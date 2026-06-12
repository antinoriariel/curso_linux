---
title: "Módulo 03 — La terminal y la shell"
sidebar_label: "03 · La terminal y la shell"
description: Bash desde cero, comandos esenciales, sistema de ayuda, historial, atajos y personalización de la shell.
---

# Módulo 03 — La terminal y la shell

La terminal es la herramienta central de Linux y de este curso. Aquí
aprenderás a **moverte con soltura en la línea de comandos**, a encontrar
ayuda por ti mismo y a personalizar tu entorno de trabajo.

## Objetivos

- Entender qué es una shell y cómo interpreta lo que escribes.
- Dominar la estructura de los comandos: opciones, argumentos, expansiones.
- Saber consultar la documentación (`man`, `info`, `--help`, `tldr`).
- Trabajar eficientemente: historial, autocompletado, atajos de teclado.

## Capítulos

### 3.1 — Terminal, consola y shell: conceptos

- Diferencia entre terminal, emulador de terminal, consola y shell.
- Shells disponibles: **Bash**, **Zsh**, **Fish**, `sh` y POSIX.
- El prompt: qué te dice `usuario@equipo:~$`.
- Abrir la terminal en cada escritorio y en WSL.

### 3.2 — Anatomía de un comando

- Estructura: `comando -opciones argumentos`.
- Opciones cortas (`-l`) y largas (`--all`); combinarlas.
- Primeros comandos: `echo`, `date`, `cal`, `whoami`, `hostname`, `uptime`,
  `clear`, `exit`.
- `which`, `type` y `command`: saber qué se está ejecutando realmente.

### 3.3 — El sistema de ayuda

- `man` a fondo: secciones del manual, navegación, búsqueda interna.
- `apropos` / `man -k` y `whatis`: encontrar el comando que no recuerdas.
- `info`, `--help` y `/usr/share/doc`.
- Ayuda moderna: `tldr`, *cheat sheets* y cómo leer documentación oficial.

### 3.4 — Historial y edición de línea

- Historial: `history`, `!!`, `!n`, `!cadena`, `Ctrl+R` (búsqueda inversa).
- Atajos de **Readline**: `Ctrl+A/E`, `Ctrl+W/U/K`, `Alt+.` y compañía.
- Autocompletado con `Tab` y `bash-completion`.
- Variables `HISTSIZE`, `HISTCONTROL` y control fino del historial.

### 3.5 — Expansiones de la shell

- Expansión de llaves: `{a,b}`, `{1..10}`.
- Expansión de tilde (`~`) y de variables (`$VAR`).
- Sustitución de comandos: `$(comando)`.
- Comillas simples, dobles y escape con `\`: cuándo usar cada una.

### 3.6 — Variables de entorno y configuración

- `env`, `export`, `set`, `unset`; variables clave: `PATH`, `HOME`, `LANG`,
  `EDITOR`, `PS1`.
- Archivos de configuración: `.bashrc`, `.bash_profile`, `/etc/profile` y el
  orden en que se leen.
- Alias y funciones rápidas para el día a día.

### 3.7 — Multiplexores de terminal

- ¿Por qué un multiplexor? Sesiones persistentes y paneles.
- **tmux**: sesiones, ventanas, paneles y configuración básica.
- **GNU Screen** como alternativa clásica.

## Requisitos previos

Módulo 02 (un Linux funcional donde practicar).
