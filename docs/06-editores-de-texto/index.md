---
title: "Módulo 06 — Editores de texto"
sidebar_label: "06 · Editores de texto"
description: nano para sobrevivir, vim a fondo y nociones de emacs y editores modernos.
---

# Módulo 06 — Editores de texto

Tarde o temprano tendrás que editar un archivo de configuración en un
servidor sin entorno gráfico. Este módulo te garantiza que **nunca te quedes
atrapado en un editor** y te da la base de `vim`, el editor omnipresente.

## Objetivos

- Editar cualquier archivo con `nano` desde el primer día.
- Adquirir fluidez real en `vim`: modos, movimientos y operadores.
- Conocer las alternativas y elegir tu editor de cabecera.

## Capítulos

### 6.1 — nano: el editor para sobrevivir

- Abrir, editar, guardar y salir.
- Buscar y reemplazar, cortar y pegar líneas.
- Configuración útil en `.nanorc` (sintaxis, números de línea).

### 6.2 — vim: conceptos fundamentales

- Por qué vim: ubicuidad, eficiencia y edición modal.
- Modos: normal, inserción, visual, línea de comandos.
- Lo mínimo vital: `i`, `Esc`, `:w`, `:q`, `:wq`, `:q!`.
- `vimtutor`: tu mejor primer paso.

### 6.3 — vim: movimientos y operadores

- Movimientos: `h j k l`, `w b e`, `0 $ ^`, `gg G`, `{ }`, `f t`.
- Operadores: `d`, `c`, `y`, `p` y la gramática *operador + movimiento*.
- Objetos de texto: `iw`, `i"`, `ip` y por qué cambian el juego.
- Repetición con `.`, deshacer/rehacer (`u`, `Ctrl+R`), conteos.

### 6.4 — vim: edición eficiente

- Buscar (`/`, `?`, `n`, `N`, `*`) y reemplazar (`:%s/.../.../g`).
- Registros, macros (`q`) y marcas.
- Ventanas divididas, pestañas y buffers.
- Modo visual de bloque para edición en columnas.

### 6.5 — vim: configuración y plugins

- `.vimrc` esencial comentado línea a línea.
- Gestores de plugins y plugins imprescindibles.
- **Neovim**: qué cambia y por qué crece su adopción.

### 6.6 — Otros editores

- `emacs`: nociones básicas y su ecosistema.
- Editores en terminal modernos: `micro`, `helix`.
- VS Code con extensión Remote-SSH/WSL: el puente con el escritorio.

## Requisitos previos

Módulo 03.
