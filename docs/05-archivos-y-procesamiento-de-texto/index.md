---
title: "Módulo 05 — Archivos y procesamiento de texto"
sidebar_label: "05 · Procesamiento de texto"
description: Tuberías, redirecciones, grep, sed, awk, expresiones regulares, comparación de archivos y compresión.
---

# Módulo 05 — Archivos y procesamiento de texto

Aquí está el corazón de la filosofía UNIX: **encadenar herramientas pequeñas
para procesar texto**. Lo que aprendas en este módulo lo usarás cada día,
desde analizar logs hasta transformar datos.

## Objetivos

- Dominar redirecciones y tuberías para componer comandos.
- Filtrar y transformar texto con `grep`, `sed` y `awk`.
- Leer y escribir expresiones regulares con confianza.
- Comprimir, archivar y comparar archivos.

## Capítulos

### 5.1 — Ver el contenido de archivos

- `cat`, `tac`, `less` (navegación completa), `more`.
- `head`, `tail` y el imprescindible `tail -f` para logs en vivo.
- `nl`, `od`, `xxd`, `strings`: ver lo que no es texto plano.
- `bat` como alternativa moderna a `cat`.

### 5.2 — Redirecciones y tuberías

- Flujos estándar: `stdin` (0), `stdout` (1), `stderr` (2).
- Redirecciones: `>`, `>>`, `<`, `2>`, `2>&1`, `&>`, `/dev/null`.
- Tuberías (`|`) y la composición de comandos.
- `tee`: bifurcar la salida.
- *Here documents* (`<<EOF`) y *here strings* (`<<<`).
- `xargs`: convertir salida en argumentos.

### 5.3 — Filtros clásicos

- `sort` (numérico, por columnas, aleatorio) y `uniq` (`-c`, `-d`).
- `cut`, `paste`, `join`, `column`.
- `tr`: traducir y borrar caracteres.
- `wc`: contar líneas, palabras y bytes.
- `split` y `csplit`: trocear archivos.
- Receta estrella: `sort | uniq -c | sort -rn` para rankings.

### 5.4 — Expresiones regulares

- Literales, clases (`[ ]`), anclas (`^`, `$`), cuantificadores (`*`, `+`,
  `?`, `{n,m}`), grupos y alternancia.
- BRE vs. ERE vs. PCRE: por qué `grep`, `sed` y `awk` no siempre coinciden.
- Estrategias para construir y depurar regex paso a paso.

### 5.5 — grep a fondo

- `grep`, `egrep`/`grep -E`, `fgrep`/`grep -F`.
- Opciones clave: `-i`, `-v`, `-r`, `-n`, `-l`, `-c`, `-w`, `-o`,
  `-A/-B/-C` (contexto).
- `ripgrep` (`rg`): la alternativa moderna y veloz.

### 5.6 — sed: el editor de flujos

- Sustitución: `s/patrón/reemplazo/g` y banderas.
- Direccionamiento por línea y por patrón; borrar, insertar, añadir.
- Edición *in place* (`-i`) con seguridad.
- Grupos de captura y retro-referencias.

### 5.7 — awk: el lenguaje de columnas

- Modelo de awk: patrón → acción, registros y campos (`$1`, `NF`, `NR`).
- Separadores (`-F`), `BEGIN`/`END`, variables y aritmética.
- Arrays asociativos: contar, agrupar y resumir datos.
- Cuándo usar awk en vez de sed (y viceversa).

### 5.8 — Comparar archivos

- `diff` y formato unificado (`-u`): la base de los parches.
- `patch`: aplicar diferencias.
- `comm`, `cmp` y `vimdiff`/`meld` para comparación visual.
- `md5sum`, `sha256sum`: verificar integridad.

### 5.9 — Archivado y compresión

- `tar`: crear, listar y extraer (`-c`, `-t`, `-x`, `-v`, `-f`, `-z`, `-J`).
- Compresores: `gzip`, `bzip2`, `xz`, `zstd` — comparativa real.
- `zip`/`unzip` para interoperar con Windows.
- Estrategias: qué comprimir, con qué y cuándo.

## Requisitos previos

Módulos 03 y 04.
