# Proyecto Práctico 3 - Grupo 3 (TRH)

Repositorio oficial del Grupo 3 (Termas de Río Hondo) para el Proyecto Práctico 3.

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

* **Estado:** En desarrollo (Próximamente).
* **Objetivo:** Esta sección contendrá los notebooks (`.ipynb`), datasets anonimizados y modelos para realizar análisis exploratorio (EDA) y predictivo sobre los datos de traslados.
