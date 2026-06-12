---
title: "Módulo 04 — El sistema de archivos"
sidebar_label: "04 · El sistema de archivos"
description: Jerarquía FHS, navegación, gestión de archivos y directorios, búsqueda con find y locate, enlaces y comodines.
---

# Módulo 04 — El sistema de archivos

En Linux **todo es un archivo**. Este módulo cubre cómo está organizado el
árbol de directorios, cómo moverte por él y cómo crear, copiar, mover,
borrar y —sobre todo— **encontrar** archivos.

## Objetivos

- Conocer la jerarquía estándar de directorios (FHS) y qué hay en cada sitio.
- Manejar con fluidez archivos y directorios desde la terminal.
- Dominar la búsqueda con `find` y `locate`.
- Entender enlaces duros y simbólicos, y los tipos de archivo de Linux.

## Capítulos

### 4.1 — La jerarquía de directorios (FHS)

- `/`, `/home`, `/etc`, `/var`, `/usr`, `/bin`, `/sbin`, `/lib`, `/opt`,
  `/tmp`, `/srv`, `/boot`, `/dev`, `/proc`, `/sys`, `/run`.
- Sistemas de archivos virtuales: qué son `/proc` y `/sys` en realidad.
- Dónde van tus cosas y dónde van las del sistema.

### 4.2 — Navegación y rutas

- Rutas absolutas y relativas; `.`, `..` y `~`.
- `pwd`, `cd`, `cd -`, `pushd`/`popd`.
- `ls` a fondo: `-l`, `-a`, `-h`, `-R`, `-t`, `-S`, ordenación y colores.
- `tree` para visualizar jerarquías.

### 4.3 — Crear, copiar, mover y borrar

- `touch`, `mkdir -p`, `rmdir`.
- `cp` (con `-r`, `-a`, `-i`, `-u`), `mv` y renombrado.
- `rm` y `rm -rf`: peligros reales y hábitos seguros.
- Papelera desde terminal: `trash-cli` y alternativas.
- Renombrado masivo con `mmv` y `rename`.

### 4.4 — Comodines y globbing

- `*`, `?`, `[abc]`, `[a-z]`, `[!x]`.
- Globbing extendido y `shopt` (`globstar`, `dotglob`, `nullglob`).
- Diferencia entre globbing de la shell y expresiones regulares.

### 4.5 — Enlaces y tipos de archivo

- Inodos: el concepto que lo explica todo.
- Enlaces duros vs. enlaces simbólicos: `ln` y `ln -s`.
- Tipos de archivo: regular, directorio, enlace, dispositivo de bloque y de
  carácter, socket, FIFO (`file`, `stat`).

### 4.6 — Buscar archivos

- `find` a fondo: por nombre, tipo, tamaño, fecha, propietario y permisos.
- Acciones de `find`: `-exec`, `-delete`, `-print0` con `xargs -0`.
- `locate` / `plocate` y `updatedb`: búsqueda instantánea por índice.
- Alternativas modernas: `fd`, `fzf` para búsqueda interactiva.

### 4.7 — Espacio en disco

- `du` y `df`: cuánto ocupa y cuánto queda.
- `ncdu` para explorar uso de disco de forma interactiva.
- Archivos dispersos (*sparse*) y tamaños aparentes.

## Requisitos previos

Módulo 03.
