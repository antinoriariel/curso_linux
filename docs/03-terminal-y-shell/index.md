---
title: "Módulo 03 — La terminal y la shell"
sidebar_label: "03 · La terminal y la shell"
description: Bash desde cero, anatomía de comandos, sistema de ayuda, historial, expansiones, variables de entorno, y multiplexores de terminal. La herramienta central de Linux.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Módulo 03 — La terminal y la shell

## Introducción

La terminal es **la herramienta más poderosa de Linux** y el eje de todo este curso. Entenderla a fondo no es opcional: es la diferencia entre usar Linux y *dominar* Linux.

En el [Módulo 01](/introduccion-al-mundo-linux) vimos que la **filosofía UNIX** propugna programas pequeños que se comunican mediante texto plano y se componen con pipes. La terminal es exactamente el lugar donde esa filosofía cobra vida: cada comando que escribes es una instancia de esa filosofía en acción.

En el [Módulo 02](/instalacion-y-primer-contacto) instalaste el sistema y abriste una terminal por primera vez. Ahora vamos a entender **qué es exactamente ese programa**, cómo interpreta lo que escribes, y cómo exprimirlo al máximo.

### Por qué la terminal sigue siendo relevante en 2024

```
Interfaces gráficas: potentes, pero limitadas
├─ Solo hacen lo que el diseñador programó
├─ Difíciles de automatizar y repetir
├─ Lentas para tareas masivas (1000 archivos)
└─ Inconsistentes entre distros y versiones

Terminal / CLI: el poder universal
├─ Cualquier tarea que el SO puede hacer, tú puedes hacer
├─ Automatizable: un script repite lo que hiciste
├─ Reproducible: mismo comando = mismo resultado
├─ Componible: comandos se encadenan con pipes
├─ Remota: controlas servidores sin GUI
└─ Universal: la misma sintaxis en Linux, macOS, BSDs
```

### Objetivos de aprendizaje

Al finalizar este módulo, serás capaz de:

- ✅ Explicar la arquitectura TTY/PTY y la diferencia entre terminal, emulador y shell
- ✅ Conocer las diferentes shells (Bash, Zsh, Fish) y sus características
- ✅ Anatomizar cualquier comando en sus componentes y predecir su comportamiento
- ✅ Usar el sistema de ayuda (`man`, `info`, `--help`, `tldr`) de forma autónoma
- ✅ Editar la línea de comandos con atajos Readline de forma fluida
- ✅ Gestionar el historial de comandos con precisión
- ✅ Dominar las seis expansiones de Bash y las reglas de comillas
- ✅ Configurar el entorno con variables, alias y funciones persistentes
- ✅ Usar tmux para sesiones persistentes y trabajo multipanel

---

## 3.1 — Terminal, consola y shell: conceptos

Estos tres términos se usan a menudo indistintamente pero significan cosas diferentes. Entenderlos evita confusión al leer documentación.

### Breve historia: del teletipos al emulador moderno

```
1960s — Teletipo (TTY)
│  Dispositivo físico de impresión/entrada
│  Conectado al mainframe
│  "Teletypewriter" → TTY
│
1970s — Terminales de vídeo
│  CRT (pantalla), teclado
│  VT100 (DEC) define el estándar de secuencias de escape
│  Todavía hardware físico separado del mainframe
│
1980s — Consola del PC
│  Monitor + teclado del propio ordenador
│  Acceso directo al hardware, sin red
│
1990s — Emuladores de terminal (software)
│  xterm, rxvt: simulan VT100 en una ventana gráfica
│  La terminal ya no es hardware, es software
│
Hoy — Emuladores modernos
   GNOME Terminal, Konsole, Alacritty, Kitty, WezTerm...
   Misma interfaz lógica, implementación moderna
```

### La arquitectura TTY/PTY en Linux

Cuando abres una terminal gráfica en Linux, se crea una estructura de capas:

```
┌─────────────────────────────────────────────────────────────┐
│  Emulador de terminal (GNOME Terminal, Konsole, Alacritty)  │
│  Dibuja texto, interpreta colores, gestiona scroll          │
├──────────────────┬──────────────────────────────────────────┤
│   PTY Master     │   PTY Slave (/dev/pts/0)                 │
│  (lado GUI)      │  (lado shell — "el terminal" del SO)     │
│                  │  bash lee stdin desde aquí               │
├──────────────────┴──────────────────────────────────────────┤
│  Kernel: Subsistema TTY                                     │
│  (disciplina de línea, buffer, señales SIGINT/SIGWINCH)     │
└─────────────────────────────────────────────────────────────┘
```

**PTY (pseudo-terminal):** Par de dispositivos virtuales que simulan un terminal hardware. El emulador escribe al master; la shell lee del slave (`/dev/pts/N`). El kernel actúa como intermediario.

```bash
# Ver tu PTY actual
echo $TTY       # /dev/pts/0 (dentro de emulador gráfico)
tty             # mismo resultado

# Listar todos los PTYs activos
ls /dev/pts/

# Ver qué procesos usan cada PTY
who
# juan  pts/0  2024-06-01 10:00 (:0)
# juan  pts/1  2024-06-01 10:05 (:0)  ← segunda ventana de terminal
```

**Consola virtual (tty1-tty6):** Las consolas de texto accesibles con `Ctrl+Alt+F1` a `Ctrl+Alt+F6`. Son terminales directas al kernel, sin emulador gráfico. El entorno gráfico suele estar en `tty7` o `tty2` (Ubuntu 22+).

```bash
# Cambiar a consola virtual 2 (texto puro)
Ctrl + Alt + F2

# Volver al entorno gráfico (Ubuntu: tty2, Fedora: tty1)
Ctrl + Alt + F2  # o el número donde esté el DE

# Ver consola actual
who am i
```

### Definiciones precisas

| Término | Definición | Ejemplo |
|---|---|---|
| **TTY** | Dispositivo terminal (histórico: hardware; hoy: virtual) | `/dev/tty1` (consola), `/dev/pts/0` (PTY) |
| **Consola** | Terminal con acceso directo al hardware del sistema | Las 6 consolas de texto (`tty1`-`tty6`) |
| **Emulador de terminal** | Programa gráfico que simula un terminal | GNOME Terminal, Konsole, Alacritty |
| **Shell** | Intérprete de comandos que corre *dentro* del terminal | bash, zsh, fish, sh |
| **Línea de comandos (CLI)** | La interfaz textual expuesta por la shell | El prompt `$` donde escribes |

```
Analogía:
┌─────────────────────────────────────────┐
│  Emulador de terminal = Ventana/marco   │
│  Shell = El programa que da órdenes     │
│  TTY/PTY = El cable que los conecta     │
└─────────────────────────────────────────┘

Es como: navegador (Chrome) vs motor (V8) vs protocolo (HTTP)
```

### Shells disponibles en Linux

Una **shell** es un intérprete de comandos: lee lo que escribes, lo analiza sintácticamente y ejecuta programas o funciones del SO. También es un lenguaje de programación completo.

#### Bash — Bourne Again Shell

La shell por defecto en Ubuntu, Debian, CentOS/RHEL y la mayoría de distribuciones.

```bash
# Versión instalada
bash --version
# GNU bash, version 5.2.15(1)-release

# Historia:
# 1989: Brian Fox escribe Bash para el proyecto GNU
# Reemplaza al Bourne Shell (sh) de AT&T
# Compatibilidad hacia atrás con sh
# Sigue siendo la shell dominante en servidores (2024)
```

**Fortalezas de Bash:**
- Omnipresente en sistemas Linux/Unix
- Compatibilidad máxima (POSIX + extensiones)
- Scripting muy maduro y documentado
- Sin dependencias adicionales

**Limitaciones:**
- Sintaxis algo arcana para operaciones complejas
- Autocompletado básico por defecto (requiere `bash-completion`)
- Sin sugerencias de errores en tiempo real

#### Zsh — Z Shell

La shell más popular entre desarrolladores y power users. Default en macOS desde Catalina (2019).

```zsh
# Instalar Zsh
sudo apt install zsh  # Debian/Ubuntu
sudo dnf install zsh  # Fedora

# Cambiar shell predeterminada
chsh -s $(which zsh)
# Cierra sesión y vuelve a abrir

# Versión
zsh --version
# zsh 5.9 (x86_64-ubuntu-linux-gnu)
```

**Ventajas sobre Bash:**
- Autocompletado potentísimo (menú interactivo)
- Corrección de errores ortográficos en rutas
- Expansión de globs avanzada (`**/*.txt`)
- Prompt altamente personalizable
- Framework Oh My Zsh: +300 plugins, +150 temas

```zsh
# Instalar Oh My Zsh (marco de configuración)
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Habilitar plugins en ~/.zshrc
plugins=(git docker kubectl python pip npm node)

# Cambiar tema
ZSH_THEME="robbyrussell"  # o "agnoster", "powerlevel10k"
```

#### Fish — Friendly Interactive Shell

Diseñada para ser usable sin configuración.

```fish
# Instalar Fish
sudo apt install fish

# Probar sin cambiar la shell predeterminada
fish

# Cambiar shell predeterminada
chsh -s $(which fish)
```

**Características únicas:**
- Sugerencias automáticas mientras escribes (como autocompletar en navegadores)
- Resaltado de sintaxis en tiempo real (verde = válido, rojo = error)
- Historial compartido entre sesiones automáticamente
- Configuración mediante GUI web (`fish_config`)

**Limitación importante:** Fish no es POSIX-compatible. Scripts Bash no funcionan directamente en Fish.

#### sh — POSIX Shell

La shell más básica, garantizada en cualquier sistema UNIX/Linux.

```sh
# Ejecutar un script en sh (máxima portabilidad)
sh script.sh
/bin/sh script.sh

# En la mayoría de sistemas modernos, /bin/sh es dash
ls -la /bin/sh
# lrwxrwxrwx 1 root root 4 /bin/sh -> dash
```

:::warning
**Distinción crítica para scripting:** Los scripts del sistema (`/etc/init.d/`, `/etc/cron.d/`) usan `#!/bin/sh`. Nunca uses características específicas de Bash en scripts con `#!/bin/sh`. Ver [Módulo 10 — Shell Scripting](/shell-scripting-bash) para más detalles.
:::

#### Comparativa de shells

| Aspecto | Bash | Zsh | Fish | sh (dash) |
|---|---|---|---|---|
| **POSIX compatible** | ✅ (+ extensiones) | ✅ (+ extensiones) | ❌ | ✅ estricto |
| **Disponible por defecto** | Ubuntu, Debian, RHEL | macOS, algunos Linux | No | Todos |
| **Autocompletado** | Básico (con plugin) | Excelente | Excelente built-in | Básico |
| **Sugerencias en línea** | No | Con plugin | Sí built-in | No |
| **Scripting** | Excelente | Muy bueno | Diferente (no POSIX) | Básico/portable |
| **Velocidad de inicio** | Rápido | Rápido (con zplug) | Muy rápido | Más rápido |
| **Recomendado para** | Servidores, scripts | Uso interactivo | Principiantes, UX | Scripts portables |

### El prompt: todo lo que te dice antes de escribir

El **prompt** es el texto que aparece antes del cursor, indicando que la shell espera entrada.

```bash
# Prompt típico en Ubuntu/Debian
juan@desktop-ubuntu:~$

# Desglose:
# juan          → Nombre de usuario
# @             → Separador
# desktop-ubuntu → Hostname del equipo (ver sección 2.3.2 del Módulo 02)
# :             → Separador
# ~             → Directorio actual (~ = home del usuario)
# $             → Indica usuario normal ($) vs root (#)

# Prompt cuando eres root:
root@desktop-ubuntu:/home/juan#
#                              ^ signo # indica root (peligro)
```

**El prompt como sistema de información:**

```bash
# PS1: la variable que define el prompt (ver sección 3.6)
echo $PS1
# \[\e]0;\u@\h: \w\a\]${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$

# Prompt personalizado sencillo (añadir a ~/.bashrc):
export PS1='\u@\h:\w\$ '
# Resultado: juan@ubuntu:~$

# Con colores y fecha:
export PS1='\[\033[1;33m\]\t\[\033[0m\] \[\033[1;32m\]\u\[\033[0m\]@\[\033[1;34m\]\h\[\033[0m\]:\[\033[1;35m\]\w\[\033[0m\]\$ '
```

#### Abrir la terminal según el entorno

*(Referencia cruzada con [Módulo 02, sección 2.5](/instalacion-y-primer-contacto#251--entornos-de-escritorio-de))*

| Entorno | Emulador predeterminado | Atajo teclado |
|---|---|---|
| **GNOME** (Ubuntu) | GNOME Terminal | `Ctrl+Alt+T` |
| **KDE Plasma** | Konsole | `Ctrl+Alt+T` |
| **XFCE** | Xfce Terminal | `Ctrl+Alt+T` |
| **WSL2** | Windows Terminal | Abrir desde menú Inicio |
| **Sin GUI** | Login directo | `tty1`-`tty6` |
| **SSH remoto** | Shell remota | `ssh usuario@host` |

```bash
# Instalar emulador moderno si quieres mejorar la experiencia:
sudo apt install alacritty   # GPU-acelerado, rápido
sudo apt install kitty       # GPU-acelerado, extensible con Python
sudo apt install tilix       # Múltiples paneles integrados
```

---

## 3.2 — Anatomía de un comando

### Estructura fundamental

```
comando   [opciones]   [argumentos]
   │           │            │
   │           │            └── Lo que el comando recibe/opera
   │           └── Modifican el comportamiento
   └── El nombre del programa o builtin
```

**Ejemplo completo diseccionado:**

```bash
ls -la /home/juan

# ls         → comando: el programa /bin/ls
# -l         → opción corta: formato largo (permisos, tamaño, fecha)
# -a         → opción corta: incluir archivos ocultos (que empiezan con .)
# -la        → equivalente a -l -a juntos
# /home/juan → argumento: el directorio a listar
```

### Tipos de comandos: el sistema de búsqueda

Cuando escribes un comando, Bash sigue un orden de búsqueda preciso:

```
Orden de precedencia en Bash:

1. Alias (definidos por el usuario o en .bashrc)
   alias ll='ls -la'

2. Funciones (definidas en la shell)
   function saludo() { echo "Hola $1"; }

3. Builtins (comandos internos de Bash)
   cd, echo, export, read, source, [[ ]], ...

4. Comandos externos (busca en $PATH)
   /usr/bin/ls, /bin/grep, /usr/local/bin/python3
```

```bash
# Saber exactamente qué tipo es un comando
type ls
# ls is aliased to `ls --color=auto'   ← Es un alias

type cd
# cd is a shell builtin                ← Es un builtin

type python3
# python3 is /usr/bin/python3          ← Es un externo

type saludo
# saludo is a function                 ← Es una función

# Forzar ejecutar el comando externo (ignorar alias/función)
command ls     # Salta alias, usa /bin/ls
\ls            # Alternativa: backslash salta alias

# Ver todas las definiciones (muestra alias Y builtin Y externo)
type -a echo
# echo is a shell builtin
# echo is /usr/bin/echo
```

**¿Qué hace `which`?**

```bash
# which solo busca en $PATH (ignora builtins y alias)
which ls      # /usr/bin/ls
which cd      # (no imprime nada — cd es builtin, no está en PATH)

# Diferencia importante:
type cd       # cd is a shell builtin
which cd      # (silencio — which no conoce builtins)

# Usar 'type' en vez de 'which' para diagnóstico completo
```

### Opciones: cortas y largas

```bash
# Opciones CORTAS: un guión + una letra
ls -l          # -l: listado largo
ls -a          # -a: mostrar ocultos
ls -h          # -h: tamaños legibles (K, M, G)

# Se pueden combinar:
ls -lah        # Equivale a: ls -l -a -h
ls -l -a -h    # Forma expandida, idéntico resultado

# Opciones LARGAS: dos guiones + palabra
ls --all       # Equivalente a -a
ls --human-readable  # Equivalente a -h

# Algunas aceptan argumento:
grep -n "texto" archivo    # -n: número de línea
grep --line-number "texto" archivo  # equivalente

# Convención: -- termina las opciones
ls -- -archivo-con-guion  # Trata "-archivo-con-guion" como nombre, no opción
rm -- --raro-nombre-de-archivo
```

### Primeros comandos esenciales

Todos estos comandos vienen de [GNU Coreutils](https://www.gnu.org/software/coreutils/) o del propio Bash, herencia directa de la filosofía GNU vista en el [Módulo 01](/introduccion-al-mundo-linux#el-proyecto-gnu-1983-1991).

#### Información del sistema y del usuario

```bash
# ¿Quién soy?
whoami
# juan

# Información completa del usuario actual
id
# uid=1000(juan) gid=1000(juan) groups=1000(juan),4(adm),27(sudo),...

# Nombre del equipo
hostname
# desktop-ubuntu

# Nombre corto y FQDN
hostname -s    # desktop-ubuntu
hostname -f    # desktop-ubuntu.local

# Sistema operativo y kernel
uname -a
# Linux desktop-ubuntu 6.8.0-35-generic #35-Ubuntu SMP x86_64 GNU/Linux

uname -r       # Solo versión del kernel: 6.8.0-35-generic
uname -m       # Arquitectura: x86_64
uname -o       # SO: GNU/Linux

# Cuánto tiempo lleva encendido el sistema
uptime
# 10:30:15 up 2 days, 3:45, 2 users, load average: 0.52, 0.48, 0.42
#           ↑ tiempo activo       ↑ usuarios  ↑ carga en 1,5,15 minutos
```

#### Fecha y hora

```bash
# Fecha y hora actual
date
# vie 01 jun 2024 10:30:15 -03

# Formatos personalizados
date +"%Y-%m-%d"        # 2024-06-01
date +"%H:%M:%S"        # 10:30:15
date +"%d/%m/%Y %H:%M"  # 01/06/2024 10:30
date +"%s"              # Unix timestamp: 1717241415

# Fecha de ayer/mañana
date -d "yesterday"
date -d "tomorrow"
date -d "1 week ago"
date -d "+3 days"

# Calendario del mes actual
cal
# Calendario específico
cal 6 2024   # Junio 2024
cal 2024     # Todo el año
```

#### Entrada/salida y pantalla

```bash
# Imprimir texto (builtin Bash)
echo "Hola, mundo"

# echo con interpretación de secuencias de escape
echo -e "Línea 1\nLínea 2\tTabulación"
echo -e "\033[1;32mVerde brillante\033[0m"   # Colores ANSI

# echo sin salto de línea al final
echo -n "Sin newline"

# printf: más control que echo (similar a C)
printf "%s tiene %d años\n" "Juan" 30
printf "%-20s %5.2f EUR\n" "Producto A" 12.5
printf "%05d\n" 42      # 00042

# Limpiar pantalla
clear                   # Borra el contenido visible
reset                   # Reinicia el terminal completamente (útil si se corrompe)
Ctrl + L               # Atajo equivalente a clear

# Ver historial de terminal (scroll)
# → Con ratón o Shift+PgUp/PgDn en la mayoría de emuladores
```

#### Comandos de proceso de shell

```bash
# Salir de la shell
exit
exit 0    # Con código de salida 0 (éxito)
exit 1    # Con código de salida 1 (error)
Ctrl + D  # Atajo — envía EOF, cierra la shell

# Ver código de salida del último comando
echo $?
# 0 = éxito, distinto de 0 = error (el número es el tipo de error)
ls /directorio-inexistente
echo $?   # 2 (no such file or directory)
```

#### Obtener información

```bash
# ¿Dónde estoy? (Working directory)
pwd
# /home/juan/proyectos

# Listar archivos (básico — profundizaremos en Módulo 04)
ls
ls -la
ls -lh /etc

# Ver variables de entorno (completo en sección 3.6)
env
printenv HOME   # /home/juan

# Ver el PATH actual
echo $PATH
# /usr/local/bin:/usr/bin:/bin:/usr/games:/usr/local/games

# Información del sistema extendida
lsb_release -a      # Distro y versión (ver Módulo 02, sección 2.3.3)
uname -a            # Kernel completo
hostnamectl         # Info del equipo (systemd)
```

### El código de salida: el lenguaje silencioso de los programas

Todo comando en Linux retorna un **código de salida** (exit code) entre 0 y 255.

```
0         → Éxito
1         → Error genérico
2         → Uso incorrecto de la orden
126       → Permiso denegado (o no es ejecutable)
127       → Comando no encontrado
128+N     → Terminado por señal N (ej: 130 = Ctrl+C = señal 2)
```

```bash
# Verificar si el último comando tuvo éxito
ls /etc/passwd; echo "Código: $?"    # Código: 0
ls /no-existe;  echo "Código: $?"    # Código: 2

# Uso práctico: ejecución condicional
mkdir /tmp/test && echo "Directorio creado"  # Solo si mkdir tuvo éxito
ls /no-existe || echo "El directorio no existe"  # Solo si ls falló
```

Este mecanismo (invisible pero presente en todo pipeline) está directamente relacionado con la filosofía UNIX de programas pequeños que comunican éxito/error a quien los llama.

---

## 3.3 — El sistema de ayuda

Linux tiene uno de los sistemas de documentación en línea más ricos que existen. Aprender a usarlo con fluidez te hace **autosuficiente**.

### Las páginas `man`: el manual de referencia

Las **manual pages** (`man pages`) son la documentación primaria de Linux. Están instaladas localmente, accesibles sin internet y cubren casi todo lo que existe en el sistema.

```bash
# Sintaxis básica
man comando
man ls          # Manual de ls
man bash        # Manual completo de Bash (muy extenso)
man 5 passwd    # Manual de /etc/passwd (sección 5)
```

#### Las 8 secciones del manual

El manual está dividido en secciones numeradas. El número es fundamental:

| Sección | Contenido | Ejemplo |
|---|---|---|
| **1** | Comandos de usuario | `man 1 ls`, `man grep` |
| **2** | Llamadas al sistema (syscalls) | `man 2 open`, `man 2 fork` |
| **3** | Funciones de biblioteca (C) | `man 3 printf`, `man 3 malloc` |
| **4** | Archivos especiales (`/dev`) | `man 4 null`, `man 4 tty` |
| **5** | Formatos de archivos y convenciones | `man 5 passwd`, `man 5 fstab` |
| **6** | Juegos y protectores de pantalla | `man 6 fortune` |
| **7** | Miscelánea, convenciones, estándares | `man 7 regex`, `man 7 signal` |
| **8** | Comandos de administración (root) | `man 8 fdisk`, `man 8 mount` |

```bash
# Cuando hay ambigüedad, especifica la sección:
man printf        # Sección 1: el comando printf de bash
man 3 printf      # Sección 3: la función printf de C

# Ver en qué secciones existe un tema
man -f passwd     # o whatis passwd
# passwd (1)      - change user password
# passwd (5)      - the password file
```

#### Navegación dentro de `man`

`man` usa el paginador `less` por defecto. Estos son sus controles:

| Tecla | Acción |
|---|---|
| `Espacio` / `f` / `PgDn` | Avanzar una pantalla |
| `b` / `PgUp` | Retroceder una pantalla |
| `↓` / `j` | Avanzar una línea |
| `↑` / `k` | Retroceder una línea |
| `g` / `G` | Ir al inicio / al final |
| `/patrón` | Buscar hacia adelante |
| `?patrón` | Buscar hacia atrás |
| `n` / `N` | Siguiente / anterior coincidencia |
| `q` | Salir |
| `h` | Ayuda de less |

```bash
# Buscar texto dentro del manual:
man ls
# (dentro de man): /--color
# Busca "--color" y resalta las coincidencias
```

#### Estructura de una página man

```
NOMBRE (sección)           ← Cabecera: nombre y sección
                           ← Número de versión, fecha

NOMBRE
    ls - listar contenido de directorios

SINOPSIS
    ls [OPCIÓN]... [ARCHIVO]...    ← Sintaxis compacta
    # [] = opcional, ... = repetible, | = alternativa

DESCRIPCIÓN
    Mostrar información sobre ARCHIVOs (del directorio actual
    por defecto). Ordenar entradas alfabéticamente...
    
    -a, --all
        no ignorar entradas que comiencen con .

OPTIONS          ← Todas las opciones documentadas

AUTHOR           ← Quién escribió el programa

REPORTING BUGS   ← Cómo reportar errores

SEE ALSO         ← Documentación relacionada
    dir(1), vdir(1), ls(1)
```

```bash
# Ver solo la sección SYNOPSIS
man ls | grep -A 5 "SYNOPSIS"

# Versión imprimible (sin paginación)
man -P cat ls    # Imprime todo a stdout

# Abrir en formato HTML (más cómodo en algunos casos)
man2html ls | firefox -  # Requiere man2html
```

### `apropos` y `whatis`: encontrar lo que no recuerdas

```bash
# apropos: busca en las descripciones de todas las man pages
apropos "comprimir"
# gzip (1)           - compress or expand files
# bzip2 (1)          - a block-sorting file compressor
# tar (1)            - an archiving utility
# zip (1)            - package and compress files

# Sinónimo: man -k
man -k "list directory"

# whatis: solo el nombre y descripción (una línea)
whatis ls
# ls (1)            - list directory contents

whatis grep
# grep (1)          - print lines that match patterns

# Actualizar base de datos de man (si apropos no encuentra nada)
sudo mandb
```

### `info`: la documentación del proyecto GNU

`info` es el sistema de documentación del proyecto GNU, más hipertextual que `man`. Para herramientas GNU (bash, gcc, coreutils), la documentación `info` suele ser más completa.

```bash
# Ver documento info de bash
info bash

# Navegar info:
# n → siguiente nodo
# p → nodo anterior
# u → subir nivel
# Enter en un enlace → seguir enlace
# q → salir

# Info de un comando específico
info coreutils 'ls invocation'

# Para quien prefiere man:
# Los temas de info también están en man (sección 1)
```

### `--help`: ayuda rápida integrada

Casi todos los programas GNU aceptan `--help` o `-h`:

```bash
ls --help
grep --help
git --help
python3 --help

# Para leer cómodamente (si la salida es larga):
ls --help | less
ls --help | grep "\-l"   # Solo las opciones que contienen "-l"
```

:::tip
`--help` es para consulta rápida. `man` es para lectura profunda. Usa `--help` cuando ya sabes el comando pero olvidaste una opción específica.
:::

### `/usr/share/doc`: documentación instalada

Muchos paquetes incluyen documentación adicional en `/usr/share/doc/`:

```bash
# Ver documentación de un paquete
ls /usr/share/doc/bash/
# changelog.Debian.gz  copyright  INSTALL  README  ...

# Leer changelog
zcat /usr/share/doc/bash/changelog.Debian.gz | less

# Documentación de nginx (si está instalado)
ls /usr/share/doc/nginx/
```

### `tldr`: man pages simplificadas para el siglo XXI

`tldr` (Too Long; Didn't Read) muestra ejemplos prácticos inmediatos, sin la extensión completa de `man`.

```bash
# Instalar tldr
sudo apt install tldr   # Ubuntu
# o con npm:
npm install -g tldr

# Actualizar base de datos
tldr --update

# Uso
tldr tar
# tar
# Archiving utility.
# More information: <https://www.gnu.org/software/tar>
#
# - Create an archive and write it to a file:
#   tar cf path/to/target.tar path/to/file1 path/to/file2...
#
# - Create a gzipped archive:
#   tar czf path/to/target.tar.gz path/to/file1 path/to/file2...

tldr git
tldr curl
tldr ffmpeg
```

### Tabla de cuándo usar cada herramienta

| Herramienta | Cuándo usarla |
|---|---|
| `man comando` | Referencia completa, conocer todas las opciones |
| `apropos "tema"` | No recuerdas el nombre del comando |
| `whatis comando` | Confirmar qué hace algo rápidamente |
| `info tema` | Documentación profunda de herramientas GNU |
| `comando --help` | Recordar opciones rápidamente |
| `tldr comando` | Ver ejemplos prácticos de uso |
| `/usr/share/doc/` | Documentación adicional del paquete |
| `https://man7.org` | Man pages online, accesibles desde cualquier lugar |

---

## 3.4 — Historial y edición de línea

### GNU Readline: la biblioteca que maneja tu input

Cuando escribes en Bash, no es Bash directamente quien gestiona el teclado: es la librería **GNU Readline**. Readline proporciona edición de línea, historial, autocompletado y atajos de teclado a cualquier programa que la use (Bash, Python REPL, MySQL client, etc.).

```
Tu teclado
    ↓
Readline (libreadline)
    ↓
Bash / Python / mysql / ...

Readline implementa:
├─ Edición con Ctrl/Alt+tecla (Emacs mode, default)
├─ Edición tipo vi (vi mode, opcional)
├─ Historial
├─ Autocompletado (Tab)
└─ Undo/Redo
```

### Atajos de teclado Readline (modo Emacs — por defecto)

Esta tabla es de las más útiles que existe para cualquier usuario de terminal. **Memoriza los primeros 10.**

#### Movimiento del cursor

| Atajo | Acción |
|---|---|
| `Ctrl+A` | Ir al **inicio** de la línea |
| `Ctrl+E` | Ir al **final** de la línea |
| `Ctrl+F` / `→` | Avanzar un carácter |
| `Ctrl+B` / `←` | Retroceder un carácter |
| `Alt+F` | Avanzar una **palabra** |
| `Alt+B` | Retroceder una **palabra** |
| `Ctrl+XX` | Alternar entre inicio de línea y posición actual |

#### Borrar texto

| Atajo | Acción |
|---|---|
| `Ctrl+D` | Borrar carácter **bajo el cursor** (o EOF si la línea está vacía) |
| `Backspace` | Borrar carácter **antes del cursor** |
| `Ctrl+H` | Equivalente a Backspace |
| `Alt+D` | Borrar **palabra** desde cursor hacia adelante |
| `Alt+Backspace` | Borrar **palabra** hacia atrás |
| `Ctrl+K` | Borrar desde cursor hasta **final** de línea (kill) |
| `Ctrl+U` | Borrar desde cursor hasta **inicio** de línea (kill) |
| `Ctrl+W` | Borrar **palabra** anterior (incluye símbolos) |
| `Ctrl+Y` | **Pegar** (yank) lo que se borró con los kills anteriores |

```bash
# Ejemplo práctico:
# Escribiste: sudo apt install package-name --verbose
# Quieres borrar "--verbose" al final:
# → Ctrl+K borra desde el cursor hasta el final
# Quieres borrar "package-name":
# → Alt+B para ir atrás una palabra, luego Alt+D para borrarla
```

#### Transformar texto

| Atajo | Acción |
|---|---|
| `Alt+U` | Convertir palabra a **MAYÚSCULAS** |
| `Alt+L` | Convertir palabra a **minúsculas** |
| `Alt+C` | Capitalizar primera letra de la palabra |
| `Ctrl+T` | Transponer (intercambiar) los dos caracteres antes del cursor |
| `Alt+T` | Transponer las dos palabras antes del cursor |

#### Control de la shell y proceso

| Atajo | Acción |
|---|---|
| `Ctrl+C` | Enviar SIGINT — interrumpir proceso en ejecución |
| `Ctrl+Z` | Enviar SIGTSTP — pausar proceso (ver Módulo 09) |
| `Ctrl+D` | EOF — cerrar la shell (si la línea está vacía) |
| `Ctrl+L` | Limpiar pantalla (equivalente a `clear`) |
| `Ctrl+S` | Pausar salida al terminal (XOFF) |
| `Ctrl+Q` | Reanudar salida al terminal (XON) |

:::warning
Si accidentalmente presionas `Ctrl+S` y el terminal "se congela", presiona `Ctrl+Q` para reanudar.
:::

#### Modo vi para Readline

Si prefieres edición estilo vi:

```bash
# Activar modo vi en la sesión actual
set -o vi

# Activar permanentemente (añadir a ~/.bashrc o ~/.inputrc)
set editing-mode vi

# Con modo vi:
# Esc → modo normal (navegación)
# i/a → modo inserción (escritura)
# hjkl → movimiento
# dw, dd, cw → edición vi normal
```

### El historial de comandos

Bash guarda todos los comandos en un archivo de historial para que puedas reutilizarlos.

```
~/.bash_history   ← Archivo donde se guarda el historial
$HISTSIZE         ← Máx. entradas en memoria durante la sesión
$HISTFILESIZE     ← Máx. entradas guardadas en ~/.bash_history
```

#### El comando `history`

```bash
# Ver todo el historial (numerado)
history
# 1  ls -la
# 2  cd /var/log
# 3  grep "ERROR" syslog
# ...
# 500  history

# Ver los últimos N comandos
history 20

# Buscar en el historial
history | grep "docker"
history | grep "apt install"

# Limpiar el historial de la sesión actual
history -c

# Borrar una entrada específica (número)
history -d 42

# Guardar el historial manualmente (antes de cerrar)
history -w
```

#### Expansión de historial: operadores `!`

```bash
# Ejecutar el último comando de nuevo
!!

# Ejecutar el comando número N del historial
!42

# Ejecutar el último comando que empieza con "cadena"
!git       # Último comando que empezó con "git"
!sudo      # Último comando que empezó con "sudo"

# El último argumento del comando anterior
echo $!$   # Último PID en background (diferente)
ls /etc/nginx
cat !$     # cat /etc/nginx  ← !$ = último argumento de !!

# El primer argumento del comando anterior
ls /var/log /var/cache
cd !^      # cd /var/log  ← !^ = primer argumento

# Todos los argumentos del comando anterior
echo archivo1.txt archivo2.txt
cp !* /backup/   # cp archivo1.txt archivo2.txt /backup/

# Sustitución en el último comando
sudo apt-get install paquete  # (con error)
^apt-get^apt^                 # sudo apt install paquete
```

#### Búsqueda inversa: `Ctrl+R`

El método más eficiente para encontrar comandos anteriores:

```bash
# Presiona Ctrl+R
(reverse-i-search)`': 

# Empieza a escribir parte del comando:
(reverse-i-search)`docker': docker run -it ubuntu bash

# Enter → ejecutar
# Ctrl+R → siguiente coincidencia más antigua
# → → Editar antes de ejecutar
# Ctrl+G → Cancelar la búsqueda
```

:::tip
Instala `fzf` para una búsqueda de historial mucho más potente con interfaz interactiva:

```bash
# Instalar fzf (fuzzy finder)
sudo apt install fzf

# Activar integración con Bash (añadir a ~/.bashrc)
source /usr/share/doc/fzf/examples/key-bindings.bash

# Ahora Ctrl+R muestra un selector interactivo con preview
```
:::

#### Variables de configuración del historial

Añade esto a `~/.bashrc` para un comportamiento óptimo:

```bash
# Número máximo de entradas en memoria
export HISTSIZE=10000

# Número máximo de entradas en el archivo
export HISTFILESIZE=20000

# No guardar duplicados consecutivos, ignorar comandos que empiecen con espacio
export HISTCONTROL=ignoreboth
# ignoredups → no duplicados consecutivos
# ignorespace → ignora comandos con espacio al inicio (para comandos "privados")
# ignoreboth → ambos

# Agregar, no sobreescribir (para múltiples terminales)
shopt -s histappend

# Guardar el historial en tiempo real (no solo al cerrar la sesión)
export PROMPT_COMMAND="history -a; history -c; history -r; $PROMPT_COMMAND"

# Ignorar comandos específicos del historial
export HISTIGNORE="ls:ll:la:cd:pwd:clear:history:exit"

# Añadir timestamp al historial
export HISTTIMEFORMAT="%Y-%m-%d %H:%M:%S  "
# history mostrará:
# 500  2024-06-01 10:30:15  ls -la /etc
```

### Autocompletado con Tab

`Tab` es el atajo más productivo de la terminal.

```bash
# Completar nombre de comando
git s⇥          → git status / git stash / git show (muestra opciones)
git sta⇥        → git status

# Completar ruta de archivo
cat /etc/ho⇥    → cat /etc/hostname  (si es único)
ls /etc/h⇥⇥    → (lista: hosts, hostname, hosts.conf, hostid...)

# Completar después de opciones
git checkout ⇥⇥  → (lista de branches)
kill -⇥⇥         → (lista de señales)
ssh ⇥⇥           → (lista de hosts conocidos en ~/.ssh/config)
man ⇥⇥           → (lista de páginas man disponibles)
```

**Instalar completaciones adicionales:**

```bash
# bash-completion: completaciones para cientos de programas
sudo apt install bash-completion

# Activar en ~/.bashrc (generalmente ya está):
if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
fi

# Completaciones específicas:
# git  → incluido en git-core
# pip  → pip completion --bash >> ~/.bashrc
# kubectl → kubectl completion bash >> ~/.bashrc
# docker  → incluido al instalar docker
```

---

## 3.5 — Expansiones de la shell

**Expansión** es el proceso por el cual Bash transforma lo que escribes *antes* de ejecutar el comando. Comprender las expansiones es fundamental para entender por qué ciertos comandos funcionan como esperamos (o no).

### Orden de procesamiento en Bash

Bash aplica las expansiones en este orden exacto:

```
Texto original ingresado:
  echo ~/docs/{a,b}.txt $VAR $(date) $((2+3)) *.log

Paso 1: Expansión de llaves
  echo ~/docs/a.txt ~/docs/b.txt $VAR $(date) $((2+3)) *.log

Paso 2: Expansión de tilde
  echo /home/juan/docs/a.txt /home/juan/docs/b.txt $VAR $(date) $((2+3)) *.log

Paso 3: Expansión de parámetros/variables
  echo /home/juan/docs/a.txt /home/juan/docs/b.txt "mi valor" $(date) $((2+3)) *.log

Paso 4: Sustitución de comandos
  echo /home/juan/docs/a.txt /home/juan/docs/b.txt "mi valor" "sáb 01 jun" $((2+3)) *.log

Paso 5: Expansión aritmética
  echo /home/juan/docs/a.txt /home/juan/docs/b.txt "mi valor" "sáb 01 jun" 5 *.log

Paso 6: División de palabras (word splitting)
  (separa en tokens según $IFS)

Paso 7: Expansión de nombres de archivo (globbing)
  echo /home/juan/docs/a.txt /home/juan/docs/b.txt "mi valor" "sáb 01 jun" 5 error.log access.log

Resultado: Bash ejecuta echo con todos esos argumentos
```

### Expansión de llaves `{}`

Genera cadenas o secuencias sin necesidad de que existan los archivos.

```bash
# Lista de palabras
echo {manzana,naranja,pera}
# manzana naranja pera

# Generar nombres de archivos
touch log_{error,access,debug}.txt
# Crea: log_error.txt  log_access.txt  log_debug.txt

# Secuencia numérica
echo {1..10}
# 1 2 3 4 5 6 7 8 9 10

# Secuencia con incremento
echo {0..20..5}
# 0 5 10 15 20

# Secuencia de letras
echo {a..z}
# a b c d e f g h i j k l m n o p q r s t u v w x y z
echo {A..Z}

# Combinaciones
echo {jpg,png,gif,svg}   # formatos de imagen
mkdir -p proyecto/{src,tests,docs,build}  # estructura de proyecto
cp archivo.txt{,.bak}    # Copia archivo.txt → archivo.txt.bak (truco útil)

# Prefijo y sufijo
echo pre{1,2,3}suf
# pre1suf pre2suf pre3suf

# Anidado
echo {a,b}{1,2}
# a1 a2 b1 b2
```

### Expansión de tilde `~`

```bash
# ~ = directorio home del usuario actual ($HOME)
echo ~
# /home/juan

cd ~            # Ir al home
ls ~/Downloads  # Listar Downloads del home

# ~usuario = home de otro usuario
echo ~root
# /root

echo ~postgres  # Home del usuario postgres (si existe)

# ~+ = directorio actual ($PWD)
echo ~+
# /home/juan/proyectos

# ~- = directorio anterior ($OLDPWD)
cd /var/log
cd /tmp
echo ~-         # /var/log
cd ~-           # Volver a /var/log (equivalente a "cd -")
```

### Expansión de parámetros y variables `$`

Esta es la expansión más rica. Más allá del simple `$VAR`:

```bash
# Básico
echo $HOME
echo $USER
echo ${HOME}    # Con llaves (necesario en contextos ambiguos)

# Valor por defecto si variable no está definida o vacía
echo ${VAR:-"valor por defecto"}
# Si VAR no existe o está vacía, usa "valor por defecto"

# Asignar valor por defecto (y guardarlo)
echo ${VAR:="valor asignado"}
# Si VAR está vacía, la asigna Y la devuelve

# Error si no está definida
echo ${VAR:?"La variable VAR es requerida"}
# Si VAR vacía, error y sale del script

# Usar valor alternativo (solo si VAR tiene valor)
echo ${VAR:+"VAR tiene valor"}
# Si VAR tiene valor, devuelve "VAR tiene valor"; sino, nada

# Longitud del valor
VAR="Hola mundo"
echo ${#VAR}    # 10

# Substring
echo ${VAR:5}   # "mundo"  (desde posición 5)
echo ${VAR:5:3} # "mun"    (desde pos 5, 3 caracteres)

# Eliminar prefijo (más corto)
ARCHIVO="imagen.jpg.bak"
echo ${ARCHIVO#*.}     # "jpg.bak"  (borra hasta primer punto)

# Eliminar prefijo (más largo)
echo ${ARCHIVO##*.}    # "bak"  (borra hasta último punto)

# Eliminar sufijo (más corto)
echo ${ARCHIVO%.*}     # "imagen.jpg"  (borra desde último punto)

# Eliminar sufijo (más largo)
echo ${ARCHIVO%%.*}    # "imagen"  (borra desde primer punto)

# Sustitución
echo ${ARCHIVO/.jpg/.png}   # "imagen.png.bak"  (primera ocurrencia)
echo ${ARCHIVO//.jpg/.png}  # Todas las ocurrencias

# Mayúsculas/minúsculas (Bash 4+)
STR="hola mundo"
echo ${STR^}    # "Hola mundo"  (primera letra mayúscula)
echo ${STR^^}   # "HOLA MUNDO"  (todo mayúsculas)
STR="HOLA MUNDO"
echo ${STR,}    # "hOLA MUNDO"  (primera letra minúscula)
echo ${STR,,}   # "hola mundo"  (todo minúsculas)
```

### Sustitución de comandos `$()`

Ejecuta un comando y captura su salida como texto.

```bash
# Sintaxis moderna (recomendada)
FECHA=$(date +%Y-%m-%d)
echo "Hoy es $FECHA"
# Hoy es 2024-06-01

# Sintaxis clásica (backticks) — evitar por legibilidad
FECHA=`date +%Y-%m-%d`

# Usos prácticos
echo "Hay $(ls /etc | wc -l) archivos en /etc"

# Anidado (fácil con $(), imposible con backticks)
echo "El usuario $(id -un) usa el home $(echo ~$(id -un))"

# En condiciones
if [ "$(uname -s)" = "Linux" ]; then
    echo "Estamos en Linux"
fi

# Capturar salida multilínea
SERVICIOS=$(systemctl list-units --type=service --state=running --no-legend)
echo "$SERVICIOS" | wc -l  # Cuántos servicios corren
```

### Expansión aritmética `$(())`

Evaluación de expresiones matemáticas enteras directamente en la shell.

```bash
# Operaciones básicas
echo $((3 + 4))     # 7
echo $((10 - 3))    # 7
echo $((3 * 4))     # 12
echo $((17 / 5))    # 3 (división entera)
echo $((17 % 5))    # 2 (módulo/resto)
echo $((2 ** 10))   # 1024 (potencia)

# Con variables
A=5; B=3
echo $((A * B))     # 15

# Incremento/decremento
N=10
echo $((N++))       # 10 (post-incremento)
echo $N             # 11
echo $((++N))       # 12 (pre-incremento)

# Comparaciones (0=verdadero/éxito no, 1=verdadero en aritmética)
echo $((5 > 3))     # 1 (verdadero)
echo $((5 < 3))     # 0 (falso)

# Para aritmética decimal usa bc o awk:
echo "scale=2; 22/7" | bc      # 3.14
awk 'BEGIN {printf "%.4f\n", 22/7}'  # 3.1429
```

### Expansión de nombres de archivo (Globbing)

Los **globs** son patrones que la shell expande a nombres de archivos.

```bash
# * → Cualquier secuencia de caracteres (excepto /)
ls *.txt             # Todos los .txt en el directorio actual
ls /var/log/*.log    # Todos los .log en /var/log

# ? → Exactamente un carácter cualquiera
ls archivo?.txt      # archivo1.txt, archivoa.txt, etc.
ls /dev/sd?          # sda, sdb, sdc...

# [...] → Uno de los caracteres dentro
ls archivo[123].txt  # archivo1.txt, archivo2.txt, archivo3.txt
ls /dev/sd[abc]      # sda, sdb, sdc
ls [aeiou]*          # Archivos que empiezan con vocal

# Rangos dentro de []
ls *[0-9].txt        # Archivos que terminan en dígito + .txt
ls [A-Z]*            # Archivos que empiezan con mayúscula

# Negación con [!] o [^]
ls [!a]*.txt         # txt que NO empiezan con 'a'

# Extglob (extensiones de Bash, requiere shopt -s extglob)
shopt -s extglob
ls !(*.txt)          # Todo excepto .txt
ls +(*.jpg|*.png)    # Solo .jpg o .png

# Globbing recursivo (Bash 4+ con globstar)
shopt -s globstar
ls **/*.txt          # Todos los .txt en subdirectorios (recursivo)
```

:::warning
**Si no hay coincidencias:** Por defecto, Bash deja el glob literal si no hay coincidencias. Para que falle con error, usa `shopt -s failglob`.
:::

### Reglas de comillas: el control de las expansiones

Las comillas controlan qué expansiones ocurren. Este es uno de los temas más confusos para principiantes y uno de los más importantes.

```
┌─────────────────────────────────────────────────────────────────┐
│ RESUMEN DE COMILLAS                                             │
├──────────────┬──────────────────────────────────────────────────┤
│ Sin comillas │ Expansión completa + word splitting + globbing   │
│ "dobles"     │ Solo $, ``, \  son especiales — SIN globbing     │
│ 'simples'    │ NADA es especial — texto literal                 │
│ $'...'       │ Secuencias \n \t \uXXXX (ANSI-C quoting)        │
└──────────────┴──────────────────────────────────────────────────┘
```

```bash
VAR="hola mundo"
PATRON="*.txt"

# Sin comillas: expansión + word splitting (¡PELIGROSO!)
echo $VAR          # hola mundo (word split en 2 args)
ls $PATRON         # Expande *.txt a archivos reales

# Comillas dobles: protege word splitting, permite expansión
echo "$VAR"        # hola mundo (un argumento, con espacio)
ls "$PATRON"       # Busca literalmente el archivo "*.txt"

# Comillas simples: todo literal
echo '$VAR'        # $VAR  (sin expandir)
echo '*.txt'       # *.txt (sin expandir)
echo 'precio: $5'  # precio: $5

# ANSI-C quoting $'...'
echo $'línea1\nlínea2'    # Imprime dos líneas separadas
echo $'tab\there'          # tab[TAB]here
echo $'♥'             # ♥ (Unicode)

# Regla de oro: SIEMPRE pon comillas dobles alrededor de variables
# (excepto cuando específicamente quieres word splitting)
cp $ARCHIVO /destino       # ❌ Falla si ARCHIVO tiene espacios
cp "$ARCHIVO" /destino     # ✅ Correcto
```

**Casos donde las comillas importan:**

```bash
# Con espacios en rutas/nombres
ARCHIVO="mi documento.txt"
cat $ARCHIVO          # ❌ Error: "mi" y "documento.txt" como args separados
cat "$ARCHIVO"        # ✅

# Con variables vacías
[ $VAR = "algo" ]     # ❌ Error si VAR vacía: [ = "algo" ]
[ "$VAR" = "algo" ]   # ✅ [ "" = "algo" ]

# En bucles
for f in $( ls ); do   # ❌ Problemas con espacios
    cat "$f"
done

for f in *; do         # ✅ Globbing es más seguro que ls
    cat "$f"
done
```

---

## 3.6 — Variables de entorno y configuración

### Variables de shell vs. variables de entorno

Hay una distinción crucial que a menudo se ignora:

```bash
# Variable de shell (solo existe en la shell actual)
MI_VAR="valor"
echo $MI_VAR        # "valor"
bash -c 'echo $MI_VAR'   # (vacío — el subproceso no la hereda)

# Variable de entorno (se exporta a procesos hijos)
export MI_VAR="valor"
bash -c 'echo $MI_VAR'   # "valor" ← ahora el hijo la ve

# Exportar una variable ya existente
MI_VAR="valor"
export MI_VAR

# Definir y exportar en una línea
export MI_VAR="valor"

# Ver todas las variables de entorno
env
printenv

# Ver una variable específica
printenv HOME
echo $HOME

# Eliminar variable
unset MI_VAR
```

```
Proceso padre
├─ Variables de shell: solo visibles en este proceso
├─ Variables de entorno (export): heredadas por TODOS los hijos
│
└─ Proceso hijo (bash, python, node...)
   ├─ Hereda copia de las variables de entorno
   ├─ Cambios en hijo NO afectan al padre
   └─ Puede crear sus propias variables
```

### Variables de entorno críticas

#### `PATH`: el mapa de comandos

Es la variable más importante de la shell. Define en qué directorios busca Bash cuando escribes un comando.

```bash
echo $PATH
# /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin

# Estructura:
# Directorio1:Directorio2:Directorio3:...
# Bash busca de izquierda a derecha, usa el primero que encuentra

# Añadir al PATH (al final — para este usuario):
export PATH="$PATH:/opt/mi-programa/bin"

# Añadir al inicio (toma precedencia sobre lo existente):
export PATH="/opt/mi-nuevo/bin:$PATH"

# Ver cómo resuelve un comando
which python3   # /usr/bin/python3  (primer match en PATH)
type -a python3 # Todos los python3 en PATH
```

```bash
# Truco: añadir ~/.local/bin al PATH (buenas prácticas)
mkdir -p ~/.local/bin
export PATH="$HOME/.local/bin:$PATH"
# Instala herramientas personales aquí sin ser root
```

#### Tabla de variables de entorno importantes

| Variable | Descripción | Ejemplo de valor |
|---|---|---|
| `$HOME` | Directorio home del usuario | `/home/juan` |
| `$USER` | Nombre del usuario actual | `juan` |
| `$SHELL` | Shell predeterminada del usuario | `/bin/bash` |
| `$PATH` | Directorios de búsqueda de comandos | `/usr/bin:/bin:...` |
| `$PWD` | Directorio de trabajo actual | `/home/juan/docs` |
| `$OLDPWD` | Directorio anterior | `/var/log` |
| `$TERM` | Tipo de terminal (para secuencias ANSI) | `xterm-256color` |
| `$LANG` | Idioma del sistema | `es_AR.UTF-8` |
| `$LC_ALL` | Override de todas las locales | `C.UTF-8` |
| `$EDITOR` | Editor de texto predeterminado | `vim` o `nano` |
| `$VISUAL` | Editor visual (para interfaces gráficas) | `code` |
| `$PAGER` | Paginador para salidas largas | `less` |
| `$PS1` | Prompt primario | `\u@\h:\w\$` |
| `$PS2` | Prompt de continuación | `> ` |
| `$PS4` | Prompt de depuración (set -x) | `+` |
| `$IFS` | Separador de palabras (word splitting) | ` \t\n` |
| `$HISTFILE` | Archivo del historial | `~/.bash_history` |
| `$HISTSIZE` | Entradas en memoria | `1000` |
| `$TMPDIR` | Directorio temporal | `/tmp` |
| `$DISPLAY` | Display de X11 | `:0` |
| `$WAYLAND_DISPLAY` | Display de Wayland | `wayland-0` |
| `$DBUS_SESSION_BUS_ADDRESS` | Bus D-Bus (servicios de escritorio) | `unix:path=...` |

```bash
# Ver todas las variables definidas en la shell (env + shell vars)
set | head -50

# Solo las de entorno (que se exportarán a hijos)
export -p    # o: env

# Pasar variable a un solo comando (sin exportar permanentemente)
LANG=C ls /etc        # ls en inglés, sin cambiar $LANG permanente
DEBUG=1 ./mi-script   # Pasar flag de debug al script
```

#### `$PS1`: el diseño del prompt

```bash
# Códigos especiales de PS1 en Bash:
# \u = nombre de usuario
# \h = hostname corto
# \H = hostname completo
# \w = ruta completa (~ para home)
# \W = solo el último directorio
# \n = salto de línea
# \t = hora HH:MM:SS
# \T = hora en formato 12h
# \d = fecha
# \# = número de comando
# \$ = $ si usuario, # si root
# \[ y \] = delimitadores de secuencias no imprimibles (colores)

# Prompt simple con color verde
export PS1='\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '

# Prompt con git branch (requiere __git_ps1):
export PS1='\u@\h:\w$(__git_ps1 " (%s)")\$ '

# Prompt multilínea
export PS1='\n\[\033[1;34m\]\u@\h:\w\[\033[0m\]\n\$ '
```

### Archivos de configuración de Bash

Este es uno de los temas más confusos de Bash. La clave es entender los **tipos de sesión**:

```
Tipos de sesión Bash:
│
├─ Login shell (--login)
│  Cuándo: SSH, login en consola, su -l, bash --login
│  Lee: /etc/profile → ~/.bash_profile → ~/.bash_login → ~/.profile
│
└─ Interactive non-login shell
   Cuándo: Abrir nueva terminal en GNOME, KDE, etc.
   Lee: /etc/bash.bashrc → ~/.bashrc
```

**Diagrama completo de qué archivo se lee cuándo:**

```
┌─── LOGIN SHELL ────────────────────────────────────────────┐
│                                                            │
│  /etc/profile                                              │
│       ↓                                                    │
│  /etc/profile.d/*.sh   (directorios con scripts)          │
│       ↓                                                    │
│  ~/.bash_profile  (si existe)                              │
│       O                                                    │
│  ~/.bash_login    (si existe y .bash_profile no)           │
│       O                                                    │
│  ~/.profile       (si existe y los otros no)               │
│       │                                                    │
│       └─→ Típicamente llama a ~/.bashrc                    │
└────────────────────────────────────────────────────────────┘

┌─── INTERACTIVE NON-LOGIN SHELL ────────────────────────────┐
│                                                            │
│  /etc/bash.bashrc                                          │
│       ↓                                                    │
│  ~/.bashrc                                                 │
└────────────────────────────────────────────────────────────┘

┌─── AL SALIR ───────────────────────────────────────────────┐
│  ~/.bash_logout   (solo para login shell)                  │
└────────────────────────────────────────────────────────────┘
```

:::tip
**Regla práctica:** Pon la configuración personal siempre en `~/.bashrc`. Para que los login shells también la lean, asegúrate de que `~/.bash_profile` la incluya:

```bash
# ~/.bash_profile — Hacer que los login shells carguen .bashrc
if [ -f ~/.bashrc ]; then
    source ~/.bashrc
fi
```

En Ubuntu, esto ya está configurado así por defecto.
:::

**Anatomía de un `~/.bashrc` completo:**

```bash
# ~/.bashrc — Configuración de Bash interactivo

# ── Guardia: salir si no es interactivo ──────────────────────────
# (evita que scripts que "sourcean" este archivo ejecuten todo)
[[ $- != *i* ]] && return

# ── Historial ────────────────────────────────────────────────────
HISTSIZE=10000
HISTFILESIZE=20000
HISTCONTROL=ignoreboth
HISTTIMEFORMAT="%Y-%m-%d %H:%M:%S  "
shopt -s histappend
PROMPT_COMMAND="history -a;$PROMPT_COMMAND"

# ── Opciones de shell ─────────────────────────────────────────────
shopt -s checkwinsize   # Actualizar LINES/COLUMNS tras cada comando
shopt -s globstar       # ** para recursión en globs
shopt -s extglob        # Patrones extendidos !(pat), ?(pat), etc.
shopt -s cdspell        # Corregir errores en cd (typos)
shopt -s autocd         # Escribir directorio sin cd lo entra

# ── Prompt ───────────────────────────────────────────────────────
export PS1='\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '

# ── PATH ─────────────────────────────────────────────────────────
export PATH="$HOME/.local/bin:$PATH"
export PATH="$HOME/bin:$PATH"

# ── Variables de entorno ─────────────────────────────────────────
export EDITOR=nano          # o vim, code...
export VISUAL=nano
export PAGER=less
export LESS="-R -F -X"     # Less con colores, salida sin pager si cabe

# ── Alias ────────────────────────────────────────────────────────
alias ls='ls --color=auto'
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'
alias diff='diff --color=auto'

# Seguridad: pedir confirmación antes de borrar/sobreescribir
alias rm='rm -i'
alias cp='cp -i'
alias mv='mv -i'

# Navegación rápida
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias ~='cd ~'
alias -- -='cd -'         # Alias para "cd -"

# Utilidades útiles
alias h='history'
alias c='clear'
alias df='df -h'
alias du='du -h'
alias free='free -h'
alias psg='ps aux | grep -v grep | grep'   # psg nginx → busca procesos nginx
alias ports='ss -tuln'                      # Ver puertos en escucha
alias myip='curl -s ifconfig.me'            # IP pública

# ── Funciones ────────────────────────────────────────────────────
# Crear directorio y entrar en él
mkcd() {
    mkdir -p "$1" && cd "$1"
}

# Extraer cualquier archivo comprimido
extract() {
    if [ -f "$1" ]; then
        case "$1" in
            *.tar.bz2)  tar xjf "$1"   ;;
            *.tar.gz)   tar xzf "$1"   ;;
            *.tar.xz)   tar xJf "$1"   ;;
            *.bz2)      bunzip2 "$1"   ;;
            *.gz)       gunzip "$1"    ;;
            *.zip)      unzip "$1"     ;;
            *.rar)      unrar x "$1"   ;;
            *.7z)       7z x "$1"      ;;
            *)  echo "'$1' no se puede extraer" ;;
        esac
    else
        echo "'$1' no es un archivo válido"
    fi
}

# Ver el clima (sin instalar nada)
weather() {
    curl "wttr.in/${1:-Buenos+Aires}?lang=es"
}

# ── Autocompletado ───────────────────────────────────────────────
if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
fi
```

### Alias: atajos permanentes

```bash
# Definir alias (válido para la sesión actual)
alias nombre='comando'

# Ejemplos útiles
alias update='sudo apt update && sudo apt upgrade -y'
alias gs='git status'
alias gc='git commit'
alias gp='git push'

# Ver todos los alias definidos
alias

# Ver un alias específico
alias ll

# Eliminar alias
unalias ll

# Alias en múltiples palabras (usar función mejor):
alias dockerclean='docker system prune -af && docker volume prune -f'
```

### Funciones de shell

Para lógica más compleja que un alias:

```bash
# Definición básica
function nombre_funcion() {
    # cuerpo
}

# Sintaxis alternativa (más portable POSIX)
nombre_funcion() {
    # cuerpo
}

# Función con argumentos ($1, $2, $@, $#)
saludar() {
    local nombre="$1"          # $1 = primer argumento
    local apellido="${2:-}"    # $2 = segundo (opcional)
    echo "Hola, $nombre $apellido"
}

saludar "Juan"          # Hola, Juan
saludar "Juan" "García" # Hola, Juan García

# Función que devuelve valor (mediante echo)
obtener_fecha() {
    echo "$(date +%Y-%m-%d)"
}
hoy=$(obtener_fecha)
echo "Hoy es $hoy"

# Función con código de retorno
archivo_existe() {
    [ -f "$1" ]   # Retorna 0 (éxito) si el archivo existe
}
archivo_existe /etc/passwd && echo "Existe" || echo "No existe"

# Ver funciones definidas
declare -F              # Lista nombres de funciones
declare -f nombre_func  # Muestra la definición completa
type nombre_func        # También la muestra

# Eliminar función
unset -f nombre_funcion
```

### El archivo `~/.inputrc`: configuración de Readline

Para cambios en Readline que aplican a todos los programas (no solo Bash):

```bash
# ~/.inputrc — Configuración de GNU Readline

# Caso insensible en Tab completion
set completion-ignore-case on

# Mostrar tipo de archivo en completado (colores)
set colored-stats on
set colored-completion-prefix on

# Un solo Tab muestra lista (sin necesitar doble Tab)
set show-all-if-ambiguous on

# Desactivar el beep
set bell-style none

# Mostrar ... mientras completa
set completion-display-width 0

# Historial navegable (flechas recuerdan el inicio del comando)
"\e[A": history-search-backward    # ↑ con prefijo
"\e[B": history-search-forward     # ↓ con prefijo

# Modo vi (alternativa a poner set -o vi en .bashrc)
# set editing-mode vi
```

---

## 3.7 — Multiplexores de terminal

### ¿Por qué necesitas un multiplexor?

Considera este escenario sin multiplexor:

```
Escenario: Trabajas en un servidor remoto vía SSH

1. Abres sesión SSH
2. Lanzas un proceso largo: ./compilar-proyecto (1 hora)
3. Tu conexión de internet cae
4. → El proceso MUERE porque la sesión SSH terminó

Con multiplexor:
1. Abres sesión SSH
2. Lanzas tmux
3. Dentro de tmux, ejecutas ./compilar-proyecto
4. Tu conexión cae
5. → El proceso SIGUE corriendo dentro de tmux
6. Te reconectas y adjuntas al tmux → ves el resultado
```

**Beneficios de los multiplexores:**

```
┌────────────────────────────────────────────────────────────┐
│  SIN multiplexor          │  CON multiplexor               │
├────────────────────────────┼───────────────────────────────┤
│ Una tarea por ventana     │ Múltiples paneles en una       │
│ Sesión muere si SSH cae   │ Sesiones persistentes          │
│ No puedes "desconectarte" │ Detach y reattach              │
│ Sin historial de sesión   │ Scroll buffer extenso          │
│ Una sola ventana activa   │ Múltiples ventanas nombradas   │
└────────────────────────────┴───────────────────────────────┘
```

### tmux — Terminal Multiplexer

tmux es el multiplexor de facto en sistemas modernos.

```
Arquitectura de tmux:

┌─ Servidor tmux (proceso daemon) ─────────────────────────┐
│                                                          │
│  ┌─ Sesión "trabajo" ──────────────────────────────────┐ │
│  │                                                     │ │
│  │  ┌─ Ventana 1: "editor" ─────────────────────────┐ │ │
│  │  │  ┌─────────────┬─────────────────────────────┐ │ │ │
│  │  │  │  Panel 1   │     Panel 2                 │ │ │ │
│  │  │  │  vim       │     bash (terminal libre)   │ │ │ │
│  │  │  └─────────────┴─────────────────────────────┘ │ │ │
│  │  └───────────────────────────────────────────────┘ │ │
│  │                                                     │ │
│  │  ┌─ Ventana 2: "servidor" ──────────────────────┐  │ │
│  │  │  ┌──────────────────────────────────────────┐ │  │ │
│  │  │  │  Panel único: nginx logs                 │ │  │ │
│  │  │  └──────────────────────────────────────────┘ │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─ Sesión "personal" ─────────────────────────────────┐ │
│  │  ...                                                │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘

Tu emulador de terminal (GNOME Terminal, etc.)
→ Se conecta al servidor tmux
→ Muestra la sesión actual
→ Si cierras el terminal, el servidor sigue vivo
```

#### Instalar tmux

```bash
# Ubuntu/Debian
sudo apt install tmux

# Fedora
sudo dnf install tmux

# Verificar instalación
tmux -V
# tmux 3.3a
```

#### Inicio rápido con tmux

```bash
# Iniciar nueva sesión tmux
tmux

# Iniciar sesión con nombre
tmux new-session -s trabajo
tmux new -s trabajo    # Forma corta

# Listar sesiones activas
tmux ls
tmux list-sessions

# Adjuntar a una sesión existente
tmux attach -t trabajo
tmux a -t trabajo      # Forma corta
tmux a                 # Adjuntar a la más reciente

# Desconectarse (detach) sin matar la sesión
Ctrl+B  d              # Prefix + d

# Matar una sesión desde fuera
tmux kill-session -t trabajo
```

#### La tecla Prefix: `Ctrl+B`

tmux usa una tecla prefix (`Ctrl+B` por defecto) para distinguir los comandos tmux de la entrada normal a los programas.

```
Cómo usar tmux: Prefix + tecla
= Presiona Ctrl+B, suéltalo, luego presiona la tecla indicada
```

#### Referencia completa de atajos tmux

<Tabs>
<TabItem value="sesiones" label="Sesiones">

| Atajo | Acción |
|---|---|
| `Prefix + d` | **Detach** (desconectarse sin matar) |
| `Prefix + $` | Renombrar sesión actual |
| `Prefix + s` | Listar y seleccionar sesión |
| `Prefix + L` | Cambiar a última sesión activa |
| `Prefix + (` / `)` | Sesión anterior / siguiente |

</TabItem>
<TabItem value="ventanas" label="Ventanas">

| Atajo | Acción |
|---|---|
| `Prefix + c` | **Crear** nueva ventana |
| `Prefix + ,` | **Renombrar** ventana actual |
| `Prefix + n` | Ventana siguiente |
| `Prefix + p` | Ventana anterior |
| `Prefix + N` | Ir a ventana número N (0-9) |
| `Prefix + &` | Matar ventana actual |
| `Prefix + w` | Listar y seleccionar ventanas |
| `Prefix + f` | Buscar ventana por nombre |

</TabItem>
<TabItem value="paneles" label="Paneles (Panes)">

| Atajo | Acción |
|---|---|
| `Prefix + %` | Dividir horizontalmente (izq/der) |
| `Prefix + "` | Dividir verticalmente (arr/abajo) |
| `Prefix + ←/→/↑/↓` | Mover al panel adyacente |
| `Prefix + o` | Ciclar entre paneles |
| `Prefix + q` | Mostrar números de panel |
| `Prefix + x` | Matar panel actual |
| `Prefix + z` | **Zoom** (maximizar/restaurar panel) |
| `Prefix + !` | Convertir panel en ventana |
| `Prefix + {` / `}` | Rotar panel izquierda/derecha |
| `Prefix + Espacio` | Cambiar layout predefinido |
| `Prefix + Alt+1..5` | Layouts: even-h, even-v, main-h, main-v, tiled |
| `Prefix + Ctrl+↑/↓/←/→` | Redimensionar panel |

</TabItem>
<TabItem value="copia" label="Modo copia">

| Atajo | Acción |
|---|---|
| `Prefix + [` | Entrar en modo copia (para scroll) |
| `Espacio` | Iniciar selección de texto |
| `Enter` | Copiar selección |
| `q` | Salir de modo copia |
| `Prefix + ]` | Pegar buffer copiado |
| `Prefix + =` | Listar buffers de copia |
| `/` | Buscar hacia adelante en modo copia |
| `?` | Buscar hacia atrás |

</TabItem>
</Tabs>

#### Configuración de tmux: `~/.tmux.conf`

```bash
# ~/.tmux.conf — Configuración de tmux

# ── Cambiar prefix a Ctrl+A (más ergonómico, similar a GNU Screen)
# unbind C-b
# set -g prefix C-a
# bind C-a send-prefix

# ── Numeración desde 1 (más intuitivo que desde 0)
set -g base-index 1
setw -g pane-base-index 1

# ── Recargar configuración con Prefix + r
bind r source-file ~/.tmux.conf \; display "tmux.conf recargado"

# ── Dividir con | y - (más intuitivo)
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"

# ── Navegar paneles con Alt+Arrow (sin prefix)
bind -n M-Left  select-pane -L
bind -n M-Right select-pane -R
bind -n M-Up    select-pane -U
bind -n M-Down  select-pane -D

# ── Mouse habilitado (útil para novatos, opcional para avanzados)
set -g mouse on

# ── Historial de scrollback más grande
set -g history-limit 50000

# ── Tiempo de display de mensajes
set -g display-time 4000

# ── Actualizar el status bar frecuentemente
set -g status-interval 5

# ── Colores verdaderos (True Color / 24-bit)
set -g default-terminal "tmux-256color"
set -ag terminal-overrides ",xterm-256color:RGB"

# ── Status bar personalizado
set -g status-bg colour235
set -g status-fg white
set -g status-left-length 40
set -g status-right-length 60
set -g status-left '#[fg=green][#S] '
set -g status-right '#[fg=yellow]%H:%M #[fg=cyan]%d-%m-%Y'
set -g window-status-current-style 'fg=white,bg=blue,bold'

# ── Modo vi para selección de texto en modo copia
setw -g mode-keys vi
bind -T copy-mode-vi v send -X begin-selection
bind -T copy-mode-vi y send -X copy-selection-and-cancel

# ── Renumerar ventanas automáticamente al cerrar una
set -g renumber-windows on

# ── Beep silencioso
set -g bell-action none
set -g visual-bell off
```

#### Flujo de trabajo real con tmux

```bash
# Escenario: Desarrollo de proyecto Django

# 1. Crear sesión nombrada
tmux new -s django

# 2. Renombrar la primera ventana
Prefix + ,   → escribe "editor"

# 3. Abrir vim en panel izquierdo
vim models.py

# 4. Crear panel derecho para shell
Prefix + %

# 5. Crear segunda ventana para el servidor de desarrollo
Prefix + c
Prefix + ,  → escribe "server"
python manage.py runserver

# 6. Crear tercera ventana para git
Prefix + c
Prefix + ,  → escribe "git"
git status

# 7. Si cortas la conexión/cierras el terminal:
# (El proceso manage.py sigue corriendo)

# 8. Reconectar en otra sesión/otro día:
tmux attach -t django
# Todo está exactamente como lo dejaste
```

### GNU Screen: la alternativa clásica

Screen existe desde 1987. Es más antiguo que tmux pero sigue instalado en muchos servidores.

```bash
# Instalar
sudo apt install screen

# Inicio básico
screen             # Nueva sesión
screen -S nombre   # Nueva sesión con nombre
screen -ls         # Listar sesiones
screen -r nombre   # Reconectarse

# Prefix de Screen: Ctrl+A (diferente a tmux's Ctrl+B)
Ctrl+A c   # Nueva ventana
Ctrl+A "   # Listar ventanas
Ctrl+A d   # Detach
Ctrl+A k   # Matar ventana actual
Ctrl+A S   # Dividir horizontalmente
Ctrl+A |   # Dividir verticalmente
Ctrl+A Tab # Cambiar entre paneles
```

### Zellij: el multiplexor moderno (Rust)

Una alternativa moderna a tmux con mejor UX para principiantes:

```bash
# Instalar (desde repositorio oficial o cargo)
cargo install zellij
# o descargar binario desde https://github.com/zellij-org/zellij

# Inicio
zellij

# Características:
# ├─ Barra de atajos siempre visible (sin memorizar)
# ├─ Layouts declarativos en YAML/KDL
# ├─ Plugins en WebAssembly
# └─ Diseño más moderno y colorido
```

---

## Anexos

### A. Tabla completa de atajos Readline

Esta tabla complementa la sección 3.4 con todos los bindings disponibles:

```bash
# Ver todos los bindings actuales de Readline
bind -P | head -80

# Ver bindings en formato de archivo de configuración
bind -p | grep -v "^#\|^ *$" | head -50
```

#### Macros y bindings personalizados en `.inputrc`

```bash
# ~/.inputrc — Ejemplos de macros

# Insertar fecha con Alt+d
"\ed": "$(date +%Y-%m-%d)\e\C-e"

# Listar archivos con Alt+l
"\el": "ls -la\n"

# sudo !! con Alt+s (reruns last command with sudo)
"\es": "\C-asudo \C-e"

# Cambiar al directorio padre con Alt+.
"\e.": "cd ..\n"
```

### B. Referencias cruzadas entre módulos

Este módulo conecta con los anteriores y posteriores:

```
◀ Módulo 01 — Introducción al mundo Linux
│
│  La filosofía UNIX (sección 1.3) explica POR QUÉ la CLI
│  funciona como funciona: pipes, composibilidad, texto plano.
│  Cada comando de este módulo ES esa filosofía en práctica.
│
│  POSIX (sección 1.2) define el comportamiento de sh, los
│  argumentos de los comandos, y el entorno de variables.

◀ Módulo 02 — Instalación y primer contacto
│
│  Los comandos de diagnóstico del Anexo C del Módulo 02
│  (lscpu, free, df, systemctl) son aplicaciones directas
│  de lo aprendido aquí.
│
│  La apertura de terminal en GNOME/KDE (sección 2.5)
│  da acceso a la shell estudiada aquí.

▶ Módulo 04 — Sistema de archivos
│
│  Los comandos cd, ls, pwd vistos brevemente aquí
│  se estudian en profundidad en el Módulo 04.
│  El concepto "todo es un archivo" del Módulo 01
│  se materializa en el Módulo 04.

▶ Módulo 05 — Archivos y procesamiento de texto
│
│  grep, sed, awk son los programas UNIX "especialistas"
│  mencionados en la sección 1.3 del Módulo 01.
│  Los pipes y expansiones de este módulo son el pegamento.

▶ Módulo 10 — Shell Scripting Bash
│
│  Las expansiones (3.5), variables (3.6) y funciones (3.6)
│  de este módulo son la base del scripting.
│  Todo lo aprendido aquí escala directamente.
```

### C. Emuladores de terminal recomendados

| Emulador | Tecnología | Ventajas | Ideal para |
|---|---|---|---|
| **GNOME Terminal** | GTK | Pre-instalado en Ubuntu, fiable | Principiantes |
| **Konsole** | Qt/KDE | Múltiples perfiles, muy configurable | KDE users |
| **Alacritty** | Rust + GPU | Extremadamente rápido | Performance |
| **Kitty** | Python + GPU | Extensible, gráficos, shortcuts | Power users |
| **WezTerm** | Rust | Multiplexor integrado, Lua config | Avanzados |
| **Tilix** | GTK | Paneles integrados (sin tmux) | Multi-panel |
| **Foot** | C/Wayland | Solo Wayland, mínimo, rápido | Wayland puro |

### D. Configurar Zsh + Oh My Zsh como alternativa a Bash

```bash
# 1. Instalar Zsh
sudo apt install zsh

# 2. Instalar Oh My Zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# 3. Plugins recomendados (editar ~/.zshrc)
plugins=(
    git               # Alias y funciones para git
    docker            # Autocompletado docker
    kubectl           # Autocompletado kubernetes
    z                 # cd inteligente por frecuencia
    zsh-autosuggestions    # Sugerencias en línea
    zsh-syntax-highlighting # Resaltado de sintaxis
)

# 4. Instalar plugins de terceros
# zsh-autosuggestions:
git clone https://github.com/zsh-users/zsh-autosuggestions \
    ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# zsh-syntax-highlighting:
git clone https://github.com/zsh-users/zsh-syntax-highlighting \
    ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

# 5. Cambiar shell predeterminada
chsh -s $(which zsh)
```

### E. Script de utilidades para el ~/.bashrc

```bash
#!/bin/bash
# Colección de funciones útiles para añadir a ~/.bashrc

# ── Navegación rápida ──────────────────────────────────────────
cdl() { cd "$1" && ls -la; }           # cd + ls combinado
up()  { cd $(printf '%0.s../' {1..$1}); }  # up 3 → cd ../../..

# ── Búsqueda ───────────────────────────────────────────────────
ff()  { find . -name "*$1*" -type f; }  # ff nombre
fd()  { find . -name "*$1*" -type d; }  # fd nombre (directorios)
ftext() { grep -r "$1" . --include="*.${2:-*}"; }  # ftext "texto" py

# ── Red ────────────────────────────────────────────────────────
port() { sudo lsof -iTCP:$1 -sTCP:LISTEN; }   # port 8080 → qué ocupa ese puerto
scan() { nmap -sn "$1"/24; }                   # scan 192.168.1.0 → red local

# ── Sistema ────────────────────────────────────────────────────
biggest() { du -sh * | sort -rh | head -${1:-10}; }  # top 10 archivos más grandes
cpu()  { ps aux --sort=-%cpu | head -11; }     # Top procesos por CPU
mem()  { ps aux --sort=-%mem | head -11; }     # Top procesos por RAM
disk() { df -h --output=target,pcent,size,avail | column -t; }

# ── Git rápido ─────────────────────────────────────────────────
gs()  { git status; }
gl()  { git log --oneline --graph --decorate -20; }
gd()  { git diff --stat; }
gp()  { git pull; }
gP()  { git push; }
```

---

## Referencias y Bibliografía

### Documentación oficial de shells

1. **GNU Bash Reference Manual**  
   https://www.gnu.org/software/bash/manual/bash.html  
   La referencia oficial y completa de Bash. Esencial para scripting avanzado.

2. **Bash man page (en línea)**  
   https://man7.org/linux/man-pages/man1/bash.1.html  
   La misma información de `man bash`, accesible desde el navegador.

3. **The POSIX Shell and Utilities Specification**  
   https://pubs.opengroup.org/onlinepubs/9699919799/utilities/V3_chap02.html  
   Estándar oficial del shell POSIX (compatible con el estudio de POSIX del Módulo 01).

4. **Zsh Documentation**  
   https://zsh.sourceforge.io/Doc/Release/zsh_toc.html  
   Manual completo de Zsh.

5. **Fish Shell Documentation**  
   https://fishshell.com/docs/current/  
   Documentación de Fish, incluida la diferencia con Bash.

### GNU Readline

6. **GNU Readline Library**  
   https://tiswww.case.edu/php/chet/readline/rltop.html  
   Sitio oficial de Readline con documentación completa.

7. **GNU Readline User Manual**  
   https://tiswww.case.edu/php/chet/readline/readline.html  
   Descripción de todos los atajos y el formato de `.inputrc`.

### Historia y conceptos

8. **The Art of Unix Programming** — Eric S. Raymond (2003)  
   http://www.catb.org/~esr/writings/taoup/  
   Capítulo 11 sobre la interfaz de línea de comandos. Extensión directa del Módulo 01.

9. **TTY demystified** — Linus Åkesson (2008)  
   https://www.linusakesson.net/programming/tty/  
   Artículo clásico que explica la arquitectura TTY/PTY en profundidad.

10. **A Brief Introduction to termios** — MIT  
    https://stuff.mit.edu/afs/sipb/project/tcl/vendor/tcl7.4/compat/unistd.h  
    Bajo nivel de cómo funciona la entrada de terminal.

11. **VT100 Escape Sequences**  
    https://vt100.net/docs/vt100-ug/  
    Estándar DEC VT100 que todos los emuladores modernos implementan.

### Herramientas y utilidades

12. **less manual**  
    https://man7.org/linux/man-pages/man1/less.1.html  
    Manual del paginador que usa `man`.

13. **man-pages project**  
    https://www.kernel.org/doc/man-pages/  
    El proyecto oficial que mantiene las man pages de Linux.

14. **tldr-pages**  
    https://tldr.sh/  
    Sitio oficial de tldr con todas las páginas en línea.

15. **GNU Coreutils Documentation**  
    https://www.gnu.org/software/coreutils/manual/  
    Manual de todas las herramientas básicas (ls, cp, mv, etc.).

### tmux

16. **tmux man page**  
    https://man7.org/linux/man-pages/man1/tmux.1.html  
    Referencia completa de todos los comandos tmux.

17. **The Tao of tmux** — Tony Narlock  
    https://leanpub.com/the-tao-of-tmux/read  
    Libro online y gratuito sobre tmux en profundidad.

18. **Awesome tmux**  
    https://github.com/rothgar/awesome-tmux  
    Colección de plugins, temas y recursos para tmux.

### Expansiones y scripting

19. **Bash Pitfalls** — Greg's Wiki  
    https://mywiki.wooledge.org/BashPitfalls  
    Lista de errores comunes en Bash, muchos relacionados con expansiones.

20. **Bash FAQ** — Greg's Wiki  
    https://mywiki.wooledge.org/BashFAQ  
    Respuestas a las preguntas más frecuentes sobre Bash.

21. **POSIX specification: Shell Variables**  
    https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap08.html  
    Variables de entorno definidas por el estándar POSIX.

22. **ShellCheck** — Analizador estático de scripts Bash  
    https://www.shellcheck.net/  
    Herramienta esencial para detectar errores antes de ejecutar.

### Historia del terminal

23. **A History of Modern Computing** — Paul Ceruzzi (2003)  
    MIT Press. Contexto histórico de teletypes a terminales modernos.

24. **Unix: A History and a Memoir** — Brian Kernighan (2019)  
    Narración de primera mano del nacimiento de UNIX y sus herramientas.

---

## Preguntas de autoevaluación

1. ¿Cuál es la diferencia entre un emulador de terminal, un PTY y una shell? ¿Cómo se relacionan?
2. Describe el orden en que Bash busca un comando. ¿Cómo compruebas qué encontrará primero?
3. ¿Qué hace exactamente `Ctrl+U` en la línea de comandos?
4. ¿En qué situación usarías `man 5 passwd` en lugar de `man passwd`?
5. ¿Cuáles son las 6 secciones que tiene una página `man`? Describe cada una brevemente.
6. Escribe el comando para buscar en el historial los últimos 3 comandos que usaron `docker run`.
7. ¿Cuál es la diferencia entre `"$VAR"` y `'$VAR'`? Da un ejemplo de cuándo cada una importa.
8. Explica la diferencia entre `${VAR:-default}` y `${VAR:=default}`.
9. ¿Qué hace `shopt -s globstar` y por qué es útil?
10. ¿Por qué tmux es especialmente útil en conexiones SSH remotas?
11. ¿Cuándo se lee `~/.bash_profile` vs `~/.bashrc`? ¿Qué contiene cada uno idealmente?
12. Tienes el comando: `ls *.txt`. Explica qué expansión hace Bash y si el programa `ls` llega a "ver" el `*`.

---

## Laboratorios prácticos

### Lab 3.1 — Explorar tu shell

```bash
# 1. Averiguar tu shell actual y su versión
echo $SHELL
$SHELL --version

# 2. Ver qué tipo son 5 comandos diferentes
type ls cd grep date python3

# 3. Listar todos los builtins de Bash
help | head -30

# 4. Ver tu PATH y entender cada directorio
echo $PATH | tr ':' '\n'
# ¿Qué hay en cada directorio?
ls /usr/local/bin | head -10
ls /usr/bin | wc -l    # ¿Cuántos comandos hay en /usr/bin?
```

### Lab 3.2 — El sistema de ayuda

```bash
# 1. Leer la página man de ls y encontrar cómo ordenar por fecha
man ls    # Busca: /-t    para encontrar la opción -t

# 2. Usar apropos para encontrar comandos que "compress" archivos
apropos compress

# 3. Comparar man vs tldr para el comando tar
man tar | head -50
tldr tar

# 4. Encontrar en qué sección está "crontab"
man -f crontab
# Notarás que hay crontab(1) y crontab(5)
# ¿Cuál es la diferencia?
```

### Lab 3.3 — Dominar el historial

```bash
# 1. Configurar el historial en tu ~/.bashrc
# Añadir:
HISTSIZE=5000
HISTCONTROL=ignoreboth
HISTTIMEFORMAT="%Y-%m-%d %H:%M "
shopt -s histappend

# 2. Ejecutar 10 comandos variados, luego:
history | tail -15

# 3. Repetir el último comando con !!
# 4. Repetir el último git... con !git
# 5. Practicar Ctrl+R buscando un comando específico
```

### Lab 3.4 — Expansiones

```bash
# 1. Crear estructura de proyecto con brace expansion
mkdir -p mi-proyecto/{src/{components,utils,hooks},tests,docs,public}
tree mi-proyecto/   # (instalar: sudo apt install tree)

# 2. Probar expansión de parámetros avanzada
RUTA="/home/juan/documentos/archivo.tar.gz"
echo "Nombre sin extensión: ${RUTA%%.*}"
echo "Solo extensión final: ${RUTA##*.}"
echo "Directorio: ${RUTA%/*}"
echo "Nombre de archivo: ${RUTA##*/}"

# 3. Diferencia entre comillas
VAR="hola   mundo"   # Tres espacios
echo $VAR            # ¿Cuántos argumentos recibe echo?
echo "$VAR"          # ¿Y ahora?
printf "%s\n" $VAR   # ¿Cuántas líneas imprime?
printf "%s\n" "$VAR" # ¿Y ahora?
```

### Lab 3.5 — Configurar el entorno

```bash
# 1. Añadir a ~/.bashrc:
#    - 3 alias útiles para ti
#    - La función mkcd() del ejemplo
#    - La función extract()
#    - Configuración de historial

# 2. Recargar sin cerrar la terminal:
source ~/.bashrc
# o:
. ~/.bashrc

# 3. Verificar que los alias funcionan
alias       # Ver todos
ll          # Probar el alias ll
mkcd /tmp/prueba-mkcd  # Debe crear Y entrar al directorio
```

### Lab 3.6 — tmux básico

```bash
# 1. Instalar y abrir tmux
sudo apt install tmux
tmux new -s practica

# 2. Crear layout de trabajo:
#    - Dividir horizontalmente: Prefix + %
#    - En el panel derecho, dividir verticalmente: Prefix + "
#    - Mover entre paneles con Prefix + flechas

# 3. Ejecutar un proceso largo en un panel:
watch -n1 date    # Actualiza la fecha cada segundo

# 4. Detach de la sesión: Prefix + d
# Verifica que tmux sigue corriendo: tmux ls
# 5. Volver a adjuntarse: tmux a -t practica
# El 'watch date' sigue corriendo

# 6. Crear una segunda ventana: Prefix + c
# Renombrarla: Prefix + ,
# Navegar entre ventanas: Prefix + n / p
```

---

## Resumen del módulo

Este módulo te ha dado los fundamentos de la interfaz más poderosa de Linux:

✅ **Arquitectura TTY/PTY:** Entiendes qué ocurre "detrás" del terminal  
✅ **Shells disponibles:** Bash, Zsh, Fish y cuándo usar cada una  
✅ **Anatomía de comandos:** Tipos, PATH lookup, códigos de salida  
✅ **Sistema de ayuda:** `man`, `apropos`, `tldr` — nunca más te quedarás bloqueado  
✅ **Readline:** Atajos para editar la línea como un profesional  
✅ **Historial:** Búsqueda, expansión y configuración óptima  
✅ **Expansiones:** Las 6 transformaciones que Bash realiza antes de ejecutar  
✅ **Comillas:** Control preciso de qué se expande y qué no  
✅ **Variables y entorno:** `PATH`, `.bashrc`, alias, funciones persistentes  
✅ **tmux:** Sesiones persistentes, paneles, flujo de trabajo profesional  

**Próximo paso:** [Módulo 04 — Sistema de archivos](/sistema-de-archivos). Aplicaremos todo lo aprendido aquí para navegar, crear y manipular la jerarquía de directorios de Linux en profundidad.

---

**Última actualización:** 2024-06  
**Versión:** 1.0  
**Estado:** ✅ Listo para enseñanza
