---
title: "Módulo 05 — Archivos y procesamiento de texto"
sidebar_label: "05 · Procesamiento de texto"
description: Visualización de archivos, redirecciones, tuberías, grep, expresiones regulares, sed, awk, filtros clásicos, comparación de archivos y compresión. El corazón de la filosofía UNIX.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Módulo 05 — Archivos y procesamiento de texto

## Introducción

En el [Módulo 01](/introduccion-al-mundo-linux#13--la-filosofía-unix) aprendiste el principio que da sentido a este módulo: **"escribe programas que hagan una cosa y la hagan bien, y que trabajen juntos"**. Este módulo es ese principio en estado puro.

En el [Módulo 04](/sistema-de-archivos) aprendiste a navegar y gestionar archivos. Pero un archivo es más que un nombre y un inodo: tiene un **contenido** que necesitas leer, filtrar, transformar y analizar. En Linux, todo eso se hace con herramientas de texto que se combinan mediante **tuberías (pipes)**.

Un administrador de sistemas que domina `grep`, `sed` y `awk` puede analizar miles de líneas de logs, detectar un ataque en segundos, transformar datos de configuración o automatizar tareas complejas sin escribir ni una línea de código Python. Esto no es exageración: es el uso real que encontrarás en producción.

### Por qué el texto plano lo cambia todo

```
¿Por qué Linux usa texto plano para todo?
(Filosofía vista en Módulo 01, sección 1.3)

Texto plano tiene propiedades únicas:
├── Es universal: cualquier herramienta puede leerlo
├── Es componible: grep | sort | uniq funciona con CUALQUIER texto
├── Es inspeccionable: puedes ver exactamente qué hay
├── Es portable: funciona en cualquier sistema
├── Es versionable: git lo gestiona nativamente
└── Es eterno: un log de 1985 es legible hoy

Por eso /etc/ es texto, los logs son texto,
los scripts son texto, las configuraciones son texto.
La herramienta correcta para trabajar con Linux
es una herramienta de texto.
```

### Objetivos de aprendizaje

Al finalizar este módulo, serás capaz de:

- ✅ Leer y explorar cualquier tipo de archivo: texto, binario, comprimido
- ✅ Dominar completamente la redirección de flujos estándar
- ✅ Construir pipelines de procesamiento con múltiples herramientas
- ✅ Escribir expresiones regulares funcionales (BRE, ERE)
- ✅ Buscar patrones en archivos y directorios con `grep` y `rg`
- ✅ Transformar texto con `sed` (sustitución, borrado, edición in-place)
- ✅ Procesar y analizar datos estructurados con `awk`
- ✅ Usar los filtros clásicos: `sort`, `uniq`, `cut`, `tr`, `wc`, `column`
- ✅ Comparar archivos con `diff` y verificar integridad con hash
- ✅ Archivar y comprimir con `tar`, `gzip`, `xz` y `zstd`
- ✅ Resolver problemas reales con pipelines de texto

---

## 5.1 — Ver el contenido de archivos

### `cat` — Concatenar y mostrar

El nombre viene de *concatenate*, su uso original: unir archivos. Pero se usa principalmente para mostrar contenido.

```bash
# Mostrar un archivo
cat /etc/hostname
cat /etc/os-release

# Mostrar con números de línea
cat -n /etc/passwd          # Numera todas las líneas
cat -b /etc/passwd          # Numera solo líneas no vacías

# Mostrar caracteres no imprimibles
cat -A archivo.txt          # Muestra $ al final de cada línea y ^I para tabs
cat -v archivo.txt          # Muestra caracteres de control visibles
cat -e archivo.txt          # Muestra $ al final de cada línea

# Concatenar archivos reales
cat parte1.txt parte2.txt parte3.txt > completo.txt

# Crear archivo con heredoc (visto en Módulo 03)
cat > nuevo_archivo.txt << 'EOF'
Línea uno
Línea dos
Línea tres
EOF
```

**Problema real:** `cat -A` es la herramienta de diagnóstico #1 para un error muy común: el archivo tiene **finales de línea Windows (`\r\n`)** en lugar de Unix (`\n`). Eso rompe scripts bash.

```bash
# Detectar finales de línea Windows
cat -A script.sh | head -5
# #!/bin/bash^M$    ← El ^M es el \r de Windows
# echo "Hola"^M$

# Solución: convertir
sed -i 's/\r//' script.sh          # Eliminar los \r
# O con la herramienta especializada:
sudo apt install dos2unix
dos2unix script.sh                  # Convierte CRLF → LF
unix2dos script.sh                  # Convierte LF → CRLF (para Windows)
```

### `tac` — cat al revés

```bash
# Mostrar un archivo en orden inverso (útil para logs)
tac /var/log/syslog | head -20    # Las últimas 20 líneas primero
```

### `less` — El paginador universal

`less` es el paginador estándar de Linux. A diferencia de `more`, **puedes ir hacia atrás**.

```bash
# Abrir un archivo
less /var/log/syslog
less /etc/nginx/nginx.conf

# Controles de navegación dentro de less:
# ↑/↓ o j/k        → Una línea arriba/abajo
# Espacio / b       → Página siguiente / anterior
# g / G             → Ir al inicio / final
# /patrón           → Buscar adelante (Enter para confirmar)
# ?patrón           → Buscar atrás
# n / N             → Siguiente / anterior coincidencia
# q                 → Salir
# F                 → Follow mode (como tail -f)
# &patrón           → Mostrar solo líneas que coinciden con patrón
# m[letra]          → Marcar posición
# '[letra]          → Ir a posición marcada
# v                 → Abrir en editor ($EDITOR)
# :n / :p           → Siguiente / anterior archivo (si se pasaron varios)
# = o Ctrl+G        → Ver posición actual (línea, bytes, %)

# Opciones útiles al abrir
less -N archivo.txt       # Mostrar números de línea
less -S archivo.txt       # No envolver líneas largas (scroll horizontal)
less -i archivo.txt       # Búsqueda case-insensitive
less -F archivo.txt       # Salir automáticamente si cabe en pantalla

# Cómo funciona man: usa less internamente
man ls | head -1          # man simplemente lanza less sobre el texto
```

:::tip
La mayoría de comandos que paginan salida (`man`, `git log`, `apt show`) usan `less`. Aprender los atajos de `less` mejora inmediatamente la velocidad con todas esas herramientas.
:::

### `head` y `tail` — Ver extremos de archivos

```bash
# Las primeras N líneas (default: 10)
head /etc/passwd
head -n 20 /etc/passwd          # Primeras 20 líneas
head -20 /etc/passwd            # Forma abreviada

# Las últimas N líneas
tail /var/log/syslog
tail -n 50 /var/log/syslog      # Últimas 50 líneas
tail -100 /var/log/syslog       # Forma abreviada

# Desde la línea N hasta el final
tail -n +5 archivo.txt          # Desde la línea 5 hasta el final
                                 # (saltar las primeras 4 líneas)

# Seguir un archivo en tiempo real (FUNDAMENTAL para logs)
tail -f /var/log/syslog
tail -f /var/log/nginx/access.log

# Seguir un archivo Y reiniciar si es rotado/recreado
tail -F /var/log/syslog         # -F = follow name (más robusto que -f)

# Seguir múltiples archivos simultáneamente
tail -f /var/log/syslog /var/log/auth.log
# ==> /var/log/syslog <==
# (líneas de syslog)
# ==> /var/log/auth.log <==
# (líneas de auth.log)
```

**Problema real:** `tail -f` termina si el proceso que escribe el archivo lo **rota** (cierra y abre un nuevo archivo con el mismo nombre). La rotación de logs es estándar. `tail -F` resuelve esto porque sigue el **nombre** del archivo, no el file descriptor.

```bash
# Extraer un rango de líneas de un archivo (combinar head y tail)
sed -n '20,30p' archivo.txt      # Líneas 20 a 30

# O con head+tail:
head -n 30 archivo.txt | tail -n 11  # Líneas 20-30
```

### `wc` — Contar líneas, palabras y bytes

```bash
# Contar todo
wc /etc/passwd
#  45  130 2627 /etc/passwd
# (líneas palabras bytes nombre)

# Solo líneas (el más usado)
wc -l /etc/passwd          # 45 /etc/passwd
wc -l /var/log/syslog      # Cuántas líneas tiene el log

# Solo palabras
wc -w documento.txt

# Solo bytes
wc -c archivo.bin

# Solo caracteres (distinto de bytes en UTF-8)
wc -m texto_unicode.txt

# Contar múltiples archivos
wc -l /etc/*.conf
```

### `od`, `xxd` — Ver archivos binarios

```bash
# od: octal dump (lectura en varios formatos)
od -x archivo.bin          # En hexadecimal
od -c archivo.bin          # Como caracteres con escapes
od -An -tx1 archivo.bin    # Hex sin desplazamientos, un byte por columna

# xxd: hex dump más legible
xxd /usr/bin/ls | head -5
# 00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............
# 00000010: 0300 3e00 0100 0000 6022 0000 0000 0000  ..>.....`"......

# Verificar si un archivo es realmente texto o binario
file /etc/passwd             # ASCII text
file /usr/bin/ls             # ELF 64-bit LSB pie executable
file imagen.jpg              # JPEG image data

# Ver solo strings legibles dentro de un binario
strings /usr/bin/ls | head -20
strings firmware.bin | grep -i "version"
```

### `bat` — La alternativa moderna a `cat`

```bash
# Instalar
sudo apt install bat    # Ubuntu 22.04+ (comando: batcat o bat)
# En Ubuntu, el comando puede ser 'batcat' por conflicto de nombre
alias bat='batcat'      # Añadir a ~/.bashrc

# Usa bat en vez de cat para:
bat /etc/nginx/nginx.conf    # Sintaxis resaltada + números de línea
bat script.py                # Python con colores
bat --paging=never script.sh # Sin paginación (salida directa)
bat --plain script.sh        # Sin decoración (solo colorear)
bat -A archivo.txt           # Mostrar caracteres especiales (como cat -A)

# Ver múltiples archivos
bat /etc/*.conf
```

---

## 5.2 — Redirecciones y tuberías en profundidad

### Los tres flujos estándar

Todo proceso en Linux tiene tres **file descriptors** estándar abiertos al iniciarse:

```
┌──────────────────────────────────────────────────────────┐
│                     Proceso Linux                        │
│                                                          │
│  stdin  (fd 0) ←── teclado / pipe / archivo / heredoc   │
│  stdout (fd 1) ───→ terminal / archivo / pipe            │
│  stderr (fd 2) ───→ terminal / archivo / /dev/null       │
│                                                          │
└──────────────────────────────────────────────────────────┘

Flujo normal sin redirección:
Teclado ──→ [stdin  → proceso → stdout] ──→ Terminal
                              └→ stderr] ──→ Terminal
```

Este modelo viene de POSIX (visto en [Módulo 01](/introduccion-al-mundo-linux#12--historia-de-unix-a-linux)) y es la base de toda la composición de comandos.

### Redirección de salida

```bash
# > Redirigir stdout a archivo (SOBRESCRIBIR)
ls -la > listado.txt
echo "Hola" > saludo.txt

# >> Redirigir stdout a archivo (AÑADIR)
echo "$(date): tarea completada" >> /var/log/mi_script.log
ls -la >> listado.txt         # Añade al final del archivo existente

# Diferencia crítica: > vs >>
echo "línea 1" > archivo.txt  # Crea/sobrescribe
echo "línea 2" > archivo.txt  # ¡Sobrescribe la línea 1!
echo "línea 2" >> archivo.txt # Añade correctamente

# Protección contra sobreescritura accidental
set -o noclobber               # Activar protección en la shell
echo "texto" > existente.txt   # Error: cannot overwrite existing file
echo "texto" >| existente.txt  # Forzar sobreescritura con noclobber activo
```

### Redirección de stderr

```bash
# 2> Redirigir stderr a archivo
find / -name "config" 2> errores.txt
# Solo los errores van al archivo; los resultados van a pantalla

# 2>/dev/null Silenciar errores (muy común)
find / -name "config" 2>/dev/null
# Solo resultados, los errores de "Permission denied" desaparecen

# Redirigir stderr AL MISMO LUGAR que stdout
find / -name "config" > todo.txt 2>&1
# El 2>&1 significa "fd 2 vaya donde fd 1"
# IMPORTANTE: El orden importa: primero redirigir stdout, luego redirigir stderr

# Forma moderna (Bash 4+): &> redirige stdout Y stderr juntos
find / -name "config" &> todo.txt

# Ver solo errores (silenciar stdout)
find / -name "config" > /dev/null
# Solo los errores aparecen en pantalla
```

**Problema real:** Un error muy frecuente con `2>&1`:

```bash
# INCORRECTO: el orden está mal
find / -name "config" 2>&1 > todo.txt
# ¿Qué hace realmente?
# 1. 2>&1: stderr → fd 1 actual (que aún es el terminal)
# 2. > todo.txt: stdout → archivo
# Resultado: stdout va al archivo, stderr sigue en terminal

# CORRECTO
find / -name "config" > todo.txt 2>&1
# 1. > todo.txt: stdout → archivo
# 2. 2>&1: stderr → fd 1 actual (que ahora es el archivo)
# Resultado: ambos van al archivo
```

### Redirección de entrada

```bash
# < Leer stdin desde archivo en vez del teclado
sort < nombres.txt            # sort lee el archivo como entrada
wc -l < /etc/passwd           # Contar líneas del archivo

# Aquí el comando lee del archivo, sin pasar el nombre al programa
# Útil cuando el programa no acepta nombres de archivo, solo stdin

# Here Document: bloque de texto como stdin
cat << 'EOF'
Este es un here document.
No expande $VARIABLES porque tiene comillas.
EOF

cat << EOF
Esto SÍ expande variables: $HOME
Fecha: $(date)
EOF

# Here String: cadena como stdin
grep "error" <<< "Este es un mensaje de error de prueba"
# Equivale a: echo "..." | grep "error"

# Combinar redirecciones
sort < entrada.txt > salida_ordenada.txt 2>/dev/null
```

### Tuberías (pipes)

El pipe `|` conecta el **stdout** de un proceso con el **stdin** del siguiente. Esta es la implementación directa del principio UNIX de composibilidad.

```
ps aux | grep "nginx" | awk '{print $2}'

paso 1:  ps aux ──────────────────────────────────────────→ lista completa de procesos
          (stdout) ↓
paso 2:            grep "nginx" ─────────────────────────→ solo líneas con "nginx"
                    (stdout) ↓
paso 3:                        awk '{print $2}' ─────────→ solo la segunda columna (PID)
                                (stdout) ↓
                                          Terminal o archivo
```

```bash
# Ejemplos fundamentales
ls -la | grep "^d"                   # Solo directorios
cat /etc/passwd | cut -d: -f1       # Solo nombres de usuario
ps aux | grep nginx | grep -v grep  # Procesos nginx (sin el grep mismo)
cat /var/log/syslog | grep "error" | tail -20  # Últimos 20 errores

# Los pipes pasan datos en streaming (no esperan a que termine el anterior)
# Esto es importante para archivos grandes:
cat archivo_enorme.log | grep "ERROR" | wc -l
# No necesita cargar todo el archivo en memoria primero
```

### `tee` — Bifurcar la salida

`tee` lee de stdin y escribe simultáneamente a stdout Y a uno o más archivos. Viene de la "T" de los tubos de fontanería.

```bash
# Guardar y ver a la vez
ls -la | tee listado.txt
# Muestra el resultado Y lo guarda

# Guardar en múltiples archivos
ls -la | tee listado.txt copia.txt

# Añadir en vez de sobrescribir
ls -la | tee -a log_diario.txt

# Caso de uso frecuente: ver output Y capturar para análisis
make 2>&1 | tee build.log
# Si el build falla, tienes el log; también lo ves en pantalla

# Usar tee a mitad de una pipeline (para debugging)
cat /var/log/syslog | grep "error" | tee errores_brutos.txt | grep "nginx" > errores_nginx.txt
# Guarda todos los errores Y filtra los de nginx
```

### Sustitución de procesos (process substitution)

Permite usar la salida de un comando como si fuera un archivo:

```bash
# <(comando): la salida del comando como archivo de entrada
diff <(ls directorio1/) <(ls directorio2/)
# Compara contenido de dos directorios sin crear archivos temporales

# Comparar configuraciones de dos servidores
diff <(ssh servidor1 cat /etc/nginx/nginx.conf) <(ssh servidor2 cat /etc/nginx/nginx.conf)

# >(comando): enviar a un proceso como si fuera un archivo de salida
tee >(gzip > backup.gz) > copia_sin_comprimir.txt
# Escribe en el archivo normal Y en el pipeline de compresión

# Útil en pipelines que solo aceptan archivos como argumentos
sort file1.txt > /tmp/s1; sort file2.txt > /tmp/s2; comm /tmp/s1 /tmp/s2
# Más limpio con process substitution:
comm <(sort file1.txt) <(sort file2.txt)
```

### `xargs` — Convertir stdin en argumentos

`xargs` toma líneas de stdin y las convierte en argumentos de un comando.

```bash
# Problema: echo acepta argumentos, no stdin
echo "hola"                              # Funciona
ls | echo                                # No funciona (echo no lee stdin)
ls | xargs echo                          # Funciona: xargs pasa como argumentos

# Uso práctico: find + xargs (más eficiente que -exec)
find . -name "*.log" | xargs rm          # Borrar todos los .log
find . -name "*.py" | xargs grep "TODO"  # Buscar TODOs en todos los .py
find . -name "*.c" | xargs wc -l         # Contar líneas en todos los .c

# Problema con nombres de archivos con espacios:
# "mi archivo.txt" → xargs lo interpreta como DOS argumentos
# Solución: separar con NULL en vez de espacios
find . -name "*.txt" -print0 | xargs -0 rm
#            ↑ NUL-terminated          ↑ NUL-separated

# -I {} para posicionar el argumento
find . -name "*.conf" | xargs -I {} cp {} {}.backup

# -P para paralelismo
find . -name "*.mp4" | xargs -P 4 -I {} ffmpeg -i {} -c:v libx265 {}.h265.mp4
# Procesa 4 archivos en paralelo

# -n: cuántos argumentos por invocación
echo "a b c d e f" | xargs -n 2 echo
# a b
# c d
# e f
```

---

## 5.3 — Filtros clásicos

### `sort` — Ordenar texto

```bash
# Ordenación básica (alfabética, por líneas)
sort nombres.txt
sort /etc/passwd

# Opciones clave
sort -r archivo.txt           # Orden inverso (reverse)
sort -n numeros.txt           # Numérico (10 > 9, no "10" < "9")
sort -rn numeros.txt          # Numérico inverso
sort -u archivo.txt           # Eliminar duplicados (unique)
sort -f archivo.txt           # Case-insensitive
sort -R archivo.txt           # Orden aleatorio (shuffle)

# Ordenar por campo específico (-k)
sort -k3 tabla.txt            # Por el tercer campo (separado por espacios)
sort -k2,2 tabla.txt          # Solo el segundo campo (start,end)
sort -t: -k3 -n /etc/passwd   # Por UID (campo 3, sep :, numérico)
sort -t, -k2 datos.csv        # CSV por segunda columna

# Ejemplos reales
# Ordenar procesos por memoria (campo 4 de ps aux)
ps aux | sort -k4 -rn | head -10

# Ordenar archivos por tamaño
ls -l | sort -k5 -n           # Por tamaño (campo 5)
du -sh /var/* | sort -h       # Por tamaño legible (human sort)
du -sh /var/* | sort -rh      # Idem, mayor primero

# Ordenar IPs (campo 1, separador .)
sort -t. -k1,1n -k2,2n -k3,3n -k4,4n ips.txt
```

### `uniq` — Eliminar duplicados consecutivos

:::info
`uniq` solo elimina **líneas adyacentes duplicadas**. Por eso casi siempre se usa precedido de `sort`.
:::

```bash
# Eliminar líneas duplicadas
sort nombres.txt | uniq

# Contar ocurrencias
sort access.log | uniq -c              # Número de veces que aparece cada línea
sort access.log | uniq -c | sort -rn  # Ordenado por frecuencia (el ranking más potente de Linux)

# Solo mostrar duplicados
sort archivo.txt | uniq -d            # Líneas que aparecen más de una vez
sort archivo.txt | uniq -D            # Todas las instancias de duplicados

# Solo mostrar únicos
sort archivo.txt | uniq -u            # Líneas que aparecen exactamente una vez

# Ignorar los primeros N caracteres para comparar
uniq -s 4 archivo.txt                 # Ignorar los primeros 4 chars

# PIPELINE ESTRELLA — Ranking de frecuencias
# "¿Cuáles son las IPs que más veces aparecen en el log?"
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20
```

### `cut` — Extraer campos y columnas

```bash
# Por carácter (-c)
cut -c1 /etc/passwd           # Primer carácter de cada línea
cut -c1-5 /etc/passwd         # Caracteres 1 al 5
cut -c1,5,10 archivo.txt      # Caracteres 1, 5 y 10

# Por campo (-f) con delimitador (-d)
cut -d: -f1 /etc/passwd               # Primer campo (nombre usuario)
cut -d: -f1,3 /etc/passwd             # Campos 1 y 3 (nombre y UID)
cut -d: -f1-4 /etc/passwd             # Campos 1 a 4
cut -d, -f2 datos.csv                 # Segunda columna de un CSV
cut -d$'\t' -f3 tabla.tsv             # Tercera columna de un TSV

# Ejemplos reales
# Extraer solo los nombres de usuario del sistema
cut -d: -f1 /etc/passwd | sort

# Extraer IPs de un log de acceso de Nginx
cut -d' ' -f1 /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# Obtener solo la lista de shells instaladas
cut -d: -f7 /etc/passwd | sort -u
```

### `paste` — Unir archivos por columnas

```bash
# Combinar archivos lado a lado
paste archivo1.txt archivo2.txt
# linea1_a   linea1_b
# linea2_a   linea2_b

# Cambiar separador (default: tab)
paste -d, archivo1.txt archivo2.txt   # Separado por comas
paste -d: nombres.txt edades.txt      # Separado por :

# Convertir una columna en una línea (serial)
paste -s nombres.txt                  # nombre1  nombre2  nombre3
paste -s -d, nombres.txt              # nombre1,nombre2,nombre3
```

### `tr` — Traducir y borrar caracteres

`tr` traduce o borra caracteres. Solo lee desde stdin (no acepta argumentos de archivo).

```bash
# Traducir: tr 'conjunto1' 'conjunto2'
echo "Hola Mundo" | tr 'a-z' 'A-Z'    # Mayúsculas: HOLA MUNDO
echo "HOLA MUNDO" | tr 'A-Z' 'a-z'    # Minúsculas: hola mundo
echo "Hola 123"   | tr '0-9' 'X'       # Enmascarar dígitos: Hola XXX
echo "hola"       | tr 'ol' 'OL'       # hOLa

# Borrar caracteres (-d)
echo "H-O-L-A" | tr -d '-'            # HOLA (elimina guiones)
echo "línea\r"  | tr -d '\r'          # Elimina \r (fix Windows line endings)
cat archivo.txt | tr -d '[:punct:]'   # Eliminar puntuación

# Comprimir secuencias repetidas (-s squeeze)
echo "hola      mundo" | tr -s ' '    # hola mundo (comprime espacios)
echo "aabbcc" | tr -s 'a-z'           # abc

# Combinaciones de clases de caracteres
echo "Texto 123 !@#" | tr -d '[:digit:][:punct:]'  # Solo letras y espacios
echo "Texto 123 !@#" | tr -cd '[:alnum:]'           # Solo alfanuméricos

# Caso práctico: normalizar un CSV con separadores irregulares
cat datos.txt | tr -s ' \t' ','       # Espacios/tabs → una sola coma
```

### `column` — Formatear como tabla

```bash
# Instalar si no está disponible
sudo apt install util-linux    # Generalmente ya instalado

# Formatear como tabla alineada
cat /etc/passwd | column -t -s:
# root    x  0     0     root    /root           /bin/bash
# daemon  x  1     1     daemon  /usr/sbin       /usr/sbin/nologin

# Con separador de entrada y salida
mount | column -t                # Formatear la salida de mount en tabla

# Especificar separador
column -t -s ',' datos.csv

# Tabla con cabeceras (util-linux >= 2.37)
column -t -N "Usuario,UID,GID,Info,Home,Shell" -s: /etc/passwd
```

### `sort | uniq -c | sort -rn` — El pipeline estrella

Esta combinación aparece en miles de scripts de producción. Cuenta la frecuencia de cualquier dato:

```bash
# Patrón: EXTRAER_CAMPO | sort | uniq -c | sort -rn | head -N

# ¿Cuáles son los 10 comandos que más uso?
history | awk '{print $2}' | sort | uniq -c | sort -rn | head -10

# ¿Cuáles son las URLs más solicitadas en Nginx?
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# ¿Cuáles son los códigos HTTP más frecuentes?
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# ¿Qué IPs hacen más peticiones?
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# ¿Cuántas conexiones por estado tiene mi servidor?
ss -tan | awk '{print $1}' | sort | uniq -c | sort -rn

# ¿Qué extensiones de archivo hay en mi proyecto?
find . -type f | grep -oE '\.[^.]+$' | sort | uniq -c | sort -rn
```

---

## 5.4 — Expresiones regulares

Las expresiones regulares (regex) son el lenguaje para describir patrones de texto. Antes de aprender `grep`, `sed` o `awk`, necesitas entender el lenguaje que hablan.

### Conceptos básicos

```
Un regex es un PATRÓN que describe un conjunto de cadenas.

"error"     → Coincide con cualquier línea que contenga "error"
"^error"    → Líneas que EMPIECEN con "error"
"error$"    → Líneas que TERMINEN con "error"
"^error$"   → Líneas que sean EXACTAMENTE "error"
"err.r"     → "error", "errar", "err0r"... (. = cualquier char)
"err.*r"    → "error", "err000r", "errando el caminar"...
```

### Los meta-caracteres

```
Anclas (posición):
^       Inicio de línea
$       Final de línea
\b      Límite de palabra (en ERE/PCRE)

Caracteres:
.       Cualquier carácter excepto newline
[abc]   Cualquiera de: a, b, c
[a-z]   Cualquier letra minúscula
[A-Z]   Cualquier letra mayúscula
[0-9]   Cualquier dígito
[^abc]  Cualquier carácter EXCEPTO a, b, c
\d      Dígito (PCRE / grep -P) ≡ [0-9]
\w      Alfanumérico + _ (PCRE) ≡ [a-zA-Z0-9_]
\s      Espacio, tab, newline (PCRE) ≡ [ \t\n\r]

Cuantificadores (cuántas veces):
*       0 o más veces del elemento anterior
+       1 o más veces (ERE/PCRE, en BRE: \+)
?       0 o 1 vez (ERE/PCRE, en BRE: \?)
{n}     Exactamente n veces
{n,}    Al menos n veces
{n,m}   Entre n y m veces

Grupos y alternancia:
(abc)   Grupo de captura
(?:abc) Grupo sin captura (PCRE)
a|b     Alternancia: a o b
```

### BRE vs. ERE vs. PCRE

Esta es la fuente de confusión más común. Existen **tres dialectos** de regex en Linux:

```
┌─────────────────────────────────────────────────────────┐
│              Dialectos de Regex en Linux                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ BRE (Basic Regex Expression)                            │
│   Herramientas: grep, sed (default), vi                 │
│   +, ?, |, (), {} requieren escape: \+, \?, \|, \(\)   │
│   Ejemplo: grep 'err\(or\|ar\)' archivo                 │
│                                                         │
│ ERE (Extended Regex Expression)                         │
│   Herramientas: grep -E, egrep, awk, sed -E             │
│   +, ?, |, (), {} funcionan SIN escape                  │
│   Ejemplo: grep -E 'err(or|ar)' archivo                 │
│                                                         │
│ PCRE (Perl-Compatible Regex)                            │
│   Herramientas: grep -P, python, perl, rg               │
│   Añade: \d, \w, \s, lookaheads, lazy quantifiers       │
│   Ejemplo: grep -P '\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}'│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Recomendación práctica:** Usa siempre `grep -E` (ERE) o `grep -P` (PCRE). Son más potentes y la sintaxis es más intuitiva que BRE.

### Clases POSIX de caracteres

```bash
# Útiles y portables (funcionan en BRE y ERE)
[:alpha:]    Letras: [a-zA-Z]
[:digit:]    Dígitos: [0-9]
[:alnum:]    Alfanumérico: [a-zA-Z0-9]
[:upper:]    Mayúsculas: [A-Z]
[:lower:]    Minúsculas: [a-z]
[:space:]    Espacios en blanco: [ \t\n\r]
[:punct:]    Puntuación
[:print:]    Caracteres imprimibles
[:blank:]    Espacio y tab

# Uso: dentro de corchetes DOBLES
grep '[[:digit:]]' archivo.txt     # Líneas con al menos un dígito
grep '[[:alpha:]][[:digit:]]' x    # Letra seguida de dígito
```

### Construir regex paso a paso

**Ejemplo: regex para validar una dirección IPv4**

```bash
# Intentos progresivos:

# V1: Muy permisivo
grep -E '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' archivo

# V2: Limitar a 3 dígitos por octeto
grep -E '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' archivo

# V3: Con anclas de palabra (evitar matching dentro de cadenas más largas)
grep -E '\b[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\b' archivo

# V4 (PCRE): Correcta para 0-255 (compleja pero exacta)
grep -P '\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b'

# En producción: V3 suele ser suficiente para logs
```

```bash
# Otros patrones útiles de producción:
# Email (simplificado)
grep -E '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' archivo

# Fecha formato YYYY-MM-DD
grep -E '[0-9]{4}-[0-9]{2}-[0-9]{2}' log.txt

# Hora formato HH:MM:SS
grep -E '[0-9]{2}:[0-9]{2}:[0-9]{2}' log.txt

# URL básica
grep -E 'https?://[a-zA-Z0-9._/-]+' texto.txt

# Hash MD5 (32 hex)
grep -E '[0-9a-f]{32}' archivo.txt

# Hash SHA256 (64 hex)
grep -E '[0-9a-f]{64}' archivo.txt
```

---

## 5.5 — `grep` — Buscar patrones en texto

### Sintaxis y opciones fundamentales

```bash
# Sintaxis: grep [opciones] PATRÓN [archivo...]
grep "error" /var/log/syslog
grep -r "TODO" ./src/         # Recursivo en directorio

# Opciones básicas
grep -i "error" archivo.txt        # Case insensitive
grep -v "debug" archivo.txt        # Invertir: líneas que NO coinciden
grep -n "error" archivo.txt        # Mostrar número de línea
grep -c "error" archivo.txt        # Contar líneas que coinciden
grep -l "error" *.log              # Solo nombre de archivos que coinciden
grep -L "error" *.log              # Archivos que NO tienen coincidencia

# Tipo de regex
grep -E "patrón" archivo.txt       # ERE (extendida) — RECOMENDADO
grep -F "cadena.literal" archivo   # Cadena fija, no regex (más rápido)
grep -P "patrón PCRE" archivo      # PCRE (Perl)

# Contexto
grep -A 3 "error" syslog    # 3 líneas DESPUÉS del match
grep -B 3 "error" syslog    # 3 líneas ANTES del match
grep -C 3 "error" syslog    # 3 líneas antes Y después (context)

# Exactitud
grep -w "error" archivo.txt        # Palabra completa (no "errores")
grep -x "error exacto" archivo.txt # Línea completa (ancla ^ y $)

# Solo mostrar el fragmento que coincide (no la línea entera)
grep -o "[0-9]\+" numeros.txt      # Solo los números
grep -oE "[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}" access.log  # Solo IPs
```

### grep recursivo y multiarchivo

```bash
# Buscar en todos los archivos de un directorio
grep -r "contraseña" /etc/          # Recursivo (sigue symlinks con -R)
grep -r "TODO" ./src/ --include="*.py"   # Solo en archivos .py
grep -r "fixme" . --exclude="*.log"      # Excluir .log
grep -r "error" . --exclude-dir=".git"   # Excluir directorio .git
grep -r "error" . --exclude-dir={.git,node_modules,__pycache__}

# Múltiples patrones
grep -e "error" -e "warning" -e "critical" syslog   # Cualquiera de los tres
# O con regex:
grep -E "error|warning|critical" syslog
```

### Casos de uso reales con `grep`

```bash
# 1. Analizar logs de SSH para detectar intentos de fuerza bruta
grep "Failed password" /var/log/auth.log | \
    grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' | \
    sort | uniq -c | sort -rn | head -20
# Muestra las IPs que más intentos de login fallidos han tenido

# 2. Encontrar qué archivos de configuración mencionan un dominio
grep -rl "ejemplo.com" /etc/nginx/
grep -rl "ejemplo.com" /etc/apache2/

# 3. Ver todos los errores de PHP del día de hoy
grep "$(date +%Y-%m-%d)" /var/log/php8.1-fpm.log | grep -E "ERROR|FATAL"

# 4. Encontrar contraseñas hardcodeadas en código (auditoría)
grep -rn -E "(password|passwd|secret|api_key)\s*=\s*['\"][^'\"]{3,}" src/

# 5. Filtrar IPs maliciosas de un log de acceso
# Primero: generar lista de IPs sospechosas
grep "404" /var/log/nginx/access.log | \
    awk '{print $1}' | sort | uniq -c | sort -rn | \
    awk '$1 > 100 {print $2}' > ips_sospechosas.txt

# 6. Buscar imports no usados en Python (simplificado)
grep -rn "^import" src/ | cut -d: -f3 | awk '{print $2}' | sort -u

# 7. Contar líneas de código por tipo de archivo
find . -name "*.py" | xargs grep -v "^$" | wc -l      # Python sin vacías
find . -name "*.js" | xargs grep -v "^[[:space:]]*//"  # JS sin comentarios
```

### `ripgrep` (`rg`) — La alternativa moderna

[ripgrep](https://github.com/BurntSushi/ripgrep) es entre 3 y 10 veces más rápido que `grep`, ignora automáticamente `.git` y `node_modules`, y respeta `.gitignore`.

```bash
# Instalar
sudo apt install ripgrep

# Uso básico (misma semántica que grep -E -r)
rg "error" /var/log/            # Recursivo por defecto
rg "TODO" ./src/                # Solo en directorio

# Opciones (mismas que grep pero más limpias)
rg -i "error"                   # Case insensitive
rg -l "error"                   # Solo nombres de archivos
rg -c "error"                   # Contar
rg -n "error"                   # Con números de línea (default)
rg -v "debug"                   # Invertir
rg -w "error"                   # Palabra completa
rg -A 3 "error"                 # 3 líneas de contexto después

# Tipos de archivo (más cómodo que --include)
rg -t py "import"               # Solo archivos Python
rg -t js -t ts "useState"       # JS y TypeScript
rg --type-list                  # Ver todos los tipos disponibles

# Búsqueda en archivos comprimidos
rg -z "error" /var/log/*.gz     # Buscar dentro de .gz

# Comparativa de velocidad real (en un repo grande con ~100k archivos)
time grep -r "función" . --include="*.py" 2>/dev/null   # ~15s
time rg "función" -t py                                  # ~0.3s
```

---

## 5.6 — `sed` — El editor de flujos

`sed` (*Stream EDitor*) es un editor no interactivo que lee un flujo de texto línea por línea, aplica transformaciones y escribe el resultado.

```
Modelo de funcionamiento de sed:

Archivo/stdin ─→ [Leer línea] ─→ [Aplicar comandos] ─→ [Imprimir] ─→ stdout
                     ↑                                        │
                     └────────────── Siguiente línea ─────────┘
```

### El comando `s` — Sustitución

```bash
# Sintaxis: s/patrón/reemplazo/flags
# El / puede ser cualquier carácter (/, |, #, @, etc.)

# Sustitución básica: solo la primera ocurrencia por línea
sed 's/error/ERROR/' archivo.txt

# Sustitución global (todas las ocurrencias)
sed 's/error/ERROR/g' archivo.txt

# Case insensitive
sed 's/error/ERROR/gi' archivo.txt

# Imprimir solo líneas modificadas
sed -n 's/error/ERROR/gp' archivo.txt   # -n suprime output; p imprime el match

# Separador alternativo (útil con rutas que contienen /)
sed 's|/usr/local|/opt|g' script.sh     # | como separador
sed 's#/home/juan#/home/maria#g' conf   # # como separador
sed 's@/old/path@/new/path@g' archivo   # @ como separador

# Reemplazar con vacío (= borrar la primera ocurrencia)
sed 's/comentario//' archivo.txt

# Borrar todas las ocurrencias de un patrón
sed 's/debug: //g' log.txt

# Borrar espacios al inicio y al final de línea (trim)
sed 's/^[[:space:]]*//' archivo.txt     # Trim izquierdo
sed 's/[[:space:]]*$//' archivo.txt     # Trim derecho
sed 's/^[[:space:]]*//;s/[[:space:]]*$//' archivo.txt  # Ambos
```

### Grupos de captura y referencias

```bash
# Grupos de captura en BRE: \( \) y referencias \1, \2
echo "juan garcia" | sed 's/\(.*\) \(.*\)/\2, \1/'
# garcia, juan

# Con -E (ERE), los grupos no necesitan escape
echo "juan garcia" | sed -E 's/(.*) (.*)/\2, \1/'
# garcia, juan

# Invertir fecha de YYYY-MM-DD a DD/MM/YYYY
echo "2024-06-15" | sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/\3\/\2\/\1/'
# 15/06/2024

# Añadir texto alrededor de un patrón
echo "nombre" | sed -E 's/(.*)/["&"]/'  # & = coincidencia completa
# ["nombre"]

# Rodear IPs con corchetes en un log
sed -E 's/([0-9]{1,3}\.){3}[0-9]{1,3}/[&]/g' access.log
```

### Direccionamiento por línea

```bash
# Actuar solo en líneas específicas
sed '5s/error/ERROR/' archivo        # Solo línea 5
sed '2,5s/error/ERROR/' archivo      # Líneas 2 a 5
sed '5,$s/error/ERROR/' archivo      # Línea 5 hasta el final
sed '$s/error/ERROR/' archivo        # Solo la última línea
sed '1~2s/error/ERROR/' archivo      # Líneas impares (1, 3, 5...)

# Direccionamiento por patrón (entre dos patrones)
sed '/inicio/,/fin/s/error/ERROR/' archivo   # Entre las líneas "inicio" y "fin"
sed '/^#/s/^/#COMENTADO: /' archivo          # Añadir prefijo a comentarios
```

### Otros comandos sed

```bash
# d: borrar líneas
sed '/^#/d' archivo.txt              # Borrar comentarios (líneas que empiezan con #)
sed '/^$/d' archivo.txt              # Borrar líneas vacías
sed '1d' archivo.txt                 # Borrar la primera línea
sed '1,3d' archivo.txt               # Borrar las primeras 3 líneas
sed '/error/d' log.txt               # Borrar líneas que contienen "error"

# p: imprimir (con -n para selectivo)
sed -n '5,10p' archivo.txt           # Mostrar solo líneas 5-10
sed -n '/inicio/,/fin/p' archivo.txt # Mostrar entre dos patrones

# i: insertar ANTES de la línea
sed '3i\Nueva línea insertada' archivo.txt

# a: añadir DESPUÉS de la línea
sed '3a\Nueva línea añadida' archivo.txt
sed '/patrón/a\Línea añadida después del patrón' archivo.txt

# q: salir tras N líneas (como head)
sed '10q' archivo.txt                # Primeras 10 líneas (más rápido que head en algunos casos)
```

### Edición in-place (`-i`)

```bash
# -i modifica el archivo directamente (SIN crear archivo nuevo en stdout)
sed -i 's/viejo/nuevo/g' archivo.txt

# -i.bak: crear backup antes de modificar (MUY RECOMENDADO)
sed -i.bak 's/viejo/nuevo/g' archivo.txt
# Crea archivo.txt.bak (original) y modifica archivo.txt

# Modificar múltiples archivos
sed -i 's/localhost/mi-servidor.com/g' /etc/app/*.conf
sed -i.bak 's/localhost/mi-servidor.com/g' /etc/app/*.conf
```

:::danger
`sed -i` sin backup puede destruir datos. Si el patrón es incorrecto o hay un typo, el archivo queda dañado y no hay forma de recuperarlo. **Siempre usa `sed -i.bak`** o verifica con `sed 's/...' archivo` (sin `-i`) antes.
:::

### Scripts sed multi-línea

```bash
# Múltiples comandos con -e
sed -e 's/error/ERROR/g' -e 's/warning/WARNING/g' -e '/^$/d' log.txt

# O en un script sed (-f archivo.sed)
cat > limpieza.sed << 'EOF'
# Eliminar comentarios
/^[[:space:]]*#/d
# Eliminar líneas vacías
/^$/d
# Convertir tabs en espacios
s/\t/    /g
# Trim derecho
s/[[:space:]]*$//
EOF
sed -f limpieza.sed archivo.txt
```

### Recetas sed de producción

```bash
# 1. Añadir número de línea a cada línea
sed = archivo.txt | sed 'N; s/\n/\t/'

# 2. Eliminar líneas duplicadas consecutivas (como uniq)
sed '$!N; /^\(.*\)\n\1$/!P; D'

# 3. Imprimir entre dos patrones (inclusive)
sed -n '/INICIO/,/FIN/p' archivo.txt

# 4. Cambiar todas las IPs en una configuración
OLD_IP="192.168.1.10"
NEW_IP="10.0.0.50"
sed -i.bak "s/$OLD_IP/$NEW_IP/g" /etc/nginx/*.conf

# 5. Añadir una línea al final de un bloque
sed '/^\[server\]/,/^\[/ { /^\[server\]/ ! { /^\[/ ! { $ { a\    timeout = 30 } } } }' config.ini
# (complejo; para esto awk es más legible)

# 6. Extraer sección de un archivo de configuración
sed -n '/^\[database\]/,/^\[/p' config.ini | sed '$d'
```

---

## 5.7 — `awk` — Procesamiento de datos estructurados

`awk` es un **lenguaje de programación completo** especializado en procesar texto estructurado (columnas, tablas). Su nombre viene de sus creadores: **A**ho, **W**einberger y **K**ernighan.

### Modelo de ejecución

```
Funcionamiento de awk:

Archivo/stdin
     │
     ├── Línea 1 ──→ [¿Coincide patrón?] ──Si── [Ejecutar acción] ──→ stdout
     │                         │
     │                         └─No── (siguiente línea)
     ├── Línea 2 ──→ ...
     └── ...

awk 'patrón { acción }' archivo

Casos especiales:
  BEGIN { acción }  → Se ejecuta ANTES de leer cualquier línea
  END   { acción }  → Se ejecuta DESPUÉS de la última línea
```

### Variables automáticas de awk

```bash
# awk divide cada línea en campos automáticamente
echo "Juan García 35 Madrid" | awk '{print $1}'     # Juan
echo "Juan García 35 Madrid" | awk '{print $2}'     # García
echo "Juan García 35 Madrid" | awk '{print $NF}'    # Madrid (último campo)
echo "Juan García 35 Madrid" | awk '{print $(NF-1)}'# 35 (penúltimo)
echo "Juan García 35 Madrid" | awk '{print $0}'     # Línea completa

# Variables automáticas
NF     # Number of Fields: número de campos en la línea actual
NR     # Number of Records: número de línea actual (contador)
$0     # Línea completa
$1..$N # Campo N
FS     # Field Separator: separador de campos (default: espacio/tab)
OFS    # Output Field Separator: separador en la salida
RS     # Record Separator: separador de registros (default: \n)
ORS    # Output Record Separator
FILENAME # Nombre del archivo actual
```

### Especificar separador de campos

```bash
# -F: especificar el separador
awk -F: '{print $1}' /etc/passwd         # Separador :
awk -F, '{print $2}' datos.csv           # Separador ,
awk -F'\t' '{print $3}' tabla.tsv        # Separador tab
awk -F'[,;]' '{print $1}' mixto.txt      # Separador , o ;

# Desde dentro del script con FS
awk 'BEGIN{FS=":"} {print $1}' /etc/passwd
awk 'BEGIN{FS=":"; OFS="\t"} {print $1, $3}' /etc/passwd
```

### Patrones y filtros

```bash
# Imprimir líneas que contienen un patrón
awk '/error/' log.txt                    # = grep "error"
awk '/error/ {print}' log.txt            # Explícito
awk '!/error/' log.txt                   # = grep -v "error"

# Condiciones numéricas sobre campos
awk '$3 > 1000' /etc/passwd              # Usuarios con UID > 1000
awk 'NR > 5' archivo.txt                 # Desde la línea 6 en adelante
awk 'NR==1' archivo.txt                  # Solo la primera línea
awk 'NR>=5 && NR<=10' archivo.txt        # Líneas 5 a 10

# Condiciones sobre strings
awk '$1 == "root"' /etc/passwd           # Campo 1 es exactamente "root"
awk '$7 ~ /bash/' /etc/passwd            # Campo 7 contiene "bash" (regex ~)
awk '$7 !~ /nologin/' /etc/passwd        # Campo 7 NO contiene "nologin"
awk 'length($0) > 80' archivo.txt        # Líneas más largas de 80 caracteres
```

### BEGIN y END

```bash
# BEGIN: ejecutar antes de leer datos
awk 'BEGIN{print "=== INICIO ==="} {print} END{print "=== FIN ==="}' archivo.txt

# Añadir cabecera a una tabla
awk 'BEGIN{print "Usuario\tUID\tShell"} -F: {print $1"\t"$3"\t"$7}' /etc/passwd

# Contar líneas (como wc -l)
awk 'END{print NR}' archivo.txt

# Calcular suma de una columna
awk '{sum += $1} END{print "Total:", sum}' numeros.txt

# Calcular promedio
awk '{sum += $1; count++} END{print "Promedio:", sum/count}' numeros.txt

# Estadísticas completas de una columna numérica
awk 'BEGIN{min=99999; max=0}
     {
       sum += $1; count++
       if ($1 > max) max = $1
       if ($1 < min) min = $1
     }
     END{
       print "N:      " count
       print "Suma:   " sum
       print "Mín:    " min
       print "Máx:    " max
       print "Media:  " sum/count
     }' tiempos.txt
```

### Arrays asociativos en awk

Los arrays asociativos son la característica más potente de awk para análisis de datos:

```bash
# Contar ocurrencias de un campo
awk '{count[$1]++} END{for (ip in count) print count[ip], ip}' access.log | sort -rn

# Suma por grupo
awk '{bytes[$1] += $10} END{for (ip in bytes) print ip, bytes[ip]}' access.log

# Ejemplo completo: analizar log de Nginx
# Formato: IP - - [fecha] "MÉTODO URL HTTP" STATUS BYTES
awk '
{
    ip = $1
    status = $9
    bytes = $10
    
    # Contar peticiones por IP
    requests[ip]++
    
    # Contar por código de estado
    status_count[status]++
    
    # Sumar bytes por IP
    if (bytes != "-") total_bytes[ip] += bytes
}
END {
    print "=== Top 10 IPs por peticiones ==="
    for (ip in requests) print requests[ip], ip
}' /var/log/nginx/access.log | sort -rn | head -10

# Deduplicar un CSV manteniendo el primer registro por clave
awk -F, '!seen[$1]++' datos.csv
# !seen[$1]++ → la primera vez que aparece $1, seen[$1] es 0 (falso falso=true)
#               las siguientes veces es >0 (falso)
```

### Reformatear y transformar con awk

```bash
# Cambiar el separador de campos
awk -F: '{OFS="\t"; print $1,$3,$7}' /etc/passwd
# Convierte : → tab para campos 1, 3, 7

# Invertir el orden de las columnas
awk '{print $3, $2, $1}' archivo.txt

# Imprimir campos en formato personalizado
awk -F: '{printf "Usuario: %-15s UID: %4d Shell: %s\n", $1, $3, $7}' /etc/passwd

# printf en awk: igual que printf de C
# %s = string, %d = entero, %f = flotante, %-15s = alineado a la izquierda en 15 chars

# Generar reportes
awk -F: '
BEGIN {
    printf "%-20s %-6s %-s\n", "USUARIO", "UID", "SHELL"
    printf "%-20s %-6s %-s\n", "-------", "---", "-----"
}
$3 >= 1000 && $7 !~ /nologin|false/ {
    printf "%-20s %-6d %-s\n", $1, $3, $7
}
' /etc/passwd
```

### Cuándo usar sed vs. awk

```
┌──────────────────────────────────────────────────────────────┐
│ ¿sed o awk?                                                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Usa sed cuando:                  │ Usa awk cuando:           │
│ ─ Sustitución de texto           │ ─ Procesar columnas       │
│ ─ Borrar líneas/patrones         │ ─ Cálculos numéricos      │
│ ─ Insertar/añadir líneas         │ ─ Agrupar o contar        │
│ ─ Edición in-place (-i)          │ ─ Reformatear tabla       │
│ ─ Transformaciones simples       │ ─ Necesitas lógica if/for │
│ ─ Operaciones por patrón/línea   │ ─ Arrays/acumuladores     │
│                                              │ ─ Reportes    │
├──────────────────────────────────────────────────────────────┤
│ Para transformaciones muy complejas: Python o Perl           │
└──────────────────────────────────────────────────────────────┘
```

---

## 5.8 — Comparar archivos

### `diff` — Ver diferencias entre archivos

`diff` es la herramienta fundamental para comparar archivos. Su salida es también el **formato de los parches (patches)** que se usan en el desarrollo de software.

```bash
# Comparación básica
diff archivo1.txt archivo2.txt
# < línea en archivo1 pero no en archivo2
# > línea en archivo2 pero no en archivo1
# --- separador
# 5c5 = línea 5 cambiada (c=changed, a=added, d=deleted)

# Formato unificado (-u): el más usado (base de git diff)
diff -u archivo1.txt archivo2.txt
# --- archivo1.txt  2024-06-01 10:00:00
# +++ archivo2.txt  2024-06-01 10:30:00
# @@ -1,5 +1,5 @@
#  línea sin cambios
# -línea eliminada
# +línea añadida
#  otra línea sin cambios

# Opciones útiles
diff -y archivo1.txt archivo2.txt     # Comparación en columnas lado a lado
diff -w archivo1.txt archivo2.txt     # Ignorar diferencias de espacios
diff -b archivo1.txt archivo2.txt     # Ignorar cambios en cantidad de blancos
diff -i archivo1.txt archivo2.txt     # Ignorar diferencias de mayúsculas
diff -r directorio1/ directorio2/     # Recursivo (directorios completos)
diff -rq dir1/ dir2/                  # Solo nombres de archivos diferentes (quiet)

# Comparar configuraciones de dos hosts
ssh host1 cat /etc/nginx/nginx.conf > /tmp/host1_nginx.conf
ssh host2 cat /etc/nginx/nginx.conf > /tmp/host2_nginx.conf
diff -u /tmp/host1_nginx.conf /tmp/host2_nginx.conf
```

### `patch` — Aplicar diferencias

```bash
# Crear un patch
diff -u original.txt modificado.txt > cambios.patch

# Aplicar el patch al archivo original
patch original.txt < cambios.patch

# Aplicar patch en directorio (para proyectos)
patch -p1 < cambios.patch     # -p1: ignorar primer componente del path
patch -p0 < cambios.patch     # -p0: paths tal como están

# Revertir un patch
patch -R original.txt < cambios.patch
patch -R -p1 < cambios.patch
```

### `comm` — Comparar dos archivos ordenados

```bash
# comm muestra 3 columnas:
# Col 1: líneas solo en archivo1
# Col 2: líneas solo en archivo2
# Col 3: líneas en ambos

sort lista1.txt > /tmp/s1; sort lista2.txt > /tmp/s2
comm /tmp/s1 /tmp/s2

# Suprimir columnas
comm -12 <(sort lista1.txt) <(sort lista2.txt)   # Solo líneas comunes (intersección)
comm -23 <(sort lista1.txt) <(sort lista2.txt)   # Solo en lista1 (diferencia A-B)
comm -13 <(sort lista1.txt) <(sort lista2.txt)   # Solo en lista2 (diferencia B-A)

# Caso de uso: ¿qué paquetes hay instalados en server1 pero no en server2?
comm -23 <(ssh server1 dpkg --get-selections | sort) \
         <(ssh server2 dpkg --get-selections | sort)
```

### `cmp` — Comparación binaria

```bash
# Comparar byte a byte (útil para binarios)
cmp archivo1.bin archivo2.bin
# archivo1.bin archivo2.bin differ: byte 1024, line 3

# Si son idénticos: no hay salida (exit code 0)
# Si difieren: muestra la posición del primer byte diferente

# Útil para verificar que una copia es exacta
cmp /dev/sda /dev/sdb              # ¡Comparar discos enteros!
cmp imagen_original.iso copia.iso
```

### Verificar integridad con hashes

```bash
# Calcular hash de un archivo
md5sum archivo.iso
# d41d8cd98f00b204e9800998ecf8427e  archivo.iso

sha256sum archivo.iso
# e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  archivo.iso

# Verificar contra un hash conocido (típico al descargar software)
echo "hash_esperado  archivo.iso" | sha256sum --check
# archivo.iso: OK     ← Si el hash coincide
# archivo.iso: FAILED ← Si fue modificado o corrompido

# Verificar múltiples archivos con un archivo de sumas
sha256sum archivo1 archivo2 archivo3 > checksums.sha256
# (más tarde para verificar)
sha256sum --check checksums.sha256
# archivo1: OK
# archivo2: OK
# archivo3: FAILED

# Para descargas: siempre verificar
wget https://ejemplo.com/ubuntu.iso
wget https://ejemplo.com/ubuntu.iso.sha256
sha256sum --check ubuntu.iso.sha256

# md5sum vs sha256sum vs sha512sum
# md5sum:    Rápido, pero colisiones conocidas. Solo para detectar corrupción accidental.
# sha256sum: Estándar actual. Suficiente para verificar integridad de descargas.
# sha512sum: Más robusto. Usar en auditorías de seguridad o cuando importa más.
```

---

## 5.9 — Archivado y compresión

### `tar` — El archivador universal

`tar` (*Tape ARchiver*) empaqueta múltiples archivos/directorios en uno solo, opcionalmente comprimido.

```bash
# CREAR un archivo tar
tar -cf archivo.tar directorio/            # Crear (c) + archivo de salida (f)
tar -czf archivo.tar.gz directorio/       # + comprimir con gzip (z)
tar -cjf archivo.tar.bz2 directorio/     # + comprimir con bzip2 (j)
tar -cJf archivo.tar.xz directorio/      # + comprimir con xz (J)
tar -c --zstd -f archivo.tar.zst dir/    # + comprimir con zstd

# VER el contenido sin extraer
tar -tf archivo.tar
tar -tzf archivo.tar.gz                   # Con gzip
tar -tJf archivo.tar.xz                   # Con xz
tar -tvf archivo.tar                      # Detallado (como ls -l)

# EXTRAER
tar -xf archivo.tar                       # Extraer en directorio actual
tar -xzf archivo.tar.gz                   # Extraer gzip
tar -xJf archivo.tar.xz                   # Extraer xz
tar -xf archivo.tar -C /destino/          # Extraer en directorio específico
tar -xf archivo.tar archivo_especifico    # Extraer solo un archivo

# Opciones útiles adicionales
tar -czf backup.tar.gz -v directorio/     # Verbose: mostrar lo que empaqueta
tar -czf backup.tar.gz directorio/ --exclude="*.log"    # Excluir patrón
tar -czf backup.tar.gz directorio/ --exclude-vcs         # Excluir .git, .svn
tar -czf backup.tar.gz directorio/ --newer-mtime="2024-01-01"  # Solo más nuevos

# Memorizar: c=crear, x=extraer, t=listar, f=archivo, v=verbose
#            z=gzip, j=bzip2, J=xz
```

**El modo `--` para archivos que empiezan con `-`:**

```bash
# Si un directorio se llama "-r" (poco probable pero posible)
tar -czf backup.tar.gz -- -r/           # -- indica fin de opciones
```

### Comparativa de compresores

```bash
# Comprimir el mismo directorio con distintos algoritmos
time tar -cf - directorio/ | gzip -9   > backup.tar.gz   # gzip nivel 9
time tar -cf - directorio/ | bzip2 -9  > backup.tar.bz2  # bzip2 nivel 9
time tar -cf - directorio/ | xz -9     > backup.tar.xz   # xz nivel 9
time tar -cf - directorio/ | zstd -19  > backup.tar.zst  # zstd nivel 19
```

```
Comparativa real (archivo de texto de 100 MB):

Algoritmo  Compresión  Velocidad compress  Velocidad decompress
─────────────────────────────────────────────────────────────
gzip       ~65%        ~300 MB/s          ~400 MB/s
bzip2      ~60%        ~30 MB/s           ~80 MB/s
xz         ~45%        ~10 MB/s           ~150 MB/s
zstd -1    ~65%        ~600 MB/s          ~2000 MB/s
zstd -19   ~45%        ~25 MB/s           ~2000 MB/s

Cuándo usar cada uno:
├── gzip:  Compatibilidad máxima, scripts, logs del sistema
├── bzip2: Legacy (casi sin razón de usarlo hoy)
├── xz:    Máxima compresión, paquetes de distribución
└── zstd:  Velocidad + buena compresión (backups, streaming)
```

### `gzip`, `bzip2`, `xz` — Comprimir archivos individuales

```bash
# gzip
gzip archivo.txt                # Comprime → archivo.txt.gz (borra el original)
gzip -k archivo.txt             # Comprime, MANTIENE el original (-k = keep)
gzip -d archivo.txt.gz          # Descomprimir (o gunzip)
gzip -9 archivo.txt             # Nivel máximo de compresión
gzip -1 archivo.txt             # Nivel mínimo (más rápido)
zcat archivo.txt.gz             # Ver contenido sin descomprimir
zgrep "error" archivo.txt.gz    # grep sobre archivo comprimido

# bzip2 (misma lógica)
bzip2 archivo.txt               # → archivo.txt.bz2
bzip2 -d archivo.txt.bz2        # Descomprimir (o bunzip2)
bzcat archivo.txt.bz2           # Ver contenido

# xz (misma lógica)
xz archivo.txt                  # → archivo.txt.xz
xz -d archivo.txt.xz            # Descomprimir (o unxz)
xzcat archivo.txt.xz            # Ver contenido
xz -l archivo.tar.xz            # Información del archivo comprimido

# zstd
zstd archivo.txt                # → archivo.txt.zst
zstd -d archivo.txt.zst         # Descomprimir
zcat archivo.txt.zst            # Ver contenido (en algunas versiones)
```

### `zip` y `unzip` — Compatibilidad con Windows

```bash
# Crear ZIP
zip archivo.zip file1 file2 file3
zip -r carpeta.zip directorio/          # Recursivo (directorios)
zip -9 max_compresion.zip archivo.txt   # Máxima compresión
zip -e secreto.zip archivo.txt          # Con contraseña (interactivo)

# Ver contenido
unzip -l archivo.zip

# Extraer
unzip archivo.zip                        # En directorio actual
unzip archivo.zip -d /destino/          # En directorio específico
unzip archivo.zip archivo_especifico    # Solo un archivo
unzip -o archivo.zip                    # Sobreescribir sin preguntar

# Actualizar ZIP (añadir/reemplazar archivos)
zip archivo.zip nuevo_archivo.txt       # Añadir al zip existente

# Información del ZIP
zipinfo archivo.zip
```

### Recetas de archivado en producción

```bash
# 1. Backup diario de directorio con fecha
FECHA=$(date +%Y-%m-%d)
tar -czf "/backup/sitio_$FECHA.tar.gz" /var/www/html/ --exclude="*.log"

# 2. Backup incremental: solo archivos modificados hoy
find /datos -mtime -1 | tar -czf "/backup/incremental_$(date +%Y%m%d).tar.gz" -T -

# 3. Comprimir logs de más de 7 días
find /var/log -name "*.log" -mtime +7 -exec gzip {} \;

# 4. Descomprimir múltiples archivos en paralelo
ls *.tar.gz | xargs -P 4 -I {} tar -xzf {}

# 5. Verificar integridad de un tar antes de extraer
tar -tzf backup.tar.gz > /dev/null && echo "OK" || echo "CORRUPTO"

# 6. Crear tar y calcular hash en un solo paso
tar -czf - directorio/ | tee backup.tar.gz | sha256sum > backup.tar.gz.sha256
```

---

## 5.10 — Flujos de trabajo reales

Esta sección muestra cómo combinar todas las herramientas anteriores en pipelines que resuelven problemas reales de producción.

### Problema 1: Detectar un ataque de fuerza bruta SSH

```bash
# Síntoma: el servidor va lento, sospechamos intentos de login
# Objetivo: identificar IPs atacantes y cuántos intentos han hecho

# Paso 1: Ver líneas de autenticación fallida
grep "Failed password" /var/log/auth.log | head -5
# Jun  1 10:23:45 srv sshd[1234]: Failed password for root from 192.168.1.100 port 52341

# Paso 2: Extraer solo las IPs
grep "Failed password" /var/log/auth.log | \
    grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' | \
    sort | uniq -c | sort -rn | head -20
# 4521 192.168.1.100
#  234 10.0.0.55
#   12 172.16.0.8

# Paso 3: Ver desde cuándo ataca la IP más activa
grep "Failed password" /var/log/auth.log | grep "192.168.1.100" | \
    awk '{print $1, $2, $3}' | head -1

# Paso 4: Ver en qué usuarios se enfoca
grep "Failed password" /var/log/auth.log | grep "192.168.1.100" | \
    awk '{print $9}' | sort | uniq -c | sort -rn
# 3200 root
#  900 admin
#  421 ubuntu

# Paso 5: Bloquear la IP (requiere root — Módulo 14)
# sudo ufw deny from 192.168.1.100 to any
```

### Problema 2: Analizar logs de Nginx para optimización

```bash
# Objetivo: identificar páginas lentas, errores frecuentes y usuarios top

# Formato de log Nginx (combined):
# $remote_addr - $remote_user [$time_local] "$request" $status $body_bytes $http_referer "$http_user_agent"

LOG="/var/log/nginx/access.log"

# Top 10 URLs más solicitadas
awk '{print $7}' $LOG | sort | uniq -c | sort -rn | head -10

# Top 10 URLs con error 404
awk '$9 == 404 {print $7}' $LOG | sort | uniq -c | sort -rn | head -10

# Códigos HTTP y su frecuencia
awk '{print $9}' $LOG | sort | uniq -c | sort -rn
# 15432 200
#  2341 304
#   432 404
#    23 500
#     5 503

# Peticiones por hora (análisis de tráfico)
awk '{print $4}' $LOG | cut -d: -f2 | sort | uniq -c
# (00:00 = 0h, 01 = 1h, etc.)

# IPs que generan errores 5xx (problema en el servidor)
awk '$9 ~ /^5/ {print $1}' $LOG | sort | uniq -c | sort -rn | head -10

# Bytes totales transferidos hoy
awk '{sum += $10} END{printf "Total: %.2f GB\n", sum/1024/1024/1024}' $LOG

# User agents más comunes (bots vs. navegadores)
awk -F'"' '{print $6}' $LOG | sort | uniq -c | sort -rn | head -10
```

### Problema 3: Procesar y limpiar un CSV de datos

```bash
# Escenario: tienes un CSV exportado de una hoja de cálculo
# con problemas: espacios extra, campos vacíos, duplicados

cat datos_sucios.csv
# "Juan García " , "juan@example.com" , " 35" ,  Madrid
#  Juan García  ,juan@example.com,35,Madrid
# "María López",maria@test.com,28,  Barcelona

# Paso 1: Normalizar separadores (quitar espacios alrededor de ,)
sed 's/ *, */,/g' datos_sucios.csv

# Paso 2: Quitar comillas
sed 's/"//g' datos_sucios.csv

# Paso 3: Trim de cada campo
awk -F, '{
    for(i=1; i<=NF; i++) {
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", $i)
    }
    print $1","$2","$3","$4
}' datos_sucios.csv

# Pipeline completo: limpiar, deduplicar y ordenar
sed 's/"//g' datos_sucios.csv | \
    sed 's/ *, */,/g' | \
    awk -F, '{
        for(i=1; i<=NF; i++) gsub(/^[ \t]+|[ \t]+$/, "", $i)
        print
    }' | \
    sort -u > datos_limpios.csv
```

### Problema 4: Monitorear un log en tiempo real con filtrado

```bash
# Objetivo: ver solo los errores de una aplicación en tiempo real,
# ignorando debug/info, coloreando los niveles

tail -F /var/log/app/application.log | \
    grep -E "ERROR|WARN|CRITICAL" | \
    awk '
    /CRITICAL/ {print "\033[31m" $0 "\033[0m"; next}  # Rojo
    /ERROR/    {print "\033[33m" $0 "\033[0m"; next}  # Amarillo
    /WARN/     {print "\033[36m" $0 "\033[0m"; next}  # Cian
    {print}
    '

# Alternativa con grep --color
tail -F /var/log/app/application.log | \
    grep --color=always -E "CRITICAL|ERROR|WARN|$"
# El $ al final matchea toda línea (sin colorear), así no se pierden líneas
```

### Problema 5: Diferencia entre dos configuraciones de servidor

```bash
# Comparar configuración de producción vs. staging
PROD="produccion@servidor1.com"
STAG="staging@servidor2.com"

diff <(ssh $PROD cat /etc/nginx/nginx.conf) \
     <(ssh $STAG cat /etc/nginx/nginx.conf) | \
     grep -v "^---" | \
     awk '
     /^</ {print "\033[31m" $0 "\033[0m"}   # Rojo: solo en producción
     /^>/ {print "\033[32m" $0 "\033[0m"}   # Verde: solo en staging
     /^@/ {print "\033[34m" $0 "\033[0m"}   # Azul: cabecera de sección
     '
```

### Problema 6: Extraer información de archivos de sistema

```bash
# Generar un reporte del sistema con múltiples fuentes

echo "=== REPORTE DEL SISTEMA ==="
echo "Fecha: $(date)"
echo ""

echo "--- Usuarios con shell interactiva ---"
awk -F: '$7 ~ /bash|zsh|fish/ {printf "%-15s UID:%-5d Shell:%s\n", $1, $3, $7}' /etc/passwd

echo ""
echo "--- Uso de disco por partición ---"
df -hT | awk 'NR==1 || $6+0 > 50 {print}' | column -t
# Muestra cabecera y particiones con más del 50% de uso

echo ""
echo "--- Memoria ---"
free -h | awk 'NR<=2 {print}' | column -t

echo ""
echo "--- Top 5 procesos por CPU ---"
ps aux --sort=-%cpu | awk 'NR<=6 {printf "%-20s %5s %5s\n", $11, $3, $4}'

echo ""
echo "--- Últimos 5 errores del sistema ---"
journalctl -p err -n 5 --no-pager 2>/dev/null || \
    grep -i "error\|fail" /var/log/syslog | tail -5
```

---

## Anexos

### A. Resumen de herramientas: cuándo usar cada una

| Necesidad | Herramienta | Ejemplo |
|---|---|---|
| Ver archivo completo | `cat -n` o `bat` | `bat /etc/nginx/nginx.conf` |
| Navegar archivo largo | `less -N` | `less /var/log/syslog` |
| Ver inicio/fin | `head -20`, `tail -f` | `tail -F /var/log/nginx/access.log` |
| Ver binarios | `xxd`, `strings` | `xxd ejecutable.bin | head` |
| Contar líneas | `wc -l` | `wc -l archivo.txt` |
| Buscar patrón | `grep -E`, `rg` | `grep -rn "TODO" ./src/` |
| Transformar texto | `sed -E` | `sed -i.bak 's/old/new/g' conf` |
| Procesar columnas | `awk` | `awk -F: '{print $1}' /etc/passwd` |
| Ordenar | `sort -rn` | `du -sh * | sort -rh` |
| Frecuencias | `sort | uniq -c | sort -rn` | Ver ranking de IPs |
| Extraer columna | `cut -d, -f2` | `cut -d: -f1 /etc/passwd` |
| Comparar archivos | `diff -u` | `diff -u config.old config.new` |
| Verificar integridad | `sha256sum --check` | `sha256sum --check file.sha256` |
| Comprimir rápido | `gzip -9` o `zstd` | `tar -czf backup.tar.gz dir/` |
| Comprimir máximo | `xz -9` | `tar -cJf paquete.tar.xz src/` |

### B. Expresiones regulares más útiles para operaciones

```bash
# Dirección IP (v4)
[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}

# Dirección IP (v4) estricta
\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}\b

# Fecha YYYY-MM-DD
[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])

# Hora HH:MM:SS
(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]

# Email (simplificado, suficiente para logs)
[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}

# URL HTTP/HTTPS
https?://[a-zA-Z0-9][-a-zA-Z0-9.]*(?:/[^[:space:]]*)?

# Hash MD5 (32 hex)
[0-9a-f]{32}

# Hash SHA256 (64 hex)
[0-9a-f]{64}

# Línea vacía o solo espacios
^[[:space:]]*$

# Línea de comentario (#)
^[[:space:]]*#

# Número entero (positivo o negativo)
-?[0-9]+

# Número decimal
-?[0-9]+\.[0-9]+
```

### C. Referencias cruzadas entre módulos

```
◀ Módulo 01 — Introducción al mundo Linux
│  Sección 1.3: Filosofía UNIX — "Haz una cosa y hazla bien"
│  → grep, sed, awk son los mejores ejemplos de este principio
│  Sección 1.3: "Texto plano como interfaz universal"
│  → Todo este módulo es la materialización de ese principio

◀ Módulo 03 — La terminal y la shell
│  Sección 3.5: Redirecciones y pipes (introducidos aquí)
│  → En este módulo los llevamos a su máxima expresión
│  Sección 3.5: Here documents y here strings
│  → Usados extensamente con sed y awk

◀ Módulo 04 — Sistema de archivos
│  Sección 4.6: find -exec y xargs
│  → El patrón find | xargs grep es el más potente
│  de búsqueda masiva en el sistema
│  Los logs de /var/log/ son el material de práctica
│  más importante de este módulo

▶ Módulo 06 — Editores de texto
│  → vim y nano para editar archivos cuando sed -i
│  no es suficiente (ediciones interactivas complejas)

▶ Módulo 08 — Gestión de software
│  → tar + gzip/xz son el formato de los tarballs de código fuente
│  → dpkg -l | awk, sort -rn para auditar paquetes instalados

▶ Módulo 09 — Procesos, servicios y systemd
│  → journalctl piped con grep/awk para analizar servicios
│  → ps aux | grep | awk para gestionar procesos

▶ Módulo 10 — Shell Scripting Bash
│  → grep, sed, awk dentro de scripts son el 80% del scripting
│  → Las técnicas de este módulo son la base del scripting
```

---

## Referencias y Bibliografía

### Documentación oficial

1. **GNU grep manual**  
   https://www.gnu.org/software/grep/manual/grep.html  
   Referencia completa de todas las opciones de grep, incluyendo PCRE.

2. **GNU sed manual**  
   https://www.gnu.org/software/sed/manual/sed.html  
   La referencia definitiva del editor de flujos, con ejemplos avanzados.

3. **The GNU Awk User's Guide**  
   https://www.gnu.org/software/gawk/manual/gawk.html  
   Manual oficial de gawk, exhaustivo y con tutoriales.

4. **GNU Coreutils: Text utilities**  
   https://www.gnu.org/software/coreutils/manual/html_node/Text-utilities.html  
   sort, uniq, cut, paste, tr, wc y más.

5. **GNU tar manual**  
   https://www.gnu.org/software/tar/manual/tar.html  
   Todas las opciones de tar incluyendo incrementales y cifrado.

### Herramientas modernas

6. **ripgrep (rg) — documentación**  
   https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md  
   Guía completa de uso con benchmarks comparativos vs grep.

7. **bat — a cat(1) clone with wings**  
   https://github.com/sharkdp/bat  
   Documentación con ejemplos de integración con fzf y git.

8. **zstd — Zstandard compression**  
   https://facebook.github.io/zstd/  
   Especificaciones técnicas y casos de uso recomendados.

### Regular Expressions

9. **POSIX BRE y ERE specification**  
   https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap09.html  
   La especificación oficial de los dialectos de regex en POSIX.

10. **regex101.com** — Probador y explicador de regex interactivo  
    https://regex101.com  
    Soporta BRE, ERE, PCRE con explicación paso a paso.

11. **regexr.com** — Alternativa visual a regex101  
    https://regexr.com

### Libros de referencia

12. **sed & awk** — Dale Dougherty & Arnold Robbins  
    O'Reilly, 2ª edición (1997). El libro clásico que sigue siendo vigente.  
    https://www.oreilly.com/library/view/sed-awk/1565922255/

13. **The Linux Command Line** — William E. Shotts Jr.  
    https://linuxcommand.org/tlcl.php (versión online gratuita)  
    Capítulos 19-26: redirecciones, filtros, grep, sed, awk.

14. **Unix Power Tools** — Shelley Powers et al.  
    O'Reilly, 3ª edición (2002). Capítulos 33-37: las herramientas de texto clásicas.

15. **Regular Expressions Cookbook** — Jan Goyvaerts & Steven Levithan  
    O'Reilly, 2ª edición (2012). Recetas de regex para todos los dialectos.

16. **The AWK Programming Language** — Aho, Weinberger, Kernighan  
    Addison-Wesley (1988, reimpreso 2023 con actualización).  
    El libro de los creadores del lenguaje.

17. **UNIX and Linux System Administration Handbook** — Nemeth et al.  
    Addison-Wesley, 5ª edición. Capítulo 6: Scripting y herramientas de texto.

### Tutoriales y referencia rápida

18. **awk one-liners explained** — Peteris Krumins  
    https://catonmat.net/awk-one-liners-explained-part-one

19. **sed one-liners explained** — Peteris Krumins  
    https://catonmat.net/sed-one-liners-explained-part-one

20. **grep cheat sheet** — Ryan Chadwick  
    https://www.ryanstutorials.net/linuxtutorial/grep.php

---

## Preguntas de autoevaluación

1. Explica la diferencia entre stdout (fd 1) y stderr (fd 2). ¿Por qué es útil mantenerlos separados?
2. ¿Qué hace exactamente `2>&1`? ¿Por qué el orden importa respecto a las otras redirecciones?
3. ¿Cuál es la diferencia entre `>` y `>>`? Da un ejemplo donde usar el equivocado sería un problema grave.
4. ¿Qué diferencia hay entre BRE, ERE y PCRE? ¿Cuándo usarías `grep -E` vs `grep -P`?
5. ¿Para qué sirve el flag `-o` en grep? ¿En qué se diferencia su salida del comportamiento por defecto?
6. Escribe un comando `sed` que borre todas las líneas que empiezan con `#` (comentarios) y todas las líneas vacías de un archivo.
7. ¿Cuál es la diferencia entre `sed 's/a/b/'` y `sed 's/a/b/g'`?
8. En `awk`, ¿qué es `NR`, `NF`, `$0` y `$NF`? Da un ejemplo de uso de cada uno.
9. ¿Cuándo usarías `sed` en lugar de `awk` y viceversa?
10. ¿Qué hace el pipeline `sort | uniq -c | sort -rn`? ¿Por qué necesita el `sort` inicial?
11. ¿Cuál es la diferencia entre `diff` y `cmp`? ¿Para qué sirve `patch`?
12. Explica las diferencias entre `gzip`, `xz` y `zstd`. ¿Cuándo elegirías cada uno?

---

## Laboratorios prácticos

### Lab 5.1 — Exploración de archivos del sistema

```bash
# 1. Ver los 10 usuarios con UID más alto (campo 3 de /etc/passwd)
sort -t: -k3 -n /etc/passwd | tail -10 | cut -d: -f1,3

# 2. Contar cuántas shells distintas hay en /etc/passwd
cut -d: -f7 /etc/passwd | sort -u

# 3. ¿Cuántos archivos de configuración hay en /etc?
find /etc -maxdepth 2 -name "*.conf" | wc -l

# 4. Ver las últimas 50 líneas del log del sistema y filtrar errores
tail -50 /var/log/syslog | grep -iE "error|fail|warn"
```

### Lab 5.2 — Construcción de pipelines

```bash
# 1. Generar un ranking de las 10 extensiones de archivo más frecuentes
#    en /usr/share
find /usr/share -type f | grep -oE '\.[^./]+$' | sort | uniq -c | sort -rn | head -10

# 2. Ver los 5 directorios más grandes en /var con su tamaño
du -sh /var/* 2>/dev/null | sort -rh | head -5

# 3. Contar las líneas de código Python en el sistema
find /usr/lib/python3 -name "*.py" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1
```

### Lab 5.3 — grep y regex

```bash
# Crear un archivo de práctica
cat > /tmp/practica_grep.txt << 'EOF'
# Esto es un comentario
192.168.1.1 - usuario1 - GET /index.html - 200
10.0.0.55 - usuario2 - POST /login - 302
192.168.1.1 - usuario1 - GET /admin - 403
172.16.0.1 - - GET /robots.txt - 200
10.0.0.55 - usuario2 - GET /dashboard - 200
192.168.100.200 - admin - GET /config - 500
EOF

# 1. Mostrar solo líneas con código 200
grep -E "- 200$" /tmp/practica_grep.txt

# 2. Mostrar solo las IPs (sin duplicados)
grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' /tmp/practica_grep.txt | sort -u

# 3. Mostrar líneas con errores (4xx o 5xx) con su número de línea
grep -nE "- [45][0-9][0-9]$" /tmp/practica_grep.txt

# 4. Ver todas las rutas solicitadas
grep -oE "GET|POST|PUT|DELETE [^ ]+" /tmp/practica_grep.txt
```

### Lab 5.4 — sed en práctica

```bash
# Crear archivo de configuración de prueba
cat > /tmp/config_prueba.conf << 'EOF'
# Configuración de la aplicación
servidor = localhost
puerto = 8080
base_datos = mi_base_datos
usuario_db = root
password_db = password123
debug = true
log_nivel = DEBUG
EOF

# 1. Cambiar localhost por 192.168.1.10 (con backup)
sed -i.bak 's/localhost/192.168.1.10/' /tmp/config_prueba.conf
diff /tmp/config_prueba.conf.bak /tmp/config_prueba.conf

# 2. Eliminar líneas de comentario (empiezan con #)
sed '/^#/d' /tmp/config_prueba.conf

# 3. Enmascarar la contraseña
sed 's/\(password_db = \).*/\1[REDACTED]/' /tmp/config_prueba.conf

# 4. Cambiar debug = true a debug = false
sed 's/debug = true/debug = false/' /tmp/config_prueba.conf
```

### Lab 5.5 — awk para análisis

```bash
# Usar /etc/passwd como dataset
# 1. Listar usuarios con UID entre 1000 y 65533 (usuarios normales)
awk -F: '$3 >= 1000 && $3 < 65534 {print $1, $3}' /etc/passwd

# 2. Contar usuarios por tipo de shell
awk -F: '{shells[$7]++} END{for (s in shells) print shells[s], s}' /etc/passwd | sort -rn

# 3. Mostrar tabla formateada de usuarios normales
awk -F: 'BEGIN{printf "%-15s %-6s %-s\n", "Usuario", "UID", "Home"}
         $3 >= 1000 && $3 < 65534 {printf "%-15s %-6d %-s\n", $1, $3, $6}' /etc/passwd

# 4. Calcular el UID promedio de usuarios del sistema
awk -F: '$3 < 1000 {sum += $3; count++} END{print "UID promedio sistema:", sum/count}' /etc/passwd
```

### Lab 5.6 — Archivado y compresión

```bash
# 1. Crear estructura de directorios para comprimir
mkdir -p /tmp/proyecto_lab/{src,docs,tests}
for i in $(seq 1 5); do echo "Contenido $i" > /tmp/proyecto_lab/src/archivo_$i.py; done
echo "README del proyecto" > /tmp/proyecto_lab/docs/README.md

# 2. Crear backup con distintos formatos y comparar tamaños
cd /tmp
tar -czf proyecto_lab.tar.gz proyecto_lab/
tar -cJf proyecto_lab.tar.xz proyecto_lab/
ls -lh proyecto_lab.tar.gz proyecto_lab.tar.xz

# 3. Ver contenido sin extraer
tar -tzf proyecto_lab.tar.gz

# 4. Extraer en un directorio diferente
mkdir /tmp/restaurado
tar -xzf proyecto_lab.tar.gz -C /tmp/restaurado/
ls /tmp/restaurado/proyecto_lab/

# 5. Verificar integridad
sha256sum proyecto_lab.tar.gz > proyecto_lab.tar.gz.sha256
sha256sum --check proyecto_lab.tar.gz.sha256
```

---

## Resumen del módulo

✅ **Visualización:** `cat`, `less`, `head`, `tail -F`, `bat`, `xxd` para cualquier tipo de archivo  
✅ **Redirecciones:** stdout, stderr, `>`, `>>`, `2>&1`, `&>`, `/dev/null`, here docs  
✅ **Tuberías:** `|`, `tee`, sustitución de procesos `<()`, `xargs` con `-0` y `-P`  
✅ **Filtros clásicos:** `sort -rn`, `uniq -c`, `cut -d`, `tr`, `column -t`  
✅ **Expresiones regulares:** BRE, ERE, PCRE y sus diferencias prácticas  
✅ **grep:** `-E`, `-i`, `-v`, `-r`, `-A/-B/-C`, `-o`, y `ripgrep` como alternativa  
✅ **sed:** sustitución con grupos de captura, borrado, edición in-place con backup  
✅ **awk:** campos `$N`, `NR`/`NF`, `BEGIN`/`END`, arrays asociativos, `printf`  
✅ **Comparación:** `diff -u`, `patch`, `comm`, `sha256sum --check`  
✅ **Compresión:** `tar` + `gzip`/`xz`/`zstd`, comparativa de algoritmos  
✅ **Flujos de trabajo:** pipelines reales para logs, CSVs, auditorías, backups  

**Próximo paso:** [Módulo 06 — Editores de texto](/editores-de-texto). Aprenderás `vim` y `nano` para las situaciones donde necesitas edición interactiva y no una transformación automatizable.

---

**Última actualización:** 2024-06  
**Versión:** 1.0  
**Estado:** ✅ Listo para enseñanza
