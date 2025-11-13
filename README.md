# Práctica Profesionalizante 3 - Grupo 3 (TRH)

Repositorio oficial del Grupo 3 (Termas de Río Hondo) para la materia de Práctica Profesionalizante 3.

## Descripción General

Este proyecto integra dos componentes principales:
1.  Una aplicación web operativa para la gestión de datos.
2.  Un análisis de datos y modelado de machine learning basado en los datos recopilados.

---

## 1. Aplicación de Gestión de Pacientes (`/app`)

Esta carpeta contiene una aplicación web completa desarrollada en **Google Apps Script** y conectada a **Google Sheets** como base de datos.

### Características:

* **Tecnología:** Google Apps Script (actuando como Frontend y Backend).
* **Funcionalidad:**
    * Sistema de **Inicio de Sesión** (Login) para usuarios.
    * **Gestión de Pacientes:** Alta, baja y modificación (ABM) de pacientes.
    * **Gestión de Traslados:** Registro de nuevos traslados, vinculados a pacientes, destinos, vehículos y choferes.
    * **Visualización de Datos:** Una tabla paginada y con capacidad de búsqueda para ver el historial de traslados.
* **Seguridad:**
    * Las credenciales (como el `SPREADSHEET_ID`) se manejan de forma segura usando **Propiedades del Script** y no están expuestas en el código.

## 2. Análisis de Datos y Machine Learning

Esta sección documenta el ciclo de vida de los datos del proyecto, desde su recolección hasta la implementación de un modelo predictivo para anticipar la demanda operativa.

### A. Preprocesamiento y EDA (Análisis Exploratorio)
Se trabajó con un dataset histórico de traslados para entender el comportamiento del servicio. El análisis (`EDA`) reveló patrones clave para la toma de decisiones:

* **Distribución Temporal:** Análisis de la demanda por año, mes y día de la semana para identificar picos operativos.
* **Análisis de Destinos y Diagnósticos:** Identificación de las rutas más frecuentes y las patologías predominantes que requieren traslado.
* **Gestión de Recursos:** Evaluación de la carga de trabajo por chofer y tipo de vehículo utilizado.

### B. Modelo Predictivo: Series Temporales con Prophet
El objetivo central de esta etapa fue desarrollar un modelo capaz de **predecir la cantidad futura de traslados**, permitiendo a la dirección planificar recursos con antelación.

* **Tecnología:** Se utilizó **Facebook Prophet**, una herramienta robusta para forecasting diseñada para manejar datos con tendencias y estacionalidad.
* **Variable Objetivo:** Cantidad de traslados (demanda) en función del tiempo.

### C. Evaluación de Métricas y Resultados
El modelo fue evaluado utilizando métricas de error estándar para regresión. Los resultados obtenidos fueron:

* **MAE (Error Absoluto Medio):** 5.40
* **RMSE (Raíz del Error Cuadrático Medio):** 5.51

**¿Por qué obtuvimos estos números y qué significan?**

1. **Estabilidad de los Errores:** La cercanía entre el MAE (5.40) y el RMSE (5.51) es un indicador muy positivo. Significa que el modelo **no tiene errores atípicos grandes** (*outliers*) que estén distorsionando la predicción; es consistente en su desempeño.
2. **Interpretación Operativa:** Un MAE de 5.40 indica que, en promedio, el modelo se desvía en aproximadamente **5 traslados** respecto al valor real.
    * *Contexto:* Si la demanda mensual promedio es alta (ej. 150 traslados), un error de solo 5 unidades representa una precisión muy alta, validando la utilidad del modelo para estimar la flota necesaria sin grandes márgenes de error.
3. **Capacidad de Generalización:** A pesar de la complejidad inherente a la demanda de salud, Prophet logró capturar la tendencia general, ofreciendo una línea base sólida para la planificación logística.

---
**Tecnologías:** Python, Pandas, Matplotlib/Seaborn, Facebook Prophet, Scikit-learn.
