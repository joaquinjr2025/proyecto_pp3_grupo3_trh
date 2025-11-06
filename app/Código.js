// -----------------------------------------------------------------------------
//           CONFIGURACIÓN INICIAL (MODIFICAR ESTOS VALORES)
// -----------------------------------------------------------------------------
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
const USUARIOS_SHEET = 'Usuarios';
const PACIENTES_SHEET = 'Pacientes';
const ATENCIONES_SHEET = 'Atenciones';
const LOGS_SHEET = 'Logs';
// -----------------------------------------------------------------------------


function doGet(e) {
   return HtmlService.createTemplateFromFile('index') // <-- 1. Usamos createTemplateFromFile
      .evaluate() // <-- 2. AÑADIMOS .evaluate() para que procese las instrucciones
      .setTitle('Sistema de Gestión de Pacientes')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Permite incluir archivos externos (CSS o JS) dentro de un archivo HTML principal.
 * @param {string} filename El nombre del archivo a incluir.
 * @returns {string} El contenido del archivo.
 */
function include(filename) {
   return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Obtiene todas las opciones para los menús desplegables desde la hoja 'Configuracion'.
 * @returns {object} Un objeto donde cada clave es el nombre de un menú (ej: "destino")
 * y su valor es un array de strings con las opciones.
 */
function obtenerOpcionesConfiguracion() {
   try {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Configuracion');
      if (!sheet) {
         throw new Error("La hoja 'Configuracion' no fue encontrada.");
      }
      const data = sheet.getDataRange().getValues();
      const headers = data.shift(); // Saca la primera fila (encabezados)
      const opciones = {};

      headers.forEach((header, index) => {
         if (header) {
            opciones[header.toLowerCase()] = data.map(row => row[index]).filter(String);
         }
      });

      return opciones;
   } catch (e) {
      console.error("Error en obtenerOpcionesConfiguracion: " + e.toString());
      return {};
   }
}

function logAction(usuario, accion, detalles) {
   try {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LOGS_SHEET);
      const timestamp = new Date();
      sheet.appendRow([timestamp, usuario, accion, detalles]);
   } catch (error) {
      console.error('Error al escribir en el log: ' + error.toString());
   }
}


function autenticarUsuario(username, password) {
   const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(USUARIOS_SHEET);
   const data = sheet.getDataRange().getValues();
   const inputHashBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
   const inputHash = inputHashBytes.map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');


   for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username && data[i][1] === inputHash) {
         logAction(username, 'INICIO DE SESIÓN', 'Login exitoso.');
         return {
            success: true,
            username: username
         };
      }
   }
   logAction(username, 'FALLO DE LOGIN', 'Intento de inicio de sesión con credenciales incorrectas.');
   return {
      success: false,
      username: null
   };
}

// REEMPLAZA tu función guardarPaciente CON ESTA VERSIÓN FINAL
function guardarPaciente(data, user) {
   try {
      // 1. Validación (que hicimos en el paso anterior)
      if (!data.apellido || !data.nombre || !data.dni || !data.genero || !data.fechaNacimiento) {
         throw new Error('Datos incompletos. Por favor, complete todos los campos obligatorios.');
      }

      // --- INICIO DEL SANEAMIENTO ---
      // 2. Saneamiento: Limpiamos todos los campos de texto
      const apellidoSaneado = sanitizarHtml(data.apellido);
      const nombreSaneado = sanitizarHtml(data.nombre);
      const dniSaneado = sanitizarHtml(data.dni);
      const direccionSaneada = sanitizarHtml(data.direccion);
      const detallesSaneados = sanitizarHtml(data.detalles);
      // --- FIN DEL SANEAMIENTO ---

      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PACIENTES_SHEET);
      const dataExistente = sheet.getDataRange().getValues();

      for (let i = 1; i < dataExistente.length; i++) {
         if (dataExistente[i][4] == dniSaneado) { // Comparamos con el DNI ya limpio
            throw new Error(`Ya existe un paciente con el DNI ${dniSaneado}.`);
         }
      }

      const lastRow = sheet.getLastRow();
      const newId = lastRow < 2 ? 1 : parseInt(sheet.getRange(lastRow, 1).getValue()) + 1;
      const fechaAlta = new Date();

      // 3. Guardado: Usamos las variables saneadas
      sheet.appendRow([
         newId, fechaAlta, apellidoSaneado, nombreSaneado, dniSaneado,
         data.genero, data.fechaNacimiento, direccionSaneada, detallesSaneados
      ]);

      logAction(user, 'NUEVO PACIENTE', `Se registró al paciente ID: ${newId} (${apellidoSaneado}, ${nombreSaneado})`);
      return `Paciente ${apellidoSaneado} guardado con éxito. ID asignado: ${newId}`;

   } catch (e) {
      logAction(user, 'ERROR AL GUARDAR PACIENTE', e.toString());
      throw new Error('Ocurrió un error al guardar el paciente: ' + e.message);
   }
}

// REEMPLAZA tu función guardarAtencion CON ESTA VERSIÓN
function guardarAtencion(data, user) {
   try {
      // 1. Validación
      if (!data.pacienteId || !data.fechaTraslado || !data.origen || !data.destino || !data.establecimiento || !data.diagnostico || !data.vehiculo || !data.chofer) {
         throw new Error('Datos incompletos. Por favor, complete todos los campos obligatorios.');
      }

      // 2. Saneamiento de todos los campos de texto
      const origenSaneado = sanitizarHtml(data.origen);
      const destinoSaneado = sanitizarHtml(data.destino);
      const establecimientoSaneado = sanitizarHtml(data.establecimiento);
      const diagnosticoSaneado = sanitizarHtml(data.diagnostico);
      const vehiculoSaneado = sanitizarHtml(data.vehiculo);
      const choferSaneado = sanitizarHtml(data.chofer);
      const observacionesSaneadas = sanitizarHtml(data.observaciones);

      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATENCIONES_SHEET);
      const lastRow = sheet.getLastRow();

      const newId = lastRow < 2 ? 1 : parseInt(sheet.getRange(lastRow, 1).getValue()) + 1;
      const now = new Date();

      const [year, month, day] = data.fechaTraslado.split('-');
      const fechaTrasladoLocal = new Date(year, month - 1, day);

      // 3. Guardado con datos limpios
      sheet.appendRow([
         newId, data.pacienteId, now, now, fechaTrasladoLocal, origenSaneado, destinoSaneado,
         establecimientoSaneado, diagnosticoSaneado, vehiculoSaneado,
         choferSaneado, observacionesSaneadas
      ]);

      logAction(user, 'NUEVA ATENCIÓN', `Se registró una atención para el paciente ID: ${data.pacienteId}. ID de atención: ${newId}`);
      return 'Atención guardada con éxito.';

   } catch (e) {
      logAction(user, 'ERROR AL GUARDAR ATENCIÓN', e.toString());
      throw new Error('Ocurrió un error al guardar la atención: ' + e.message);
   }
}

function obtenerListaPacientes() {
   const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PACIENTES_SHEET);
   if (sheet.getLastRow() < 2) return [];

   const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();

   return data.map(row => ({
      id: row[0],
      apellido: row[2],
      nombre: row[3]
   }));
}

// REEMPLAZA LA FUNCIÓN ANTIGUA EN CÓDIGO.GS CON ESTA

/**
 * Obtiene los datos de atenciones y pacientes de forma paginada.
 * @param {number} page El número de página a obtener (empezando en 1).
 * @param {number} pageSize El número de registros por página.
 * @returns {object} Un objeto con los datos de la página y la información de paginación.
 */
function obtenerDatosCompletos(page, pageSize) {
   const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
   const pacientesSheet = ss.getSheetByName(PACIENTES_SHEET);
   const atencionesSheet = ss.getSheetByName(ATENCIONES_SHEET);

   // Mapear pacientes sigue siendo eficiente
   const pacientesMap = {};
   if (pacientesSheet.getLastRow() > 1) {
      const pacientesData = pacientesSheet.getRange(2, 1, pacientesSheet.getLastRow() - 1, pacientesSheet.getLastColumn()).getValues();
      pacientesData.forEach(row => {
         pacientesMap[row[0]] = {
            apellido: row[2],
            nombre: row[3],
            dni: row[4]
         };
      });
   }

   if (atencionesSheet.getLastRow() < 2) {
      return {
         data: [],
         totalRecords: 0,
         totalPages: 0,
         currentPage: 1
      };
   }

   const atencionesData = atencionesSheet.getRange(2, 1, atencionesSheet.getLastRow() - 1, atencionesSheet.getLastColumn()).getValues();

   // Invertimos el array para que los más nuevos estén primero
   const allDataReversed = atencionesData.reverse();

   const totalRecords = allDataReversed.length;
   const totalPages = Math.ceil(totalRecords / pageSize);
   const startIndex = (page - 1) * pageSize;
   const endIndex = startIndex + pageSize;

   // Cortamos solo la "rebanada" de datos que corresponde a la página solicitada
   const pageData = allDataReversed.slice(startIndex, endIndex);

   // Mapeamos los datos solo para la página actual, no para todos los registros
   const datosPaginados = pageData.map(atencion => {
      const idPaciente = atencion[1];
      const pacienteInfo = pacientesMap[idPaciente] || {
         apellido: 'N/A',
         nombre: 'Paciente no encontrado',
         dni: 'N/A'
      };
      return {
         idAtencion: atencion[0],
         fechaRegistro: Utilities.formatDate(new Date(atencion[2]), "GMT-3", "dd/MM/yyyy"),
         horaRegistro: Utilities.formatDate(new Date(atencion[3]), "GMT-3", "HH:mm"),
         fechaTraslado: Utilities.formatDate(new Date(atencion[4]), "GMT-3", "dd/MM/yyyy"),
         paciente: `${pacienteInfo.apellido}, ${pacienteInfo.nombre}`,
         dni: pacienteInfo.dni,
         origen: atencion[5],
         destino: atencion[6],
         establecimiento: atencion[7],
         diagnostico: atencion[8],
         vehiculo: atencion[9],
         chofer: atencion[10],
         observaciones: atencion[11],
      };
   });

   return {
      data: datosPaginados,
      totalRecords: totalRecords,
      totalPages: totalPages,
      currentPage: page
   };
}

function eliminarAtencion(id, user) {
   try {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATENCIONES_SHEET);
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
         if (data[i][0] == id) {
            sheet.deleteRow(i + 1);
            logAction(user, 'ELIMINAR ATENCIÓN', `Se eliminó la atención con ID: ${id}`);
            return 'Atención eliminada con éxito.';
         }
      }
      return 'Error: No se encontró la atención con el ID especificado.';
   } catch (e) {
      logAction(user, 'ERROR AL ELIMINAR', `ID: ${id}, Error: ${e.toString()}`);
      return 'Ocurrió un error al eliminar la atención.';
   }
}

function obtenerAtencionPorId(id) {
   try {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATENCIONES_SHEET);
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
         if (data[i][0] == id) {
            const row = data[i];
            return {
               id_atencion: row[0],
               id_paciente: row[1],
               fechaTraslado: Utilities.formatDate(row[4], SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), "yyyy-MM-dd"),
               origen: row[5],
               destino: row[6],
               establecimiento: row[7],
               diagnostico: row[8],
               vehiculo: row[9],
               chofer: row[10],
               observaciones: row[11],
            };
         }
      }
      return null;
   } catch (e) {
      console.error("Error en obtenerAtencionPorId: " + e.toString());
      return null;
   }
}

// REEMPLAZA tu función actualizarAtencion CON ESTA VERSIÓN
function actualizarAtencion(dataObject, user) {
   try {
      // 1. Saneamiento de todos los campos de texto
      const origenSaneado = sanitizarHtml(dataObject.origen);
      const destinoSaneado = sanitizarHtml(dataObject.destino);
      const establecimientoSaneado = sanitizarHtml(dataObject.establecimiento);
      const diagnosticoSaneado = sanitizarHtml(dataObject.diagnostico);
      const vehiculoSaneado = sanitizarHtml(dataObject.vehiculo);
      const choferSaneado = sanitizarHtml(dataObject.chofer);
      const observacionesSaneadas = sanitizarHtml(dataObject.observaciones);

      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATENCIONES_SHEET);
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
         if (data[i][0] == dataObject.id_atencion) {
            const filaAActualizar = i + 1;

            const [year, month, day] = dataObject.fechaTraslado.split('-');
            const fechaTrasladoLocal = new Date(year, month - 1, day);

            // 2. Actualización con datos limpios
            sheet.getRange(filaAActualizar, 1, 1, 12).setValues([
               [
                  dataObject.id_atencion,
                  dataObject.id_paciente,
                  data[i][2], // Fecha de registro (sin cambios)
                  data[i][3], // Hora de registro (sin cambios)
                  fechaTrasladoLocal,
                  origenSaneado,
                  destinoSaneado,
                  establecimientoSaneado,
                  diagnosticoSaneado,
                  vehiculoSaneado,
                  choferSaneado,
                  observacionesSaneadas
               ]
            ]);

            logAction(user, 'ACTUALIZAR ATENCIÓN', `Se actualizó la atención con ID: ${dataObject.id_atencion}`);
            return 'Atención actualizada con éxito.';
         }
      }
      return 'Error: No se encontró la atención para actualizar.';

   } catch (e) {
      logAction(user, 'ERROR AL ACTUALIZAR', `ID: ${dataObject.id_atencion}, Error: ${e.toString()}`);
      return 'Ocurrió un error al actualizar la atención.';
   }
}

function agregarUsuario(username, password) {
   try {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(USUARIOS_SHEET);

      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
         if (data[i][0] === username) {
            logAction('Sistema', 'FALLO AL AGREGAR USUARIO', `Intento de agregar usuario duplicado: ${username}`);
            return {
               success: false,
               message: 'Error: El nombre de usuario ya existe.'
            };
         }
      }

      const passwordHashBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
      const passwordHash = passwordHashBytes.map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');

      sheet.appendRow([username, passwordHash]);

      logAction('Sistema', 'NUEVO USUARIO', `Usuario ${username} agregado con éxito.`);
      return {
         success: true,
         message: `Usuario ${username} agregado con éxito.`
      };

   } catch (e) {
      logAction('Sistema', 'ERROR AL AGREGAR USUARIO', e.toString());
      return {
         success: false,
         message: 'Ocurrió un error al agregar el usuario: ' + e.message
      };
   }
}

function sanitizarHtml(texto) {
  if (typeof texto !== 'string') {
    return texto;
  }
  return texto.replace(/&/g, '&amp;')  // Reemplaza & con &amp;
              .replace(/</g, '&lt;')   // Reemplaza < con &lt;
              .replace(/>/g, '&gt;')   // Reemplaza > con &gt;
              .replace(/"/g, '&quot;') // Reemplaza " con &quot;
              .replace(/'/g, '&#39;'); // Reemplaza ' con &#39;
}

// AÑADE ESTA NUEVA FUNCIÓN A CÓDIGO.GS

/**
 * Busca en TODOS los traslados un término específico (nombre o DNI de paciente).
 * No utiliza paginación, devuelve todos los resultados que coincidan.
 * @param {string} terminoBusqueda El texto a buscar.
 * @returns {Array} Un array de objetos de traslado que coinciden con la búsqueda.
 */
function buscarTraslados(terminoBusqueda) {
  if (!terminoBusqueda || typeof terminoBusqueda !== 'string') {
    return []; // Si no hay término de búsqueda, devuelve un array vacío.
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const pacientesSheet = ss.getSheetByName(PACIENTES_SHEET);
  const atencionesSheet = ss.getSheetByName(ATENCIONES_SHEET);

  // 1. Crear el mapa de pacientes (igual que en obtenerDatosCompletos)
  const pacientesMap = {};
  if (pacientesSheet.getLastRow() > 1) {
    const pacientesData = pacientesSheet.getRange(2, 1, pacientesSheet.getLastRow() - 1, pacientesSheet.getLastColumn()).getValues();
    pacientesData.forEach(row => {
      pacientesMap[row[0]] = { apellido: row[2], nombre: row[3], dni: row[4] };
    });
  }

  if (atencionesSheet.getLastRow() < 2) {
    return [];
  }

  // 2. Obtener TODOS los datos de atenciones
  const atencionesData = atencionesSheet.getRange(2, 1, atencionesSheet.getLastRow() - 1, atencionesSheet.getLastColumn()).getValues();
  const termino = terminoBusqueda.toLowerCase();
  
  // 3. Filtrar los datos en el servidor
  const resultados = atencionesData.filter(atencion => {
    const idPaciente = atencion[1];
    const pacienteInfo = pacientesMap[idPaciente];
    if (!pacienteInfo) {
      return false; // Si el paciente no se encuentra, no puede coincidir
    }
    
    const nombreCompleto = `${pacienteInfo.apellido}, ${pacienteInfo.nombre}`.toLowerCase();
    const dni = (pacienteInfo.dni || '').toString().toLowerCase();

    return nombreCompleto.includes(termino) || dni.includes(termino);
  });

  // 4. Mapear solo los resultados filtrados al formato final
  const datosFiltrados = resultados.map(atencion => {
    const idPaciente = atencion[1];
    const pacienteInfo = pacientesMap[idPaciente];
    return {
      idAtencion: atencion[0],
      fechaRegistro: Utilities.formatDate(new Date(atencion[2]), "GMT-3", "dd/MM/yyyy"),
      horaRegistro: Utilities.formatDate(new Date(atencion[3]), "GMT-3", "HH:mm"),
      fechaTraslado: Utilities.formatDate(new Date(atencion[4]), "GMT-3", "dd/MM/yyyy"),
      paciente: `${pacienteInfo.apellido}, ${pacienteInfo.nombre}`,
      dni: pacienteInfo.dni,
      origen: atencion[5],
      destino: atencion[6],
      establecimiento: atencion[7],
      diagnostico: atencion[8],
      vehiculo: atencion[9],
      chofer: atencion[10],
      observaciones: atencion[11],
    };
  });

  return datosFiltrados.reverse(); // Devolver los más recientes primero
}