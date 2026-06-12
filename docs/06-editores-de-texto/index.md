---
title: "Módulo 06 — Editores de texto"
sidebar_label: "06 · Editores de texto"
description: nano para sobrevivir, vim a fondo con modos/movimientos/operadores/macros, Neovim, micro, helix, emacs y VS Code Remote SSH. Nunca más quedarte atrapado en un editor.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Módulo 06 — Editores de texto

## Introducción

Hay un rito de iniciación en Linux que tarde o temprano vive todo profesional: abres un archivo de configuración en un servidor de producción, sin entorno gráfico, sin ratón, con la urgencia de un incidente activo. El editor que aparece no es VS Code. Es `vi` o `vim`. Y si no sabes salir, el pánico es real.

Este módulo te garantiza dos cosas: que **nunca más te quedes atrapado en un editor**, y que con el tiempo `vim` se convierta en una extensión natural de tu pensamiento, no en un obstáculo.

En el [Módulo 05](/archivos-y-procesamiento-de-texto) aprendiste a transformar texto con `sed` y `awk` de forma no interactiva. Los editores de texto son el complemento: cuando la transformación es lo suficientemente compleja o puntual como para necesitar **ver el archivo mientras lo editas**, necesitas un editor.

En el [Módulo 03](/terminal-y-shell) viste que la shell usa Readline con atajos `Ctrl+A`, `Ctrl+E`, `Ctrl+K`. Muchos de esos atajos tienen su origen en **Emacs**. Y los modos de `vim` tienen su origen en `vi`, el editor estándar de UNIX desde 1976.

### La pregunta que siempre aparece: ¿por qué aprender vim si existe VS Code?

```
VS Code en un servidor remoto:
├── Necesita extensión Remote-SSH
├── Necesita que el servidor tenga recursos para el servidor VSCode
├── Necesita conexión estable de red
└── No sirve si el servidor está en modo emergencia / recovery

vim en un servidor:
├── Está instalado en el 99% de los sistemas Linux/Unix
├── Funciona en cualquier terminal SSH, incluso con alta latencia
├── Funciona en modo recovery, minimal, sin X11
├── Es el editor de git commit messages por defecto
└── Lleva 50 años sin cambiar su interfaz central
```

### Objetivos de aprendizaje

Al finalizar este módulo, serás capaz de:

- ✅ Editar cualquier archivo con `nano` desde el primer segundo
- ✅ Entrar y salir de `vim` sin pánico, y editar con confianza básica
- ✅ Navegar en vim sin las teclas de flecha (hjkl + movimientos semánticos)
- ✅ Usar la gramática de vim: operador + movimiento + texto-objeto
- ✅ Buscar y reemplazar, usar macros, gestionar múltiples buffers
- ✅ Configurar vim con un `.vimrc` funcional y comentado
- ✅ Entender qué es Neovim y cuándo adoptarlo
- ✅ Conocer las alternativas modernas: `micro`, `helix`, `emacs`
- ✅ Usar VS Code Remote-SSH para editar en servidores remotos

---

## 6.1 — nano: el editor para sobrevivir

`nano` es el editor más accesible de Linux. Muestra sus comandos en la parte inferior de la pantalla, acepta el ratón, y se comporta como un editor de texto normal. Es el primer editor que deberías dominar, aunque después evoluciones a vim.

### Abrir, editar, guardar y salir

```bash
# Abrir un archivo (crea uno nuevo si no existe)
nano /etc/hosts
nano ~/.bashrc
nano nuevo_archivo.txt

# La interfaz de nano:
#
# ┌─────────────────────────────────────────────────────────────┐
# │  GNU nano 7.2              /etc/hosts              Modified  │
# │                                                              │
# │  127.0.0.1   localhost                                       │
# │  127.0.1.1   mi-equipo                                       │
# │  ::1         localhost ip6-localhost ip6-loopback            │
# │  ^           ← El cursor está aquí                           │
# │                                                              │
# ├──────────────────────────────────────────────────────────────┤
# │  ^G Help    ^O Write Out  ^W Where Is  ^K Cut      ^T Execute│
# │  ^X Exit    ^R Read File  ^\ Replace   ^U Paste    ^J Justify│
# └──────────────────────────────────────────────────────────────┘
#
# ^ significa Ctrl. ^X = Ctrl+X
```

**Operaciones básicas:**

```
Guardar:        Ctrl+O  (Write Out) → pedirá nombre de archivo → Enter
Salir:          Ctrl+X  (si hay cambios sin guardar, pregunta)
Guardar y salir: Ctrl+O, Enter, Ctrl+X

Deshacer:       Alt+U   (o Ctrl+Z en versiones modernas)
Rehacer:        Alt+E
```

### Movimiento y selección

```
Movimiento con cursor:
Flechas         → Mover cursor
Ctrl+A          → Inicio de línea (igual que en Readline)
Ctrl+E          → Final de línea
Ctrl+←/→        → Palabra anterior/siguiente
Ctrl+↑/↓        → Párrafo anterior/siguiente
Ctrl+Home       → Inicio del archivo
Ctrl+End        → Final del archivo
Alt+G           → Ir a línea N (útil para errores de compilación)

Selección:
Alt+A           → Activar selección (ancla)
(Luego mover con flechas para seleccionar)
Shift+flechas   → Seleccionar arrastrando (versiones modernas)
```

### Cortar, copiar y pegar

```
Ctrl+K          → Cortar (cut) la línea completa actual
Alt+6           → Copiar la línea actual sin cortarla
Ctrl+U          → Pegar (uncut) en la posición del cursor

# Con selección activa (Alt+A primero):
Ctrl+K          → Cortar la selección
Alt+6           → Copiar la selección
Ctrl+U          → Pegar
```

**Tip:** Para cortar múltiples líneas consecutivas, pulsa `Ctrl+K` varias veces seguidas. Nano las acumula en el buffer. Luego `Ctrl+U` pega todas juntas.

### Buscar y reemplazar

```
Buscar:
Ctrl+W          → Abrir búsqueda (Where Is)
                   Escribe el término → Enter
                   Alt+W para buscar siguiente
                   Ctrl+W, Enter  → Buscar siguiente sin reabrir
                   Ctrl+C para cancelar

Opciones de búsqueda (dentro del prompt de búsqueda):
Alt+C           → Toggle case sensitive
Alt+R           → Toggle regex (¡soporta expresiones regulares!)
Alt+B           → Búsqueda hacia atrás

Reemplazar:
Ctrl+\          → Buscar y reemplazar
                   1. Introduce el término a buscar
                   2. Introduce el reemplazo
                   3. Y/N para cada ocurrencia, A para todas
```

### Configuración con `.nanorc`

El archivo `~/.nanorc` personaliza nano. Aquí un `.nanorc` útil y comentado:

```bash
# Crear/editar la configuración
nano ~/.nanorc
```

```
# ~/.nanorc — Configuración de nano

# === VISUAL ===
set linenumbers          # Mostrar números de línea
set numbercolor cyan     # Color de los números de línea
set titlecolor bold,white on blue  # Título de la barra
set statuscolor bold,white on green

# Resaltar la línea actual
set indicator            # Barra de posición lateral

# Mostrar espacio en blanco como caracteres visibles
# set whitespace "»·"   # Descomenta si quieres ver tabs y espacios

# Guardar automáticamente al salir (sin preguntar)
# set autoindent         # Mantener sangría de la línea anterior

# === COMPORTAMIENTO ===
set autoindent           # Sangría automática
set tabsize 4            # Tab = 4 espacios
set tabstospaces         # Convertir tabs a espacios al escribir
set nowrap               # No envolver líneas largas (scroll horizontal)
set mouse                # Soporte para ratón
set nohelp               # Ocultar las 2 líneas de ayuda (más espacio)
                         # Ctrl+G siempre abre la ayuda completa
set backup               # Crear copia .bak antes de guardar
set backupdir "~/.nano-backups"  # Directorio para backups

# === RESALTADO DE SINTAXIS ===
# Incluir todos los archivos de sintaxis de nano
include "/usr/share/nano/*.nanorc"
include "/usr/share/nano/extra/*.nanorc"
```

```bash
# Aplicar inmediatamente
source ~/.bashrc   # No necesario — nano lee .nanorc al abrir

# Ver qué archivos de sintaxis hay disponibles
ls /usr/share/nano/
# asm.nanorc  c.nanorc  css.nanorc  html.nanorc  javascript.nanorc
# json.nanorc  makefile.nanorc  python.nanorc  sh.nanorc  xml.nanorc ...
```

### nano con permisos de root (editar archivos del sistema)

```bash
# La forma más común (sin logearse como root)
sudo nano /etc/nginx/nginx.conf
sudo nano /etc/ssh/sshd_config
sudo nano /etc/fstab

# Abrir un archivo ya abierto como el usuario actual pero necesitas root
# (nano muestra "Permission denied" al guardar)
# Solución: volver a abrir con sudo
# O usar el truco de guardar con permisos elevados:
nano /etc/hosts
# Al intentar Ctrl+O → "Error writing /etc/hosts: Permission denied"
# Solución: abrir con sudo directamente desde el principio
```

### Atajos de nano: referencia rápida

| Acción | Atajo |
|---|---|
| Guardar | `Ctrl+O` |
| Salir | `Ctrl+X` |
| Deshacer | `Alt+U` |
| Rehacer | `Alt+E` |
| Buscar | `Ctrl+W` |
| Buscar y reemplazar | `Ctrl+\` |
| Cortar línea | `Ctrl+K` |
| Copiar línea | `Alt+6` |
| Pegar | `Ctrl+U` |
| Ir a línea N | `Alt+G` |
| Inicio/fin línea | `Ctrl+A` / `Ctrl+E` |
| Inicio/fin archivo | `Ctrl+Home` / `Ctrl+End` |
| Ayuda completa | `Ctrl+G` |

---

## 6.2 — vim: conceptos fundamentales

### Por qué vim es diferente a todos los demás editores

Casi todos los editores del mundo tienen **un solo modo**: inserción. Abres el archivo, el cursor parpadea, y todo lo que escribes se inserta en el documento. Para guardar usas `Ctrl+S`, para buscar `Ctrl+F`, etc.

`vim` tiene **edición modal**: en cada momento estás en uno de varios modos, y las mismas teclas hacen cosas distintas según el modo activo.

```
La metáfora de vim: el idioma de la edición

vim no es un editor con atajos de teclado.
vim es un LENGUAJE donde las teclas son verbos y sustantivos:

  d  w       →  "delete word"
  c  i  "    →  "change inside quotes"
  y  3  j    →  "yank (copy) 3 lines down"
  >  a  p    →  "indent around paragraph"

Una vez que interiorizes la gramática, la velocidad de edición
es cualitativamente diferente. No más "100 veces Ctrl+D".
```

### Los modos de vim

```
┌───────────────────────────────────────────────────────┐
│                    MODOS DE VIM                        │
│                                                        │
│  ┌─────────────┐    i, a, o, I, A, O, s, S, c...      │
│  │             │ ─────────────────────────────────→   │
│  │   NORMAL    │                          ┌─────────┐  │
│  │   (default) │ ←─────────────────────── │INSERCIÓN│  │
│  │             │           Esc            └─────────┘  │
│  └──────┬──────┘                                       │
│         │                                              │
│    v, V, Ctrl+V                                        │
│         ↓                                              │
│  ┌─────────────┐   Shift+: (desde Normal)              │
│  │   VISUAL    │   ┌──────────────┐                    │
│  │  (selección)│   │  EX / LÍNEA  │                    │
│  └─────────────┘   │ DE COMANDOS  │                    │
│         │          └──────────────┘                    │
│        Esc              Esc                            │
│         └──────→ NORMAL ←──────────────────────        │
└───────────────────────────────────────────────────────┘

NORMAL:  Navegar, operar sobre texto. ES EL MODO BASE.
INSERCIÓN: Escribir texto (como cualquier editor normal)
VISUAL:  Seleccionar texto visualmente
EX:     Comandos de archivo (:w, :q, :s/..., etc.)
```

**La regla de oro:** `Esc` siempre vuelve al modo Normal. Si no sabes dónde estás, pulsa `Esc` dos veces.

### Lo mínimo vital para no morir

Este es el conjunto mínimo que necesitas para sobrevivir en cualquier servidor:

```
ABRIR:
vim archivo.txt         Abrir o crear archivo
vim +42 archivo.txt     Abrir en la línea 42
vim +/patrón archivo    Abrir buscando "patrón"
vim archivo1 archivo2   Abrir múltiples archivos

SALIR (desde modo Normal — pulsa Esc primero):
:q          Salir (solo si no hay cambios)
:q!         Salir DESCARTANDO cambios (¡el escape de emergencia!)
:w          Guardar sin salir
:wq         Guardar y salir
:x          Igual que :wq pero solo escribe si hay cambios
ZZ          Atajo: guardar y salir (sin los dos puntos)
ZQ          Atajo: salir sin guardar

INSERTAR TEXTO (desde modo Normal):
i           Insertar ANTES del cursor
a           Insertar DESPUÉS del cursor (append)
I           Insertar al INICIO de la línea
A           Insertar al FINAL de la línea
o           Abrir nueva línea DEBAJO y entrar en inserción
O           Abrir nueva línea ARRIBA y entrar en inserción
```

:::tip
El error más común de los principiantes: intentar escribir en modo Normal. Vim no inserta el texto, ejecuta comandos. Si ves que el archivo se llena de letras raras (o ves `INSERT` en la barra inferior), ya sabes dónde estás.
:::

### `vimtutor`: el mejor punto de partida

```bash
# Abre el tutorial interactivo oficial de vim (30-45 minutos)
vimtutor

# En español (si está disponible)
LANG=es vimtutor
```

`vimtutor` es un archivo de texto que te enseña vim **dentro del propio vim**, de forma interactiva. Es la mejor forma de aprender los fundamentos con las manos.

---

## 6.3 — vim: movimientos y operadores

### La gramática de vim

Vim tiene una gramática interna que, una vez interiorizada, te permite realizar ediciones complejas con muy pocas teclas. La estructura es:

```
[CONTADOR] OPERADOR [CONTADOR] MOVIMIENTO_O_OBJETO_DE_TEXTO

Ejemplos:
  d  w       → delete word (borrar una palabra)
  d  2  w    → delete 2 words
  3  d  w    → delete word 3 times (equivalente)
  d  $       → delete to end of line
  d  G       → delete to end of file
  c  i  "    → change inside " (cambiar lo que hay entre comillas)
  y  a  p    → yank (copy) around paragraph
  >  3  j    → indent current + 3 lines below
```

### Movimientos fundamentales

<Tabs>
<TabItem value="basico" label="Movimiento básico">

```
Movimiento carácter a carácter (sin flechas):
h   ← Izquierda
j   ↓ Abajo
k   ↑ Arriba
l   → Derecha

¿Por qué hjkl y no las flechas?
Las flechas también funcionan, pero hjkl tienen dos ventajas:
1. Las manos no se mueven del home row del teclado
2. Se pueden preceder de contadores: 5j = bajar 5 líneas
```

</TabItem>
<TabItem value="palabras" label="Por palabras">

```
w   → Inicio de la siguiente palabra (Word)
b   ← Inicio de la palabra anterior (Back)
e   → Final de la palabra actual/siguiente (End)
ge  ← Final de la palabra anterior

W   → Igual pero cuenta como "palabra" cualquier cadena sin espacio
B   ← Igual hacia atrás
E   → Final de WORD

Diferencia w vs W:
  "archivo.txt" → w lo ve como 3 tokens: archivo  .  txt
  "archivo.txt" → W lo ve como 1 token:  archivo.txt
```

</TabItem>
<TabItem value="linea" label="En la línea">

```
0   → Inicio de línea (posición 0, incluso espacios)
^   → Primer carácter no-blanco de la línea
$   → Final de línea
g_  → Último carácter no-blanco de la línea

f{char}  → Saltar AL carácter {char} en la línea (Find)
F{char}  → Saltar AL carácter {char} hacia atrás
t{char}  → Saltar HASTA el carácter {char} (Till — un antes)
T{char}  → Igual hacia atrás
;        → Repetir el último f/F/t/T
,        → Repetir en sentido contrario

Ejemplo:
  fi   → salta a la próxima 'i' de la línea
  dt"  → borra hasta (sin incluir) la próxima "
  cf)  → cambia hasta (incluyendo) el próximo )
```

</TabItem>
<TabItem value="pantalla" label="Por el archivo">

```
gg   → Inicio del archivo (primera línea)
G    → Final del archivo (última línea)
:N   → Ir a la línea N (ej: :42 → línea 42)
NG   → Ir a la línea N (ej: 42G)

{    → Párrafo anterior (línea vacía separa párrafos)
}    → Párrafo siguiente

Ctrl+F → Página siguiente (Forward)
Ctrl+B → Página anterior (Backward)
Ctrl+D → Media página abajo (Down)
Ctrl+U → Media página arriba (Up)

H    → Primera línea visible de la pantalla (High)
M    → Línea del medio de la pantalla (Middle)
L    → Última línea visible de la pantalla (Low)

zz   → Centrar la línea actual en pantalla
zt   → Llevar la línea actual al Top de la pantalla
zb   → Llevar la línea actual al Bottom de la pantalla
```

</TabItem>
</Tabs>

### Operadores (verbos)

```
d   → delete (borrar, también copia al registro)
c   → change (borrar y entrar en modo inserción)
y   → yank (copiar al registro)
p   → put (pegar después del cursor)
P   → put antes del cursor
>   → indent (aumentar sangría)
<   → unindent (disminuir sangría)
=   → auto-indent (formatear sangría automáticamente)
gU  → convertir a MAYÚSCULAS
gu  → convertir a minúsculas
g~  → alternar mayúsculas/minúsculas
!   → filtrar por comando externo
```

### Objetos de texto (text objects)

Los objetos de texto son el superpoder de vim. Permiten operar sobre unidades semánticas: palabras, frases, bloques, entre comillas, entre paréntesis...

```
Sintaxis: OPERADOR + i/a + OBJETO
  i = "inner" (interior, sin incluir el delimitador)
  a = "around" (incluyendo el delimitador)

OBJETOS:
w   → word (palabra)
W   → WORD (palabra incluyendo puntuación)
s   → sentence (frase, hasta . ! ?)
p   → paragraph (párrafo, entre líneas vacías)
"   → entre comillas dobles
'   → entre comillas simples
`   → entre backticks
(   → entre paréntesis (también b)
)   → entre paréntesis (alias)
[   → entre corchetes
{   → entre llaves (también B)
<   → entre <angle brackets>
t   → entre tags HTML/XML (<tag>...</tag>)

EJEMPLOS PRÁCTICOS:
ciw  → Cambiar una palabra (cursor en cualquier parte de la palabra)
diw  → Borrar una palabra sin los espacios alrededor
daw  → Borrar una palabra incluyendo los espacios
ci"  → Cambiar el contenido entre comillas dobles
di(  → Borrar el contenido entre paréntesis
ya{  → Copiar el bloque entre llaves (incluyendo llaves)
=ip  → Auto-indentar el párrafo actual
>ap  → Incrementar sangría del párrafo completo
dit  → Borrar el contenido de un tag HTML
```

**Ejemplo real:** Tienes `nombre = "Juan García"` y quieres cambiar el nombre:
- Pones el cursor en cualquier lugar dentro de las comillas
- Escribes `ci"` (change inner quotes)
- Vim borra el contenido y entra en modo inserción entre las comillas
- Escribes el nuevo nombre

### Contadores

Cualquier movimiento u operador puede ser precedido por un número:

```
5j      → Bajar 5 líneas
3w      → Avanzar 3 palabras
d3w     → Borrar 3 palabras
10dd    → Borrar 10 líneas
yy      → Copiar la línea actual (alias de y_)
5yy     → Copiar 5 líneas
.       → Repetir la última operación (el comando más poderoso de vim)

Ejemplo del punto (.):
diw     → Borrar una palabra
.       → Borrar la siguiente palabra (repite diw)
...     → Tres veces más

cgn     → Cambiar la próxima coincidencia de búsqueda
.       → Cambiar la siguiente (automatiza búsqueda y reemplazo manual)
```

### Deshacer y rehacer

```
u           → Undo: deshacer el último cambio
Ctrl+R      → Redo: rehacer lo deshecho
U           → Deshacer todos los cambios en la línea actual
:earlier 5m → Estado del archivo hace 5 minutos (undofile requerido)
:later 1h   → Estado del archivo en 1 hora en el futuro
```

---

## 6.4 — vim: edición eficiente

### Buscar y reemplazar

```
BUSCAR:
/patrón         → Buscar hacia adelante
?patrón         → Buscar hacia atrás
n               → Siguiente coincidencia (en dirección actual)
N               → Coincidencia anterior (en dirección contraria)
*               → Buscar la palabra bajo el cursor (hacia adelante)
#               → Buscar la palabra bajo el cursor (hacia atrás)
g*              → Igual que * pero sin anclar en límite de palabra
gd              → Ir a la primera definición de la palabra bajo cursor

Opciones de búsqueda:
:set ignorecase  → Búsqueda sin distinción de mayúsculas
:set smartcase   → Case sensitive solo si el patrón tiene mayúsculas
:set hlsearch    → Resaltar todas las coincidencias
:set incsearch   → Búsqueda incremental (mientras escribes)
:nohlsearch      → Quitar el resaltado (atajo: :noh)
```

```
REEMPLAZAR (comando :s — substitute):
Sintaxis: :[rango]s/patrón/reemplazo/[flags]

:s/viejo/nuevo/       → Reemplazar primera ocurrencia en línea actual
:s/viejo/nuevo/g      → Reemplazar TODAS en línea actual (global)
:%s/viejo/nuevo/g     → Reemplazar en TODO el archivo
:%s/viejo/nuevo/gc    → Con confirmación para cada reemplazo
:5,10s/viejo/nuevo/g  → Solo en líneas 5 a 10
:'<,'>s/viejo/nuevo/g → En la selección visual (se rellena auto con v)

Flags:
g → global (todas en la línea, no solo la primera)
c → confirm (pedir confirmación en cada reemplazo)
i → ignore case (ignorar mayúsculas)
I → respetar mayúsculas aunque set ignorecase esté activo

Grupos de captura:
:%s/\(Juan\) \(García\)/\2, \1/g     → BRE: "García, Juan"
:%s/\v(Juan) (García)/\2, \1/g       → \v = very magic (más limpio)

Rangos especiales:
.       → Línea actual
$       → Última línea
%       → Todo el archivo (= 1,$)
1,5     → Líneas 1 a 5
'<,'>   → Selección visual actual
/pat/   → Líneas que coinciden con /pat/
```

### Registros: el portapapeles múltiple de vim

vim tiene **26 registros con nombre** (a-z) además de los registros especiales:

```
REGISTROS ESPECIALES:
"   → Sin nombre (default): donde van d, y, c
0   → Registro de yank: solo los yanks (no los deletes)
1-9 → Historial de deletes (1=más reciente)
+   → Portapapeles del sistema (X11/Wayland/clipboard)
*   → Selección del mouse (primary selection)
_   → Registro negro (/dev/null): descarta lo que recibe
:   → Último comando ex ejecutado
/   → Último patrón de búsqueda
%   → Nombre del archivo actual
.   → Último texto insertado

USAR REGISTROS:
"ayw    → Copiar palabra al registro 'a' (yank to register a)
"ap     → Pegar desde el registro 'a'
"Add    → Borrar línea y AÑADIR al registro 'a' (uppercase = append)
"+y     → Copiar al portapapeles del sistema
"+p     → Pegar desde el portapapeles del sistema

VER EL CONTENIDO DE TODOS LOS REGISTROS:
:registers  → Lista todos los registros y su contenido
:reg        → Abreviado

CASO DE USO REAL:
"ayw       → Copiar el nombre de una variable al registro 'a'
(moverse a otra parte del archivo)
"ap        → Pegar el nombre donde necesites
```

### Macros: automatizar ediciones repetitivas

Una macro graba una secuencia de acciones y la reproduce:

```
GRABAR UNA MACRO:
q{letra}    → Iniciar grabación en el registro {letra}
             (la barra inferior muestra "recording @a")
(hacer acciones)
q           → Detener grabación

REPRODUCIR:
@{letra}    → Ejecutar la macro del registro {letra}
@@          → Repetir la última macro ejecutada
10@a        → Ejecutar la macro 'a' 10 veces

VER EL CONTENIDO DE UNA MACRO:
:registers a  → Ver qué tiene el registro a (la macro)
```

**Ejemplo práctico:** Tienes 50 líneas con formato `nombre,edad,ciudad` y necesitas convertirlas a HTML `<li>nombre (ciudad)</li>` eliminando la edad:

```
# Línea original:
# Juan García,35,Madrid

# Pasos de la macro:
qa          → empezar grabación en 'a'
0           → ir al inicio de la línea
f,          → saltar a la primera coma
dt,         → borrar desde la coma hasta (sin incluir) la siguiente coma
             # resultado: Juan García,Madrid
f,          → saltar a la segunda coma
r)          → reemplazar la coma por )
I<li>       → insertar <li> al inicio de la línea
Esc         → volver a Normal
A</li>      → añadir </li> al final
Esc         → volver a Normal
0           → ir al inicio
f,          → saltar a la coma restante
r(          → reemplazar por (
              # resultado: <li>Juan García(Madrid)</li>
j           → bajar a la siguiente línea
q           → detener grabación

49@a        → ejecutar en las 49 líneas restantes
```

### Marcas: guardar posiciones en el archivo

```
m{letra}    → Marcar la posición actual con {letra}
'{letra}    → Saltar al inicio de la línea marcada
`{letra}    → Saltar a la posición exacta marcada
''          → Saltar a la posición anterior al último salto
`.          → Saltar al lugar del último cambio

Marcas globales (mayúsculas = entre archivos):
mA          → Marcar posición en el archivo A (global)
'A          → Saltar a esa marca desde cualquier archivo

:marks      → Ver todas las marcas
```

### Ventanas, tabs y buffers

```
CONCEPTOS:
buffer  → Archivo cargado en memoria (vim puede tener muchos)
window  → Área de la pantalla que muestra un buffer (split)
tab     → Conjunto de ventanas (tab page)

BUFFERS:
:e archivo  → Abrir archivo en nuevo buffer
:ls         → Listar buffers abiertos
:b N        → Ir al buffer número N
:b nombre   → Ir al buffer con ese nombre
:bn         → Siguiente buffer (buffer next)
:bp         → Buffer anterior (buffer previous)
:bd         → Cerrar buffer actual (buffer delete)
:bufdo cmd  → Ejecutar comando en todos los buffers

VENTANAS (splits):
:sp archivo     → Split horizontal (stacked)
:vsp archivo    → Split vertical (side by side)
Ctrl+W s        → Split horizontal del buffer actual
Ctrl+W v        → Split vertical del buffer actual
Ctrl+W h/j/k/l  → Moverse entre ventanas (hjkl direction)
Ctrl+W H/J/K/L  → Mover ventana (reposicionar)
Ctrl+W =        → Igualar tamaños de ventanas
Ctrl+W +/-      → Aumentar/reducir altura
Ctrl+W >/<      → Aumentar/reducir anchura
Ctrl+W q        → Cerrar ventana actual
:only           → Cerrar todas las ventanas menos la actual

TABS:
:tabnew         → Abrir nueva pestaña
:tabnew archivo → Abrir archivo en nueva pestaña
gt              → Siguiente pestaña
gT              → Pestaña anterior
Ngt             → Ir a la pestaña N
:tabclose       → Cerrar pestaña actual
:tabonly        → Cerrar todas las tabs menos la actual
```

```
Visualización típica con splits:

┌──────────────────┬──────────────────┐
│ views.py    1/3  │ models.py   45/120│
│                  │                  │
│ def index(req):  │ class User(Model)│
│     users = User │     name = Char..│
│     return rende │     email = Char.│
│                  │                  │
│~                 │~                 │
└──────────────────┴──────────────────┘
Tab: [views.py] models.py  urls.py
```

### Modo visual: seleccionar y operar

```
MODOS VISUALES:
v       → Visual carácter a carácter
V       → Visual línea completa
Ctrl+V  → Visual en bloque (columnas) ← muy potente

OPERACIONES SOBRE SELECCIÓN:
d       → Borrar la selección
y       → Copiar la selección
c       → Cambiar (borrar + inserción)
>       → Aumentar sangría
<       → Disminuir sangría
~       → Alternar mayúsculas/minúsculas
u       → Convertir a minúsculas
U       → Convertir a MAYÚSCULAS
!cmd    → Filtrar selección por comando externo
:s/a/b  → Reemplazar en la selección (auto: '<,'>s)
```

**Visual block — el más potente:**

```bash
# Caso de uso: comentar varias líneas al mismo tiempo

# Antes:
def funcion_a():
    pass

def funcion_b():
    pass

# Pasos:
Ctrl+V          → Activar visual block
jj              → Seleccionar 2 líneas más
I               → Insertar al inicio del bloque
# (con espacio)→ Escribir "# "
Esc             → Aplicar a todas las líneas seleccionadas

# Después:
# def funcion_a():
#     pass
# 
# def funcion_b():
#     pass

# Descomentar: Ctrl+V, seleccionar las #, d
```

---

## 6.5 — vim: configuración y plugins

### El archivo `.vimrc`

El archivo `~/.vimrc` (o `~/.vim/vimrc`) es el corazón de la configuración de vim. Aquí un `.vimrc` completo, funcional y comentado línea a línea:

```bash
nano ~/.vimrc    # O: vim ~/.vimrc (una vez que te sientas cómodo)
```

```vim
" ~/.vimrc — Configuración de Vim
" Las líneas que empiezan con " son comentarios

" ============================================================
" CONFIGURACIÓN BASE (obligatoria en vimrc moderno)
" ============================================================

" Desactivar compatibilidad con vi antiguo (SIEMPRE la primera línea)
set nocompatible

" Detectar tipo de archivo para plugins e indentación
filetype plugin indent on

" Activar resaltado de sintaxis
syntax enable

" ============================================================
" VISUAL
" ============================================================

" Mostrar números de línea
set number

" Mostrar números de línea relativos (muy útil para saltos: 5j, 3k)
set relativenumber

" Resaltar la línea donde está el cursor
set cursorline

" Mostrar la posición del cursor (línea, columna)
set ruler

" Mostrar el comando que estás tecleando en la barra inferior
set showcmd

" Mostrar el modo actual (-- INSERT --, etc.)
set showmode

" Altura del área de comandos
set cmdheight=2

" Siempre mostrar la barra de estado
set laststatus=2

" Mostrar columna de signos (para plugins de errores/git)
set signcolumn=yes

" Color scheme
colorscheme desert        " Viene incluido en vim
" colorscheme onedark     " Con plugin

" Fondo oscuro (importante para que los colores sean correctos)
set background=dark

" ============================================================
" INDENTACIÓN
" ============================================================

" Usar espacios en lugar de tabs
set expandtab

" Tamaño del tab visual
set tabstop=4

" Espacios al indentar con >> y <<
set shiftwidth=4

" Borrar hasta el nivel de indentación con Backspace
set softtabstop=4

" Copiar la indentación de la línea anterior
set autoindent

" Indentación inteligente para lenguajes como C
set smartindent

" ============================================================
" BÚSQUEDA
" ============================================================

" Buscar mientras escribes
set incsearch

" Resaltar todas las coincidencias
set hlsearch

" Búsqueda case-insensitive...
set ignorecase

" ...a menos que el patrón tenga mayúsculas
set smartcase

" Limpiar el resaltado con Esc en modo Normal
nnoremap <Esc> :nohlsearch<CR>

" ============================================================
" COMPORTAMIENTO
" ============================================================

" No crear archivos de swap en el directorio del archivo
set noswapfile

" Crear backup en un directorio centralizado
set backup
set backupdir=~/.vim/backup//

" Guardar historial de cambios (persistente entre sesiones)
set undofile
set undodir=~/.vim/undo//

" Número de cambios recordados
set undolevels=1000

" Tiempo de inactividad para guardar swap y activar plugins
set updatetime=300

" No pasar de una línea a la siguiente con h/l
set nostartofline

" Permitir que el cursor vaya un carácter más allá del final
" set virtualedit=onemore

" Mantener N líneas visibles al hacer scroll
set scrolloff=8
set sidescrolloff=8

" Abrir splits a la derecha y abajo (más natural)
set splitright
set splitbelow

" ============================================================
" ARCHIVOS Y ENCODING
" ============================================================

" UTF-8 siempre
set encoding=utf-8
set fileencoding=utf-8

" Detectar saltos de línea automáticamente
set fileformats=unix,dos,mac

" No beep
set noerrorbells
set novisualbell

" Recargar archivos modificados externamente
set autoread

" Confirmar antes de salir con cambios sin guardar
set confirm

" ============================================================
" AUTOCOMPLETADO
" ============================================================

" Autocompletado de comandos con Tab
set wildmenu
set wildmode=longest:full,full

" Ignorar estos archivos en autocompletado
set wildignore+=*.pyc,*.o,*.obj,*~,*.swp
set wildignore+=node_modules/**,.git/**,__pycache__/**

" ============================================================
" ATAJOS PERSONALIZADOS (keymaps)
" ============================================================

" Tecla Leader: la base de los atajos personalizados
let mapleader = " "          " Espacio como leader (muy común)

" Guardar con Leader + w
nnoremap <leader>w :w<CR>

" Salir con Leader + q
nnoremap <leader>q :q<CR>

" Navegar entre splits con Ctrl + hjkl
nnoremap <C-h> <C-w>h
nnoremap <C-j> <C-w>j
nnoremap <C-k> <C-w>k
nnoremap <C-l> <C-w>l

" Moverse entre buffers con Tab y Shift+Tab
nnoremap <Tab> :bn<CR>
nnoremap <S-Tab> :bp<CR>

" Mover líneas arriba/abajo con Alt+j/k (como en VS Code)
nnoremap <A-j> :m .+1<CR>==
nnoremap <A-k> :m .-2<CR>==
inoremap <A-j> <Esc>:m .+1<CR>==gi
inoremap <A-k> <Esc>:m .-2<CR>==gi
vnoremap <A-j> :m '>+1<CR>gv=gv
vnoremap <A-k> :m '<-2<CR>gv=gv

" Indentación en modo visual que mantiene la selección
vnoremap < <gv
vnoremap > >gv

" Buscar y reemplazar la palabra bajo el cursor
nnoremap <leader>r :%s/\<<C-r><C-w>\>//g<Left><Left>

" ============================================================
" CREACIÓN DE DIRECTORIOS PARA BACKUP/UNDO
" ============================================================

if !isdirectory($HOME.'/.vim/backup')
    call mkdir($HOME.'/.vim/backup', 'p')
endif
if !isdirectory($HOME.'/.vim/undo')
    call mkdir($HOME.'/.vim/undo', 'p')
endif
```

### Gestores de plugins

```bash
# vim-plug: el gestor de plugins más popular
curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
    https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim

# Añadir al .vimrc:
call plug#begin('~/.vim/plugged')
  " Aquí van los plugins
call plug#end()

# Después:
# :PlugInstall   → Instalar plugins declarados
# :PlugUpdate    → Actualizar plugins
# :PlugClean     → Eliminar plugins no declarados
# :PlugStatus    → Estado de los plugins
```

### Plugins esenciales

```vim
" ~/.vimrc — Sección de plugins con vim-plug

call plug#begin('~/.vim/plugged')

" === NAVEGACIÓN Y ARCHIVOS ===

" Árbol de archivos lateral
Plug 'preservim/nerdtree'
" Uso: :NERDTree  o  <leader>n (si lo configuras)

" Búsqueda difusa de archivos (como Ctrl+P en VSCode)
Plug 'ctrlpvim/ctrlp.vim'
" Uso: Ctrl+P → escribir nombre → Enter

" === APARIENCIA ===

" Barra de estado rica en información
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'

" Color scheme popular
Plug 'joshdick/onedark.vim'

" Resaltado para muchos lenguajes
Plug 'sheerun/vim-polyglot'

" === EDICIÓN ===

" Completar pares de símbolos automáticamente (", (, [, etc.)
Plug 'jiangmiao/auto-pairs'

" Comentar/descomentar con gc
Plug 'tpope/vim-commentary'
" Uso: gcc → comentar línea, gc3j → comentar 3 líneas abajo, gcap → comentar párrafo

" Rodear texto con delimitadores (cs"' cambia " por ', ds" elimina ")
Plug 'tpope/vim-surround'
" Uso: cs"'  → cambia "texto" a 'texto'
"      ds"   → borra las comillas de "texto"
"      ysiw) → rodea la palabra con ()

" === GIT ===

" Indicadores de cambios git en el margen
Plug 'airblade/vim-gitgutter'

" Integración git completa
Plug 'tpope/vim-fugitive'
" Uso: :Git status  :Git commit  :Git diff  :Gblame

" === LENGUAJES ===

" LSP nativo de vim (autocompletado, errores)
Plug 'prabirshrestha/vim-lsp'
Plug 'prabirshrestha/asyncomplete.vim'

call plug#end()

" Activar NERDTree con Leader+n
nnoremap <leader>n :NERDTreeToggle<CR>

" Color scheme (después de plug#end)
colorscheme onedark
```

### Neovim: la evolución moderna de vim

[Neovim](https://neovim.io) es un fork de vim iniciado en 2014 con objetivos de modernización: arquitectura limpia, soporte de plugins asíncrono, API externa, LSP nativo y configuración en Lua.

```
┌─────────────────────────────────────────────────────────┐
│              vim vs. Neovim (2024)                      │
├─────────────────────────────────────────────────────────┤
│ Aspecto          │ vim             │ Neovim             │
├─────────────────────────────────────────────────────────┤
│ Configuración    │ Vimscript       │ Lua (+ Vimscript)  │
│ LSP              │ Plugin externo  │ Nativo (built-in)  │
│ Tree-sitter      │ No              │ Nativo (AST)       │
│ Async plugins    │ Limitado        │ Completo (jobs)    │
│ Interfaces ext.  │ No              │ Sí (UI remotas)    │
│ Compatibilidad   │ Universal       │ Casi total con vim │
│ Popularidad 2024 │ Muy alta        │ Creciendo rápido   │
│ Distros          │ N/A             │ LazyVim, AstroNvim │
└─────────────────────────────────────────────────────────┘
```

```bash
# Instalar Neovim
sudo apt install neovim        # Ubuntu (puede ser versión antigua)
sudo snap install nvim --classic  # Versión más reciente en Ubuntu

# Fedora
sudo dnf install neovim

# Arch
sudo pacman -S neovim

# O desde releases de GitHub (última versión):
curl -LO https://github.com/neovim/neovim/releases/latest/download/nvim-linux64.tar.gz
tar xzf nvim-linux64.tar.gz
sudo install nvim-linux64/bin/nvim /usr/local/bin/nvim

# Configuración de Neovim (en Lua)
mkdir -p ~/.config/nvim
nvim ~/.config/nvim/init.lua

# Usar vimrc de vim como base (compatibilidad)
echo 'vim.cmd("source ~/.vimrc")' >> ~/.config/nvim/init.lua
```

**Distribuciones de Neovim listas para usar:**

```bash
# LazyVim: la distribución más popular y mantenida
git clone https://github.com/LazyVim/starter ~/.config/nvim
nvim    # Primera apertura descarga e instala todo

# AstroNvim: muy completa, orientada a IDE
git clone --depth 1 https://github.com/AstroNvim/template ~/.config/nvim

# NvChad: rápida y moderna, basada en Lua
git clone https://github.com/NvChad/NvChad ~/.config/nvim --depth 1
```

---

## 6.6 — Otros editores

### `micro` — El editor moderno para terminales

[micro](https://micro-editor.github.io) es un editor terminal moderno que usa **atajos estándar** (`Ctrl+S`, `Ctrl+C`, `Ctrl+Z`). Sin curva de aprendizaje.

```bash
# Instalar
curl https://getmic.ro | bash
sudo install micro /usr/local/bin/

# O con el gestor de paquetes
sudo apt install micro
sudo snap install micro --classic

# Usar
micro archivo.txt
micro /etc/nginx/nginx.conf

# Atajos de micro (idénticos a editores gráficos)
Ctrl+S      → Guardar
Ctrl+Q      → Salir
Ctrl+Z      → Deshacer
Ctrl+Y      → Rehacer
Ctrl+C      → Copiar
Ctrl+X      → Cortar
Ctrl+V      → Pegar
Ctrl+F      → Buscar
Ctrl+H      → Buscar y reemplazar
Ctrl+G      → Ir a línea
Ctrl+A      → Seleccionar todo
Ctrl+E      → Abrir línea de comandos de micro

# Características de micro
# - Resaltado de sintaxis para 150+ lenguajes
# - Sistema de plugins en Lua
# - Soporte para ratón completo
# - Múltiples cursores (Alt+click)
# - Split vertical/horizontal
```

```bash
# Configuración en ~/.config/micro/settings.json
cat > ~/.config/micro/settings.json << 'EOF'
{
    "tabsize": 4,
    "tabstospaces": true,
    "autoindent": true,
    "ruler": true,
    "syntax": true,
    "mouse": true,
    "hlsearch": true,
    "savecursor": true,
    "backup": true
}
EOF
```

### `helix` — El editor modal moderno

[Helix](https://helix-editor.com) es un editor modal (como vim) pero con una filosofía diferente: **selección primero, operación después** (en vez de operación + movimiento de vim). Tiene LSP y tree-sitter incorporados sin plugins.

```bash
# Instalar
sudo apt install helix    # Ubuntu (si está disponible)
# O descargar del repositorio:
# https://github.com/helix-editor/helix/releases

# Usar
hx archivo.txt

# Diferencia de filosofía:
# vim:   dw  → (operador) delete + (movimiento) word
# helix: wvd → (movimiento) word → (visual/selección) → (operador) delete
#        o más simplemente: wd  (en helix select primero con movimiento)

# Comprobar qué tienes configurado:
hx --health          # Estado de LSP, Tree-sitter, etc.
hx --health python   # Estado específico para Python
```

### GNU Emacs — El otro gran editor

Emacs es el rival histórico de vim. Donde vim es modal y minimalista, Emacs es **un entorno completo** que incluye editor, gestor de archivos, cliente de email, lector de RSS, terminal, y mucho más. Su extensibilidad en Emacs Lisp no tiene rival.

```bash
# Instalar
sudo apt install emacs

# La interfaz de Emacs usa Ctrl+Meta (Alt) como base:
# C = Ctrl, M = Meta/Alt

SUPERVIVENCIA EN EMACS:
C-x C-f    → Abrir archivo (find file)
C-x C-s    → Guardar (save buffer)
C-x C-c    → Salir de Emacs
C-g        → Cancelar comando actual (equivalente de Esc en vim)
C-x u      → Deshacer
M-x        → Ejecutar comando por nombre (el supercomando)

MOVIMIENTO:
C-f        → Forward char
C-b        → Backward char
M-f        → Forward word
M-b        → Backward word
C-n        → Next line
C-p        → Previous line
C-a        → Inicio de línea
C-e        → Final de línea
M-<        → Inicio del buffer
M->        → Final del buffer

EDICIÓN:
C-k        → Kill (cortar) hasta fin de línea
C-y        → Yank (pegar)
M-w        → Copiar región seleccionada
C-space    → Marcar inicio de selección
C-s        → Buscar (isearch)
M-%        → Query replace (buscar y reemplazar con confirmación)

VENTANAS:
C-x 2      → Split horizontal
C-x 3      → Split vertical
C-x o      → Cambiar de ventana
C-x 1      → Cerrar todas menos la actual
C-x 0      → Cerrar ventana actual

# Emacs moderno: Doom Emacs y Spacemacs
# Son distribuciones de Emacs con modal editing estilo vim

# Doom Emacs (la más popular y rápida)
git clone --depth 1 https://github.com/doomemacs/doomemacs ~/.config/emacs
~/.config/emacs/bin/doom install

# Spacemacs
git clone https://github.com/syl20bnr/spacemacs ~/.emacs.d
```

### VS Code con Remote SSH — El puente entre mundos

Para desarrollo en servidores remotos sin renunciar a la comodidad de VS Code:

```bash
# En el servidor remoto, instalar el servidor de VS Code (automático)
# VS Code instala automáticamente el servidor en el primer acceso

# En VS Code local:
# 1. Instalar extensión "Remote - SSH" (ms-vscode-remote.remote-ssh)
# 2. Ctrl+Shift+P → "Remote-SSH: Connect to Host"
# 3. Introducir: usuario@servidor.com

# O configurar hosts en ~/.ssh/config para acceso rápido:
nano ~/.ssh/config
```

```
# ~/.ssh/config
Host mi-servidor
    HostName 192.168.1.100
    User juan
    IdentityFile ~/.ssh/id_rsa
    ServerAliveInterval 60

Host produccion
    HostName produccion.empresa.com
    User deploy
    IdentityFile ~/.ssh/deploy_key
    Port 2222
```

```bash
# Ahora en VS Code: Ctrl+Shift+P → Remote-SSH: Connect to Host → "mi-servidor"
# VS Code instala su servidor en el remoto (~/.vscode-server/)
# Puedes abrir carpetas, ejecutar el terminal integrado, usar extensiones

# Extensiones útiles para desarrollo remoto:
# - Remote - SSH: conectar por SSH
# - Remote - WSL: editar en WSL desde Windows
# - Remote - Containers: editar dentro de Docker
# - Remote Explorer: gestionar conexiones remotas
```

### Tabla comparativa de editores

| Editor | Curva de aprendizaje | Velocidad | Configurabilidad | Ideal para |
|---|---|---|---|---|
| **nano** | Mínima (minutos) | Suficiente | Baja | Ediciones rápidas, principiantes |
| **micro** | Muy baja (horas) | Buena | Media | Quienes vienen de editores gráficos |
| **vim** | Alta (semanas) | Excelente | Muy alta | Admins, devs en terminal |
| **Neovim** | Alta (semanas) | Excelente | Máxima (Lua) | Desarrollo moderno en terminal |
| **helix** | Media (días) | Excelente | Media | Alternativa modal moderna |
| **Emacs** | Muy alta (meses) | Buena | Ilimitada (Lisp) | Power users, ecosistema completo |
| **VS Code** | Baja (días) | Buena | Alta | Desarrollo con GUI |

---

## 6.7 — Problemas reales y sus soluciones

### Problema 1: Estoy atrapado en vim/vi en producción

```
SITUACIÓN: Abriste un archivo con vim (o vi) y no sabes salir.

SOLUCIÓN DE EMERGENCIA (en este orden):
1. Pulsa Esc varias veces   → Vuelves a modo Normal
2. Escribe :q!              → Salir SIN guardar
   (si da error, pulsa Esc de nuevo y repite)
3. Si :q! no funciona:      ZQ (Shift+Z, Shift+Q)

Si quieres GUARDAR los cambios:
1. Esc
2. :wq  o  ZZ

Si el archivo es de solo lectura (al editar con sudo):
1. Esc
2. :w !sudo tee %    → Guarda con sudo sin reabrir
3. :q                → Sale
```

### Problema 2: Editar un archivo protegido sin reabrir con sudo

```bash
# Situación: abriste un archivo de sistema sin sudo y ya lo editaste
vim /etc/nginx/nginx.conf   # Sin sudo → al guardar: "Permission denied"

# Solución desde dentro de vim:
:w !sudo tee %
# :w          → "escribe" el contenido
# !sudo tee % → a través del comando "sudo tee" con nombre del archivo (%)
# Pedirá contraseña, y guardará el archivo

# O si usas Neovim/vim con suda.vim plugin:
:SudaWrite
```

### Problema 3: Archivos con finales de línea Windows en vim

```bash
# Síntoma: ves ^M al final de cada línea
# O vim muestra el archivo con líneas extra raras

# Detectar:
:set list           → Muestra ^M al final si hay \r

# Convertir dentro de vim:
:set ff=unix        → Cambiar formato de archivo a Unix
:w                  → Guardar

# O con sed (fuera de vim, visto en Módulo 05):
sed -i 's/\r//' archivo.sh
```

### Problema 4: El archivo fue editado por otro proceso mientras lo tenías abierto

```bash
# vim avisa con:
# WARNING: The file has been changed since reading it!

# Opciones:
# [O]k      → Recargar la versión del disco (descartas tus cambios)
# [L]oad    → Igual que Ok
# [A]bort   → Quedarte con tu versión en el buffer (riesgo de sobrescribir)

# Recargar manualmente si no aparece el aviso:
:e!         → Reload desde disco (descarta cambios del buffer)
:e          → Reload solo si el archivo no cambió
```

### Problema 5: vim se comporta raro (terminal dañado)

```bash
# Síntoma: vim muestra basura, colores rotos, o caracteres extraños
# Causa: el $TERM no está bien configurado, o la conexión SSH tiene problemas

# Desde fuera de vim:
reset           → Resetear el terminal completamente

# Desde dentro de vim:
Ctrl+L          → Redibujar la pantalla
:redraw!        → Forzar redibujado completo

# Configurar TERM correctamente en ~/.bashrc:
export TERM=xterm-256color
```

---

## Anexos

### A. Mapa mental de modos vim

```
         ┌──────────────────────────────────────┐
         │           MODO NORMAL                 │
         │         (teclas = comandos)            │
         │                                       │
         │  hjkl → mover       d → delete        │
         │  w/b  → palabra     y → yank           │
         │  0/$  → línea       c → change         │
         │  gg/G → archivo     p → put            │
         │  /    → buscar      u → undo           │
         │  :    → ex mode     . → repetir        │
         └─────┬──────────────────────────────────┘
               │                    ↑ Esc (siempre)
         ──────┼──────────────────────────────────
         │     │ i/a/o/I/A/O/s/c...              │
         ▼     │                     v/V/Ctrl+V   │
    ┌─────────────┐              ┌───────────────┐│
    │  MODO       │     Esc      │  MODO VISUAL  ││
    │ INSERCIÓN   │──────────────│  (selección)  ││
    │ (escribe    │              │               ││
    │  texto      │              │  d,y,c,>,<    ││
    │  normal)    │              │  =,~,!cmd     ││
    └─────────────┘              └───────────────┘│
               │ : (desde Normal)                  │
               ▼                                   │
         ┌──────────────────────────────────────┐  │
         │           MODO EX (línea de cmd)      │  │
         │                                       │  │
         │  :w  :q  :wq  :q!                    │  │
         │  :s/buscar/reemplazar/g               │  │
         │  :e archivo   :sp   :vsp             │  │
         │  :set ...    :map ...                 │  │
         └──────────────────────────────────────┘  │
                                                    │
         ─────────────────────────────────────────────
```

### B. Comandos vim de producción más usados

```vim
" === LOS 20 COMANDOS QUE USARÁS CADA DÍA ===

" Abrir y salir
:e archivo          " Abrir archivo
:w                  " Guardar
:wq o ZZ            " Guardar y salir
:q!  o ZQ           " Salir sin guardar

" Buscar
/patrón             " Buscar adelante
*                   " Buscar la palabra bajo el cursor
n / N               " Siguiente / anterior
:noh                " Quitar resaltado

" Reemplazar
:%s/viejo/nuevo/g   " Reemplazar en todo el archivo
:%s/viejo/nuevo/gc  " Con confirmación

" Edición
dd                  " Borrar línea
yy + p              " Copiar línea y pegar
u / Ctrl+R          " Deshacer / Rehacer
.                   " Repetir última operación
ciw                 " Cambiar palabra
ci"                 " Cambiar contenido entre comillas

" Movimiento
gg / G              " Inicio / fin del archivo
:N (ej :42)         " Ir a línea N
Ctrl+F / Ctrl+B     " Página adelante / atrás
%                   " Saltar al paréntesis/llave correspondiente

" Sangría
>>  /  <<           " Indentar / desndentar línea
=G                  " Auto-indentar hasta el final del archivo
ggVG=               " Auto-indentar TODO el archivo

" Visual block
Ctrl+V, selección, I, texto, Esc   " Insertar en múltiples líneas
Ctrl+V, selección, d               " Borrar columna
```

### C. Referencias cruzadas entre módulos

```
◀ Módulo 01 — Introducción al mundo Linux
│  Sección 1.3: "El editor vi como parte del estándar POSIX"
│  → vim es la implementación moderna del vi histórico de UNIX
│  Sección 1.3: Filosofía "texto plano como interfaz"
│  → Los editores de este módulo son las herramientas para
│    crear y mantener esa filosofía (dotfiles, configuraciones)

◀ Módulo 03 — La terminal y la shell
│  Sección 3.5: Readline usa atajos de Emacs por defecto
│  → Ctrl+A, Ctrl+E, Ctrl+K, Ctrl+Y vienen de Emacs
│  Sección 3.6: Variables $EDITOR y $VISUAL
│  → Definen qué editor usa el sistema (git commit, cron, etc.)
│  → Deberías añadir: export EDITOR=vim (o nano, micro)

◀ Módulo 05 — Procesamiento de texto
│  sed y awk: transformaciones no interactivas
│  → vim es el complemento interactivo: cuando necesitas
│    VER el archivo mientras lo transformas
│  La integración :%!comando filtra el buffer por
│    comandos externos (awk, sort, etc.) desde vim

▶ Módulo 07 — Usuarios, grupos y permisos
│  → Editar /etc/sudoers con visudo (usa vi/vim)
│  → Editar archivos de configuración del sistema requiere
│    el flujo :w !sudo tee % de este módulo

▶ Módulo 10 — Shell Scripting Bash
│  → Todos los scripts se escriben con los editores de este módulo
│  → vim tiene resaltado y validación de bash scripts
│  → :!bash % ejecuta el script actual desde vim
```

### D. Configura tu `$EDITOR`

```bash
# Añadir a ~/.bashrc:
export EDITOR="vim"         # Editor para git commit, crontab -e, etc.
export VISUAL="vim"         # Editor para operaciones "visuales"

# Alternativas:
export EDITOR="nano"        # Si prefieres nano
export EDITOR="micro"       # Si prefieres micro
export EDITOR="nvim"        # Si usas Neovim

# Verificar que funciona:
git commit    # Debe abrir tu editor preferido
crontab -e    # Igual

# En distribuciones con update-alternatives:
sudo update-alternatives --config editor
# Muestra un menú para elegir el editor del sistema
```

---

## Referencias y Bibliografía

### Documentación oficial

1. **Vim documentation (`:help`)**  
   https://vimhelp.org  
   La documentación completa de vim, accesible también desde dentro del editor con `:help`.

2. **Neovim Documentation**  
   https://neovim.io/doc/user/  
   Manual completo de Neovim, incluyendo la API Lua.

3. **GNU nano documentation**  
   https://www.nano-editor.org/docs.php  
   Manual oficial de nano con todas las opciones.

4. **Micro editor documentation**  
   https://github.com/zyedidia/micro/tree/master/runtime/help  
   Ayuda integrada de micro (también accesible con `Ctrl+G` dentro del editor).

5. **Helix editor documentation**  
   https://docs.helix-editor.com  
   Documentación completa de helix incluyendo la guía de modos.

6. **GNU Emacs manual**  
   https://www.gnu.org/software/emacs/manual/html_node/emacs/index.html  
   Manual completo de Emacs.

### Tutoriales interactivos

7. **Vim Adventures** — Aprende vim jugando  
   https://vim-adventures.com  
   Juego de aventuras donde navegas con hjkl y aprendes vim.

8. **OpenVim** — Tutorial interactivo de vim en el navegador  
   https://www.openvim.com

9. **Practical Vim** exercises — vimgolf.com  
   https://www.vimgolf.com  
   Retos de editar archivos con el menor número de teclas posible.

### Libros de referencia

10. **Practical Vim** — Drew Neil  
    Pragmatic Bookshelf, 2ª edición (2015).  
    El mejor libro sobre vim práctico. "Edit Text at the Speed of Thought".

11. **Modern Vim** — Drew Neil  
    Pragmatic Bookshelf (2018).  
    Plugins modernos, Neovim y terminal integrado.

12. **Learning the vi and Vim Editors** — Arnold Robbins et al.  
    O'Reilly, 8ª edición (2022).  
    La referencia más completa y actualizada.

13. **The Emacs Manual** — Richard Stallman  
    Free Software Foundation. Disponible online en https://www.gnu.org/software/emacs/manual/

### Recursos para Neovim

14. **Neovim Lua Guide**  
    https://neovim.io/doc/user/lua-guide.html  
    La guía oficial para configurar Neovim con Lua.

15. **LazyVim documentation**  
    https://www.lazyvim.org  
    Distribución de Neovim basada en lazy.nvim.

16. **TJ DeVries (canal YouTube)** — Core maintainer de Neovim  
    Tutoriales avanzados de configuración de Neovim con Lua.

### Artículos de referencia

17. **"Why, oh WHY, do those #?@! nutheads use vi?"** — Jon Beltran de Heredia  
    http://www.viemu.com/a-why-vi-vim.html  
    Explicación de la filosofía modal y por qué tiene sentido.

18. **"Vim Text Objects: The Definitive Guide"** — Jared Carroll  
    https://blog.carbonfive.com/vim-text-objects-the-definitive-guide/

19. **"Your problem with Vim is that you don't grok vi"** — Jim Dennis  
    Stack Overflow answer (la respuesta más votada de la historia sobre vim).  
    https://stackoverflow.com/a/1220118

---

## Preguntas de autoevaluación

1. ¿Cómo sales de vim sin guardar los cambios? ¿Y guardando?
2. ¿Qué diferencia hay entre el modo Normal, Inserción y Visual de vim?
3. Explica la gramática de vim con un ejemplo concreto de operador + movimiento.
4. ¿Qué hace `ciw`? ¿Y `da"`? ¿Y `yap`?
5. ¿Para qué sirve el registro `0` en vim y en qué se diferencia del registro sin nombre?
6. ¿Cómo puedes guardar un archivo en vim al que no tienes permisos de escritura directa?
7. ¿Qué diferencia hay entre `vim` y `Neovim`? ¿Cuándo elegirías uno sobre el otro?
8. ¿Qué hace `:%s/foo/bar/gc`? Explica cada parte.
9. ¿Para qué sirven las macros en vim? Describe el flujo de grabación y reproducción.
10. ¿Qué es el modo Visual Block (`Ctrl+V`) y en qué caso lo usarías?
11. ¿Cuál es la ventaja de `micro` respecto a `nano`? ¿Y su desventaja respecto a vim?
12. ¿Qué es `$EDITOR` y por qué es importante configurarlo correctamente?

---

## Laboratorios prácticos

### Lab 6.1 — Supervivencia en vim

```bash
# Objetivo: entrar, editar y salir de vim con confianza

# 1. Abrir vimtutor (dedicar 30-45 minutos)
vimtutor

# 2. Crear y editar un archivo
vim /tmp/practica_vim.txt

# Dentro de vim:
# - Entrar en modo inserción con 'i'
# - Escribir: "Primera línea de prueba"
# - Pulsar Esc
# - Escribir 'o' (nueva línea debajo)
# - Escribir: "Segunda línea de prueba"
# - Pulsar Esc
# - Guardar con :w
# - Salir con :q
```

### Lab 6.2 — Movimientos y objetos de texto

```bash
vim /etc/passwd    # (solo lectura, no puedes guardar — está bien)

# Ejercicios:
# 1. Ir a la última línea: G
# 2. Ir a la primera línea: gg
# 3. Buscar "root": /root → n para siguiente
# 4. Posicionar el cursor en una palabra y probar:
#    - diw (borrar palabra — no se guardará)
#    - u (deshacer)
#    - yiw (copiar palabra)
#    - p (pegar)
# 5. Salir sin guardar: :q!
```

### Lab 6.3 — Buscar y reemplazar

```bash
# Crear archivo de práctica
cat > /tmp/lab_sed_vim.txt << 'EOF'
usuario: juan
email: juan@example.com
ciudad: madrid
usuario: maria
email: maria@test.com
ciudad: barcelona
usuario: carlos
email: carlos@demo.net
ciudad: madrid
EOF

vim /tmp/lab_sed_vim.txt

# Ejercicios dentro de vim:
# 1. Buscar "madrid": /madrid (n para siguiente)
# 2. Reemplazar "juan" por "JUAN": :%s/juan/JUAN/g
# 3. Reemplazar con confirmación "email" → "correo": :%s/email/correo/gc
# 4. Ver el resultado y guardar: :w
```

### Lab 6.4 — Macros

```bash
# Crear archivo con datos repetitivos
cat > /tmp/lab_macros.txt << 'EOF'
juan,garcia,35
maria,lopez,28
carlos,fernandez,42
ana,martinez,31
pedro,sanchez,25
EOF

vim /tmp/lab_macros.txt

# Objetivo: convertir "nombre,apellido,edad" → "<li>nombre apellido</li>"

# Pasos:
# 1. Ir a la primera línea: gg
# 2. Empezar macro: qa
# 3. 0 → inicio de línea
# 4. f, → saltar a la primera coma
# 5. r   → reemplazar la coma por espacio
# 6. f, → saltar a la segunda coma
# 7. D  → borrar desde aquí hasta el final
# 8. I<li> → insertar al inicio
# 9. Esc → modo normal
# 10. A</li> → añadir al final
# 11. Esc → modo normal
# 12. j → bajar a la siguiente línea
# 13. q → terminar macro

# Aplicar a las 4 líneas restantes:
# 4@a
```

### Lab 6.5 — nano para edición rápida

```bash
# 1. Editar tu .bashrc con nano
nano ~/.bashrc

# 2. Buscar la línea que configura PS1 (prompt)
# Ctrl+W → PS1 → Enter

# 3. Añadir un alias al final del archivo
# Ctrl+End (ir al final)
# Escribir: alias actualizar='sudo apt update && sudo apt upgrade -y'

# 4. Guardar sin salir: Ctrl+O → Enter

# 5. Verificar que el alias está:
# Ctrl+W → actualizar → Enter

# 6. Salir: Ctrl+X

# 7. Recargar: source ~/.bashrc

# 8. Probar el alias:
# actualizar
```

### Lab 6.6 — Visual Block para edición en columnas

```bash
# Crear archivo de configuración tipo INI
cat > /tmp/config_ejemplo.ini << 'EOF'
host = servidor1.com
puerto = 8080
debug = false
timeout = 30
max_conexiones = 100
EOF

vim /tmp/config_ejemplo.ini

# Objetivo: añadir "# " al inicio de todas las líneas (comentarlas)

# Pasos:
# 1. Ir a la primera línea: gg
# 2. Activar visual block: Ctrl+V
# 3. Seleccionar todas las líneas: G (o 4j)
# 4. Insertar al inicio del bloque: I
# 5. Escribir: # 
# 6. Esc (aplicará a todas las líneas)

# Resultado:
# # host = servidor1.com
# # puerto = 8080
# (etc.)

# Para descomentar: Ctrl+V, seleccionar las "# ", d
```

---

## Resumen del módulo

✅ **nano:** Edición inmediata sin curva de aprendizaje; `.nanorc` para comodidad; `Ctrl+W` para buscar, `Ctrl+\` para reemplazar  
✅ **vim — supervivencia:** `Esc`, `:q!`, `:wq`, `i`, `a`, `o`; los modos Normal/Inserción/Visual  
✅ **vim — movimientos:** `hjkl`, `w/b/e`, `0/^/$`, `gg/G`, `f/t`, `{/}` — sin flechas, semánticos  
✅ **vim — gramática:** operador + movimiento + objeto de texto; `diw`, `ci"`, `ya{`, `d3w`  
✅ **vim — edición avanzada:** `:%s/a/b/gc`, registros ("+), macros `qa...q → @a`, marcas `ma → 'a`  
✅ **vim — entorno:** splits, buffers, tabs; visual block para edición en columnas  
✅ **vim — configuración:** `.vimrc` funcional con mappings, vim-plug, plugins esenciales  
✅ **Neovim:** LSP nativo, Lua, LazyVim; la evolución moderna de vim  
✅ **Alternativas:** `micro` (atajos estándar), `helix` (modal moderno), `emacs` (ecosistema), VS Code Remote-SSH  

**Próximo paso:** [Módulo 07 — Usuarios, grupos y permisos](/usuarios-grupos-y-permisos). Los editores de este módulo son las herramientas con las que modificarás los archivos de configuración de permisos, `sudoers` y la base de datos de usuarios del sistema.

---

**Última actualización:** 2024-06  
**Versión:** 1.0  
**Estado:** ✅ Listo para enseñanza
