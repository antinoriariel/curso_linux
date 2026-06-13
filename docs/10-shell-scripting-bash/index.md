---
title: "Módulo 10 — Shell scripting con Bash"
sidebar_label: "10 · Shell scripting (Bash)"
description: Scripts Bash de producción — variables, quoting, condicionales, bucles, funciones, arrays, manejo de errores con set -euo pipefail, trap, getopts, ShellCheck y proyecto real de backup.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Módulo 10 — Shell scripting con Bash

## Introducción

Hay una diferencia fundamental entre *usar* Linux y *dominarlo*: la automatización. Un administrador que teclea el mismo comando veinte veces al mes está desperdiciando tiempo y arriesgando errores humanos. Uno que tiene un script que lo hace por él cada noche —verificando errores, enviando alertas, rotando archivos— está usando Linux como fue diseñado.

Este módulo construye sobre todo lo aprendido hasta aquí. Los pipes y redirecciones del [Módulo 05](/archivos-y-procesamiento-de-texto), la comprensión del sistema de archivos del [Módulo 04](/sistema-de-archivos), los permisos del [Módulo 07](/usuarios-grupos-y-permisos), los servicios del [Módulo 09](/procesos-servicios-y-systemd): todo eso se convierte en los ingredientes de scripts Bash que resuelven problemas reales.

La meta no es solo que los scripts funcionen, sino que sean **robustos, mantenibles y seguros**: que manejen errores en vez de ignorarlos, que limpien tras sí mismos, que avisen cuando algo va mal, y que otro administrador pueda leerlos seis meses después.

### Objetivos de aprendizaje

Al finalizar este módulo, serás capaz de:

- ✅ Escribir scripts Bash con la estructura correcta (shebang, permisos, shellcheck)
- ✅ Manejar variables y quoting sin crear bugs de espacios/palabras
- ✅ Procesar argumentos posicionales y opciones con `getopts`
- ✅ Dominar condicionales (`[[ ]]`) y comparaciones de archivos, cadenas y números
- ✅ Usar bucles `for`, `while` y leer archivos línea a línea correctamente
- ✅ Escribir funciones con variables locales y valores de retorno
- ✅ Manejar arrays indexados y asociativos
- ✅ Aplicar `set -euo pipefail` y `trap` para scripts robustos
- ✅ Depurar scripts con `bash -x` y ShellCheck
- ✅ Escribir un script completo de producción con logging y manejo de errores

---

## 10.1 — Tu primer script

### El shebang y la estructura básica

```bash
#!/usr/bin/env bash
# Lo anterior es el "shebang": le dice al kernel qué intérprete usar.
#
# ¿Por qué '#!/usr/bin/env bash' y no '#!/bin/bash'?
# env busca bash en el PATH → funciona aunque bash esté en una ruta no estándar
# (en macOS está en /usr/local/bin/bash; en NixOS en otra ruta)
# En producción de Linux puro, /bin/bash también está bien.

# Descripción y uso al principio:
# Nombre: sistema-backup.sh
# Descripción: Hace backup de /home al directorio especificado
# Uso: ./sistema-backup.sh [-v] [-d DESTINO] ORIGEN
# Autor: Juan García

# Código aquí...
echo "Hola, mundo"
```

```bash
# Crear el script y darle permisos de ejecución (Módulo 07)
touch mi-script.sh
chmod +x mi-script.sh
# o al crear:
install -m 755 /dev/null mi-script.sh  # Crea vacío con 755

# Ejecutar el script:
./mi-script.sh          # Con ./: usa el shebang, crea un SUBPROCESO
bash mi-script.sh       # Fuerza bash incluso sin shebang
source mi-script.sh     # "Sourcear": se ejecuta en el proceso ACTUAL
. mi-script.sh          # Equivalente a source

# La diferencia CRUCIAL entre ./ y source:
# ./: nueva shell → los cambios en variables/cd/etc. NO afectan a tu shell
# source: misma shell → los cambios SÍ afectan (útil para cargar funciones)
```

### `echo` vs `printf`

```bash
# echo: simple pero con comportamiento inconsistente entre implementaciones
echo "Hola, mundo"
echo -n "Sin salto de línea"    # -n: no añadir \n al final
echo -e "Con\ttabulación"       # -e: interpretar escapes (no siempre disponible)

# printf: portable, consistente, más potente
printf "Hola, mundo\n"
printf "%-15s %5d\n" "Nombre" 42      # Como printf en C: justificación, ancho
printf "%-15s %5d\n" "Juan" 1000
printf "%-15s %5d\n" "María" 500
# Nombre            42
# Juan            1000
# María            500

# Para OUTPUT ESTRUCTURADO en scripts: siempre printf
# Para OUTPUT SIMPLE en el terminal: echo está bien
```

---

## 10.2 — Variables y quoting

### Asignación y expansión

```bash
# Asignación: SIN ESPACIOS alrededor del =
nombre="Juan García"       # ✓
nombre = "Juan"            # ✗ Error: bash interpreta 'nombre' como un comando

# Expansión con llaves (siempre recomendado para claridad)
echo $nombre               # Funciona pero puede ser ambiguo
echo "${nombre}"           # Explícito: siempre correcto
echo "Hola ${nombre}, bienvenido"

# Comandos como valores (command substitution)
fecha=$(date +%Y-%m-%d)    # Preferido: $()
archivos=$(ls /etc/*.conf)
usuario=$(whoami)
lineas=$(wc -l < archivo.txt)

# Aritmética
contador=0
contador=$((contador + 1))
resultado=$((5 * 3 + 2))
echo $((2 ** 10))   # 1024

# Variables de entorno importantes para scripts
echo $HOME          # Directorio home del usuario
echo $USER          # Nombre del usuario
echo $PWD           # Directorio actual
echo $0             # Nombre del script
echo $BASH_VERSION  # Versión de Bash
```

### Quoting: la causa número uno de bugs en shell

Este es el concepto más importante de este módulo y el más mal entendido.

```bash
# REGLA DE ORO: siempre pon las variables entre comillas dobles
# a menos que tengas una razón explícita para no hacerlo.

nombre="Juan García"
archivo="mi archivo.txt"     # Con espacio

# SIN comillas: el espacio divide en palabras (word splitting)
ls $archivo       # Bash ve: ls mi archivo.txt → busca dos archivos
rm $archivo       # Borra 'mi' y 'archivo.txt' si existen, ERROR

# CON comillas: la variable se trata como una sola cadena
ls "$archivo"     # Bash ve: ls "mi archivo.txt" → correcto
rm "$archivo"     # Borra el archivo correcto

# La regla se aplica también a los arrays:
archivos=(*.txt)
for f in ${archivos[@]}; do   # ✗ Word splitting rompe nombres con espacios
for f in "${archivos[@]}"; do # ✓ Correcto

# Comillas simples: preservan TODO literalmente (sin expansión)
echo '$nombre'          # Imprime: $nombre (literalmente, sin expandir)
echo '$(ls)'            # Imprime: $(ls) (no ejecuta ls)
echo 'Hola ${nombre}'  # Imprime: Hola ${nombre}

# Cuándo usar comillas simples: contraseñas en scripts, regex, sed/awk
sed 's/foo/bar/' archivo.txt    # la expresión debe ser literal
```

### Variables especiales del script

```bash
#!/usr/bin/env bash
# Cuando corres: ./mi-script.sh -v archivo.txt 42

echo $0        # Nombre del script: ./mi-script.sh
echo $1        # Primer argumento: -v
echo $2        # Segundo: archivo.txt
echo $3        # Tercero: 42
echo $#        # Número de argumentos: 3
echo "$@"      # Todos los argumentos como palabras separadas: -v archivo.txt 42
echo "$*"      # Todos los argumentos como una sola cadena: "-v archivo.txt 42"

# La diferencia entre $@ y $*:
# "$@" → cada argumento es una palabra separada (correcto para bucles)
# "$*" → todos juntos en una cadena (raramente lo que quieres)

echo $?        # Código de salida del ÚLTIMO comando (0=éxito, otro=fallo)
echo $$        # PID de la shell actual (útil para archivos temporales únicos)
echo $!        # PID del último proceso en background

# shift: desplazar los argumentos posicionales
echo "Argumento 1: $1"
shift          # $2 pasa a ser $1, $3 a $2, etc.
echo "Ahora argumento 1: $1"    # Era $2
```

### Expansiones de parámetro

Las expansiones de parámetro son una característica muy poderosa para manipular variables sin lanzar subprocesos externos:

```bash
nombre="Juan García"
ruta="/home/juan/documentos/informe.pdf"

# VALORES POR DEFECTO
echo "${VAR:-valor_default}"      # Si VAR está vacía o no definida → usa valor_default
echo "${VAR:=valor_default}"      # Igual + asigna el default a VAR
echo "${VAR:+alternativo}"        # Si VAR tiene valor → usa 'alternativo'
echo "${VAR:?mensaje de error}"   # Si VAR está vacía → imprime error y sale

# En la práctica:
puerto="${1:-8080}"               # Usar argumento 1 o 8080 por defecto
: "${DESTINO:?La variable DESTINO es obligatoria}"  # Fallar si no está definida

# LONGITUD
echo "${#nombre}"         # Longitud de la cadena: 12

# RECORTE DE PATRONES (extrae partes de rutas/nombres de archivo)
echo "${ruta##*/}"        # Solo el nombre del archivo: informe.pdf (## = greedy desde la izq)
echo "${ruta%/*}"         # Solo el directorio: /home/juan/documentos (% = desde la dcha)
echo "${ruta##*.}"        # Extensión: pdf
echo "${ruta%.*}"         # Sin extensión: /home/juan/documentos/informe

# Equivalentes a dirname/basename pero sin subproceso:
archivo="${ruta##*/}"     # como: basename "$ruta"
directorio="${ruta%/*}"   # como: dirname "$ruta"

# REEMPLAZO
echo "${nombre/García/Martínez}"    # Primera ocurrencia
echo "${nombre//a/A}"               # Todas las ocurrencias
echo "${nombre/#Juan/Pepe}"         # Solo si está al principio
echo "${nombre/%García/López}"      # Solo si está al final

# CASE: mayúsculas/minúsculas (Bash 4.0+)
echo "${nombre,,}"        # Todo a minúsculas: juan garcía
echo "${nombre^^}"        # Todo a mayúsculas: JUAN GARCÍA
echo "${nombre^}"         # Primera letra mayúscula: Juan garcía
```

---

## 10.3 — Condicionales

### Códigos de salida: el fundamento

En Unix, **cada comando devuelve un código de salida** (exit code, también llamado exit status): 0 significa éxito, cualquier otro valor es un error. Toda la lógica condicional de Bash se basa en esto.

```bash
ls /etc/passwd        # Código 0 (éxito)
ls /no/existe         # Código 2 (error)
echo $?               # Ver el código del último comando

grep "root" /etc/passwd
echo "grep encontró algo: $?"   # 0 si encontró, 1 si no

# Operadores de cortocircuito
mkdir /tmp/test && cd /tmp/test       # cd solo si mkdir tuvo éxito
cd /tmp/test || mkdir /tmp/test       # mkdir solo si cd falló
comando_arriesgado || exit 1          # Salir si el comando falla

# Definir el exit code de un script
exit 0    # Éxito
exit 1    # Error genérico
exit 2    # Uso incorrecto (argumentos incorrectos)
# Por convención: 0=OK, 1-125=errores del script, 126=no ejecutable, 127=no encontrado
```

### `if`, `elif`, `else` y el test correcto

```bash
# Estructura básica
if [[ condición ]]; then
    # comandos si verdad
elif [[ otra_condición ]]; then
    # comandos si la segunda condición es verdad
else
    # comandos si ninguna es verdad
fi

# USAR [[ ]] EN VEZ DE [ ] O test
# [[ ]] es una palabra reservada de Bash (más potente y segura)
# [ ] es el comando externo 'test' (POSIX, más portable pero con trampas)
```

<Tabs>
<TabItem value="archivos" label="Tests de archivos">

```bash
# Los más importantes (man test para la lista completa)
if [[ -f "$archivo" ]]; then echo "es un archivo regular"; fi
if [[ -d "$directorio" ]]; then echo "es un directorio"; fi
if [[ -e "$ruta" ]]; then echo "existe (cualquier tipo)"; fi
if [[ -L "$enlace" ]]; then echo "es un enlace simbólico"; fi
if [[ -r "$archivo" ]]; then echo "tengo permiso de lectura"; fi
if [[ -w "$archivo" ]]; then echo "tengo permiso de escritura"; fi
if [[ -x "$script" ]]; then echo "tengo permiso de ejecución"; fi
if [[ -s "$archivo" ]]; then echo "existe y no está vacío"; fi
if [[ -z "$archivo" ]]; then echo "el archivo tiene tamaño cero"; fi

# Comparar fechas de modificación
if [[ "$a" -nt "$b" ]]; then echo "a es más nuevo que b"; fi
if [[ "$a" -ot "$b" ]]; then echo "a es más antiguo que b"; fi
```

</TabItem>
<TabItem value="cadenas" label="Comparación de cadenas">

```bash
if [[ "$cadena" == "valor" ]]; then echo "iguales"; fi
if [[ "$cadena" != "valor" ]]; then echo "distintos"; fi
if [[ -z "$cadena" ]]; then echo "cadena vacía o no definida"; fi
if [[ -n "$cadena" ]]; then echo "cadena con contenido"; fi

# [[ ]] admite glob y regex (ventaja sobre [ ])
if [[ "$archivo" == *.log ]]; then echo "es un log"; fi
if [[ "$usuario" =~ ^[a-z][a-z0-9_]{2,}$ ]]; then echo "usuario válido"; fi
# =~ es comparación de regex (SOLO en [[ ]] )

# Cuidado con los espacios: con [[ ]] las comillas no son obligatorias
# pero úsalas siempre para ser explícito
if [[ $# -eq 0 ]]; then    # $# no necesita comillas (es un número)
    echo "Sin argumentos"
fi
```

</TabItem>
<TabItem value="numeros" label="Comparaciones numéricas">

```bash
# Operadores aritméticos en [[ ]] (o en (( )))
if [[ $num -eq 5 ]]; then echo "igual a 5"; fi      # eq = equal
if [[ $num -ne 5 ]]; then echo "distinto de 5"; fi  # ne = not equal
if [[ $num -lt 10 ]]; then echo "menor que 10"; fi  # lt = less than
if [[ $num -le 10 ]]; then echo "menor o igual"; fi # le = less equal
if [[ $num -gt 0 ]]; then echo "mayor que 0"; fi    # gt = greater than
if [[ $num -ge 0 ]]; then echo "mayor o igual"; fi  # ge = greater equal

# Alternativa: la sintaxis aritmética (( )) con operadores C
if (( num == 5 )); then echo "igual a 5"; fi
if (( num > 0 && num < 100 )); then echo "entre 0 y 100"; fi

# Para operaciones aritméticas complejas: (( )) es más legible
if (( espacio_libre > (espacio_requerido * 2) )); then
    echo "Hay suficiente espacio"
fi
```

</TabItem>
</Tabs>

### `case`: ramificación limpia

```bash
case "$opcion" in
    start|iniciar)
        echo "Iniciando..."
        ;;
    stop|parar)
        echo "Parando..."
        ;;
    restart|reiniciar)
        echo "Reiniciando..."
        ;;
    [0-9]*)
        echo "Es un número: $opcion"
        ;;
    *.log)
        echo "Es un archivo de log: $opcion"
        ;;
    *)
        echo "Opción desconocida: $opcion"
        exit 1
        ;;
esac

# case es ideal para: opciones de menú, extensiones de archivo, argumentos
extension="${archivo##*.}"
case "$extension" in
    gz|bz2|xz|zst)  echo "Archivo comprimido" ;;
    sh|bash)         echo "Script shell" ;;
    py)              echo "Script Python" ;;
    *)               echo "Tipo desconocido" ;;
esac
```

---

## 10.4 — Bucles

### `for` — Iterar sobre listas

```bash
# Iterar sobre una lista literal
for fruta in manzana pera naranja; do
    echo "Fruta: $fruta"
done

# Iterar sobre archivos (glob)
for archivo in /etc/*.conf; do
    echo "Config: $archivo"
done

# SIEMPRE comillas en glob para manejar espacios en nombres:
for archivo in /home/juan/documentos/*.pdf; do
    [[ -f "$archivo" ]] || continue    # Saltar si no hay .pdf
    echo "Procesando: $archivo"
done

# Iterar sobre la salida de un comando
for usuario in $(awk -F: '$3 >= 1000 && $3 < 65534 {print $1}' /etc/passwd); do
    echo "Usuario real: $usuario"
done

# Rango numérico: {inicio..fin} o {inicio..fin..paso}
for i in {1..10}; do echo $i; done
for i in {0..100..5}; do echo $i; done    # 0 5 10 15 ... 100

# Bucle estilo C (con (( )))
for (( i=0; i<10; i++ )); do
    echo "i = $i"
done
```

### `while` y `until`

```bash
# while: ejecutar MIENTRAS la condición sea verdadera
contador=0
while [[ $contador -lt 5 ]]; do
    echo "Contador: $contador"
    (( contador++ ))
done

# until: ejecutar HASTA QUE la condición sea verdadera (opuesto a while)
intentos=0
until ping -c1 -W2 8.8.8.8 &>/dev/null; do
    (( intentos++ ))
    echo "Intento $intentos: sin red, reintentando..."
    sleep 5
    [[ $intentos -ge 10 ]] && { echo "Sin red tras 10 intentos"; exit 1; }
done
echo "Red disponible"

# Bucle infinito (para daemons, menús)
while true; do
    echo "Opciones: [q]uit [s]tatus [r]estart"
    read -r opcion
    case "$opcion" in
        q) break ;;
        s) systemctl status mi-servicio ;;
        r) sudo systemctl restart mi-servicio ;;
    esac
done
```

### Leer archivos línea a línea: el patrón correcto

```bash
# ✗ MAL: for para leer archivos
for linea in $(cat archivo.txt); do    # Word splitting: rompe por espacios, no líneas
    echo "$linea"
done

# ✓ BIEN: while read -r
while IFS= read -r linea; do
    echo "$linea"
done < archivo.txt

# Explicación:
# IFS=    → no strip de espacios al inicio/final de la línea
# -r      → no interpretar \ como escape (raw)
# < archivo.txt → redirección de entrada al while completo

# Con pipe (en un subshell, variables NO son visibles fuera del while):
cat archivo.txt | while IFS= read -r linea; do
    echo "$linea"
done
# ↑ TRAMPA: las variables modificadas dentro del while no salen del subshell
# Solución con Bash: process substitution o redirección directa

# Leer campos separados (parsear /etc/passwd por ejemplo)
while IFS=: read -r usuario pass uid gid gecos home shell; do
    [[ $uid -ge 1000 && $uid -lt 65534 ]] || continue
    printf "Usuario: %-15s Home: %s\n" "$usuario" "$home"
done < /etc/passwd

# Leer con timeout
while IFS= read -r -t 5 linea; do   # -t 5: timeout de 5 segundos
    echo "Recibido: $linea"
done

# break y continue
for i in {1..10}; do
    (( i % 2 == 0 )) && continue    # Saltar los pares
    (( i > 7 )) && break             # Parar si i > 7
    echo $i                          # Imprime: 1 3 5 7
done
```

---

## 10.5 — Funciones

### Definición y uso

```bash
# Sintaxis (las dos formas son equivalentes):
mi_funcion() {
    echo "Soy una función"
}

function mi_funcion {
    echo "Soy una función"
}

# Llamar a una función (sin paréntesis, como un comando)
mi_funcion

# Las funciones usan $1, $2... para sus propios argumentos:
saludar() {
    echo "Hola, $1!"
    echo "Tienes $# argumentos"
}
saludar "Juan"
saludar "Juan" "María" "Pedro"
```

### Variables locales: evitar contaminación

```bash
# SIN local: la variable es GLOBAL y contamina el entorno del script
sumar() {
    resultado=$(( $1 + $2 ))    # ¡resultado es global!
}

# CON local: la variable vive y muere dentro de la función
sumar() {
    local resultado=$(( $1 + $2 ))
    echo $resultado              # Devolver por stdout
}

total=$(sumar 5 3)              # Capturar el resultado
echo "Total: $total"            # Total: 8

# REGLA: todas las variables de una función deben ser 'local'
# excepto las que deliberadamente quieras exportar
```

### Valores de retorno

Bash tiene dos formas de "devolver" valores desde funciones:

```bash
# OPCIÓN 1: exit code (para éxito/fracaso)
archivo_existe() {
    [[ -f "$1" ]]    # El exit code del [[ ]] es el de la función
}
if archivo_existe "/etc/passwd"; then echo "existe"; fi

# OPCIÓN 2: stdout (para devolver datos)
obtener_fecha() {
    date +%Y-%m-%d
}
fecha=$(obtener_fecha)

# OPCIÓN 3: variable por referencia (Bash 4.3+)
obtener_info() {
    local -n resultado=$1    # -n = nameref (referencia a la variable del llamador)
    resultado="valor calculado"
}
obtener_info mi_var
echo "$mi_var"    # "valor calculado"
```

### Biblioteca de funciones reutilizable

```bash
# lib/log.sh — funciones de logging reutilizables
#!/usr/bin/env bash

# Colores (usando ANSI escape codes)
readonly RED='\033[0;31m'
readonly YELLOW='\033[1;33m'
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'    # No Color

log_info()    { printf "${BLUE}[INFO]${NC}  %s\n" "$*" >&2; }
log_ok()      { printf "${GREEN}[OK]${NC}    %s\n" "$*" >&2; }
log_warn()    { printf "${YELLOW}[WARN]${NC}  %s\n" "$*" >&2; }
log_error()   { printf "${RED}[ERROR]${NC} %s\n" "$*" >&2; }
log_fatal()   { printf "${RED}[FATAL]${NC} %s\n" "$*" >&2; exit 1; }

# Uso:
# source /usr/local/lib/log.sh
# log_info "Iniciando backup..."
# log_error "No se pudo conectar a $SERVIDOR"
# log_fatal "Archivo de configuración no encontrado: $CONFIG"
```

---

## 10.6 — Arrays

### Arrays indexados

```bash
# Declarar y poblar
frutas=("manzana" "pera" "naranja")
frutas+=("uva" "kiwi")              # Añadir elementos

# Acceder a elementos (los índices empiezan en 0)
echo "${frutas[0]}"                  # manzana
echo "${frutas[2]}"                  # naranja
echo "${frutas[-1]}"                 # kiwi (el último, Bash 4.1+)

# EL QUOTING CORRECTO para arrays:
echo "${frutas[@]}"                  # Todos los elementos (palabras separadas) ✓
echo "${frutas[*]}"                  # Todos juntos (cadena única) — raramente útil
echo "${#frutas[@]}"                 # Número de elementos: 5
echo "${!frutas[@]}"                 # Índices: 0 1 2 3 4

# Iterar correctamente
for fruta in "${frutas[@]}"; do
    echo "Fruta: $fruta"
done

# Slice (porción del array)
echo "${frutas[@]:1:3}"              # Elementos 1, 2, 3 (índice:longitud)

# Cargar la salida de un comando en un array
mapfile -t lineas < /etc/passwd      # cada línea = un elemento
readarray -t archivos < <(find /etc -name "*.conf")   # con process substitution

# Comprobación de vacío
if [[ ${#array[@]} -eq 0 ]]; then
    echo "Array vacío"
fi
```

### Arrays asociativos (diccionarios/hash maps)

```bash
# Declarar (obligatorio para asociativos)
declare -A colores
colores["rojo"]="#FF0000"
colores["verde"]="#00FF00"
colores["azul"]="#0000FF"

# Acceso y listado
echo "${colores[rojo]}"              # #FF0000
echo "${!colores[@]}"               # Claves: rojo verde azul
echo "${colores[@]}"                # Valores: #FF0000 #00FF00 #0000FF

# Iterar sobre clave-valor
for clave in "${!colores[@]}"; do
    printf "%-10s → %s\n" "$clave" "${colores[$clave]}"
done

# Comprobar si una clave existe
if [[ -v colores[rojo] ]]; then
    echo "La clave 'rojo' existe"
fi

# Caso de uso real: contar ocurrencias
declare -A contador
while IFS= read -r linea; do
    extension="${linea##*.}"
    (( contador[$extension]++ ))
done < <(find /etc -type f)

for ext in "${!contador[@]}"; do
    printf "%5d  .%s\n" "${contador[$ext]}" "$ext"
done | sort -rn
```

---

## 10.7 — Entrada, argumentos y opciones

### `read` — Entrada interactiva

```bash
# Leer una línea de texto
read -r nombre
echo "Hola, $nombre"

# Con prompt
read -r -p "Introduce tu nombre: " nombre
read -r -p "Contraseña: " -s password    # -s: ocultar la entrada (passwords)
echo ""                                   # Salto de línea tras el -s

# Con timeout
if read -r -t 10 -p "¿Continuar? [s/N]: " respuesta; then
    [[ "$respuesta" =~ ^[sS]$ ]] || exit 0
else
    echo "Timeout — continuando"
fi

# Leer en array (palabras separadas por IFS)
read -r -a palabras <<< "hola mundo foo bar"
echo "${palabras[1]}"    # mundo

# Leer un carácter (menú interactivo)
read -r -n 1 -p "Elige [a/b/c]: " opcion
echo ""
```

### `getopts` — Opciones al estilo Unix

```bash
#!/usr/bin/env bash
# Ejemplo: ./script.sh -v -o archivo.out entrada.txt

uso() {
    cat <<EOF
Uso: $0 [OPCIONES] ARCHIVO

Opciones:
  -v          Modo verbose
  -o ARCHIVO  Archivo de salida (default: output.txt)
  -n NÚMERO   Número de líneas (default: 10)
  -h          Mostrar esta ayuda
EOF
}

# Valores por defecto
verbose=false
output="output.txt"
lineas=10

# getopts: la 'v' sin ':' es flag (sin argumento)
#          'o:' con ':' espera un argumento (lo pone en $OPTARG)
#          ':' al inicio → silencia errores y los maneja manualmente
while getopts ":vo:n:h" opcion; do
    case "$opcion" in
        v)  verbose=true ;;
        o)  output="$OPTARG" ;;
        n)  lineas="$OPTARG"
            [[ "$lineas" =~ ^[0-9]+$ ]] || { echo "ERROR: -n debe ser un número"; exit 2; }
            ;;
        h)  uso; exit 0 ;;
        :)  echo "ERROR: la opción -$OPTARG requiere un argumento"; exit 2 ;;
        \?) echo "ERROR: opción desconocida -$OPTARG"; uso; exit 2 ;;
    esac
done

# Desplazar los argumentos procesados
shift $((OPTIND - 1))

# Ahora $1, $2... son los argumentos posicionales (no las opciones)
[[ $# -gt 0 ]] || { echo "ERROR: falta el ARCHIVO"; uso; exit 2; }
archivo_entrada="$1"

$verbose && echo "Modo verbose activado"
echo "Entrada: $archivo_entrada, Salida: $output, Líneas: $lineas"
```

---

## 10.8 — Manejo de errores y robustez

### El trío sagrado: `set -euo pipefail`

Poner estas tres opciones al principio de cualquier script de producción:

```bash
#!/usr/bin/env bash
set -euo pipefail
# O equivalente:
set -e  # Exit on error: salir si cualquier comando falla (exit code ≠ 0)
set -u  # Undefined: error si se usa una variable no definida
set -o pipefail  # Los pipes fallan si CUALQUIER comando del pipe falla

# SIN set -e:
rm /archivo/que/no/existe     # Falla silenciosamente con exit 2
echo "Esto se ejecuta igual"  # ← BUG: el script continúa como si nada

# CON set -e:
rm /archivo/que/no/existe     # Falla → el script para AQUÍ
echo "Esto nunca se ejecuta"  # ← Protegido

# SIN set -u:
echo "Hola $NAOMRE"           # Typo: variable no definida → imprime "Hola "

# CON set -u:
echo "Hola $NAOMRE"           # Error: bash: NAOMRE: unbound variable

# SIN pipefail:
cat /no/existe | wc -l        # cat falla, pero la pipe "tiene éxito" porque wc sí
                               # El exit code del pipe es el de wc (0) → BUG silencioso

# CON pipefail:
cat /no/existe | wc -l        # El pipe falla porque cat falló → comportamiento correcto

# TRAMPAS de set -e (cosas que lo desactivan temporalmente):
# 1. En condiciones de if: if comando_que_falla; then... no termina el script
# 2. Con ||: comando_falla || true (suprimir el fallo intencionalmente)
# 3. Con &&: comando_que_falla && echo "bien"
```

```bash
# Cómo suprimir intencionalmente errores (con set -e activo):
rm /tmp/lock_file 2>/dev/null || true     # "No me importa si falla"
grep "patron" archivo.txt || true         # grep puede devolver 1 si no encuentra
```

### `trap` — Limpieza garantizada

`trap` registra comandos que se ejecutan cuando el script recibe una señal o termina. Es la forma de garantizar que los archivos temporales siempre se limpian, aunque el script falle a la mitad.

```bash
#!/usr/bin/env bash
set -euo pipefail

# Crear directorio temporal con nombre único
TMPDIR=$(mktemp -d)                          # Crea /tmp/tmp.XXXXXXXXXX
LOCKFILE="/var/lock/mi-script.lock"

# Función de limpieza
cleanup() {
    local exit_code=$?
    rm -rf "$TMPDIR"
    rm -f "$LOCKFILE"
    [[ $exit_code -ne 0 ]] && echo "Script terminó con error (código $exit_code)" >&2
    exit $exit_code
}

# Registrar la limpieza para:
# EXIT → cuando el script termina (normal o con error)
# INT  → Ctrl+C
# TERM → kill sin señal (SIGTERM)
trap cleanup EXIT INT TERM

# A partir de aquí, cualquier error o salida limpia el tmpdir automáticamente
cp /etc/passwd "$TMPDIR/backup_passwd"
# ... hacer cosas con los archivos temporales ...
echo "Trabajo completado en $TMPDIR"
# Al llegar aquí (o si hay un error), cleanup() se ejecuta sola
```

### Bloqueos con `flock`: evitar ejecuciones simultáneas

```bash
#!/usr/bin/env bash
# Un script de cron que no debe correr dos veces a la vez

LOCKFILE="/var/lock/mi-backup.lock"

# flock: adquiere un lock exclusivo en el archivo
# Si ya está bloqueado, -n hace que falle en vez de esperar
if ! flock -n "$LOCKFILE" -c "echo 'ok'" 2>/dev/null; then
    echo "El script ya está corriendo (lock en $LOCKFILE)" >&2
    exit 1
fi

# Forma más elegante: bloquear un descriptor de archivo abierto
exec 200>"$LOCKFILE"    # Abrir el archivo como fd 200
if ! flock -n 200; then
    echo "Ya está corriendo otra instancia" >&2
    exit 1
fi
# El lock se libera automáticamente cuando el script termina

# ... resto del script ...
```

### Logging a stderr y niveles de verbosidad

```bash
#!/usr/bin/env bash
set -euo pipefail

# Por convención: mensajes de log → stderr, datos procesados → stdout
# Así los mensajes no interfieren con pipelines

VERBOSE=${VERBOSE:-false}
LOG_FILE="${LOG_FILE:-/var/log/mi-script.log}"

log() {
    local nivel="$1"; shift
    local mensaje="$*"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    printf "%s [%-5s] %s\n" "$timestamp" "$nivel" "$mensaje" >&2
    printf "%s [%-5s] %s\n" "$timestamp" "$nivel" "$mensaje" >> "$LOG_FILE"
}

log_info()  { log INFO  "$@"; }
log_warn()  { log WARN  "$@"; }
log_error() { log ERROR "$@"; }
log_debug() { $VERBOSE && log DEBUG "$@" || true; }

# Uso:
log_info "Iniciando backup de /home"
log_debug "Directorio temporal: $TMPDIR"
log_warn "El disco está al 85% de capacidad"
log_error "No se pudo conectar a $HOST"
```

---

## 10.9 — Depuración y calidad

### `bash -x`: ejecutar en modo traza

```bash
# Trazar todo el script desde el principio:
bash -x mi-script.sh

# Activar/desactivar dentro del script:
set -x      # Activar traza a partir de aquí
echo "hola"
set +x      # Desactivar

# Cada línea ejecutada se imprime precedida de '+':
# + echo "hola"
# hola

# Mejorar la traza con PS4 (el prefijo del trace):
export PS4='+(${BASH_SOURCE}:${LINENO}): ${FUNCNAME[0]:+${FUNCNAME[0]}(): }'
set -x
# Ahora el trace muestra archivo, número de línea y función:
# +(mi-script.sh:42): main(): echo "hola"
```

### ShellCheck — El linter imprescindible

ShellCheck analiza tu script estáticamente y detecta bugs antes de ejecutarlo. Es **la herramienta más importante** para escribir scripts correctos.

```bash
# Instalar
sudo apt install shellcheck       # Debian/Ubuntu
sudo dnf install ShellCheck       # Fedora
# o: https://github.com/koalaman/shellcheck

# Usar
shellcheck mi-script.sh
# mi-script.sh:15:7: warning [SC2086]: Double quote to prevent globbing and word splitting.
# mi-script.sh:23:1: error [SC2034]: VAR appears unused. Assign to _ to suppress.

# Integración con el editor (Módulo 06):
# - vim: vim-ale o vim-syntastic con shellcheck
# - VS Code: extensión ShellCheck
# - CI/CD: shellcheck en GitHub Actions / GitLab CI

# Suprimir una advertencia específica (cuando sabes lo que haces):
# shellcheck disable=SC2086
echo $sin_comillas    # ShellCheck no avisará de esta línea

# Ejemplos de lo que detecta ShellCheck:
# SC2086: Missing quotes → word splitting bugs
# SC2046: Command substitution sin comillas → $(ls *.txt)
# SC2148: Script sin shebang
# SC2034: Variable definida pero nunca usada
# SC2155: Declaración y asignación separadas con local
# SC1090: source de archivo con ruta variable (no puede verificarlo)
```

### Estilo y buenas prácticas

```bash
# Reglas de estilo (Google Shell Style Guide):

# 1. Nombres de variables: MAYÚSCULAS para globales/constantes, minúsculas para locales
readonly MAX_RETRIES=3
local contador=0

# 2. Funciones en minúsculas_con_guión_bajo
procesar_archivo() { ... }

# 3. Constantes con readonly
readonly CONFIG_FILE="/etc/mi-app/config.conf"

# 4. main() para el cuerpo principal (mejora la legibilidad)
main() {
    parse_args "$@"
    validate_env
    run_backup
}
main "$@"    # Llamar a main pasándole todos los argumentos

# 5. Comprobar dependencias al inicio
require_commands() {
    local cmd
    for cmd in "$@"; do
        command -v "$cmd" &>/dev/null || {
            echo "ERROR: comando requerido no encontrado: $cmd" >&2
            exit 1
        }
    done
}
require_commands rsync gpg curl

# 6. Documentar las funciones (qué hace, qué argumentos, qué devuelve)
# Si es una función no obvia, un comentario de una línea es suficiente
```

---

## 10.10 — Proyecto: script de backup de producción

Un script completo que integra todo lo del módulo: getopts, funciones, logging, trap, flock, set -euo pipefail y rotación de backups.

```bash
#!/usr/bin/env bash
# backup.sh — Script de copia de seguridad incremental
# Uso: ./backup.sh [-v] [-d DESTINO] [-r RETENCIÓN_DÍAS] ORIGEN [ORIGEN...]

set -euo pipefail

# ─── Constantes ────────────────────────────────────────────────────────────
readonly SCRIPT_NAME=$(basename "$0")
readonly SCRIPT_VERSION="2.0"
readonly LOG_FILE="/var/log/backup.log"
readonly LOCK_FILE="/var/lock/backup.lock"
readonly TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ─── Variables con defaults ─────────────────────────────────────────────────
DESTINO="/backup"
RETENCION_DIAS=30
VERBOSE=false
declare -a ORIGENES=()

# ─── Colores ────────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
BLUE='\033[0;34m'; NC='\033[0m'

# ─── Funciones de logging ───────────────────────────────────────────────────
log() {
    local nivel="$1"; shift
    printf "%s [%s] %s\n" "$(date '+%Y-%m-%d %H:%M:%S')" "$nivel" "$*" | \
        tee -a "$LOG_FILE" >&2
}
log_info()  { log "INFO " "$@"; }
log_ok()    { printf "${GREEN}"; log "OK   " "$@"; printf "${NC}"; }
log_warn()  { printf "${YELLOW}"; log "WARN " "$@"; printf "${NC}"; }
log_error() { printf "${RED}"; log "ERROR" "$@"; printf "${NC}"; }
log_debug() { $VERBOSE && log "DEBUG" "$@" || true; }
log_fatal() { log_error "$@"; exit 1; }

# ─── Limpieza ───────────────────────────────────────────────────────────────
cleanup() {
    local exit_code=$?
    log_debug "Limpiando recursos..."
    [[ $exit_code -ne 0 ]] && log_error "Backup terminó con error (código $exit_code)"
    exit $exit_code
}
trap cleanup EXIT INT TERM

# ─── Uso ────────────────────────────────────────────────────────────────────
usage() {
    cat <<EOF
${SCRIPT_NAME} v${SCRIPT_VERSION} — Backup incremental con rsync

Uso: ${SCRIPT_NAME} [OPCIONES] ORIGEN [ORIGEN...]

Opciones:
  -d DIR    Directorio destino (default: ${DESTINO})
  -r DÍAS   Días de retención (default: ${RETENCION_DIAS})
  -v        Modo verbose
  -h        Esta ayuda

Ejemplo:
  ${SCRIPT_NAME} -d /mnt/nas/backups -r 60 /home /etc /var/www
EOF
}

# ─── Parsing de argumentos ──────────────────────────────────────────────────
parse_args() {
    [[ $# -eq 0 ]] && { usage; exit 0; }

    while getopts ":d:r:vh" opt; do
        case "$opt" in
            d)  DESTINO="$OPTARG" ;;
            r)  RETENCION_DIAS="$OPTARG"
                [[ "$RETENCION_DIAS" =~ ^[0-9]+$ ]] || \
                    log_fatal "-r debe ser un número positivo" ;;
            v)  VERBOSE=true ;;
            h)  usage; exit 0 ;;
            :)  log_fatal "La opción -$OPTARG requiere un argumento" ;;
            \?) log_fatal "Opción desconocida: -$OPTARG" ;;
        esac
    done
    shift $((OPTIND - 1))

    [[ $# -gt 0 ]] || log_fatal "Debes especificar al menos un ORIGEN"
    ORIGENES=("$@")
}

# ─── Validaciones ───────────────────────────────────────────────────────────
validate_env() {
    command -v rsync &>/dev/null || log_fatal "rsync no está instalado"

    [[ -d "$DESTINO" ]] || {
        log_info "Creando directorio destino: $DESTINO"
        mkdir -p "$DESTINO"
    }

    local origen
    for origen in "${ORIGENES[@]}"; do
        [[ -e "$origen" ]] || log_fatal "El origen no existe: $origen"
    done

    # Verificar espacio disponible (necesita al menos 100 MB libres)
    local espacio_libre
    espacio_libre=$(df -m "$DESTINO" | awk 'NR==2 {print $4}')
    (( espacio_libre >= 100 )) || log_fatal "Espacio insuficiente en $DESTINO: ${espacio_libre}MB"

    log_debug "Validaciones superadas. Espacio libre: ${espacio_libre}MB"
}

# ─── Backup ─────────────────────────────────────────────────────────────────
hacer_backup() {
    local origen="$1"
    local nombre_origen
    nombre_origen=$(echo "$origen" | tr '/' '_' | tr -s '_' | sed 's/^_//')
    local dir_destino="${DESTINO}/${nombre_origen}_${TIMESTAMP}"
    local dir_latest="${DESTINO}/${nombre_origen}_latest"

    log_info "Backup de $origen → $dir_destino"

    local rsync_opts=(-av --delete --stats)
    $VERBOSE && rsync_opts+=(-P) || rsync_opts+=(--quiet)

    # Si existe un backup previo, enlazar los archivos iguales (backup incremental)
    if [[ -d "$dir_latest" ]]; then
        rsync_opts+=(--link-dest="$dir_latest")
        log_debug "Usando backup previo como referencia: $dir_latest"
    fi

    rsync "${rsync_opts[@]}" "$origen/" "$dir_destino/" || {
        log_error "rsync falló para $origen (exit code $?)"
        return 1
    }

    # Actualizar el symlink 'latest'
    ln -snf "$dir_destino" "$dir_latest"
    log_ok "Backup completado: $dir_destino"
}

# ─── Rotación de backups antiguos ──────────────────────────────────────────
rotar_backups() {
    local dias="$RETENCION_DIAS"
    log_info "Eliminando backups con más de $dias días..."

    local eliminados=0
    while IFS= read -r -d '' dir; do
        rm -rf "$dir"
        log_debug "Eliminado: $dir"
        (( eliminados++ ))
    done < <(find "$DESTINO" -maxdepth 1 -type d -name "*_20*" \
                  -mtime "+$dias" -print0)

    log_info "Backups eliminados: $eliminados"
}

# ─── Informe ────────────────────────────────────────────────────────────────
informe() {
    local total origen
    total=$(du -sh "$DESTINO" 2>/dev/null | cut -f1)
    log_info "=== Resumen del backup ==="
    log_info "Destino: $DESTINO (uso total: $total)"
    log_info "Orígenes procesados: ${#ORIGENES[@]}"
    for origen in "${ORIGENES[@]}"; do
        log_info "  → $origen"
    done
    log_info "Retención: $RETENCION_DIAS días"
    log_ok "Backup completado exitosamente"
}

# ─── Main ────────────────────────────────────────────────────────────────────
main() {
    parse_args "$@"

    # Evitar ejecuciones simultáneas
    exec 200>"$LOCK_FILE"
    flock -n 200 || log_fatal "Ya hay un backup corriendo (lock: $LOCK_FILE)"

    log_info "=== Iniciando backup v${SCRIPT_VERSION} ==="
    validate_env

    local errores=0
    for origen in "${ORIGENES[@]}"; do
        hacer_backup "$origen" || (( errores++ ))
    done

    rotar_backups
    informe

    [[ $errores -eq 0 ]] || log_fatal "$errores origen(es) fallaron"
}

main "$@"
```

---

## Anexos

### A. ShellCheck — Errores más frecuentes

| Código | Causa | Corrección |
|---|---|---|
| SC2086 | `$var` sin comillas | Usar `"$var"` |
| SC2046 | `$(cmd)` sin comillas en argumento | Usar `"$(cmd)"` |
| SC2148 | Script sin shebang | Añadir `#!/usr/bin/env bash` |
| SC2155 | `local var=$(cmd)` | Separar: `local var; var=$(cmd)` |
| SC2181 | `if [ $? -eq 0 ]` | Usar `if comando; then` directamente |
| SC2207 | `array=($(cmd))` | Usar `mapfile -t array < <(cmd)` |
| SC2034 | Variable declarada pero no usada | Asignar a `_` para suprimir |

La razón de SC2155 (`local var=$(cmd)`) es importante: si `cmd` falla, el exit code del fallo se pierde porque `local` siempre devuelve 0. Separar la declaración de la asignación preserva el exit code.

### B. set -e: comportamiento detallado

```bash
# Comandos que NO provocan salida aunque fallen con set -e:
command || true              # Fallo ignorado explícitamente
! command                    # Negación
if command; then fi          # Condición de if
while command; do done       # Condición de while
command && other             # Parte izquierda de &&
```

### C. Referencias cruzadas entre módulos

```
◀ Módulo 03 — Terminal y shell
│  Variables, redirecciones, pipes, alias y funciones de la shell
│  Todo eso es la base sintáctica de los scripts

◀ Módulo 05 — Procesamiento de texto
│  grep, sed, awk son los motores del 80% del procesamiento en scripts
│  Pipelines complejos dentro de $( ) o mientras IFS= read -r

◀ Módulo 09 — Procesos, servicios y systemd
│  trap captura señales (SIGTERM, SIGINT) para limpieza
│  Los scripts llamados desde cron o timers de systemd

▶ Módulo 14 — Seguridad y hardening
│  → Scripts con set -u evitan inyección por variables vacías
│  → Validación de argumentos para scripts que reciben input externo

▶ Módulo 18 — Automatización y DevOps
│  → Scripts Bash como base de pipelines CI/CD
│  → Ansible playbooks invocan scripts Bash como módulos
```

---

## Referencias y Bibliografía

1. **Bash Reference Manual** — GNU  
   https://www.gnu.org/software/bash/manual/

2. **Advanced Bash-Scripting Guide** — Mendel Cooper  
   https://tldp.org/LDP/abs/html/ — La biblia del scripting avanzado.

3. **Google Shell Style Guide**  
   https://google.github.io/styleguide/shellguide.html

4. **ShellCheck** — Koala  
   https://www.shellcheck.net/ (online) y https://github.com/koalaman/shellcheck

5. **Bash Pitfalls** — Greg's Wiki  
   https://mywiki.wooledge.org/BashFAQ/031  
   Lista de errores comunes con explicación y solución.

6. **BashFAQ** — Greg's Wiki  
   https://mywiki.wooledge.org/BashFAQ

7. **bats-core** — Bash Automated Testing System  
   https://github.com/bats-core/bats-core

8. **POSIX Shell Specification** — The Open Group  
   https://pubs.opengroup.org/onlinepubs/9699919799/utilities/V3_chap02.html

9. **The Linux Command Line** — William Shotts  
   https://linuxcommand.org/tlcl.php — Parte IV: Writing Shell Scripts.

10. **Classic Shell Scripting** — Robbins & Beebe  
    O'Reilly (2005). Capítulos 7-12.

11. **Learning the bash Shell** — Cameron Newham  
    O'Reilly (2005), 3ª edición.

12. **Unix Power Tools** — Shelley et al.  
    O'Reilly (2002). Una colección de técnicas imprescindibles.

13. **Pro Bash Programming** — Johnson & Varma  
    Apress (2015), 2ª edición.

---

## Preguntas de autoevaluación

1. ¿Cuál es la diferencia entre ejecutar `./script.sh` y hacer `source script.sh`? ¿Cuándo usarías cada uno?
2. Explica el concepto de "word splitting" en Bash. ¿Por qué `for f in $(ls)` es problemático? ¿Cuál es la alternativa correcta?
3. ¿Qué diferencia hay entre `$@` y `$*` cuando están entre comillas dobles?
4. ¿Qué hace `${VAR:-valor_default}`? ¿Y `${VAR:?mensaje}`?
5. ¿Por qué se recomienda `[[ ]]` en vez de `[ ]` en scripts Bash modernos?
6. Explica el bug de `local resultado=$(comando_que_falla)` y cómo se corrige (SC2155).
7. ¿Qué hace cada opción en `set -euo pipefail`? Pon un ejemplo de bug que previene cada una.
8. ¿Cuál es la utilidad de `trap cleanup EXIT INT TERM`?
9. ¿Por qué `while IFS= read -r` es la forma correcta de leer archivos línea a línea?
10. ¿Cómo previene `flock` que un script corra dos veces simultáneamente?
11. ¿Qué es ShellCheck y qué tipo de errores detecta que el script no revelaría al correr?
12. Escribe el esqueleto de una función que: acepta argumentos, usa variables locales, y devuelve un valor por stdout.
13. ¿Qué pasa si usas `set -e` y un comando falla dentro de un `if`? ¿Y dentro de `||`?

---

## Laboratorios prácticos

### Lab 10.1 — Variables y quoting

```bash
# 1. Crear un archivo con espacios en el nombre y procesarlo correctamente
touch "/tmp/mi archivo con espacios.txt"
echo "contenido" > "/tmp/mi archivo con espacios.txt"

archivo="/tmp/mi archivo con espacios.txt"
# ✓ Correcto:
ls -la "$archivo"
wc -l "$archivo"
# ✗ Incorrecto (verifica qué error da):
ls -la $archivo     # ¿Qué pasa?

# 2. Expansiones de parámetro
ruta="/home/usuario/documentos/informe-2024.pdf"
echo "Nombre del archivo: ${ruta##*/}"
echo "Directorio: ${ruta%/*}"
echo "Extensión: ${ruta##*.}"
echo "Sin extensión: ${ruta%.*}"

# 3. Valores por defecto
puerto="${PUERTO:-8080}"
echo "Puerto: $puerto"
PUERTO=9090
puerto="${PUERTO:-8080}"
echo "Puerto: $puerto"     # ¿Cuánto sale ahora?
```

### Lab 10.2 — Leer /etc/passwd con while read

```bash
# Procesar /etc/passwd para listar usuarios reales con su shell
while IFS=: read -r usuario _ uid _ _ home shell; do
    [[ $uid -ge 1000 && $uid -lt 65534 ]] || continue
    printf "%-15s UID:%-6d Home:%-25s Shell:%s\n" \
        "$usuario" "$uid" "$home" "$shell"
done < /etc/passwd

# ¿Cuántos usuarios tienen bash como shell?
count=0
while IFS=: read -r _ _ _ _ _ _ shell; do
    [[ "$shell" == */bash ]] && (( count++ ))
done < /etc/passwd
echo "Usuarios con bash: $count"
```

### Lab 10.3 — Función con validación y retorno

```bash
#!/usr/bin/env bash
set -euo pipefail

# Función: verificar que un puerto está escuchando
puerto_activo() {
    local host="${1:-localhost}"
    local puerto="$2"
    local timeout="${3:-3}"

    [[ "$puerto" =~ ^[0-9]+$ ]] || { echo "Puerto inválido: $puerto" >&2; return 1; }

    if timeout "$timeout" bash -c ">/dev/tcp/$host/$puerto" 2>/dev/null; then
        return 0    # Puerto abierto
    else
        return 1    # Puerto cerrado/inaccesible
    fi
}

# Probar varios puertos
for puerto in 22 80 443 8080 3306; do
    if puerto_activo localhost "$puerto" 1; then
        echo "Puerto $puerto: ABIERTO"
    else
        echo "Puerto $puerto: cerrado"
    fi
done
```

### Lab 10.4 — Script con getopts y validación

```bash
#!/usr/bin/env bash
# Crear un script que liste archivos de un directorio con opciones
# Uso: ./listar.sh [-l] [-t tipo] [-s SIZE] DIRECTORIO

set -euo pipefail

FORMATO="simple"
TIPO=""
TAMANIO_MIN=0

usage() {
    echo "Uso: $0 [-l] [-t TIPO] [-s BYTES] DIRECTORIO"
    echo "  -l       Formato largo (ls -la)"
    echo "  -t TIPO  Solo archivos de este tipo (f=regular, d=directorio, l=symlink)"
    echo "  -s BYTES Solo archivos mayores a BYTES bytes"
    exit 0
}

while getopts ":lt:s:h" opt; do
    case "$opt" in
        l) FORMATO="largo" ;;
        t) TIPO="$OPTARG" ;;
        s) TAMANIO_MIN="$OPTARG" ;;
        h) usage ;;
        :) echo "ERROR: -$OPTARG requiere argumento" >&2; exit 2 ;;
        \?) echo "ERROR: -$OPTARG desconocida" >&2; exit 2 ;;
    esac
done
shift $((OPTIND - 1))

[[ $# -gt 0 ]] || { echo "ERROR: falta DIRECTORIO" >&2; exit 2; }
DIRECTORIO="$1"
[[ -d "$DIRECTORIO" ]] || { echo "ERROR: $DIRECTORIO no es un directorio" >&2; exit 1; }

# Construir el comando find
find_opts=("$DIRECTORIO" -maxdepth 1)
[[ -n "$TIPO" ]] && find_opts+=(-type "$TIPO")
[[ $TAMANIO_MIN -gt 0 ]] && find_opts+=(-size "+${TAMANIO_MIN}c")

while IFS= read -r -d '' archivo; do
    if [[ "$FORMATO" == "largo" ]]; then
        ls -la "$archivo"
    else
        echo "$archivo"
    fi
done < <(find "${find_opts[@]}" -print0 | sort -z)
```

### Lab 10.5 — Script con set -euo pipefail y trap

```bash
#!/usr/bin/env bash
# Script de procesamiento que limpia automáticamente
set -euo pipefail

TMPDIR=$(mktemp -d)
RESULTADOS="/tmp/resultados_$(date +%Y%m%d).txt"

cleanup() {
    echo "Limpiando $TMPDIR..." >&2
    rm -rf "$TMPDIR"
}
trap cleanup EXIT

echo "Trabajando en $TMPDIR"

# Copiar los logs del sistema al tmpdir y analizarlos
cp /var/log/syslog "$TMPDIR/" 2>/dev/null || \
    cp /var/log/messages "$TMPDIR/" 2>/dev/null || \
    journalctl -n 1000 --no-pager > "$TMPDIR/syslog"

# Contar errores por hora
awk '{print $3}' "$TMPDIR/"* 2>/dev/null | \
    cut -d: -f1 | sort | uniq -c | sort -rn | head -10 > "$RESULTADOS"

echo "Las 10 horas con más actividad:"
cat "$RESULTADOS"
echo ""
echo "Resultados guardados en $RESULTADOS"
# Al terminar, cleanup() borra TMPDIR automáticamente
```

---

## Resumen del módulo

✅ **Estructura:** shebang `#!/usr/bin/env bash`, `chmod +x`, diferencia `./` vs `source`  
✅ **Variables:** asignación sin espacios, quoting obligatorio, `"$@"` para arrays de argumentos  
✅ **Expansiones:** `${VAR:-default}`, `${#VAR}`, `${VAR##*/}` para rutas, `${VAR//buscar/reemplazar}`  
✅ **Condicionales:** `[[ ]]` con tests de archivos (`-f -d -e`), strings (`==`, `=~`), números (`-eq -lt`)  
✅ **Bucles:** `for` con globs y rangos; `while IFS= read -r` para archivos; `break`/`continue`  
✅ **Funciones:** `local` para variables, retorno por stdout o exit code, bibliotecas reutilizables  
✅ **Arrays:** indexados y asociativos (`declare -A`), `"${arr[@]}"` siempre con comillas  
✅ **Argumentos:** `getopts` para opciones tipo Unix, `shift $((OPTIND-1))` para posicionales  
✅ **Robustez:** `set -euo pipefail`, `trap cleanup EXIT`, `flock` para exclusión mutua, `mktemp`  
✅ **Calidad:** `bash -x` para traza, ShellCheck para análisis estático, SC2155/SC2086/SC2046  

**Próximo paso:** [Módulo 11 — Redes en Linux](/redes-en-linux). Los scripts de este módulo son la base de la automatización de red: verificar conectividad, analizar logs de firewall, configurar interfaces desde scripts de arranque.

---

**Última actualización:** 2024-06  
**Versión:** 1.0  
**Estado:** ✅ Listo para enseñanza
