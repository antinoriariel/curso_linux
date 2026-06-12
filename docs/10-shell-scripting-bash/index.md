---
title: "Módulo 10 — Shell scripting con Bash"
sidebar_label: "10 · Shell scripting (Bash)"
description: Scripts Bash de principio a fin; variables, condicionales, bucles, funciones, arrays, manejo de errores y buenas prácticas.
---

# Módulo 10 — Shell scripting con Bash

Automatizar es la diferencia entre usar Linux y dominarlo. Este módulo
convierte todo lo aprendido en **scripts robustos y mantenibles**, con las
buenas prácticas que separan un script de juguete de uno de producción.

## Objetivos

- Escribir scripts Bash correctos, legibles y portables.
- Manejar argumentos, entrada/salida y códigos de error.
- Dominar estructuras de control, funciones y arrays.
- Depurar scripts y validarlos con herramientas automáticas.

## Capítulos

### 10.1 — Tu primer script

- El *shebang* (`#!/usr/bin/env bash`) y permisos de ejecución.
- Ejecutar vs. *sourcear* (`./script` vs. `source script`).
- Convenciones: nombres, comentarios, estructura.
- `echo` vs. `printf`.

### 10.2 — Variables y parámetros

- Asignación, comillas y *quoting* correcto (la causa nº1 de bugs).
- Parámetros posicionales: `$1`, `$@`, `$#`, `$0`; `shift`.
- Variables especiales: `$?`, `$$`, `$!`.
- Expansiones de parámetro: valores por defecto (`${VAR:-x}`), longitud,
  recorte (`${VAR%...}`, `${VAR#...}`), reemplazo (`${VAR/a/b}`).

### 10.3 — Condicionales

- Códigos de salida y los operadores `&&` / `||`.
- `if`/`elif`/`else`; `test`, `[ ]` y `[[ ]]` (y sus diferencias).
- Comparaciones numéricas, de cadenas y de archivos (`-f`, `-d`, `-r`...).
- `case`: ramificación limpia por patrones.

### 10.4 — Bucles

- `for` (listas, rangos, archivos con glob), `while`, `until`.
- Leer archivos línea a línea: `while read -r` (y por qué `for` no).
- `break`, `continue` y bucles anidados.
- Aritmética: `$(( ))`, `let`, bucles estilo C.

### 10.5 — Funciones

- Definición, argumentos y valores de retorno.
- Ámbito: `local` y por qué importa.
- Bibliotecas de funciones reutilizables.

### 10.6 — Arrays

- Arrays indexados y asociativos (`declare -A`).
- Recorrer, contar, trocear; `"${arr[@]}"` y el quoting correcto.
- `mapfile`/`readarray`: cargar archivos en arrays.

### 10.7 — Entrada, argumentos y opciones

- `read`: entrada interactiva, prompts, valores ocultos.
- `getopts`: opciones tipo `-v -f archivo` bien hechas.
- Validación de argumentos y mensajes de uso (`usage()`).

### 10.8 — Manejo de errores y robustez

- `set -e`, `set -u`, `set -o pipefail`: qué hacen y sus trampas.
- `trap` para limpieza (archivos temporales con `mktemp`).
- Logging a stderr, niveles de verbosidad.
- Bloqueos (`flock`) para evitar ejecuciones simultáneas.

### 10.9 — Depuración y calidad

- `bash -x`, `set -x` y `PS4` mejorado.
- **ShellCheck**: el linter imprescindible.
- Pruebas de scripts: `bats-core`.
- Portabilidad: bashismos vs. POSIX `sh`.

### 10.10 — Proyecto del módulo

- Script completo de copia de seguridad: argumentos, configuración,
  logging, rotación y notificación de errores.

## Requisitos previos

Módulos 03–05 y 09.
