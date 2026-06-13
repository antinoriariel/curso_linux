---
title: "Módulo 04 — El sistema de archivos"
sidebar_label: "04 · El sistema de archivos"
description: Jerarquía FHS, navegación, gestión de archivos y directorios, inodos, enlaces, búsqueda con find y locate, y gestión de espacio en disco.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Módulo 04 — El sistema de archivos

## Introducción

En el [Módulo 01](/introduccion-al-mundo-linux#3-todo-es-un-archivo) aprendimos que uno de los principios fundamentales de la filosofía UNIX es que **todo es un archivo**. Este módulo es la materialización práctica de ese principio: aprenderás cómo está organizado el árbol de directorios, cómo navegar por él, cómo gestionar archivos y directorios, y —crucialmente— cómo encontrar lo que buscas.

En el [Módulo 03](/terminal-y-shell) adquiriste las herramientas para interactuar con la shell. Aquí pondremos esas herramientas en práctica: los comandos `ls`, `cd`, `find`, `cp`, `mv` y `rm` son el vocabulario diario de cualquier administrador y desarrollador Linux.

En el [Módulo 02](/instalacion-y-primer-contacto#232--instalador-de-ubuntu-2404-pantalla-a-pantalla) viste brevemente el particionado del sistema (`/`, `/home`, `/boot/efi`). Ahora entenderás **por qué** esas particiones tienen esos nombres y qué contienen.

### Objetivos de aprendizaje

Al finalizar este módulo, serás capaz de:

- ✅ Explicar la jerarquía FHS y el propósito de cada directorio principal
- ✅ Navegar el sistema de archivos con fluidez usando rutas absolutas y relativas
- ✅ Crear, copiar, mover y borrar archivos y directorios de forma eficiente y segura
- ✅ Comprender los inodos y la diferencia entre enlaces duros y simbólicos
- ✅ Identificar los 7 tipos de archivo de Linux con `file` y `stat`
- ✅ Buscar archivos con `find` usando todos sus predicados y acciones
- ✅ Gestionar el espacio en disco con `du`, `df` y `ncdu`

---

## 4.1 — La jerarquía de directorios (FHS)

### El estándar FHS

El **Filesystem Hierarchy Standard (FHS)** es el documento que define la estructura de directorios en sistemas Linux. Es mantenido por la [Linux Foundation](https://refspecs.linuxfoundation.org/FHS_3.0/fhs-3.0.html) y todas las distribuciones principales lo siguen (con pequeñas variaciones).

El FHS responde a una pregunta fundamental: **¿dónde va cada cosa?** Sin este estándar, cada distribución tendría sus propios convenios y los scripts y programas dejarían de funcionar al cambiar de sistema.

```
Árbol completo del sistema Linux (FHS 3.0):

/                    ← Raíz: el origen de todo el árbol
├── bin  →  /usr/bin    (binarios esenciales de usuario)
├── boot               (kernel, initrd, GRUB)
├── dev                (dispositivos de hardware)
├── etc                (configuración del sistema)
├── home               (directorios personales de usuarios)
│   └── juan/
├── lib  →  /usr/lib    (bibliotecas esenciales)
├── lib64 →  /usr/lib64 (bibliotecas 64-bit)
├── media              (puntos de montaje removibles: USB, DVD)
├── mnt                (montajes temporales manuales)
├── opt                (software adicional autocontenido)
├── proc               (sistema de archivos virtual — procesos)
├── root               (home del superusuario root)
├── run                (datos de runtime — PIDs, sockets)
├── sbin →  /usr/sbin  (binarios de administración)
├── srv                (datos servidos por servicios: HTTP, FTP)
├── sys                (sistema de archivos virtual — kernel/hardware)
├── tmp                (archivos temporales — se borran al reiniciar)
├── usr                (jerarquía de recursos del sistema)
│   ├── bin            (comandos de usuario)
│   ├── include        (headers C/C++)
│   ├── lib            (bibliotecas)
│   ├── local          (software instalado localmente)
│   │   ├── bin
│   │   ├── lib
│   │   └── share
│   ├── sbin           (comandos de administración)
│   ├── share          (datos independientes de arquitectura)
│   │   ├── doc        (documentación de paquetes)
│   │   ├── man        (páginas man)
│   │   └── locale     (traducciones)
│   └── src            (código fuente de paquetes)
└── var                (datos variables — logs, caches, spools)
    ├── cache          (datos de caché de aplicaciones)
    ├── lib            (estado persistente de aplicaciones)
    ├── log            (logs del sistema)
    ├── mail           (buzones de correo)
    ├── run  →  /run   (enlace simbólico al /run moderno)
    ├── spool          (colas: impresión, correo)
    └── tmp            (temporales persistentes entre reinicios)
```

### Directorio por directorio

#### `/` — La raíz

Todo en Linux cuelga de una única raíz. No existen las letras de unidad de Windows (`C:`, `D:`). Los discos adicionales se **montan** en subdirectorios.

```bash
# La raíz es literalmente un directorio
ls /
# bin  boot  dev  etc  home  lib  lib64  media  mnt  opt
# proc  root  run  sbin  srv  sys  tmp  usr  var

# Ver qué está montado donde
findmnt
# O de forma más legible:
df -hT
```

#### `/etc` — Configuración del sistema

*"Editable Text Configuration"* (retrocónimo). Contiene **exclusivamente archivos de texto plano** de configuración.

```bash
ls /etc | head -30
# adduser.conf  apt  bash.bashrc  crontab  default
# environment  fstab  group  hostname  hosts  ...

# Archivos clave:
cat /etc/hostname        # Nombre del equipo
cat /etc/hosts           # Resolución local de nombres
cat /etc/fstab           # Sistemas de archivos que se montan al arranque
cat /etc/passwd          # Base de datos de usuarios (sin contraseñas)
cat /etc/shadow          # Contraseñas hasheadas (solo root)
cat /etc/group           # Grupos del sistema
cat /etc/os-release      # Información de la distribución
cat /etc/resolv.conf     # Servidores DNS
ls /etc/apt/             # Configuración de APT
ls /etc/systemd/         # Configuración de systemd
ls /etc/ssh/             # Configuración de SSH
```

:::info
Por convención (y por seguridad), `/etc` solo contiene configuración, nunca datos ni binarios. Todo en `/etc` debería poder incluirse en un control de versiones (git).
:::

#### `/home` — Directorios personales

Cada usuario tiene un subdirectorio en `/home`. Contiene su configuración personal (dotfiles), documentos, descargas, proyectos, etc.

```bash
ls /home/
# juan  maria  root  (root tiene su propio home en /root, no aquí)

ls -la /home/juan/
# drwxr-x--- 2 juan juan 4096 ...  .
# drwxr-xr-x 4 root root 4096 ...  ..
# -rw-r--r-- 1 juan juan  220 ...  .bash_logout
# -rw-r--r-- 1 juan juan 3526 ...  .bashrc
# -rw-r--r-- 1 juan juan  807 ...  .profile
# drwxr-xr-x 2 juan juan 4096 ...  Documentos
# drwxr-xr-x 2 juan juan 4096 ...  Descargas
```

**Archivos de configuración ("dotfiles"):** los archivos que empiezan con `.` están ocultos por defecto (`ls -a` para verlos). Por convención, la configuración personal de cada programa vive aquí.

```bash
# Dotfiles típicos en ~:
~/.bashrc           # Configuración de Bash (visto en Módulo 03)
~/.bash_history     # Historial de comandos
~/.ssh/             # Claves SSH
~/.gitconfig        # Configuración de Git
~/.config/          # Directorio XDG de configuración de apps
~/.local/           # Datos locales de apps (caché, estado)
~/.profile          # Variables de entorno de sesión
```

#### `/var` — Datos variables

Archivos que **cambian durante la operación normal** del sistema.

```bash
/var/log/            # Logs del sistema
  ├── syslog        # Log general del sistema (Debian/Ubuntu)
  ├── auth.log      # Autenticaciones SSH, sudo
  ├── kern.log      # Mensajes del kernel
  ├── dpkg.log      # Instalaciones de paquetes
  ├── nginx/        # Logs de Nginx (si instalado)
  └── journal/      # Logs de systemd journal (binarios)

/var/cache/          # Caches de aplicaciones
  └── apt/archives/ # Paquetes .deb descargados

/var/lib/            # Estado persistente de aplicaciones
  ├── apt/          # Base de datos de paquetes APT
  ├── docker/       # Datos de Docker
  └── postgresql/   # Datos de PostgreSQL

/var/spool/          # Colas de trabajo
  ├── cron/         # Trabajos de cron pendientes
  └── mail/         # Cola de correo

/var/tmp/            # Temporales que sobreviven al reinicio
```

```bash
# Ver logs en tiempo real
tail -f /var/log/syslog       # Ubuntu/Debian
tail -f /var/log/messages     # Fedora/RHEL

# Con journalctl (systemd)
journalctl -f                 # Todos los logs en tiempo real
journalctl -u nginx -f        # Logs solo del servicio nginx
```

#### `/usr` — Recursos del sistema Unix

*"Unix System Resources"* (no "user"). Es la mayor parte del software instalado.

```
/usr
├── bin/      Comandos de usuario (ls, grep, python3, git...)
├── sbin/     Comandos de admin (fdisk, mkfs, sshd...)
├── lib/      Bibliotecas compartidas (.so files)
├── include/  Headers para compilar software (stdio.h, etc.)
├── share/    Datos independientes de arquitectura
│   ├── man/  Man pages → 'man ls' las lee de aquí
│   ├── doc/  Documentación de paquetes
│   └── locale/ Traducciones de aplicaciones
└── local/    Reservado para software instalado manualmente
    ├── bin/  → Programas no gestionados por APT/DNF
    └── lib/
```

```bash
# Cuántos comandos hay en /usr/bin
ls /usr/bin | wc -l    # ~1500-2000 en un sistema típico

# ¿Qué biblioteca usa un ejecutable?
ldd /usr/bin/ls
# linux-vdso.so.1
# libselinux.so.1 => /lib/x86_64-linux-gnu/libselinux.so.1
# libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6
```

**La "usrmerge":** En Linux moderno, `/bin`, `/sbin`, `/lib` son **enlaces simbólicos** a sus equivalentes bajo `/usr/`. Esto simplifica la gestión del sistema.

```bash
ls -la /bin
# lrwxrwxrwx 1 root root 7 /bin -> usr/bin

ls -la /lib
# lrwxrwxrwx 1 root root 7 /lib -> usr/lib
```

#### `/boot` — Arranque del sistema

Contiene el kernel, el initrd (initial RAM disk) y el cargador de arranque (GRUB).

```bash
ls /boot/
# config-6.8.0-35-generic    initrd.img-6.8.0-35-generic
# grub/                       vmlinuz-6.8.0-35-generic
# System.map-6.8.0-35-generic

# vmlinuz: El kernel comprimido
file /boot/vmlinuz-6.8.0-35-generic
# /boot/vmlinuz-6.8.0-35-generic: Linux kernel x86 boot executable

# initrd: Sistema de archivos RAM inicial
file /boot/initrd.img-6.8.0-35-generic
# /boot/initrd.img: gzip compressed data (initramfs)
```

*(Visto en el contexto del particionado en [Módulo 02](/instalacion-y-primer-contacto#231--conceptos-de-particionado))*

#### `/dev` — Dispositivos

Archivos especiales que representan hardware. *"Todo es un archivo"* en acción directa (visto en [Módulo 01](/introduccion-al-mundo-linux#3-todo-es-un-archivo)).

```bash
ls /dev/
# block devices
/dev/sda       → Primer disco SATA/SAS
/dev/sda1      → Primera partición de sda
/dev/nvme0n1   → Disco NVMe
/dev/nvme0n1p1 → Primera partición NVMe

# Terminales
/dev/tty       → Terminal controlador del proceso actual
/dev/tty1      → Primera consola virtual
/dev/pts/0     → Primer PTY (emulador de terminal)

# Especiales
/dev/null      → Basura: todo lo que se escribe se descarta
/dev/zero      → Fuente infinita de bytes 0x00
/dev/random    → Números aleatorios (bloquea si no hay entropía)
/dev/urandom   → Números pseudoaleatorios (no bloquea)
/dev/stdin     → Stdin del proceso actual
/dev/stdout    → Stdout del proceso actual
/dev/stderr    → Stderr del proceso actual
```

```bash
# Usos prácticos de dispositivos especiales
# Descartar salida
comando > /dev/null 2>&1     # Silenciar completamente un comando

# Generar archivo de ceros (para tests, borrado seguro)
dd if=/dev/zero of=archivo_ceros.dat bs=1M count=100

# Generar datos aleatorios
dd if=/dev/urandom of=datos_random.bin bs=1k count=10

# Tiempo de acceso a disco vs /dev/null
time dd if=/dev/zero of=/dev/null bs=1M count=1000   # ~15 GB/s (RAM)
time dd if=/dev/zero of=test.dat bs=1M count=1000    # Velocidad real del disco
```

#### `/proc` — Interfaz del kernel (procfs)

Un **sistema de archivos virtual** que el kernel genera dinámicamente. No hay datos reales en disco; lo que ves es información del kernel en tiempo real, expuesta como archivos.

```bash
# Información del sistema en tiempo real
cat /proc/cpuinfo          # Detalles del procesador
cat /proc/meminfo          # Uso de memoria detallado
cat /proc/version          # Versión del kernel
cat /proc/uptime           # Tiempo de actividad en segundos
cat /proc/loadavg          # Carga promedio del sistema
cat /proc/net/dev          # Estadísticas de red por interfaz
cat /proc/mounts           # Sistemas de archivos montados

# Cada proceso tiene su directorio en /proc/PID/
ls /proc/$$                # $$ = PID de la shell actual
# cmdline  cwd  environ  exe  fd  maps  mem  net  stat  status

cat /proc/$$/cmdline | tr '\0' ' '   # Comando completo del proceso
ls -la /proc/$$/fd                   # File descriptors abiertos
cat /proc/$$/environ | tr '\0' '\n'  # Variables de entorno del proceso
readlink /proc/$$/exe                # Ruta al ejecutable
readlink /proc/$$/cwd                # Directorio de trabajo

# Ajustar parámetros del kernel en tiempo real (kernel tuning)
cat /proc/sys/vm/swappiness          # Preferencia de uso de swap
echo 10 > /proc/sys/vm/swappiness   # Modificar (como root)
```

#### `/sys` — Interfaz hardware del kernel (sysfs)

Similar a `/proc`, pero organizado por el modelo de objetos del kernel (kobjects). Expone información sobre dispositivos y drivers.

```bash
# Información de hardware
cat /sys/class/net/eth0/speed         # Velocidad de la interfaz de red
cat /sys/class/net/lo/carrier         # ¿Está conectada?
cat /sys/class/power_supply/BAT0/capacity  # % de batería
ls /sys/bus/usb/devices/              # Dispositivos USB conectados
cat /sys/block/sda/size               # Tamaño del disco en sectores de 512 bytes

# Información de temperatura
find /sys/class/hwmon -name "temp*_input" | while read f; do
    echo "$(basename $(dirname $f)): $(cat $f)°m ($(echo "scale=1; $(cat $f)/1000" | bc)°C)"
done
```

#### `/tmp` — Archivos temporales

Los programas escriben aquí archivos temporales. Se **borra al reiniciar** (y systemd puede borrarlo con tmpfiles.d).

```bash
# Ver qué hay en /tmp
ls /tmp/

# En sistemas con systemd-tmpfiles:
cat /usr/lib/tmpfiles.d/tmp.conf
# d /tmp 1777 root root 10d    ← Borra archivos de más de 10 días

# Crear archivos temporales de forma segura (evita race conditions)
tmpfile=$(mktemp)          # /tmp/tmp.XXXXXXXXXX
tmpdir=$(mktemp -d)        # Directorio temporal
echo "datos" > "$tmpfile"
# ...usar el archivo...
rm "$tmpfile"
```

#### `/run` — Datos de runtime

Reemplaza a `/var/run`. Contiene archivos de estado que solo existen mientras el sistema está encendido: PIDs, sockets Unix, bloqueos.

```bash
ls /run/
# lock/  log/  mount/  network/  sshd.pid  systemd/  user/  utmp

# PID files: indica el PID del servicio principal
cat /run/sshd.pid             # PID del proceso sshd
cat /run/nginx.pid            # PID de Nginx
ls /run/systemd/units/        # Unidades de systemd activas
ls /run/user/1000/            # Runtime del usuario UID 1000
```

### Sistemas de archivos virtuales: `/proc` y `/sys` en profundidad

```
Sistemas de archivos virtuales en Linux:

procfs (/proc)    ← Generado por el kernel
├─ Información de procesos (/proc/PID/)
├─ Estadísticas del sistema (/proc/meminfo, /proc/cpuinfo)
└─ Interfaz de configuración del kernel (/proc/sys/)

sysfs (/sys)     ← Generado por el driver model del kernel
├─ Dispositivos (/sys/devices/)
├─ Buses (/sys/bus/)
├─ Clases de dispositivos (/sys/class/)
└─ Módulos del kernel (/sys/module/)

devtmpfs (/dev)  ← Gestionado por udev/mdev
├─ Dispositivos de bloque (/dev/sd*, /dev/nvme*)
├─ Dispositivos de carácter (/dev/tty*, /dev/pts/)
└─ Dispositivos especiales (/dev/null, /dev/random)

tmpfs (/tmp, /run)  ← En RAM, se pierde al apagar
```

```bash
# Verificar tipos de sistemas de archivos montados
mount | grep -E 'proc|sys|dev|run'
# sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)
# proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)
# devtmpfs on /dev type devtmpfs (rw,nosuid,size=...)
# tmpfs on /run type tmpfs (rw,nosuid,nodev,noexec,relatime)
```

### ¿Dónde van tus cosas?

Guía práctica de dónde instalar y guardar según el tipo de dato:

| ¿Qué? | ¿Dónde? | ¿Por qué? |
|---|---|---|
| Documentos, fotos | `~/Documentos`, `~/Imágenes` | Datos personales del usuario |
| Proyectos de código | `~/proyectos/` o `~/dev/` | Datos personales |
| Scripts personales | `~/.local/bin/` | En PATH del usuario |
| Config de herramientas | `~/.config/`, `~/.bashrc` | Dotfiles del usuario |
| Software instalado con gestor | `/usr/bin/`, `/usr/lib/` | Gestionado por APT/DNF |
| Software compilado a mano | `/usr/local/bin/` | Fuera del gestor de paquetes |
| Software de terceros (empresa) | `/opt/empresa/` | Autocontenido, no fragmentado |
| Configuración del sistema | `/etc/` | Solo root puede modificar |
| Logs del sistema | `/var/log/` | Datos variables del sistema |
| Bases de datos, state | `/var/lib/nombre/` | Estado persistente de servicio |

---

## 4.2 — Navegación y rutas

### Rutas absolutas vs. relativas

**Ruta absoluta:** Comienza desde la raíz `/`. Es inequívoca independientemente de dónde estés.

```bash
/home/juan/proyectos/web/index.html   # Ruta absoluta
/etc/nginx/nginx.conf                  # Ruta absoluta
/usr/bin/python3                       # Ruta absoluta
```

**Ruta relativa:** Comienza desde el directorio actual (`$PWD`). Su significado depende de dónde estés.

```bash
# Si estoy en /home/juan:
proyectos/web/index.html   # Relativa → /home/juan/proyectos/web/index.html
../maria/documentos/        # Relativa → /home/maria/documentos/
./script.sh                 # Relativa → /home/juan/script.sh
```

**Entradas especiales del sistema de archivos:**

```bash
.         # Directorio actual (punto)
..        # Directorio padre (dos puntos)
~         # Home del usuario actual ($HOME)
~usuario  # Home de otro usuario
-         # Directorio anterior ($OLDPWD) — solo con cd
```

```bash
# Ejemplos de uso
cd ..              # Subir un nivel
cd ../..           # Subir dos niveles
cd ../../etc       # Subir dos y bajar a /etc (desde /home/juan)
ls ./              # Listar directorio actual (igual que ls)
ls ../             # Listar directorio padre
./mi-script.sh     # Ejecutar script en directorio actual (NECESARIO el ./)
```

:::warning
**¿Por qué `./script.sh` y no solo `script.sh`?** El directorio actual (`.`) no está en `$PATH` por seguridad. Si lo estuviera, un atacante podría colocar un `ls` malicioso en tu directorio y ejecutarse cuando teclees `ls`. Siempre necesitas `./` para ejecutar scripts en el directorio actual.
:::

### `pwd` — Print Working Directory

```bash
# Ver dónde estás
pwd
# /home/juan/proyectos

# pwd lógico (con enlaces simbólicos no resueltos) — default
pwd -L

# pwd físico (rutas reales, sin enlaces simbólicos)
pwd -P

# La variable $PWD es equivalente
echo $PWD
# /home/juan/proyectos
```

### `cd` — Change Directory

```bash
# Sintaxis básica
cd /ruta/absoluta
cd ruta/relativa

# Casos especiales
cd          # Sin argumentos → ir al home (~)
cd ~        # Mismo: ir al home
cd -        # Ir al directorio anterior ($OLDPWD)
cd ..       # Subir un nivel
cd ../..    # Subir dos niveles

# Ejemplo práctico de cd -
cd /var/log
cd /etc/nginx
cd -             # Vuelve a /var/log
cd -             # Vuelve a /etc/nginx
```

### `pushd` y `popd` — Pila de directorios

Para navegar con historial de posiciones (como una pila LIFO):

```bash
# pushd: cambia al directorio Y lo guarda en una pila
pushd /var/log
# /var/log ~           ← Muestra la pila (izquierda = tope)

pushd /etc/nginx
# /etc/nginx /var/log ~

pushd /tmp
# /tmp /etc/nginx /var/log ~

# dirs: ver la pila sin moverse
dirs -v
# 0  /tmp
# 1  /etc/nginx
# 2  /var/log
# 3  ~

# popd: volver al directorio anterior de la pila
popd
# /etc/nginx /var/log ~    ← /tmp fue sacado; estamos en /etc/nginx

popd
# /var/log ~

# Ir directamente a una posición de la pila
pushd +2    # Ir al índice 2 de la pila (rotación)
```

**Cuándo usar `pushd`/`popd` vs `cd -`:**
- `cd -` sirve para alternar entre dos directorios
- `pushd`/`popd` sirven cuando necesitas navegar entre más de dos ubicaciones

### `ls` — Listar archivos (en profundidad)

`ls` es el comando más usado. Tiene muchas opciones que vale la pena conocer.

```bash
# Básico
ls                  # Archivos del directorio actual
ls /etc             # Archivos de otro directorio
ls archivo.txt      # Información de un archivo

# Formato de listado
ls -l               # Formato largo: permisos, propietario, tamaño, fecha
ls -la              # Largo + ocultos (archivos con .)
ls -lh              # Largo + tamaños legibles (K, M, G)
ls -lah             # Combinado (el más usado)

# Ordenación
ls -lt              # Ordenar por fecha (más reciente primero)
ls -ltr             # Ordenar por fecha (más antiguo primero: -r reverso)
ls -lS              # Ordenar por tamaño (mayor primero)
ls -lSr             # Ordenar por tamaño (menor primero)
ls -lX              # Ordenar por extensión
ls -lv              # Ordenar versiones (1, 2, 10 en vez de 1, 10, 2)

# Profundidad
ls -R               # Recursivo: lista todos los subdirectorios
ls -d */            # Solo directorios (no su contenido)
ls -d .*/           # Solo directorios ocultos

# Visualización
ls -1               # Un archivo por línea
ls -m               # Separados por comas
ls --color=always   # Forzar colores (útil en pipelines)
ls -F               # Añadir indicadores: / directorios, * ejecutables, @ symlinks
ls --group-directories-first  # Mostrar directorios antes que archivos
```

**Interpretar la salida de `ls -la`:**

```bash
ls -la /home/juan/
# total 44
# drwxr-x--- 7 juan juan 4096 jun  1 10:00 .
# drwxr-xr-x 4 root root 4096 may 15 09:00 ..
# -rw-r--r-- 1 juan juan  220 may 15 09:00 .bash_logout
# -rw-r--r-- 1 juan juan 3526 may 15 09:00 .bashrc
# drwxr-xr-x 3 juan juan 4096 jun  1 09:30 .config
# -rw-rw-r-- 2 juan juan 1024 jun  1 10:00 documento.txt
# lrwxrwxrwx 1 juan juan   18 jun  1 09:00 enlace -> /var/log/syslog

Columnas:
  drwxr-x---  → Tipo (d=dir, -=regular, l=symlink...) + Permisos (rwxrwxrwx)
  7           → Número de enlaces duros (hard links)
  juan        → Propietario
  juan        → Grupo
  4096        → Tamaño en bytes (4096 para dirs = un bloque)
  jun  1 10:00→ Fecha y hora de última modificación
  .           → Nombre del archivo/directorio
```

*(Los permisos se estudian en profundidad en el [Módulo 07 — Usuarios, grupos y permisos](/usuarios-grupos-y-permisos))*

### `tree` — Visualizar jerarquías

```bash
# Instalar (no siempre viene por defecto)
sudo apt install tree   # Debian/Ubuntu
sudo dnf install tree   # Fedora

# Uso básico
tree /etc/nginx

# Opciones útiles
tree -L 2              # Máximo 2 niveles de profundidad
tree -a                # Incluir archivos ocultos (dotfiles)
tree -d                # Solo directorios (no archivos)
tree -h                # Tamaños legibles
tree -s                # Mostrar tamaños
tree -t                # Ordenar por fecha
tree -I "*.pyc|__pycache__"  # Excluir patrones
tree --du              # Mostrar tamaño acumulado de directorios
tree -J                # Salida en JSON
tree -H . -o tree.html # Generar HTML navegable
```

```
Ejemplo de salida de tree:
/etc/nginx
├── conf.d
│   ├── default.conf
│   └── ssl.conf
├── mime.types
├── modules-available
│   └── 50-mod-http-gzip.conf
├── modules-enabled
│   └── 50-mod-http-gzip.conf -> ../modules-available/50-mod-http-gzip.conf
├── nginx.conf
└── sites-enabled
    └── default -> ../sites-available/default
```

---

## 4.3 — Crear, copiar, mover y borrar

### `touch` — Crear archivos y actualizar timestamps

```bash
# Crear archivo vacío
touch nuevo.txt
touch archivo1.txt archivo2.txt archivo3.txt  # Varios a la vez

# Crear archivo con brace expansion (Módulo 03)
touch log_{error,access,debug}.txt

# touch actualiza el timestamp si el archivo ya existe
touch archivo_existente.txt   # Actualiza mtime a "ahora"
ls -l archivo_existente.txt

# Especificar fecha de timestamp
touch -d "2024-01-15 10:30" archivo.txt   # Fecha específica
touch -r referencia.txt destino.txt       # Copiar timestamp de otro archivo

# Opciones específicas
touch -a archivo.txt    # Solo actualizar atime (access time)
touch -m archivo.txt    # Solo actualizar mtime (modification time)
```

**Los tres timestamps de un archivo:**

| Timestamp | Descripción | Comando para ver |
|---|---|---|
| **atime** (access time) | Última vez que se leyó | `stat archivo` |
| **mtime** (modification time) | Última vez que cambió el contenido | `ls -l` |
| **ctime** (change time) | Última vez que cambió el inodo (metadatos) | `ls -lc` |

### `mkdir` — Crear directorios

```bash
# Crear directorio simple
mkdir nuevo_directorio

# Crear múltiples directorios
mkdir dir1 dir2 dir3

# Crear con estructura anidada (-p: crea padres intermedios si no existen)
mkdir -p proyectos/web/frontend/src
mkdir -p proyectos/web/frontend/src    # No da error si ya existe

# Brace expansion para crear estructura de proyecto completa
mkdir -p proyecto/{src/{components,utils,hooks},tests/{unit,integration},docs,public}

# Crear con permisos específicos
mkdir -m 755 directorio_publico
mkdir -m 700 directorio_privado

# Ver qué se crea (-v: verbose)
mkdir -pv estructura/profunda/directorio
# mkdir: created directory 'estructura'
# mkdir: created directory 'estructura/profunda'
# mkdir: created directory 'estructura/profunda/directorio'
```

### `rmdir` — Borrar directorios vacíos

```bash
# Solo funciona con directorios VACÍOS
rmdir directorio_vacio

# Borrar árbol de directorios vacíos de forma recursiva
rmdir -p padre/hijo/nieto    # Borra nieto, luego hijo, luego padre
                              # (solo si cada uno queda vacío)
```

### `cp` — Copiar archivos y directorios

```bash
# Copia básica de archivo
cp origen.txt destino.txt
cp origen.txt /directorio/destino/   # Dentro de directorio

# Copiar directorio y todo su contenido (requiere -r)
cp -r directorio_origen/ directorio_destino/

# Opciones importantes
cp -i origen.txt destino.txt    # Interactivo: pregunta antes de sobreescribir
cp -n origen.txt destino.txt    # No sobreescribir si existe (no-clobber)
cp -u origen.txt destino.txt    # Copiar solo si origen es más nuevo (update)
cp -v origen.txt destino.txt    # Verbose: mostrar lo que hace
cp -p origen.txt destino.txt    # Preservar: timestamps, permisos, propietario

# -a (archive): equivale a -dR --preserve=all
# Ideal para hacer copias de seguridad exactas
cp -a /home/juan/ /backup/juan/   # Copia exacta con todo preservado

# Copiar varios archivos a un directorio
cp archivo1.txt archivo2.txt imagen.png /destino/
cp *.txt /destino/    # Con globbing

# Copiar con barra: importante la diferencia
cp -r dir/  destino/    # Copia el CONTENIDO de dir dentro de destino/
cp -r dir   destino/    # Copia el DIRECTORIO dir como destino/dir/
```

:::warning
**Diferencia crítica de la barra al final:**
```bash
cp -r origen/  destino/   # El contenido de origen/ va en destino/
cp -r origen   destino/   # La carpeta origen completa va en destino/origen/
```
:::

### `mv` — Mover y renombrar

```bash
# Renombrar archivo
mv viejo.txt nuevo.txt

# Mover a otro directorio
mv archivo.txt /otro/directorio/

# Mover y renombrar a la vez
mv /ruta/vieja/nombre.txt /ruta/nueva/otro_nombre.txt

# Mover múltiples archivos a un directorio
mv archivo1.txt archivo2.txt directorio_destino/
mv *.log /var/log/backup/

# Opciones
mv -i origen destino    # Interactivo: preguntar antes de sobreescribir
mv -n origen destino    # No sobreescribir si destino existe
mv -v origen destino    # Verbose
mv -u origen destino    # Actualizar solo si origen es más nuevo

# mv es instantáneo si origen y destino están en el MISMO sistema de archivos
# (solo modifica el inodo). Si son sistemas diferentes, copia + borra.
```

**Renombrado masivo:**

```bash
# rename (Perl, disponible en Ubuntu/Debian)
rename 's/\.jpeg$/.jpg/' *.jpeg        # Cambiar extensión
rename 's/foto_/imagen_/g' foto_*.jpg  # Reemplazar texto
rename 'y/A-Z/a-z/' *.TXT             # A minúsculas

# mmv: Multiple Move (muy potente)
sudo apt install mmv
mmv '*.jpeg' '#1.jpg'     # Renombrar extensión masivamente
mmv 'foto_*' 'imagen_#1'  # Reemplazar prefijo
```

### `rm` — Borrar archivos (con precaución)

:::danger
**`rm` en Linux es irreversible.** No hay papelera de reciclaje, no hay "deshacer". Una vez borrado, solo se puede recuperar desde backups.
:::

```bash
# Borrar archivo
rm archivo.txt

# Borrar múltiples archivos
rm archivo1.txt archivo2.txt
rm *.log    # Con globbing — ¡ten cuidado con esto!

# Borrar directorio y todo su contenido (PELIGROSO)
rm -r directorio/

# Opciones
rm -i archivo.txt    # Interactivo: preguntar confirmación
rm -f archivo.txt    # Force: no preguntar, no error si no existe
rm -v archivo.txt    # Verbose: mostrar qué borra

# La combinación más peligrosa de Linux:
rm -rf directorio/   # Recursivo + sin preguntar
```

**Hábitos seguros con `rm`:**

```bash
# 1. Siempre usar -i por defecto (añadir a ~/.bashrc)
alias rm='rm -i'

# 2. Antes de borrar con glob, probar con ls
ls *.log          # Ver qué afectaría
rm *.log          # Luego borrar

# 3. Usar echo primero para comandos complejos
echo rm -r /ruta/directorio/     # Ver qué se ejecutaría
rm -r /ruta/directorio/          # Si parece correcto, quitar el echo

# 4. La triple verificación antes de rm -rf:
# - ¿Es el directorio correcto? pwd
# - ¿Hay backups? timeshift, rsync
# - ¿Realmente es necesario? ¿No basta con mv a /tmp?

# 5. Mover a /tmp en lugar de borrar (recuperable hasta el reinicio)
mv archivo_dudoso.txt /tmp/
```

**El infame `rm -rf /`:**

```bash
# Linux moderno protege contra este desastre:
rm -rf /        # Error: rm: it is dangerous to operate recursively on '/'
rm -rf --no-preserve-root /   # Esto SÍ destruye el sistema (no lo ejecutes)

# La historia: El comando que destruyó datos de millones:
# rm -rf /usr   # Un typo histórico (¡no ejecutar!)
```

### Papelera desde la terminal: `trash-cli`

```bash
# Instalar
sudo apt install trash-cli

# Mover a la papelera (recuperable)
trash-put archivo.txt
trash-put *.log

# Ver papelera
trash-list

# Vaciar papelera
trash-empty

# Restaurar archivos
trash-restore

# Alias para reemplazar rm con trash
alias rm='trash-put'   # Más seguro (pero diferente comportamiento)
```

---

## 4.4 — Comodines y globbing

*(Visto en detalle en [Módulo 03, sección 3.5](/terminal-y-shell#35--expansiones-de-la-shell). Aquí lo aplicamos al sistema de archivos.)*

El **globbing** (expansión de nombres de archivo) es una de las herramientas más potentes de la shell. La clave es que **la shell expande los globs ANTES de pasarlos al comando**. El programa recibe nombres de archivos reales, no el patrón.

```
Shell expande:    ls *.txt
               ↓
Shell ejecuta:  ls documento.txt notas.txt informe.txt
               ↓
ls recibe tres argumentos, no el asterisco
```

### Patrones básicos de globbing

```bash
# * → Cualquier secuencia de caracteres (incluida la vacía)
ls *.txt                    # Todos los .txt
ls *.                       # Archivos sin extensión
ls foto.*                   # Archivos llamados "foto" con cualquier extensión
ls /var/log/*.log            # .log en /var/log
ls /dev/sd*                 # Todos los discos sd*

# ? → Exactamente un carácter
ls archivo?.txt             # archivo1.txt, archivoa.txt (no archivo.txt)
ls /dev/sd?                 # sda, sdb, sdc (no sdaa)
ls 20??-??-??.log           # Fechas del formato YYYY-MM-DD

# [...] → Uno de los caracteres del conjunto
ls archivo[123].txt         # archivo1, archivo2, archivo3
ls /dev/sd[abc]             # sda, sdb, sdc
ls [Dd]ocumentos            # Documentos o documentos

# Rangos en [...]
ls *[0-9].txt               # Terminan en dígito + .txt
ls [A-Z]*                   # Empiezan con mayúscula
ls [a-zA-Z0-9_]*            # Empiezan con alfanumérico o guión bajo

# Negación con [!] o [^]
ls [!.]*.txt                # .txt que NO empiezan con punto
ls [^aeiou]*                # No empiezan con vocal minúscula
```

### Globbing extendido con `shopt`

```bash
# Activar globbing extendido (generalmente necesitas habilitarlo)
shopt -s extglob

# Patrones extglob:
# ?(pat)   → Cero o una vez
# *(pat)   → Cero o más veces
# +(pat)   → Una o más veces
# @(pat)   → Exactamente una vez
# !(pat)   → Todo excepto el patrón

ls !(*.txt)                  # Todo excepto .txt
ls +(*.jpg|*.png)            # Solo .jpg o .png
rm !(archivo_importante.txt) # Borrar todo menos ese archivo

# globstar: ** para recursión profunda
shopt -s globstar
ls **/*.log                  # Todos los .log en cualquier subdirectorio
ls **/*.{py,js}              # Python y JavaScript en todo el árbol

# nullglob: glob vacío → lista vacía (en vez de dejar el glob literal)
shopt -s nullglob
for f in *.xyz; do echo "$f"; done  # No hace nada si no hay .xyz

# dotglob: incluir archivos ocultos (. prefix) en globs
shopt -s dotglob
ls *               # Incluye .bashrc, .config, etc.
```

### Globbing vs. Expresiones regulares

Esta confusión es muy común. Son sistemas completamente diferentes:

```
┌─────────────────────────────────────────────────────────────┐
│ GLOBBING (shell patterns)        │ EXPRESIONES REGULARES     │
├────────────────────────────────────────────────────────────┤
│ Usado por: ls, cp, mv, rm, etc.  │ Usado por: grep, sed, awk │
│ Expande la SHELL antes del cmd   │ El PROGRAMA los interpreta│
│                                  │                            │
│  *  = cualquier cadena           │  .* = cualquier cadena    │
│  ?  = un carácter                │  .  = un carácter         │
│  [abc] = uno de estos            │  [abc] = uno de estos ✓   │
│  [!x]  = negación                │  [^x]  = negación         │
│                                  │  +  = uno o más           │
│                                  │  ?  = cero o uno          │
│  No tiene | alternancia          │  | = alternancia          │
│  No tiene grupos ()              │  () = grupos              │
└─────────────────────────────────────────────────────────────┘
```

```bash
# GLOBBING (shell): para nombres de archivos
ls *.log                     # * en glob = cualquier cadena
ls archivo?.txt              # ? en glob = un carácter

# REGEX (grep): para contenido de archivos
grep "error.*timeout" syslog    # .* en regex = cualquier cadena
grep "^[0-9]\{3\}" numeros.txt  # ^ = inicio de línea

# NUNCA confundir:
ls *.log                     # ✅ Glob para nombres
grep "*.log" syslog          # ❌ Regex interpretado por grep (. = cualquier char)
grep ".*\.log" syslog        # ✅ Regex correcto para buscar "algo.log" en texto
```

---

## 4.5 — Inodos, enlaces y tipos de archivo

### El inodo: el concepto que lo explica todo

Un **inodo** (index node) es la estructura de datos que el sistema de archivos usa para almacenar los **metadatos** de un archivo. Cada archivo tiene exactamente un inodo.

```
Disco duro / SSD
│
├── Tabla de inodos (metadatos de cada archivo)
│   ├── Inodo 1: metadatos de /
│   ├── Inodo 2: metadatos de /home
│   ├── Inodo 1234567: ← Juan's archivo
│   │   ├── Tipo: archivo regular
│   │   ├── Permisos: rw-r--r--
│   │   ├── Propietario: UID 1000 (juan)
│   │   ├── Grupo: GID 1000 (juan)
│   │   ├── Tamaño: 2048 bytes
│   │   ├── atime: 2024-06-01 10:00
│   │   ├── mtime: 2024-05-30 09:00
│   │   ├── ctime: 2024-06-01 10:00
│   │   ├── Número de hard links: 1
│   │   └── Punteros a bloques de datos: [bloque_17, bloque_18]
│   └── ...
│
└── Bloques de datos (el contenido real de los archivos)
    ├── bloque_17: "Hola, esto es el contenido..."
    ├── bloque_18: "...continúa aquí."
    └── ...
```

**Lo que el inodo NO contiene:** El nombre del archivo. Los nombres están en los **directorios**. Un directorio es simplemente una tabla que mapea nombres a números de inodo.

```bash
# Ver número de inodo
ls -i archivo.txt
# 1234567 archivo.txt

# Ver información completa del inodo
stat archivo.txt
#   File: archivo.txt
#   Size: 2048       Blocks: 8    IO Block: 4096   regular file
# Device: fd01h/64769d   Inode: 1234567   Links: 1
# Access: (0644/-rw-r--r--)  Uid: ( 1000/   juan)  Gid: ( 1000/   juan)
# Access: 2024-06-01 10:00:00.000000000 +0000
# Modify: 2024-05-30 09:00:00.000000000 +0000
# Change: 2024-06-01 10:00:00.000000000 +0000
#  Birth: 2024-05-30 09:00:00.000000000 +0000
```

### Tipos de archivo en Linux

Linux tiene **7 tipos de archivo**. El primer carácter de los permisos en `ls -l` indica el tipo:

```
- archivo regular
d directorio
l enlace simbólico (symlink)
b dispositivo de bloque (disco duro, partición)
c dispositivo de carácter (tty, /dev/null)
p FIFO / named pipe
s socket de dominio Unix
```

```bash
# Identificar tipo con file (analiza el contenido)
file /bin/ls
# /bin/ls: ELF 64-bit LSB pie executable, x86-64, ...

file /etc/passwd
# /etc/passwd: ASCII text

file /dev/sda
# /dev/sda: block special (8/0)

file /dev/tty
# /dev/tty: character special (5/0)

file /run/docker.sock
# /run/docker.sock: socket

# Identificar tipo con ls -la (primer carácter)
ls -la /dev/ | head -15
# crw-rw-rw-  1 root video  1,  3  /dev/null     ← c = char device
# brw-rw----  1 root disk   8,  0  /dev/sda      ← b = block device
# drwxr-xr-x  3 root root        /dev/bus/       ← d = directory
# lrwxrwxrwx  1 root root        /dev/stdin -> /proc/self/fd/0  ← l = symlink
```

### Tipos de archivo en detalle

<Tabs>
<TabItem value="regular" label="Archivos regulares">

El tipo más común. Puede contener cualquier dato: texto, binarios, imágenes, scripts.

```bash
# Crear
touch archivo_vacio.txt
echo "contenido" > archivo_texto.txt

# Identificar
ls -la archivo.txt   # Empieza con -
file archivo.txt     # Tipo detallado del contenido

# Ver contenido según tipo
cat archivo_texto.txt          # Texto
hexdump -C archivo_binario.bin # Binario
xxd archivo.bin | head         # Con xxd
```

</TabItem>
<TabItem value="directorios" label="Directorios">

Un directorio es un archivo especial que contiene una tabla de pares (nombre → inodo).

```bash
# Crear directorio
mkdir mi_directorio

# Ver que es un tipo especial
ls -la    # Empieza con d
stat mi_directorio    # type: directory

# El tamaño de un directorio (4096) es el tamaño del bloque que ocupa,
# no el tamaño de su contenido
ls -la mi_directorio    # Size: 4096 (aunque esté vacío)
du -sh mi_directorio/   # Tamaño real del contenido
```

</TabItem>
<TabItem value="symlinks" label="Enlaces simbólicos">

Un enlace simbólico es un archivo que contiene el path de otro archivo. Similar a un "acceso directo" de Windows.

```bash
# Ver que es un symlink
ls -la /bin
# lrwxrwxrwx 1 root root 7 /bin -> usr/bin

# Listar symlinks en un directorio
find /etc -maxdepth 1 -type l -ls

# Seguir o no seguir symlinks
ls -l /etc/alternatives/editor    # Muestra el symlink
ls -lL /etc/alternatives/editor   # Sigue el symlink (muestra el archivo real)
```

</TabItem>
<TabItem value="devices" label="Dispositivos">

```bash
# Dispositivos de bloque: acceso en bloques (discos)
ls -la /dev/sd*
# brw-rw---- 1 root disk 8, 0 /dev/sda
# brw-rw---- 1 root disk 8, 1 /dev/sda1

# Los números 8,0 son major,minor device numbers
# major=8 → SCSI/SATA disk driver
# minor=0 → primer disco

# Dispositivos de carácter: acceso secuencial
ls -la /dev/null /dev/random /dev/tty
# crw-rw-rw- 1 root root  1, 3 /dev/null
# crw-rw-rw- 1 root root  1, 8 /dev/random
# crw-rw-rw- 1 root tty   5, 0 /dev/tty
```

</TabItem>
<TabItem value="pipes" label="FIFOs y Sockets">

```bash
# FIFO (named pipe): comunicación entre procesos
mkfifo mi_pipe
ls -la mi_pipe
# prw-r--r-- 1 juan juan 0 mi_pipe

# Uso básico de FIFO
cat < mi_pipe &     # Proceso lector (background)
echo "datos" > mi_pipe  # Proceso escritor → el lector los recibe

# Socket: comunicación entre procesos (bidireccional)
ls -la /run/docker.sock
# srw-rw---- 1 root docker /run/docker.sock
# s = socket

# Interactuar con un socket
curl --unix-socket /run/docker.sock http://localhost/version
```

</TabItem>
</Tabs>

### `ln` — Crear enlaces

#### Hard links (enlaces duros)

```bash
# Crear hard link
ln archivo_original.txt enlace_duro.txt

# Verificar: ambos apuntan al MISMO inodo
ls -li
# 1234567 -rw-r--r-- 2 juan juan 1024 archivo_original.txt
# 1234567 -rw-r--r-- 2 juan juan 1024 enlace_duro.txt
#          ↑ mismo inodo  ↑ 2 links

# Si borras el original, el enlace duro sobrevive
rm archivo_original.txt
cat enlace_duro.txt    # ¡Sigue funcionando! El inodo aún tiene 1 link
```

```
Cómo funcionan los hard links:

Directorio:
├── "archivo_original.txt"  →  inodo 1234567
└── "enlace_duro.txt"       →  inodo 1234567   (mismo inodo)

Inodo 1234567:
├── links: 2
├── datos: [bloque 100, bloque 101]
└── (otros metadatos)

Al borrar "archivo_original.txt":
├── "archivo_original.txt" es eliminado del directorio
├── Inodo 1234567: links decrementan a 1
└── Los datos PERSISTEN porque hay 1 link restante

Al borrar "enlace_duro.txt":
├── Inodo 1234567: links decrementan a 0
└── Los datos son liberados (el espacio se recupera)
```

**Limitaciones de los hard links:**
- No pueden cruzar sistemas de archivos (particiones diferentes)
- No se puede crear hard link de un directorio (por riesgo de ciclos en el árbol)

#### Symbolic links (enlaces simbólicos)

```bash
# Crear symlink
ln -s destino_real enlace_simbolico

# Ejemplos prácticos
ln -s /var/log syslog_link    # Symlink en dir actual → /var/log
ln -s /usr/bin/python3 python # "python" apunta a python3

# Symlinks relativos (más portables):
ln -s ../directorio/archivo enlace_relativo
# Más portable: funciona aunque muevas el árbol de directorios

# Symlinks absolutos:
ln -s /ruta/absoluta/archivo enlace_absoluto
# Más fácil de entender, pero frágil si mueves el árbol

# Verificar que es un symlink y adónde apunta
ls -la enlace_simbolico
# lrwxrwxrwx 1 juan juan 8 enlace_simbolico -> /var/log

readlink enlace_simbolico      # Solo la ruta de destino
readlink -f enlace_simbolico   # Ruta canónica (resuelve todos los symlinks)

# Symlink roto (dangling): el destino no existe
ln -s /no/existe enlace_roto
ls -la enlace_roto    # Se muestra en rojo (destino no existe)
file enlace_roto      # "broken symbolic link to '/no/existe'"
```

```
Cómo funcionan los symlinks:

Directorio:
└── "enlace_simbolico" → inodo 9999999

Inodo 9999999:
├── tipo: symlink
└── contenido: "/var/log"   ← El path almacenado

Cuando accedes a "enlace_simbolico":
1. Kernel lee inodo 9999999
2. Ve que es symlink, lee el path "/var/log"
3. Resuelve "/var/log" → inodo del directorio /var/log
4. Accede a ese inodo

Si el path destino no existe → symlink roto
```

**Tabla comparativa: Hard link vs. Symlink:**

| Aspecto | Hard Link | Symbolic Link |
|---|---|---|
| **¿Mismo inodo?** | Sí (son el mismo archivo) | No (es un archivo independiente) |
| **¿Cruza particiones?** | No | Sí |
| **¿Enlaza directorios?** | No (por convención) | Sí |
| **Si se borra el original** | El link sigue funcionando | El link queda roto |
| **Tamaño** | No ocupa espacio extra | Ocupa el tamaño del path |
| **Uso típico** | Backups eficientes, hardlinks de `/bin` → `/usr/bin` | Aliases de comandos, configuración |

```bash
# Caso práctico: ver los hard links de /bin (usrmerge)
ls -li /bin/ls /usr/bin/ls
# Mismo inodo → son hard links entre sí
```

---

## 4.6 — Buscar archivos

### `find` — La herramienta de búsqueda por excelencia

`find` es extremadamente potente. Busca archivos en el sistema de archivos en tiempo real (no usa índice, lee el árbol directamente).

**Sintaxis:**
```bash
find [punto_de_partida] [predicados] [acciones]
```

#### Búsqueda por nombre

```bash
# Por nombre exacto
find / -name "sshd_config"
# /etc/ssh/sshd_config

# Case-insensitive
find /home -iname "readme.md"

# Por patrón (con comillas para que NO expanda la shell)
find /var/log -name "*.log"           # Todos los .log
find /home/juan -name "*.py"          # Scripts Python
find / -name "config.yaml" 2>/dev/null  # Suprimir errores de permisos

# Por patrón en path completo
find / -path "*/nginx/*.conf"
```

#### Búsqueda por tipo

```bash
# Tipos: f (regular), d (directorio), l (symlink), b (bloque), c (carácter), p (fifo), s (socket)
find /etc -type f        # Solo archivos regulares en /etc
find /var -type d        # Solo directorios en /var
find /run -type s        # Solo sockets Unix en /run
find /dev -type b        # Solo dispositivos de bloque
find /tmp -type l        # Solo symlinks en /tmp
```

#### Búsqueda por tamaño

```bash
# Unidades: c=bytes, k=kilobytes, M=megabytes, G=gigabytes
find /var/log -size +100M          # Archivos mayores de 100 MB
find /tmp -size -10k               # Archivos menores de 10 KB
find /home -size +1G               # Archivos mayores de 1 GB
find / -size +500M -size -1G       # Entre 500 MB y 1 GB

# Archivos exactamente de 4096 bytes (1 bloque)
find /etc -size 4096c
```

#### Búsqueda por fecha

```bash
# -mtime N: modificado hace N*24h
find /var/log -mtime -1     # Modificado en las últimas 24h
find /var/log -mtime +7     # Modificado hace más de 7 días
find /var/log -mtime 1      # Modificado exactamente hace 1-2 días

# -mmin N: modificado hace N minutos
find /tmp -mmin -30         # Modificado en los últimos 30 min

# -newer referencia: más nuevo que el archivo de referencia
find /etc -newer /etc/passwd   # Archivos modificados después de passwd

# -atime: último acceso
# -ctime: último cambio de metadatos (inodo)
find /home -atime +30       # No accedido en más de 30 días
```

#### Búsqueda por propietario y permisos

```bash
# Por propietario
find /home -user juan            # Archivos de juan
find /tmp -user root             # Archivos de root en /tmp

# Por grupo
find /var -group www-data        # Archivos del grupo www-data

# Por permisos
find /usr/bin -perm 755          # Permisos exactos 755
find / -perm /4000               # Con SUID bit (peligrosos si mal configurados)
find / -perm /2000               # Con SGID bit
find / -perm /6000               # Con SUID o SGID
find /tmp -perm -002             # Con write para otros (world-writable)
```

#### Combinar predicados

```bash
# AND implícito (por defecto)
find /var/log -name "*.log" -size +10M     # .log Y mayor de 10M

# AND explícito
find /var/log -name "*.log" -and -size +10M

# OR
find /home -name "*.txt" -or -name "*.md"

# NOT
find /etc -not -name "*.conf"
find /etc ! -name "*.conf"    # Forma alternativa

# Agrupación
find /var -type f \( -name "*.log" -or -name "*.txt" \) -size +1M
```

#### Acciones de `find`

```bash
# -print (default): imprimir cada archivo encontrado
find /var/log -name "*.log" -print

# -ls: listar como 'ls -l'
find /var/log -name "*.log" -ls

# -delete: borrar los archivos encontrados
find /tmp -name "*.tmp" -mtime +7 -delete    # Limpiar viejos temporales

# -exec: ejecutar comando por cada archivo
find /var/log -name "*.log" -exec ls -lh {} \;
# {} = ruta del archivo encontrado
# \; = fin del comando -exec

# -exec con múltiples archivos (más eficiente: solo llama al cmd una vez)
find /var/log -name "*.log" -exec ls -lh {} +
# {} + pasa todos los archivos como argumentos de una sola llamada

# Ejemplos prácticos de -exec
# Comprimir todos los logs de más de 30 días
find /var/log -name "*.log" -mtime +30 -exec gzip {} \;

# Cambiar permisos de todos los .sh
find ~/scripts -name "*.sh" -exec chmod +x {} \;

# Borrar directorios vacíos
find /var -type d -empty -exec rmdir {} \;
```

#### `find` con `xargs` para procesamiento masivo

```bash
# -print0 y xargs -0: manejo seguro de nombres con espacios
find /home -name "*.log" -print0 | xargs -0 rm

# Equivalente a -exec pero más eficiente para muchos archivos
find /var/log -name "*.log" -print0 | xargs -0 ls -lh

# Con xargs -P para paralelismo
find /datos -name "*.mp4" -print0 | xargs -0 -P 4 -I {} ffmpeg -i {} {}.compressed.mp4

# -I {} permite posicionar el argumento en cualquier lugar
find /etc -name "*.conf" -print0 | xargs -0 -I {} cp {} {}.backup
```

#### Recetas de `find` para casos reales

```bash
# 1. Encontrar archivos grandes (>100 MB)
find / -xdev -type f -size +100M -exec ls -lh {} \; 2>/dev/null
# -xdev: no cruzar a otros sistemas de archivos

# 2. Encontrar duplicados (mismo nombre en distintos directorios)
find /home -name "*.jpg" | sort | uniq -d

# 3. Encontrar archivos modificados hoy
find /etc -newermt "$(date +%Y-%m-%d)" -type f

# 4. Limpiar archivos temporales de Python
find . -type f -name "*.pyc" -delete
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null

# 5. Encontrar archivos sin propietario (huérfanos — posible seguridad)
find / -xdev \( -nouser -o -nogroup \) 2>/dev/null

# 6. Backup incremental: solo archivos modificados en las últimas 24h
find /datos -mtime -1 -exec cp -a {} /backup/ \;

# 7. Encontrar archivos con permisos peligrosos
find / -perm /4000 -type f 2>/dev/null    # SUID files
find /tmp -perm -0002 -type f             # World-writable en /tmp
```

### `locate` / `plocate` — Búsqueda instantánea por índice

A diferencia de `find`, `locate` usa un índice pre-construido, haciendo la búsqueda **casi instantánea**.

```bash
# Instalar
sudo apt install plocate   # Moderno y rápido (reemplaza mlocate)

# Actualizar la base de datos (necesario antes del primer uso)
sudo updatedb

# Buscar
locate sshd_config       # Encuentra /etc/ssh/sshd_config
locate "*.conf"          # Todos los .conf
locate -i "readme"       # Case-insensitive

# Contar cuántos hay
locate -c "*.py"

# Estadísticas de la base de datos
locate -S
# Database /var/lib/plocate/plocate.db:
#   Directories: 62,543
#   Files: 743,211
#   File names: 24,123,456 bytes

# Filtrar solo archivos existentes (la BD puede estar desactualizada)
locate -e "*.conf"        # -e: verificar existencia real

# Actualización automática con cron
cat /etc/cron.daily/plocate
```

**`locate` vs. `find`:**

| Aspecto | `find` | `locate` |
|---|---|---|
| **Velocidad** | Lento (lee disco) | Instantáneo (índice) |
| **Resultados** | Siempre actualizados | Pueden estar desactualizados |
| **Búsqueda por** | Nombre, tipo, tamaño, fecha, permisos | Solo nombre |
| **Necesita root** | Para algunos directorios | No |
| **Uso típico** | Búsquedas complejas, scripts | Encontrar un archivo rápidamente |

### `fd` — La alternativa moderna a `find`

[`fd`](https://github.com/sharkdp/fd) es una herramienta escrita en Rust que reemplaza `find` con una interfaz más amigable y mayor velocidad.

```bash
# Instalar
sudo apt install fd-find   # Ubuntu (comando: fdfind o fd)
sudo dnf install fd        # Fedora

# Uso (más simple que find)
fd "patrón"              # Buscar por nombre (case-insensitive por defecto)
fd "\.log$"              # Con regex
fd -e log                # Por extensión
fd -t f "config"         # Solo archivos
fd -t d "src"            # Solo directorios
fd --hidden "\.env"      # Incluir ocultos

# Con acciones
fd "\.tmp$" --exec rm    # Borrar todos los .tmp

# Comparativa
find . -name "*.py" -type f  # find clásico
fd -e py                      # fd equivalente (más corto)
```

### `fzf` — Búsqueda interactiva fuzzy

```bash
# Instalar
sudo apt install fzf

# Búsqueda interactiva de archivos
find . | fzf
fzf --preview 'cat {}'   # Con preview del contenido

# Integración con bash (ctrl+T para buscar archivos, ctrl+R para historial)
source /usr/share/doc/fzf/examples/key-bindings.bash
source /usr/share/bash-completion/completions/fzf

# Ejemplo: abrir archivo con vim usando fzf
vim $(find . -name "*.py" | fzf)
```

---

## 4.7 — Espacio en disco

### `df` — Disk Free (espacio disponible por partición)

```bash
# Uso básico
df
# Filesystem     1K-blocks    Used Available Use% Mounted on
# /dev/sda4      51198976 15234560  33348864  32% /
# /dev/sda5     440294912 87234560 330476416  21% /home

# Opciones comunes
df -h          # Human-readable (KB, MB, GB)
df -H          # Idem pero en base 1000 (SI)
df -T          # Mostrar tipo de sistema de archivos
df -i          # Mostrar uso de inodos en lugar de bloques
df -x tmpfs    # Excluir un tipo de filesystem

# Ver solo el sistema de archivos de un directorio
df -h /home
df -h .        # Del directorio actual

# Todos los sistemas de archivos (incluyendo virtuales)
df -a
```

**Interpretar la salida:**

```bash
df -hT
# Filesystem     Type     Size  Used Avail Use% Mounted on
# /dev/sda4      ext4      49G   15G   32G  32% /
# /dev/sda5      ext4     420G   84G  315G  21% /home
# tmpfs          tmpfs    3.9G  1.2M  3.9G   1% /run
# /dev/sda1      vfat     511M  6.1M  505M   2% /boot/efi

# Columnas:
# Filesystem: El dispositivo o fuente
# Type: Sistema de archivos (ext4, btrfs, tmpfs, vfat)
# Size: Capacidad total
# Used: Espacio usado
# Avail: Espacio disponible
# Use%: Porcentaje usado (alerta si > 85%)
# Mounted on: Punto de montaje
```

### `du` — Disk Usage (espacio ocupado por directorios)

```bash
# Tamaño del directorio actual
du -sh .
# 156M  .

# Tamaño de un directorio específico
du -sh /var/log
# 234M /var/log

# Desglose por subdirectorios (profundidad 1)
du -h --max-depth=1 /var
# 4.0K  /var/backups
# 234M  /var/log
# 12M   /var/cache
# 8.0M  /var/lib

# Ordenar por tamaño (mayor primero)
du -sh /var/* | sort -rh | head -10

# Todos los archivos (no solo directorios)
du -ah /etc | sort -rh | head -20

# Excluir un patrón
du -sh --exclude=".git" .

# Tamaño aparente vs. tamaño real en disco
du -sh archivo.txt              # Tamaño en bloques (múltiplo de 4096)
du --apparent-size -sh archivo  # Tamaño real del contenido
```

### `ncdu` — Navegador interactivo de uso de disco

`ncdu` (NCurses Disk Usage) es una herramienta interactiva que facilita enormemente encontrar qué ocupa espacio.

```bash
# Instalar
sudo apt install ncdu

# Escanear directorio y navegar
ncdu /home/juan
ncdu /var
ncdu /    # Todo el sistema (puede tardar)

# Controles dentro de ncdu:
# ↑/↓       → Navegar entre directorios/archivos
# Enter/→    → Entrar en directorio
# ←/q        → Salir del directorio actual / salir de ncdu
# d          → Borrar directorio o archivo seleccionado (¡con cuidado!)
# n/s/a      → Ordenar por nombre/tamaño/archivos
# i          → Info del archivo
# g          → Mostrar % como gráfica de barras
# r          → Re-escanear
# ?          → Ayuda
```

```
Vista típica de ncdu:
─────────────────────────────────────────────────
 ncdu 1.17 ~ Use the arrow keys to navigate, press ? for help
─────────────────────────────────────────────────
    156.0 GiB [##########] /var
     82.3 GiB [#####     ]  lib
     45.2 GiB [###       ]  log
     28.5 GiB [##        ]  cache
      0.1 GiB [          ]  backups
─────────────────────────────────────────────────
 Total disk usage: 156.0 GiB  Apparent size: 154.2 GiB
```

### Archivos dispersos (sparse files)

Un **archivo disperso** (sparse file) es un archivo que aparentemente ocupa mucho espacio pero físicamente solo almacena los bloques que contienen datos reales (los bloques de ceros no se guardan).

```bash
# Crear un archivo sparse de 1 GB
dd if=/dev/zero of=sparse.img bs=1 count=0 seek=1G

# Comparar tamaño aparente vs. tamaño real
ls -lh sparse.img        # 1.0G  (tamaño aparente)
du -sh sparse.img        # 0     (tamaño real en disco — solo headers)
du --apparent-size -sh sparse.img  # 1.0G (aparente)

# Usos comunes de sparse files:
# - Imágenes de disco virtual (VMs: qcow2, vmdk)
# - Bases de datos (ZFS, PostgreSQL en algunos casos)
# - Checkpoints de Docker

# Ver si un archivo es sparse
stat sparse.img | grep -E "Blocks|Size"
# Size: 1073741824    Blocks: 8          IO Block: 4096
# (8 bloques = 4096 bytes, pero el tamaño es 1 GB)
```

### Estrategia para liberar espacio

```bash
# 1. Encontrar qué ocupa más (con ncdu o du)
sudo ncdu /

# 2. Limpiar paquetes
sudo apt autoremove --purge    # Paquetes huérfanos
sudo apt clean                 # Limpiar caché de paquetes descargados
sudo apt autoclean             # Limpiar paquetes obsoletos del caché

# 3. Limpiar logs viejos
sudo journalctl --vacuum-time=7d    # Borrar logs systemd de más de 7 días
sudo journalctl --vacuum-size=200M  # Limitar a 200 MB

# 4. Limpiar /tmp
sudo rm -rf /tmp/*    # (con cuidado, puede afectar procesos corriendo)

# 5. Encontrar archivos grandes huérfanos
find / -size +500M -type f 2>/dev/null

# 6. Limpiar Flatpak no usados
flatpak uninstall --unused
flatpak repair --system

# 7. Docker (si aplica)
docker system prune -af    # Contenedores, imágenes y volumes no usados
```

---

## Anexos

### A. Tabla resumen: Comandos de gestión de archivos

| Operación | Comando | Opción clave | Precaución |
|---|---|---|---|
| Ver directorio actual | `pwd` | `-P` físico | — |
| Cambiar directorio | `cd ruta` | `cd -` vuelve atrás | — |
| Listar archivos | `ls -la` | `-h` legible, `-S` por tamaño | — |
| Árbol visual | `tree -L 2` | `-a` ocultos | — |
| Crear archivo | `touch archivo` | `-d` con fecha | — |
| Crear directorio | `mkdir -p ruta` | `-m` con permisos | — |
| Copiar | `cp -a orig dest` | `-i` interactivo | Sobreescritura |
| Mover/renombrar | `mv -i orig dest` | `-n` no sobreescribir | — |
| Borrar archivo | `rm -i archivo` | `-f` forzar | **Irreversible** |
| Borrar directorio | `rm -rf dir/` | — | **MUY PELIGROSO** |
| Crear symlink | `ln -s destino link` | — | Verificar ruta |
| Ver tipo de archivo | `file nombre` | — | — |
| Info de inodo | `stat nombre` | — | — |
| Buscar archivos | `find . -name "*.log"` | `-exec`, `-delete` | — |
| Búsqueda rápida | `locate nombre` | `-e` verificar existencia | BD puede ser vieja |
| Espacio por partición | `df -hT` | `-i` inodos | — |
| Espacio por directorio | `du -sh dir/` | `--max-depth` | — |
| Navegación interactiva | `ncdu /` | `d` para borrar | — |

### B. Estructura de directorios según FHS 3.0 (referencia rápida)

```
/               Sistema raíz
├── /bin        → /usr/bin     Comandos de usuario esenciales
├── /boot       Kernel, initrd, GRUB (no tocar)
├── /dev        Dispositivos de hardware (gestionado por udev)
├── /etc        Configuración del sistema (archivos de texto)
├── /home       Datos de usuarios
├── /lib        → /usr/lib     Bibliotecas esenciales
├── /media      Medios removibles (auto-montados)
├── /mnt        Montajes temporales manuales
├── /opt        Software de terceros autocontenido
├── /proc       Virtual: procesos y estado del kernel
├── /root       Home del usuario root
├── /run        Runtime (PIDs, sockets) — en tmpfs
├── /sbin       → /usr/sbin    Comandos de administración
├── /srv        Datos servidos (web, ftp)
├── /sys        Virtual: dispositivos y drivers del kernel
├── /tmp        Temporales (se borran al reiniciar)
└── /usr        Jerarquía de software instalado
    ├── /usr/bin          Comandos de usuario
    ├── /usr/include      Headers de desarrollo
    ├── /usr/lib          Bibliotecas
    ├── /usr/local        Software local (no APT/DNF)
    ├── /usr/sbin         Comandos de admin
    └── /usr/share        Datos independientes de arch
        ├── /usr/share/doc    Documentación de paquetes
        ├── /usr/share/man    Páginas man
        └── /usr/share/locale Traducciones
└── /var        Datos variables
    ├── /var/cache        Caches de apps
    ├── /var/lib          Estado de apps (bases de datos, etc.)
    ├── /var/log          Logs del sistema
    └── /var/spool        Colas (cron, impresión)
```

### C. Referencias cruzadas entre módulos

```
◀ Módulo 01 — Introducción al mundo Linux
│  Sección 1.3: "Todo es un archivo"
│  → La materialización completa de este principio está en 4.5
│    (inodos, tipos de archivo, dispositivos en /dev)
│  Sección 1.3: "Texto plano como interfaz universal"
│  → /etc contiene EXCLUSIVAMENTE archivos de texto plano

◀ Módulo 02 — Instalación y primer contacto
│  Sección 2.3: Particionado (/, /home, /boot/efi, swap)
│  → Ahora entiendes qué hay en cada partición y por qué
│  Sección 2.6: Drivers en /dev, logs en /var/log
│  → journalctl y /var/log/syslog son el resultado del arranque

◀ Módulo 03 — La terminal y la shell
│  Sección 3.5: Globbing (* ? [...])
│  → Usado extensamente en este módulo para ls, find, cp, rm
│  Sección 3.6: Variables $HOME, $PATH, $PWD, $OLDPWD
│  → Directamente relacionadas con la navegación de este módulo

▶ Módulo 05 — Archivos y procesamiento de texto
│  → cat, head, tail, grep, sed, awk sobre los archivos de /etc, /var/log
│  → find -exec grep es el patrón más potente de búsqueda

▶ Módulo 07 — Usuarios, grupos y permisos
│  → Los permisos que aparecen en ls -la se estudian en detalle
│  → chown, chmod, chgrp operan sobre los inodos de este módulo

▶ Módulo 12 — Almacenamiento avanzado
│  → LVM, RAID, btrfs, ZFS: sistemas de archivos avanzados
│  → mount, fstab, /etc/fstab se estudian en detalle
```

### D. Laboratorio de find avanzado

```bash
# Lab: Auditoría de seguridad básica con find

# 1. Encontrar todos los archivos con SUID activado
sudo find / -perm /4000 -type f 2>/dev/null | sort

# 2. Encontrar archivos modificados en las últimas 24h en /etc
find /etc -mtime -1 -type f | sort

# 3. Encontrar directorios con escritura para todos
find / -xdev -type d -perm -0002 -not -perm -1000 2>/dev/null

# 4. Encontrar archivos vacíos en /etc
find /etc -empty -type f

# 5. Encontrar los 10 archivos más grandes en el sistema
find / -xdev -type f 2>/dev/null | xargs ls -s 2>/dev/null | sort -rn | head -10

# 6. Encontrar archivos de log que no han sido rotados en 30 días
find /var/log -name "*.log" -mtime +30 -size +10M

# 7. Generar reporte de estructura de /etc
find /etc -maxdepth 2 -type f | \
    awk -F/ 'NF==4{print $3}' | sort | uniq -c | sort -rn | head -20
```

---

## Referencias y Bibliografía

### Estándares y especificaciones

1. **Filesystem Hierarchy Standard (FHS) 3.0**  
   https://refspecs.linuxfoundation.org/FHS_3.0/fhs-3.0.html  
   La especificación oficial que define la estructura de directorios Linux.

2. **POSIX.1-2017: File System Interfaces**  
   https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap10.html  
   Estándar POSIX para el sistema de archivos (compatible con POSIX visto en Módulo 01).

### Documentación oficial de herramientas

3. **GNU Coreutils Manual: File operations**  
   https://www.gnu.org/software/coreutils/manual/html_node/Basic-operations.html  
   Documentación oficial de cp, mv, rm, ln, mkdir, touch.

4. **find(1) — Linux man page**  
   https://man7.org/linux/man-pages/man1/find.1.html  
   Manual completo del comando find con todos sus predicados.

5. **GNU findutils Manual**  
   https://www.gnu.org/software/findutils/manual/html_mono/find.html  
   Manual completo del conjunto find/locate/xargs.

6. **ls(1) — GNU Coreutils**  
   https://man7.org/linux/man-pages/man1/ls.1.html  
   Todas las opciones del comando ls.

7. **stat(1) — man page**  
   https://man7.org/linux/man-pages/man1/stat.1.html  
   Ver información de inodos y timestamps.

8. **du(1) y df(1) — man pages**  
   https://man7.org/linux/man-pages/man1/du.1.html  
   https://man7.org/linux/man-pages/man1/df.1.html

### Sistemas de archivos y kernel

9. **The Linux Virtual File System (VFS)**  
   https://www.kernel.org/doc/html/latest/filesystems/vfs.html  
   Documentación oficial del kernel sobre la capa VFS.

10. **procfs(5) — Linux man page**  
    https://man7.org/linux/man-pages/man5/proc.5.html  
    Documentación completa del sistema de archivos /proc.

11. **sysfs(5) — Linux man page**  
    https://man7.org/linux/man-pages/man5/sysfs.5.html  
    Documentación del sistema de archivos /sys.

12. **inode(7) — Linux man page**  
    https://man7.org/linux/man-pages/man7/inode.7.html  
    Descripción del concepto de inodo en Linux.

13. **Understanding the Linux Virtual Memory Manager** — Mel Gorman  
    https://www.kernel.org/doc/gorman/html/understand/  
    Para profundizar en cómo Linux gestiona el sistema de archivos en memoria.

### Herramientas modernas

14. **fd — A simple, fast, and user-friendly alternative to find**  
    https://github.com/sharkdp/fd  
    Documentación de fd, incluyendo benchmarks comparativos.

15. **fzf — A command-line fuzzy finder**  
    https://github.com/junegunn/fzf  
    Documentación oficial de fzf con ejemplos de integración.

16. **ncdu Manual**  
    https://dev.yorhel.nl/ncdu/man  
    Manual del navegador interactivo de disco.

17. **plocate**  
    https://plocate.sesse.net/  
    Documentación del moderno reemplazante de mlocate.

### Libros de referencia

18. **The Linux Command Line** — William Shotts (2nd Ed., 2019)  
    https://linuxcommand.org/tlcl.php  
    Disponible gratuitamente online. Capítulos 3-11 cubren este módulo.

19. **Unix and Linux System Administration Handbook** — Evi Nemeth et al.  
    Addison-Wesley, 5ª edición (2017). Capítulo 5: The Filesystem.

20. **Linux System Programming** — Robert Love (2013)  
    O'Reilly. Capítulos 1-3 sobre el VFS y llamadas al sistema relacionadas.

21. **How Linux Works** — Brian Ward (3rd Ed., 2021)  
    No Starch Press. Capítulos 3-4: Archivos y estructura del sistema.

22. **Advanced Programming in the UNIX Environment** — Stevens & Rago  
    Addison-Wesley, 3ª edición. Capítulos 3-4: File I/O, Files and Directories.

---

## Preguntas de autoevaluación

1. ¿Qué es el FHS y por qué es importante para la interoperabilidad entre distribuciones?
2. ¿Qué contienen `/etc`, `/var` y `/usr` respectivamente? ¿Por qué están separados?
3. ¿Qué son `/proc` y `/sys`? ¿Por qué no ocupan espacio real en disco?
4. Explica la diferencia entre ruta absoluta y ruta relativa con un ejemplo.
5. ¿Para qué sirve la entrada `..` en el sistema de archivos? ¿Cuántos `..` tiene la raíz `/`?
6. ¿Qué es un inodo? ¿Qué información contiene y qué información NO contiene?
7. ¿Cuál es la diferencia fundamental entre un hard link y un symbolic link? ¿Cuándo usarías cada uno?
8. ¿Por qué un hard link no puede cruzar entre diferentes particiones?
9. Escribe el comando `find` para encontrar todos los archivos `.conf` en `/etc` modificados en los últimos 7 días y mostrarlos con `ls -la`.
10. ¿Cuál es la diferencia entre `du` y `df`? ¿Cuándo usarías cada uno?
11. ¿Qué es un archivo disperso (sparse file)? ¿En qué situaciones aparecen?
12. Explica qué pasa exactamente cuando ejecutas `rm archivo.txt` a nivel de inodo.

---

## Laboratorios prácticos

### Lab 4.1 — Explorar la jerarquía FHS

```bash
# 1. Ejecutar los siguientes comandos y documentar qué información muestra cada uno:
ls /
cat /etc/os-release
cat /proc/cpuinfo | head -30
cat /proc/meminfo | head -10
ls -la /bin
# ¿/bin es un directorio o un symlink?

# 2. Encontrar cuántos archivos de configuración hay en /etc
find /etc -maxdepth 1 -type f | wc -l

# 3. Ver los 5 subdirectorios más grandes en /var
du -sh /var/* 2>/dev/null | sort -rh | head -5
```

### Lab 4.2 — Navegación avanzada

```bash
# 1. Practicar pushd/popd con 4 directorios diferentes
pushd /var/log
pushd /etc
pushd /tmp
pushd /home
dirs -v    # Ver la pila
popd       # Volver uno a uno
popd
popd
popd

# 2. Crear una estructura de proyecto completa con una sola línea
mkdir -p ~/practica-lab4/{src/{components,utils},tests/{unit,e2e},docs,config}
tree ~/practica-lab4/
```

### Lab 4.3 — Crear, copiar, mover y borrar

```bash
# 1. Trabajar en /tmp para este lab
cd /tmp && mkdir lab4 && cd lab4

# 2. Crear estructura de archivos
touch archivo_{1..5}.txt
mkdir -p directorio_{A,B}
echo "contenido" > archivo_1.txt

# 3. Copiar preservando metadata
cp -av archivo_1.txt directorio_A/copia.txt

# 4. Mover archivos con globbing
mv archivo_{2,3}.txt directorio_B/

# 5. Renombrar masivo (si tienes rename)
ls *.txt
rename 's/archivo_/doc_/' *.txt
ls *.txt

# 6. Verificar que rm -i pregunta
rm -i doc_1.txt    # Responder 'n'

# 7. Limpiar
cd /tmp && rm -rf lab4/
```

### Lab 4.4 — Inodos y tipos de archivo

```bash
# 1. Crear hard links y verificar
echo "contenido original" > /tmp/original.txt
ln /tmp/original.txt /tmp/hard_link.txt
ls -li /tmp/original.txt /tmp/hard_link.txt
# Deben tener el mismo número de inodo

# 2. ¿Qué pasa al borrar el original?
rm /tmp/original.txt
cat /tmp/hard_link.txt    # ¿Sigue funcionando?

# 3. Crear symlink y explorar
ln -s /var/log /tmp/logs_link
ls -la /tmp/logs_link
file /tmp/logs_link
readlink /tmp/logs_link
ls /tmp/logs_link/         # Acceder a través del symlink

# 4. Crear symlink roto
ln -s /no/existe /tmp/link_roto
ls -la /tmp/link_roto       # Se muestra en rojo o con flecha
file /tmp/link_roto         # "broken symbolic link"
```

### Lab 4.5 — find en práctica

```bash
# 1. Encontrar todos los archivos .conf en /etc (solo en el primer nivel)
find /etc -maxdepth 1 -name "*.conf" -type f

# 2. Encontrar archivos modificados en las últimas 2 horas
find /var/log -mmin -120 -type f | head -10

# 3. Encontrar los 5 archivos más grandes en /usr/bin
find /usr/bin -type f -exec ls -s {} \; | sort -rn | head -5

# 4. Contar archivos por tipo en /dev
echo "Block devices:" && find /dev -type b | wc -l
echo "Char devices:"  && find /dev -type c | wc -l
echo "Symlinks:"       && find /dev -type l | wc -l
echo "Sockets:"        && find /dev -type s | wc -l
```

### Lab 4.6 — Espacio en disco

```bash
# 1. Ver uso de disco por sistema de archivos
df -hT

# 2. Encontrar los directorios más grandes en /var
du -h --max-depth=2 /var 2>/dev/null | sort -rh | head -10

# 3. Cuánto espacio ocupan los logs de systemd
journalctl --disk-usage

# 4. Ver archivos de caché de APT
du -sh /var/cache/apt/archives/

# 5. Instalar y usar ncdu (si tienes conexión)
sudo apt install ncdu
ncdu /home    # Explorar interactivamente
```

---

## Resumen del módulo

✅ **Jerarquía FHS:** Conoces el propósito de cada directorio y dónde va cada cosa  
✅ **Sistemas virtuales:** `/proc`, `/sys` y `/dev` no son discos: son el kernel hablando  
✅ **Navegación:** Rutas absolutas/relativas, `cd`, `pushd`/`popd`, `ls` con todas sus opciones  
✅ **Gestión de archivos:** `cp`, `mv`, `rm`, `mkdir`, `touch` con hábitos seguros  
✅ **Inodos:** Entiendes la capa fundamental que sustenta todo el sistema de archivos  
✅ **Tipos de archivo:** Los 7 tipos y cómo identificarlos con `file` y `stat`  
✅ **Hard links vs. symlinks:** Diferencia conceptual y práctica  
✅ **`find`:** El comando más potente para buscar; predicados, combinaciones y acciones  
✅ **`locate`/`fd`/`fzf`:** Alternativas para diferentes casos de uso  
✅ **Espacio en disco:** `df`, `du`, `ncdu` para diagnosticar y liberar espacio  

**Próximo paso:** [Módulo 05 — Archivos y procesamiento de texto](/archivos-y-procesamiento-de-texto). Aprenderás a leer, filtrar y transformar el contenido de los archivos que acabas de aprender a gestionar.

---

**Última actualización:** 2024-06  
**Versión:** 1.0  
**Estado:** ✅ Listo para enseñanza
