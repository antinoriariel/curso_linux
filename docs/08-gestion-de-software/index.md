---
title: "Módulo 08 — Gestión de software"
sidebar_label: "08 · Gestión de software"
description: Gestores de paquetes apt, dnf, pacman y zypper; repositorios y firmas GPG, Flatpak, Snap, AppImage, compilación desde código fuente y mantenimiento del sistema.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Módulo 08 — Gestión de software

## Introducción

Instalar software en Linux es radicalmente distinto a Windows o macOS. En lugar de descargar instaladores `.exe` de páginas web (con el riesgo de malware que eso conlleva), Linux usa **repositorios centralizados**: almacenes de miles de paquetes verificados criptográficamente, mantenidos por la distribución, donde las **dependencias se resuelven automáticamente** y **todo el sistema se actualiza con un solo comando**.

Esta diferencia no es cosmética: es uno de los mayores logros de ingeniería del ecosistema Linux. Un servidor Debian puede tener 1.500 paquetes instalados, cada uno con sus dependencias exactas, y actualizarse completo —kernel incluido— con `apt full-upgrade`. Ningún paquete pisa los archivos de otro, porque el gestor lleva un registro exacto de qué archivo pertenece a qué paquete.

Ya usaste `sudo apt install` varias veces en módulos anteriores (por ejemplo, para instalar `tree` en el [Módulo 04](/sistema-de-archivos), `ripgrep` en el [Módulo 05](/archivos-y-procesamiento-de-texto) o `vim` en el [Módulo 06](/editores-de-texto)). Y en el [Módulo 07](/usuarios-grupos-y-permisos) entendiste por qué instalar requiere `sudo`: los paquetes escriben en `/usr/`, `/etc/` y `/var/`, territorios de `root`. En este módulo entenderás **qué pasa realmente debajo de esos comandos** y dominarás los gestores de todas las grandes familias de distribuciones.

### Objetivos de aprendizaje

Al finalizar este módulo, serás capaz de:

- ✅ Explicar qué contiene un paquete, qué es un repositorio y cómo se verifican las firmas GPG
- ✅ Entender el problema de las dependencias y cómo lo resuelven los gestores
- ✅ Dominar APT (Debian/Ubuntu): instalar, actualizar, buscar, inspeccionar y reparar
- ✅ Usar `dpkg` para operaciones de bajo nivel sobre paquetes `.deb`
- ✅ Manejar DNF/RPM (Fedora/RHEL) y reconocer `pacman`, `zypper` y `apk`
- ✅ Usar Flatpak, Snap y AppImage sabiendo cuándo conviene cada uno
- ✅ Compilar e instalar software desde el código fuente sin ensuciar el sistema
- ✅ Mantener el sistema: actualizaciones automáticas, limpieza de cachés y huérfanos
- ✅ Diagnosticar y reparar los problemas más comunes (bases de datos bloqueadas, dependencias rotas, claves expiradas)

---

## 8.1 — Conceptos: paquetes, repositorios y dependencias

### ¿Qué es un paquete?

Un paquete es un **archivo comprimido con estructura estandarizada** que contiene:

```
┌─────────────────────────────────────────────────────────────┐
│              Anatomía de un paquete (.deb / .rpm)           │
│                                                             │
│  1. LOS ARCHIVOS DEL PROGRAMA                               │
│     /usr/bin/htop              ← el ejecutable              │
│     /usr/share/man/man1/htop.1.gz  ← su página man          │
│     /usr/share/applications/htop.desktop ← entrada de menú  │
│     /usr/share/doc/htop/       ← documentación              │
│                                                             │
│  2. METADATOS                                               │
│     Nombre:      htop                                       │
│     Versión:     3.3.0-4                                    │
│     Arquitectura: amd64                                     │
│     Descripción: interactive process viewer                 │
│     Mantenedor:  Daniel Lange <...@debian.org>              │
│                                                             │
│  3. DEPENDENCIAS                                            │
│     Depends: libc6 (>= 2.34), libncursesw6 (>= 6.1), ...    │
│     Recommends: lsof, strace                                │
│     Conflicts/Replaces/Provides: ...                        │
│                                                             │
│  4. SCRIPTS DE INSTALACIÓN (maintainer scripts)             │
│     preinst / postinst / prerm / postrm                     │
│     (ej.: crear el usuario 'mysql' al instalar mysql-server)│
└─────────────────────────────────────────────────────────────┘
```

```bash
# Un .deb es en realidad un archivo 'ar' con tres miembros
# (¡usa lo aprendido en el Módulo 05 sobre archivado!)
ar t htop_3.3.0-4_amd64.deb
# debian-binary          ← versión del formato
# control.tar.zst        ← metadatos y scripts
# data.tar.zst           ← los archivos del programa

# Ver los metadatos de un .deb sin instalarlo
dpkg --info htop_3.3.0-4_amd64.deb

# Ver qué archivos contiene sin instalarlo
dpkg --contents htop_3.3.0-4_amd64.deb
```

### ¿Qué es un repositorio?

Un repositorio es un **servidor HTTP(S) con un índice firmado de paquetes**. La distribución mantiene varios; los *mirrors* (espejos) son copias en universidades y empresas de todo el mundo para repartir la carga.

```
        Flujo de una instalación con APT
        ─────────────────────────────────

  sudo apt update
        │
        ▼
┌──────────────────┐   descarga índices    ┌──────────────────────┐
│  Tu sistema      │ ◀──────────────────── │ Repositorio (mirror)  │
│                  │   InRelease (firmado) │ deb.debian.org        │
│ /var/lib/apt/    │   Packages.xz         │ archive.ubuntu.com    │
│ lists/           │                       │                       │
└──────────────────┘                       └──────────────────────┘
        │
        │ 1. Verifica la firma GPG del índice
        │    con las claves de /etc/apt/keyrings/ y trusted.gpg.d/
        │ 2. Cada paquete del índice incluye su hash SHA-256
        ▼
  sudo apt install htop
        │
        │ 3. Resuelve dependencias (htop → libncursesw6 → libc6)
        │ 4. Descarga los .deb a /var/cache/apt/archives/
        │ 5. Verifica el SHA-256 de cada .deb contra el índice firmado
        │ 6. dpkg desempaqueta y ejecuta los scripts postinst
        ▼
     htop instalado y registrado en la base de datos de dpkg
```

:::info **La cadena de confianza**
Tú nunca verificas manualmente nada: la clave pública de la distribución viene preinstalada, firma el índice, y el índice contiene los hashes de cada paquete. Si un atacante compromete un mirror y modifica un `.deb`, el hash no coincidirá y APT rechazará la instalación. Esta es la razón por la que añadir repositorios de terceros (y sus claves) **es un acto de confianza total**: les das el mismo poder que a Debian/Ubuntu.
:::

### El problema de las dependencias

Casi ningún programa es autosuficiente. `htop` necesita `libncursesw6` para dibujar la interfaz; `libncursesw6` necesita `libc6`; y `libc6` lo necesita prácticamente todo. Antes de los gestores modernos, instalar algo era el famoso **dependency hell**: descargar un RPM, que fallara por una librería faltante, buscarla, que esa fallara por otra...

```bash
# Ver de qué bibliotecas compartidas depende un ejecutable
ldd /usr/bin/htop
#   linux-vdso.so.1
#   libncursesw.so.6 => /lib/x86_64-linux-gnu/libncursesw.so.6
#   libtinfo.so.6 => /lib/x86_64-linux-gnu/libtinfo.so.6
#   libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6

# El enlazador dinámico encuentra las .so gracias a la caché de ldconfig
ldconfig -p | head -5          # Ver la caché de bibliotecas
ldconfig -p | grep ncurses     # ¿Dónde está libncursesw?
sudo ldconfig                  # Regenerar la caché (tras instalar libs a mano)

# Ver las dependencias declaradas de un paquete
apt depends htop
apt rdepends libncursesw6 | head    # Dependencias INVERSAS: quién la usa
```

```
Tipos de relación entre paquetes (Debian):

Depends     → obligatoria; no se instala sin ella
Recommends  → muy conveniente; APT la instala por defecto
Suggests    → opcional; no se instala por defecto
Conflicts   → no pueden coexistir (ej. dos MTA que escuchan el puerto 25)
Replaces    → este paquete sustituye archivos de aquel
Provides    → paquete "virtual" (ej. postfix Provides: mail-transport-agent)
```

---

## 8.2 — Familia Debian/Ubuntu: APT

### `apt` vs `apt-get` vs `aptitude`

```bash
# apt      → interfaz moderna para humanos (barra de progreso, colores)
# apt-get  → interfaz clásica, salida estable: úsala en SCRIPTS
# apt-cache → consultas de la caché (búsquedas), absorbe 'apt search/show'
# aptitude → interfaz TUI opcional con resolutor alternativo
# dpkg     → la capa de BAJO NIVEL que todos usan por debajo

# En el día a día interactivo: usa apt. En scripts: apt-get.
```

### El ciclo básico

```bash
# 1. ACTUALIZAR LOS ÍNDICES (no instala nada: solo descarga las listas)
sudo apt update
# Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease
# Get:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]
# ...
# 12 packages can be upgraded. Run 'apt list --upgradable' to see them.

# 2. VER QUÉ SE PUEDE ACTUALIZAR
apt list --upgradable

# 3. ACTUALIZAR LOS PAQUETES INSTALADOS
sudo apt upgrade           # Actualiza sin eliminar ni instalar paquetes nuevos
sudo apt full-upgrade      # Puede instalar/eliminar paquetes si es necesario
                           # (necesario para actualizaciones de kernel y cambios grandes)

# El mantra diario del administrador:
sudo apt update && sudo apt upgrade
```

:::warning **`apt update` NO actualiza programas**
Es el error de principiante más común. `apt update` solo refresca los **índices** (la lista de qué hay disponible). Quien actualiza los programas es `apt upgrade`. Por eso siempre van en pareja: primero entérate de qué hay nuevo, después instálalo.
:::

### Instalar, eliminar y buscar

```bash
# INSTALAR
sudo apt install htop
sudo apt install htop tmux ripgrep        # Varios a la vez
sudo apt install nginx=1.24.0-1           # Versión específica
sudo apt install ./paquete-local.deb      # Un .deb local (resuelve dependencias)
sudo apt install --no-install-recommends mpv   # Sin los Recommends
sudo apt reinstall htop                   # Reinstalar (reparar archivos dañados)

# Simular sin hacer nada (ver qué pasaría)
apt install -s nginx                      # -s = --simulate (no requiere sudo)

# ELIMINAR
sudo apt remove htop          # Elimina el programa, CONSERVA su configuración
sudo apt purge htop           # Elimina el programa Y su configuración de /etc
sudo apt autoremove           # Elimina dependencias que ya nadie usa
sudo apt autoremove --purge   # Lo mismo + configuraciones

# ¿remove o purge? Si planeas reinstalar conservando la config → remove.
# Si quieres borrar todo rastro → purge.

# BUSCAR E INSPECCIONAR
apt search "process viewer"   # Buscar en nombres y descripciones
apt show htop                 # Ficha completa: versión, deps, tamaño, descripción
apt list --installed          # Todo lo instalado (¡son miles!)
apt list --installed | grep nginx
apt policy nginx              # Qué versión está instalada y cuáles disponibles
                              # (y de qué repositorio viene cada una)
```

### `dpkg` — La capa de bajo nivel

`dpkg` instala y registra paquetes, pero **no sabe descargar ni resolver dependencias**. Es la base de datos del sistema: qué paquete está instalado, qué archivos posee cada uno.

```bash
# Instalar un .deb suelto (sin resolución de dependencias)
sudo dpkg -i google-chrome-stable_current_amd64.deb
# Si falla por dependencias, completa con:
sudo apt --fix-broken install
# (apt -f install: descarga e instala lo que faltaba)
# Alternativa moderna: sudo apt install ./archivo.deb hace todo en un paso

# CONSULTAS A LA BASE DE DATOS (las cuatro letras de oro)
dpkg -l                      # Listar todos los paquetes instalados
dpkg -l | grep nginx         # Filtrar (estado 'ii' = instalado correctamente)
dpkg -L nginx                # ¿Qué ARCHIVOS instaló este paquete?
dpkg -S /usr/sbin/nginx      # ¿Qué PAQUETE posee este archivo? (inversa de -L)
dpkg -s nginx                # Estado y metadatos de un paquete instalado

# Los estados en dpkg -l:
# ii  = instalado OK
# rc  = removed but config remains (eliminado, config presente → purge pendiente)
# iU  = desempaquetado pero no configurado (instalación interrumpida)

# Listar los 'rc' (restos de configuración) y purgarlos todos
dpkg -l | awk '/^rc/ {print $2}'
dpkg -l | awk '/^rc/ {print $2}' | xargs sudo apt purge -y
# (pipeline del Módulo 05: awk filtra, xargs construye el comando)
```

### Fuentes de software: `sources.list` y el formato deb822

<Tabs>
<TabItem value="deb822" label="Formato moderno (deb822)">

Ubuntu 24.04+ y Debian 12+ usan archivos `.sources` en formato deb822:

```bash
cat /etc/apt/sources.list.d/ubuntu.sources
# Types: deb
# URIs: http://archive.ubuntu.com/ubuntu/
# Suites: noble noble-updates noble-backports
# Components: main restricted universe multiverse
# Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
```

- **Types**: `deb` (binarios) o `deb-src` (código fuente)
- **Suites**: la versión (`noble`) y sus canales (`-updates`, `-security`, `-backports`)
- **Components**: `main` (libre, soportado), `universe` (libre, comunidad), `restricted` (drivers privativos), `multiverse` (no libre)
- **Signed-By**: la clave que firma este repositorio (clave por repositorio = seguridad)

</TabItem>
<TabItem value="clasico" label="Formato clásico (una línea)">

```bash
cat /etc/apt/sources.list
# deb http://deb.debian.org/debian bookworm main contrib non-free-firmware
# deb http://security.debian.org/debian-security bookworm-security main
# deb http://deb.debian.org/debian bookworm-updates main

# Estructura:  tipo  URI  suite  componentes...
```

En Debian los componentes son: `main` (100% libre), `contrib` (libre pero depende de no-libre), `non-free` y `non-free-firmware`.

</TabItem>
</Tabs>

### Añadir repositorios de terceros (la forma correcta en 2024+)

```bash
# ❌ OBSOLETO Y PELIGROSO: apt-key add (la clave valía para TODOS los repos)
# ✅ MODERNO: clave dedicada en /etc/apt/keyrings/ + Signed-By

# Ejemplo real: añadir el repositorio oficial de Docker
# 1. Descargar la clave GPG del proveedor
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 2. Añadir el repositorio VINCULADO a esa clave (signed-by)
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 3. Actualizar e instalar
sudo apt update
sudo apt install docker-ce

# PPAs (Personal Package Archives, solo Ubuntu):
sudo add-apt-repository ppa:git-core/ppa    # Git siempre actualizado
sudo apt update
# Eliminar un PPA y VOLVER a las versiones oficiales de sus paquetes:
sudo apt install ppa-purge
sudo ppa-purge ppa:git-core/ppa
```

:::danger **Cada repositorio de terceros es una puerta**
Un repositorio puede publicar un paquete llamado `libc6` con versión superior a la oficial y APT lo instalaría en la próxima actualización, reemplazando la librería más crítica del sistema. Añade solo repositorios de proveedores en los que confíes plenamente (Docker, Microsoft, Google...) y usa siempre `signed-by` para limitar cada clave a su repositorio.
:::

### Congelar versiones: `apt-mark` y pinning

```bash
# Retener un paquete (no se actualizará con apt upgrade)
sudo apt-mark hold nginx
apt-mark showhold              # Ver qué está retenido
sudo apt-mark unhold nginx     # Liberar

# Marcar como instalado automático/manual (afecta a autoremove)
apt-mark showmanual | head     # Paquetes que pediste explícitamente
sudo apt-mark auto libfoo1     # "lo instalé sin querer, trátalo como dependencia"

# Pinning fino en /etc/apt/preferences.d/ (prioridades por origen)
# Ejemplo: preferir el repo oficial de nginx.org sobre el de Ubuntu
sudo tee /etc/apt/preferences.d/nginx <<'EOF'
Package: nginx*
Pin: origin nginx.org
Pin-Priority: 900
EOF
apt policy nginx               # Verificar las prioridades resultantes
```

### El historial de APT

```bash
# ¿Qué se instaló/eliminó y cuándo? Todo queda registrado:
less /var/log/apt/history.log
# Start-Date: 2024-06-01  10:15:32
# Commandline: apt install htop
# Requested-By: juan (1000)
# Install: htop:amd64 (3.3.0-4)
# End-Date: 2024-06-01  10:15:35

# Buscar cuándo se instaló algo (grep del Módulo 05)
zgrep -h "Install:" /var/log/apt/history.log* | grep nginx
```

---

## 8.3 — Familia Red Hat/Fedora: DNF y RPM

DNF (Dandified YUM) es el gestor de Fedora, RHEL 8+, CentOS Stream, Rocky y AlmaLinux. La sintaxis es muy parecida a APT pero con una diferencia clave: **`dnf` actualiza sus metadatos automáticamente** cuando caducan — no existe el paso obligatorio de `apt update`.

```bash
# CICLO BÁSICO
sudo dnf install htop
sudo dnf install htop tmux           # Varios
sudo dnf remove htop
sudo dnf upgrade                     # Actualizar todo (alias: update)
sudo dnf upgrade nginx               # Actualizar solo uno
dnf check-update                     # Solo ver qué hay nuevo (sin sudo)

# BUSCAR E INSPECCIONAR
dnf search "process viewer"
dnf info htop
dnf list installed
dnf list available | grep nginx
dnf provides /usr/bin/htop           # ¿Qué paquete contiene este archivo?
dnf provides "*/ifconfig"            # Búsqueda con comodín (¡muy útil!)
dnf repoquery --requires htop        # Dependencias
dnf repoquery --whatrequires libxyz  # Dependencias inversas

# LA JOYA DE DNF: historial con deshacer
dnf history                          # Lista de transacciones numeradas
dnf history info 42                  # Detalle de la transacción 42
sudo dnf history undo 42             # ¡DESHACER la transacción 42!
sudo dnf history rollback 40         # Volver al estado tras la transacción 40

# GRUPOS DE PAQUETES (instalar entornos completos)
dnf group list
sudo dnf group install "Development Tools"   # gcc, make, etc. de un golpe
sudo dnf group install "Virtualization"
```

### `rpm` — Bajo nivel (análogo a dpkg)

```bash
rpm -qa                       # Listar todo lo instalado (query all)
rpm -qa | grep nginx
rpm -qi nginx                 # Información de un paquete instalado
rpm -ql nginx                 # Archivos que instaló (como dpkg -L)
rpm -qf /usr/sbin/nginx       # Qué paquete posee este archivo (como dpkg -S)
rpm -qd nginx                 # Solo la documentación del paquete
rpm -q --changelog nginx | head -20

# VERIFICACIÓN DE INTEGRIDAD (potente para detectar manipulación)
rpm -V nginx
# S.5....T.  c /etc/nginx/nginx.conf
# │ │    │  │
# │ │    │  └ c = archivo de configuración (cambios esperables)
# │ │    └ T = mtime cambió
# │ └ 5 = el hash MD5/SHA cambió (¡el contenido es distinto!)
# └ S = el tamaño cambió
rpm -Va                       # Verificar TODOS los paquetes (auditoría)

# Instalar un .rpm suelto: mejor con dnf (resuelve dependencias)
sudo dnf install ./paquete.rpm
```

### Repositorios en la familia Red Hat

```bash
# Los repos viven en archivos .repo
ls /etc/yum.repos.d/
cat /etc/yum.repos.d/fedora.repo
# [fedora]
# name=Fedora $releasever - $basearch
# metalink=https://mirrors.fedoraproject.org/metalink?repo=fedora-$releasever...
# enabled=1
# gpgcheck=1
# gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-fedora-$releasever-$basearch

dnf repolist                        # Repos activos
sudo dnf config-manager --set-disabled nombre-repo   # Desactivar uno

# EPEL: Extra Packages for Enterprise Linux (imprescindible en RHEL/Rocky/Alma)
sudo dnf install epel-release
# Da acceso a htop, ripgrep, fail2ban y miles de paquetes que RHEL no incluye

# RPM Fusion (Fedora): codecs y software que Fedora no puede distribuir
sudo dnf install \
  https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm
```

---

## 8.4 — Otras familias: pacman, zypper y apk

<Tabs>
<TabItem value="pacman" label="Arch: pacman">

`pacman` usa flags de una letra combinables. Tras el críptico aspecto inicial hay un sistema muy coherente: la primera letra mayúscula es la **operación** (`S`ync, `R`emove, `Q`uery) y las siguientes la modifican.

```bash
# EL COMANDO SAGRADO DE ARCH: actualizar TODO el sistema
sudo pacman -Syu
# S = sincronizar con repos, y = refrescar índices, u = actualizar

# Instalar (siempre con el sistema actualizado: Arch es rolling release)
sudo pacman -S htop
sudo pacman -S htop tmux

# Eliminar
sudo pacman -R htop            # Solo el paquete
sudo pacman -Rs htop           # + dependencias huérfanas
sudo pacman -Rns htop          # + dependencias + configuración (el más completo)

# Buscar y consultar
pacman -Ss process viewer      # Buscar en repos
pacman -Si htop                # Info de un paquete en repos
pacman -Qs htop                # Buscar entre lo INSTALADO
pacman -Qi htop                # Info de un paquete instalado
pacman -Ql htop                # Archivos del paquete (como dpkg -L)
pacman -Qo /usr/bin/htop       # Qué paquete posee el archivo (como dpkg -S)
pacman -Qdt                    # Huérfanos (deps que ya nadie necesita)
sudo pacman -Sc                # Limpiar caché de versiones antiguas

# EL AUR (Arch User Repository): recetas comunitarias (PKGBUILD)
# Se usan helpers como yay o paru:
yay -S google-chrome           # Compila/empaqueta desde el AUR
yay -Syu                       # Actualiza repos oficiales + AUR
```

:::danger **Nunca hagas actualizaciones parciales en Arch**
`pacman -Sy paquete` (refrescar índices e instalar UNO sin actualizar el resto) puede romper el sistema: el paquete nuevo se enlazará contra librerías más nuevas que las que tienes. En Arch: o actualizas todo (`-Syu`) o no refrescas índices.
:::

</TabItem>
<TabItem value="zypper" label="openSUSE: zypper">

```bash
# zypper: el gestor de openSUSE (usa RPM por debajo, como DNF)
sudo zypper refresh            # Refrescar repos (como apt update)
sudo zypper update             # Actualizar paquetes
sudo zypper dup                # Distribution upgrade (Tumbleweed, rolling)

sudo zypper install htop       # Abreviado: zypper in htop
sudo zypper remove htop        # Abreviado: zypper rm htop
zypper search htop             # Abreviado: zypper se htop
zypper info htop

# Lo distintivo de openSUSE: los PATTERNS (grupos) y los snapshots
zypper search -t pattern       # Listar patterns disponibles
sudo zypper install -t pattern devel_basis

# openSUSE integra snapshots Btrfs: si una actualización rompe algo,
# puedes arrancar desde un snapshot anterior en GRUB (snapper rollback)
```

</TabItem>
<TabItem value="apk" label="Alpine: apk">

```bash
# apk: el gestor de Alpine Linux — LA distro de los contenedores Docker
# (la imagen base alpine pesa ~5 MB; la conocerás bien en el Módulo 16)

apk update                     # Refrescar índices
apk upgrade                    # Actualizar todo
apk add htop                   # Instalar
apk del htop                   # Eliminar
apk search htop
apk info htop
apk info -L htop               # Archivos del paquete

# El patrón típico en Dockerfiles:
# RUN apk add --no-cache curl ca-certificates
# (--no-cache: no guarda índices → imagen más pequeña)
```

</TabItem>
</Tabs>

### Tabla Rosetta: el mismo comando en cada familia

| Acción | APT (Debian/Ubuntu) | DNF (Fedora/RHEL) | pacman (Arch) | zypper (openSUSE) | apk (Alpine) |
|---|---|---|---|---|---|
| Refrescar índices | `apt update` | (automático) | `pacman -Sy` | `zypper ref` | `apk update` |
| Actualizar todo | `apt upgrade` | `dnf upgrade` | `pacman -Syu` | `zypper up` | `apk upgrade` |
| Instalar | `apt install X` | `dnf install X` | `pacman -S X` | `zypper in X` | `apk add X` |
| Eliminar | `apt remove X` | `dnf remove X` | `pacman -Rs X` | `zypper rm X` | `apk del X` |
| Buscar | `apt search X` | `dnf search X` | `pacman -Ss X` | `zypper se X` | `apk search X` |
| Info del paquete | `apt show X` | `dnf info X` | `pacman -Si X` | `zypper info X` | `apk info X` |
| Archivos del paquete | `dpkg -L X` | `rpm -ql X` | `pacman -Ql X` | `rpm -ql X` | `apk info -L X` |
| ¿Quién posee el archivo? | `dpkg -S ruta` | `rpm -qf ruta` | `pacman -Qo ruta` | `rpm -qf ruta` | `apk info --who-owns ruta` |
| Limpiar huérfanos | `apt autoremove` | `dnf autoremove` | `pacman -Rns $(pacman -Qdtq)` | — | — |
| Limpiar caché | `apt clean` | `dnf clean all` | `pacman -Sc` | `zypper clean` | (no aplica) |

---

## 8.5 — Formatos universales: Flatpak, Snap y AppImage

### El problema que resuelven

Los paquetes nativos tienen un inconveniente: **cada distribución empaqueta por separado** y las versiones se congelan con cada release. Si usas Debian stable, tu Firefox o tu GIMP pueden tener dos años. Los formatos universales empaquetan la aplicación **con todas sus dependencias** y funcionan igual en cualquier distro.

```
┌──────────────────────────────────────────────────────────────┐
│           Paquete nativo  vs  Formato universal              │
│                                                              │
│  NATIVO (.deb/.rpm)            UNIVERSAL (Flatpak/Snap)      │
│  ┌──────────┐                  ┌────────────────────┐        │
│  │   app    │                  │  app               │        │
│  └────┬─────┘                  │  + sus librerías   │        │
│       │ usa las librerías      │  + runtime propio  │        │
│       ▼ del sistema            │  + sandbox         │        │
│  ┌──────────┐                  └────────────────────┘        │
│  │ libs del │                  No toca el sistema.           │
│  │ sistema  │                  Pesa más. Siempre actualizada.│
│  └──────────┘                  Aislada (permisos).           │
│  Ligero, integrado.                                          │
│  Versión congelada con la distro.                            │
└──────────────────────────────────────────────────────────────┘
```

### Flatpak

El formato universal preferido por la comunidad de escritorio (Fedora, GNOME, KDE). Su tienda es **Flathub**.

```bash
# Instalar flatpak y conectar Flathub
sudo apt install flatpak          # (en Fedora ya viene)
flatpak remote-add --if-not-exists flathub \
    https://dl.flathub.org/repo/flathub.flatpakrepo

# Uso diario
flatpak search obs                      # Buscar
flatpak install flathub com.obsproject.Studio   # Instalar (ID inverso de dominio)
flatpak run com.obsproject.Studio       # Ejecutar
flatpak list                            # Qué tengo instalado
flatpak update                          # Actualizar TODOS los flatpaks
flatpak uninstall com.obsproject.Studio
flatpak uninstall --unused              # Limpiar runtimes huérfanos (¡ahorra GB!)

# EL SANDBOX Y SUS PERMISOS
flatpak info --show-permissions com.obsproject.Studio
# Conceder acceso a un directorio extra
flatpak override --user --filesystem=/mnt/datos com.obsproject.Studio
# Gestionar permisos con interfaz gráfica: instala Flatseal
flatpak install flathub com.github.tchx84.Flatseal
```

### Snap

El formato de Canonical, integrado de serie en Ubuntu. Técnicamente similar, con dos diferencias polémicas: la **tienda es un servidor cerrado controlado por Canonical** y las **actualizaciones son automáticas y obligatorias** (puedes aplazarlas, no desactivarlas).

```bash
snap find spotify               # Buscar
sudo snap install spotify       # Instalar
sudo snap install code --classic    # --classic = sin sandbox (IDEs, etc.)
snap list                       # Instalados (fíjate en la columna 'channel')
sudo snap refresh               # Actualizar todos
sudo snap remove spotify

# CANALES: latest/stable, latest/candidate, latest/beta, latest/edge
sudo snap install firefox --channel=latest/beta
sudo snap refresh firefox --channel=latest/stable    # Volver a stable

# Aplazar actualizaciones automáticas (no desactivarlas)
sudo snap set system refresh.hold="$(date --date='+30 days' +%Y-%m-%dT%H:%M:%S%:z)"
snap refresh --time             # Ver cuándo será la próxima actualización
```

### AppImage

La filosofía opuesta: **un solo archivo ejecutable, sin instalación, sin demonio, sin tienda**. Descargas, das permiso de ejecución y funciona. Como los `.exe` portables de Windows.

```bash
# 1. Descargar (ejemplo: el editor de vídeo Kdenlive)
wget https://download.kde.org/stable/kdenlive/24.05/linux/kdenlive-24.05.0-x86_64.AppImage

# 2. Dar permiso de ejecución (Módulo 07: el bit x)
chmod +x kdenlive-24.05.0-x86_64.AppImage

# 3. Ejecutar
./kdenlive-24.05.0-x86_64.AppImage

# Buenas prácticas:
mkdir -p ~/Aplicaciones && mv *.AppImage ~/Aplicaciones/
# Para integración con el menú (iconos, asociaciones): instala AppImageLauncher
# Contras: sin actualizaciones automáticas ni verificación centralizada de firmas
```

### ¿Cuál elegir?

| Criterio | Nativo (apt/dnf) | Flatpak | Snap | AppImage |
|---|---|---|---|---|
| Herramientas CLI y servicios | ✅ **siempre** | ❌ | ⚠️ | ❌ |
| Apps de escritorio actualizadas | ⚠️ según distro | ✅ **ideal** | ✅ | ✅ |
| Espacio en disco | ✅ mínimo | ❌ runtimes grandes | ❌ | ⚠️ |
| Sandbox/permisos | ❌ | ✅ granular | ✅ | ❌ |
| Sin conexión / portable | ❌ | ❌ | ❌ | ✅ **ideal** |
| Servidores | ✅ **siempre** | ❌ | ⚠️ | ❌ |

**Regla práctica:** en servidores y para herramientas de terminal, paquetes nativos siempre. En escritorio, nativo si la versión te sirve; Flatpak para aplicaciones gráficas que quieras al día (navegadores, editores de vídeo, juegos).

---

## 8.6 — Compilar desde el código fuente

A veces el software que necesitas no está empaquetado, o necesitas la última versión, o quieres activar opciones de compilación específicas. Entonces toca compilar.

### Preparar el entorno de compilación

```bash
# Debian/Ubuntu: el metapaquete con gcc, make, libc-dev...
sudo apt install build-essential
# Y para descargar fuentes y dependencias de compilación:
sudo apt install git pkg-config

# Fedora/RHEL
sudo dnf group install "Development Tools"

# Arch
sudo pacman -S base-devel
```

**La regla de los headers:** para compilar contra una librería necesitas su paquete de desarrollo: en Debian terminan en `-dev` (`libssl-dev`, `libcurl4-openssl-dev`); en Fedora en `-devel` (`openssl-devel`).

```bash
# Truco APT: instalar TODAS las dependencias de compilación de un paquete
sudo apt build-dep htop      # requiere líneas deb-src activas en sources
```

### La tríada clásica: `./configure && make && make install`

```bash
# Ejemplo completo y real: compilar htop desde el código fuente
wget https://github.com/htop-dev/htop/releases/download/3.3.0/htop-3.3.0.tar.xz
tar xf htop-3.3.0.tar.xz          # (Módulo 05: tar + xz)
cd htop-3.3.0/

# PASO 1: configure — inspecciona tu sistema y genera el Makefile
./configure --prefix=/usr/local
# checking for gcc... gcc
# checking for ncursesw6-config... yes
# ...
# Si falta algo: "configure: error: missing libraries: libncursesw"
#   → sudo apt install libncursesw5-dev   y repetir
./configure --help | less          # Ver TODAS las opciones disponibles

# PASO 2: make — compila (en paralelo con todos tus núcleos)
make -j$(nproc)

# Puedes probar el binario SIN instalar:
./htop

# PASO 3: make install — copia los archivos a su destino
sudo make install                  # → /usr/local/bin/htop
# ¿Por qué /usr/local? El FHS (Módulo 04) lo reserva para software
# instalado manualmente: NUNCA chocará con los paquetes del gestor (en /usr)

# Desinstalar (si el proyecto lo soporta, conserva el directorio de fuentes)
sudo make uninstall
```

```
El flujo de compilación:

 código fuente          Makefile              binarios
 ┌──────────┐  configure ┌─────────┐   make   ┌─────────┐  make install
 │ htop.c   │ ─────────▶ │ recetas │ ───────▶ │ ./htop  │ ─────────────▶ /usr/local/bin/
 │ *.c *.h  │  (detecta  │ de com- │ (gcc...) │         │   (cp + permisos)
 └──────────┘   tu so)   └─────────┘          └─────────┘
```

### Instalar sin ensuciar el sistema

El problema de `make install`: los archivos **no quedan registrados en ningún gestor**. Seis meses después no recordarás qué archivos puso ni cómo quitarlos. Soluciones, de simple a elegante:

```bash
# OPCIÓN 1: prefijo en tu home (ni siquiera necesitas sudo)
./configure --prefix=$HOME/.local
make -j$(nproc) && make install
# Asegúrate de que ~/.local/bin está en el PATH (Módulo 03)

# OPCIÓN 2: checkinstall — crea un .deb en vez de instalar a pelo
sudo apt install checkinstall
sudo checkinstall                # En lugar de 'sudo make install'
# Genera e instala htop_3.3.0-1_amd64.deb → ahora dpkg lo conoce
# y puedes quitarlo con: sudo apt remove htop

# OPCIÓN 3: GNU Stow — cada programa en su jaula + symlinks
sudo apt install stow
./configure --prefix=/usr/local/stow/htop-3.3.0
make && sudo make install
cd /usr/local/stow && sudo stow htop-3.3.0
# Crea symlinks: /usr/local/bin/htop → ../stow/htop-3.3.0/bin/htop
sudo stow -D htop-3.3.0          # Desinstalar = borrar los symlinks
```

### Sistemas de construcción modernos: CMake y Meson

```bash
# CMAKE (el más extendido en C/C++ moderno)
sudo apt install cmake
git clone https://github.com/ejemplo/proyecto && cd proyecto
cmake -B build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/usr/local
cmake --build build -j$(nproc)
sudo cmake --install build

# MESON + NINJA (GNOME, systemd y proyectos modernos)
sudo apt install meson ninja-build
meson setup build --prefix=/usr/local --buildtype=release
ninja -C build
sudo ninja -C build install

# RUST y GO tienen su propio mundo:
cargo install ripgrep            # Rust: compila e instala en ~/.cargo/bin
go install github.com/usuario/herramienta@latest   # Go: en ~/go/bin
```

---

## 8.7 — Mantenimiento del sistema

### Actualizaciones de seguridad automáticas

En un servidor, las actualizaciones de seguridad no pueden depender de que alguien se acuerde.

<Tabs>
<TabItem value="ubuntu" label="Debian/Ubuntu: unattended-upgrades">

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades   # Activar (diálogo)

# La configuración:
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
# Lo esencial:
# Unattended-Upgrade::Allowed-Origins {
#     "${distro_id}:${distro_codename}-security";   ← solo seguridad (default)
# };
# Unattended-Upgrade::Remove-Unused-Dependencies "true";   ← autoremove
# Unattended-Upgrade::Automatic-Reboot "false";    ← reiniciar si lo pide el kernel
# Unattended-Upgrade::Automatic-Reboot-Time "04:00";
# Unattended-Upgrade::Mail "admin@empresa.com";    ← informar por correo

# Probar en seco y ver el log
sudo unattended-upgrade --dry-run --debug
less /var/log/unattended-upgrades/unattended-upgrades.log

# ¿El sistema pide reinicio? (típico tras actualizar el kernel)
ls /var/run/reboot-required* 2>/dev/null && cat /var/run/reboot-required.pkgs
```

</TabItem>
<TabItem value="fedora" label="Fedora/RHEL: dnf-automatic">

```bash
sudo dnf install dnf-automatic
sudo nano /etc/dnf/automatic.conf
# [commands]
# upgrade_type = security      ← solo actualizaciones de seguridad
# apply_updates = yes          ← aplicar (no solo descargar)
# [emitters]
# emit_via = motd              ← o 'email'

# Activar el timer de systemd (los timers se ven en el Módulo 09)
sudo systemctl enable --now dnf-automatic.timer
systemctl list-timers | grep dnf
```

</TabItem>
</Tabs>

### Limpieza periódica

```bash
# APT: la caché de .deb descargados puede crecer mucho
du -sh /var/cache/apt/archives/    # ¿Cuánto ocupa?
sudo apt clean                     # Borrar toda la caché
sudo apt autoclean                 # Borrar solo versiones obsoletas
sudo apt autoremove --purge        # Huérfanos + sus configuraciones

# El clásico: /boot lleno de kernels antiguos
dpkg -l | grep linux-image         # ¿Cuántos kernels tengo?
sudo apt autoremove --purge        # Elimina los antiguos (conserva actual + 1)

# DNF
sudo dnf clean all
sudo dnf autoremove

# Flatpak (los runtimes huérfanos ocupan gigas)
flatpak uninstall --unused

# Diagnóstico general de espacio (Módulo 04: du y df)
sudo du -xh --max-depth=1 /var | sort -rh | head
```

### Actualizar entre versiones de la distribución

```bash
# UBUNTU: release upgrade (ej. 22.04 LTS → 24.04 LTS)
# 1. SIEMPRE primero: backup + sistema al día
sudo apt update && sudo apt full-upgrade
# 2. Lanzar el actualizador
sudo do-release-upgrade
# Por defecto solo ofrece LTS→LTS (configurable en /etc/update-manager/release-upgrades)

# DEBIAN: editar sources.list (bookworm → trixie) y:
sudo apt update && sudo apt full-upgrade

# FEDORA: con el plugin oficial
sudo dnf upgrade --refresh
sudo dnf install dnf-plugin-system-upgrade
sudo dnf system-upgrade download --releasever=40
sudo dnf system-upgrade reboot     # Reinicia y actualiza fuera de línea
```

:::warning
Antes de cualquier *release upgrade*: backup verificado, desactivar repositorios de terceros y PPAs (el actualizador los desactiva, pero revisa después), y nunca lanzarlo por SSH sin un plan B (usa `tmux`/`screen` para sobrevivir a cortes de conexión — los conociste en el [Módulo 03](/terminal-y-shell)).
:::

---

## 8.8 — Problemas reales y soluciones

### Problema 1: "Could not get lock /var/lib/dpkg/lock-frontend"

```bash
# SITUACIÓN: apt se niega a ejecutarse
# E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 3274 (apt)

# CAUSA: otro proceso está usando dpkg/apt. Suele ser:
#   - unattended-upgrades trabajando en segundo plano
#   - otra terminal con apt abierto
#   - "Software Updater" gráfico

# DIAGNÓSTICO: ¿quién tiene el lock?
ps aux | grep -E "apt|dpkg" | grep -v grep
sudo fuser -v /var/lib/dpkg/lock-frontend

# SOLUCIÓN CORRECTA: esperar a que termine (suele ser 1-5 minutos)
# Si quedó un proceso zombi tras un corte:
sudo kill PID_del_proceso        # Primero intento amable
# Y si dpkg quedó interrumpido a medias:
sudo dpkg --configure -a         # Completar configuraciones pendientes

# ❌ NUNCA hagas 'sudo rm /var/lib/dpkg/lock*' con un apt vivo:
#    puedes corromper la base de datos de paquetes
```

### Problema 2: dependencias rotas / "unmet dependencies"

```bash
# SITUACIÓN:
# The following packages have unmet dependencies:
#  paquete-x : Depends: libfoo1 (>= 2.0) but 1.8 is to be installed

# ARSENAL DE REPARACIÓN (en orden):
sudo apt --fix-broken install      # 1. El reparador estándar
sudo dpkg --configure -a           # 2. Completar instalaciones a medias
sudo apt clean && sudo apt update  # 3. Descartar índices/cachés corruptos
apt policy libfoo1                 # 4. Investigar: ¿de DÓNDE viene la versión rara?

# La causa #1 de dependencias rotas: un repositorio de terceros o PPA
# que publica versiones incompatibles. apt policy lo delata:
#   1.8-custom1  →  https://ppa.example.com  ← ¡el culpable!
# Solución: ppa-purge del PPA conflictivo (visto en §8.2)

# Último recurso quirúrgico: forzar la eliminación del paquete conflictivo
sudo dpkg --remove --force-remove-reinstreq paquete-roto
sudo apt --fix-broken install
```

### Problema 3: errores de firma GPG

```bash
# SITUACIÓN tras apt update:
# W: GPG error: https://repo.example.com stable InRelease:
#    The following signatures couldn't be verified because the
#    public key is not available: NO_PUBKEY 1234ABCD5678EF90
# o bien: "EXPKEYSIG ... Key expired"

# CAUSA: falta la clave pública del repo, o el proveedor la renovó

# SOLUCIÓN: descargar la clave actual del proveedor (de su web oficial)
curl -fsSL https://repo.example.com/gpg.key | \
    sudo gpg --dearmor -o /etc/apt/keyrings/example.gpg
# y asegurarse de que el .list usa signed-by=/etc/apt/keyrings/example.gpg

# Si el repo ya no existe o no lo necesitas: elimínalo
ls /etc/apt/sources.list.d/
sudo rm /etc/apt/sources.list.d/repo-viejo.list
sudo apt update
```

### Problema 4: "command not found" después de instalar

```bash
# SITUACIÓN: instalaste algo y la shell no lo encuentra
sudo apt install ripgrep
rg --version
# bash: rg: command not found      ← ¿¡cómo!?

# DIAGNÓSTICO en orden:
# 1. ¿La shell tiene la tabla de comandos desactualizada?
hash -r                  # Limpiar la caché de rutas de bash; reintentar

# 2. ¿El binario se llama distinto que el paquete?
dpkg -L ripgrep | grep bin
# /usr/bin/rg            ← el paquete es 'ripgrep' pero el comando es 'rg'

# 3. ¿Se instaló fuera del PATH? (típico con pip, cargo, go install)
echo $PATH
ls ~/.local/bin ~/.cargo/bin 2>/dev/null
# Solución: añadir al PATH en ~/.bashrc (Módulo 03)
export PATH="$HOME/.local/bin:$PATH"
```

### Problema 5: necesito una versión más nueva que la del repo

```bash
# OPCIONES, de más a menos recomendable:

# 1. ¿Existe en backports? (paquetes nuevos compilados para tu versión estable)
apt list -a nombre-paquete
sudo apt install -t bookworm-backports nombre-paquete    # Debian
# En Ubuntu: buscar un PPA oficial del proyecto (ej. ppa:git-core/ppa)

# 2. ¿El proyecto tiene repositorio oficial propio?
#    (Docker, PostgreSQL, NGINX, Node.js... casi todos los grandes lo tienen)
#    → añadirlo con el método signed-by de §8.2

# 3. ¿Existe como Flatpak (apps gráficas) o binario estático oficial?

# 4. Compilar desde fuente con --prefix=$HOME/.local (§8.6)

# ❌ LO QUE NO DEBES HACER: mezclar releases (instalar paquetes de
#    Debian testing en stable, "FrankenDebian") — rompe el sistema
#    de forma diferida y difícil de diagnosticar
```

---

## Anexos

### A. Chuleta APT de supervivencia

```bash
sudo apt update && sudo apt upgrade   # El mantra diario
apt search palabra                    # Buscar
apt show paquete                      # Ficha
sudo apt install paquete              # Instalar
sudo apt remove paquete               # Quitar (deja config)
sudo apt purge paquete                # Quitar todo
sudo apt autoremove --purge           # Limpiar huérfanos
apt policy paquete                    # Versiones y orígenes
dpkg -L paquete                       # Qué archivos instaló
dpkg -S /ruta/archivo                 # Qué paquete posee el archivo
sudo apt --fix-broken install         # Reparar dependencias
sudo dpkg --configure -a              # Completar instalación interrumpida
zgrep "Install:" /var/log/apt/history.log* | grep paquete   # ¿Cuándo se instaló?
```

### B. Auditoría de software del sistema

```bash
# 1. ¿Qué repositorios de terceros tengo? (superficie de confianza)
grep -rh ^deb /etc/apt/sources.list /etc/apt/sources.list.d/ 2>/dev/null
ls /etc/apt/sources.list.d/

# 2. ¿Qué paquetes NO vienen de los repos oficiales?
apt list --installed 2>/dev/null | grep -v "ubuntu\|debian" | head

# 3. ¿Qué paquetes instalé yo explícitamente?
apt-mark showmanual

# 4. ¿Hay actualizaciones de seguridad pendientes?
apt list --upgradable 2>/dev/null | grep -i security

# 5. ¿Archivos modificados respecto al paquete original? (RPM lo borda)
rpm -Va                                  # Fedora/RHEL
sudo apt install debsums && sudo debsums -c   # Debian/Ubuntu

# 6. Paquetes más pesados (¿qué ocupa tanto?)
dpkg-query -Wf '${Installed-Size}\t${Package}\n' | sort -rn | head -15
# (salida en KB; pipeline de ordenación del Módulo 05)
```

### C. Referencias cruzadas entre módulos

```
◀ Módulo 01 — Introducción al mundo Linux
│  Las familias de distribuciones (Debian/Red Hat/Arch/SUSE)
│  → cada familia trae el gestor de paquetes que dominaste aquí

◀ Módulo 03 — Terminal y shell
│  El PATH y hash -r explican el "command not found" tras instalar
│  tmux/screen para sobrevivir a release upgrades por SSH

◀ Módulo 04 — Sistema de archivos
│  El FHS explica los destinos: /usr (paquetes), /usr/local (manual),
│  /opt (terceros), /var/cache/apt (caché), /etc (configuración)

◀ Módulo 05 — Procesamiento de texto
│  dpkg -l | awk, sort -rn para auditorías; tar/xz para tarballs
│  de código fuente; grep en /var/log/apt/history.log

◀ Módulo 07 — Usuarios, grupos y permisos
│  Por qué instalar requiere sudo; los maintainer scripts crean
│  usuarios de sistema (www-data, mysql) con useradd -r

▶ Módulo 09 — Procesos, servicios y systemd
│  → Los paquetes de servicios instalan unidades systemd;
│    dnf-automatic y unattended-upgrades usan timers

▶ Módulo 14 — Seguridad y hardening
│  → Minimizar paquetes = minimizar superficie de ataque;
│    debsums/rpm -V para detectar manipulación

▶ Módulo 16 — Virtualización y contenedores
│  → apk y Alpine en Dockerfiles; las imágenes de contenedor
│    son, en el fondo, otra forma de empaquetar software
```

---

## Referencias y Bibliografía

### Documentación oficial

1. **Debian Administrator's Handbook — cap. 5 y 6 (Packaging System, APT)**  
   https://debian-handbook.info/browse/stable/  
   La referencia más completa y gratuita sobre dpkg y APT.

2. **apt(8), apt-get(8), dpkg(1), sources.list(5) — man pages**  
   https://manpages.debian.org/

3. **Ubuntu Server Guide — Package Management**  
   https://documentation.ubuntu.com/server/explanation/software/package-management/

4. **DNF Documentation**  
   https://dnf.readthedocs.io/

5. **RPM Packaging Guide (Red Hat)**  
   https://rpm-packaging-guide.github.io/

6. **ArchWiki — pacman**  
   https://wiki.archlinux.org/title/Pacman  
   Una de las mejores páginas de toda la documentación Linux.

7. **ArchWiki — Arch User Repository (AUR)**  
   https://wiki.archlinux.org/title/Arch_User_Repository

8. **Flatpak Documentation**  
   https://docs.flatpak.org/

9. **Flathub** — https://flathub.org/

10. **Snapcraft Documentation**  
    https://snapcraft.io/docs

11. **AppImage Documentation**  
    https://docs.appimage.org/

12. **GNU Make Manual**  
    https://www.gnu.org/software/make/manual/

13. **CMake Documentation** — https://cmake.org/documentation/

14. **GNU Stow Manual** — https://www.gnu.org/software/stow/manual/

15. **Debian Wiki — DontBreakDebian**  
    https://wiki.debian.org/DontBreakDebian  
    Lectura obligatoria: qué NO hacer (FrankenDebian, sudo make install indiscriminado...).

16. **Debian Wiki — UnattendedUpgrades**  
    https://wiki.debian.org/UnattendedUpgrades

### Seguridad de la cadena de suministro

17. **SecureApt — Debian Wiki**  
    https://wiki.debian.org/SecureApt  
    Cómo funciona exactamente la verificación criptográfica de APT.

18. **Reproducible Builds**  
    https://reproducible-builds.org/  
    El esfuerzo por compilaciones bit a bit verificables.

### Libros

19. **Unix and Linux System Administration Handbook** — Nemeth et al.  
    5ª edición (2017). Capítulo 6: Software Installation and Management.

20. **How Linux Works** — Brian Ward, 3ª ed. (2021). No Starch Press.  
    Capítulo 15: Development Tools (compilación y librerías compartidas).

21. **The Linux Command Line** — William Shotts.  
    https://linuxcommand.org/tlcl.php — Capítulo 14: Package Management.

---

## Preguntas de autoevaluación

1. ¿Qué contiene exactamente un paquete `.deb` además de los archivos del programa?
2. Explica la cadena de confianza criptográfica: ¿cómo sabe APT que un paquete no fue manipulado en el mirror?
3. ¿Cuál es la diferencia entre `apt update` y `apt upgrade`? ¿Por qué siempre van juntos?
4. ¿Qué diferencia hay entre `apt remove` y `apt purge`? ¿Y qué hace `apt autoremove`?
5. ¿Para qué sirven `dpkg -L` y `dpkg -S`? Da un caso de uso real de cada uno.
6. ¿Por qué `apt-key add` está obsoleto y cuál es el método moderno (`signed-by`) más seguro?
7. ¿Qué riesgo introduce cada repositorio de terceros que añades al sistema?
8. ¿Qué hace `dnf history undo` y por qué APT no tiene un equivalente directo?
9. Descifra `pacman -Syu` y explica por qué las actualizaciones parciales (`-Sy paquete`) rompen Arch.
10. Compara Flatpak, Snap y AppImage: tienda, sandbox, actualizaciones y casos de uso ideales.
11. ¿Qué hace cada paso de `./configure && make && sudo make install` y por qué el destino por defecto razonable es `/usr/local`?
12. ¿Qué problema tiene `sudo make install` a largo plazo y qué alternativas existen (checkinstall, stow, --prefix)?
13. Un compañero borró `/var/lib/dpkg/lock-frontend` mientras apt corría "porque estaba bloqueado". ¿Qué pudo romper y cuál era el procedimiento correcto?
14. ¿Qué es un "FrankenDebian" y por qué mezclar releases rompe el sistema de forma diferida?

---

## Laboratorios prácticos

### Lab 8.1 — Anatomía de un paquete

```bash
# 1. Descargar un .deb sin instalarlo
apt download htop
ls -la htop_*.deb

# 2. Diseccionarlo
dpkg --info htop_*.deb          # Metadatos y dependencias
dpkg --contents htop_*.deb      # Lista de archivos
ar t htop_*.deb                 # Los tres miembros del archivo ar

# 3. Extraerlo a mano (sin instalarlo) y explorar
mkdir /tmp/htop-extraido
dpkg-deb -x htop_*.deb /tmp/htop-extraido
tree /tmp/htop-extraido | head -20
rm -r /tmp/htop-extraido htop_*.deb
```

### Lab 8.2 — Ciclo de vida completo con APT

```bash
# 1. Buscar, inspeccionar, instalar
apt search cowsay
apt show cowsay                 # ¿Cuánto pesa? ¿Qué dependencias tiene?
sudo apt install cowsay
cowsay "¡Funciona!"

# 2. Investigar qué instaló y de dónde vino
dpkg -L cowsay
dpkg -S $(which cowsay)
apt policy cowsay
zgrep "Install:" /var/log/apt/history.log* | grep cowsay

# 3. Eliminar y verificar el rastro
sudo apt remove cowsay
dpkg -l | grep cowsay           # ¿Aparece como 'rc'?
sudo apt purge cowsay
dpkg -l | grep cowsay           # Ahora no debe aparecer
```

### Lab 8.3 — Detective de archivos y dependencias

```bash
# 1. ¿Qué paquete posee /etc/passwd? ¿Y /usr/bin/sudo?
dpkg -S /etc/passwd
dpkg -S /usr/bin/sudo

# 2. ¿De qué librerías depende el comando ls?
ldd /usr/bin/ls

# 3. ¿Qué paquetes dependen de libc6? (cuenta cuántos)
apt rdepends libc6 2>/dev/null | wc -l

# 4. ¿Cuáles son los 10 paquetes más pesados de tu sistema?
dpkg-query -Wf '${Installed-Size}\t${Package}\n' | sort -rn | head -10
```

### Lab 8.4 — Retener y liberar versiones

```bash
# 1. Retener un paquete
sudo apt-mark hold cowsay 2>/dev/null || sudo apt install cowsay && sudo apt-mark hold cowsay
apt-mark showhold

# 2. Verificar que upgrade lo respeta
sudo apt upgrade -s | grep -i held    # -s = simulación

# 3. Liberar y limpiar
sudo apt-mark unhold cowsay
sudo apt purge cowsay
```

### Lab 8.5 — Flatpak de principio a fin

```bash
# 1. Instalar flatpak y Flathub (si no lo tienes)
sudo apt install flatpak
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
# (puede requerir cerrar sesión la primera vez)

# 2. Instalar una aplicación pequeña y examinar su sandbox
flatpak install -y flathub org.gnome.Calculator
flatpak info org.gnome.Calculator
flatpak info --show-permissions org.gnome.Calculator
flatpak run org.gnome.Calculator

# 3. ¿Cuánto espacio ocupan app + runtimes?
flatpak list --columns=application,size

# 4. Limpiar
flatpak uninstall -y org.gnome.Calculator
flatpak uninstall --unused -y
```

### Lab 8.6 — Compilar desde fuente sin ensuciar el sistema

```bash
# Compilaremos GNU hello (el "hola mundo" oficial de los tarballs)
sudo apt install build-essential wget

# 1. Descargar y extraer
cd /tmp
wget https://ftp.gnu.org/gnu/hello/hello-2.12.1.tar.gz
tar xzf hello-2.12.1.tar.gz && cd hello-2.12.1/

# 2. Configurar con prefijo en tu home (sin sudo en ningún momento)
./configure --prefix=$HOME/.local

# 3. Compilar y probar SIN instalar
make -j$(nproc)
./hello --greeting="¡Compilado por mí!"

# 4. Instalar en ~/.local y verificar
make install
~/.local/bin/hello
# ¿~/.local/bin está en tu PATH? (echo $PATH)

# 5. "Desinstalar" limpiamente
make uninstall
ls ~/.local/bin/hello 2>/dev/null || echo "Eliminado correctamente"
cd / && rm -rf /tmp/hello-2.12.1*
```

---

## Resumen del módulo

✅ **Conceptos:** un paquete = archivos + metadatos + dependencias + scripts; los repositorios firman índices con GPG y APT verifica hashes SHA-256 de cada paquete  
✅ **APT:** `update` ≠ `upgrade`; install/remove/purge/autoremove; `apt policy` para investigar orígenes; historial en `/var/log/apt/`  
✅ **dpkg:** `-l` (listar), `-L` (archivos del paquete), `-S` (paquete del archivo); `--configure -a` para reparar  
✅ **Repos de terceros:** método moderno con clave en `/etc/apt/keyrings/` + `signed-by`; cada repo añadido es confianza total  
✅ **DNF/RPM:** sintaxis gemela de APT + `dnf history undo`; `rpm -V` para auditar integridad; EPEL en RHEL-likes  
✅ **pacman:** `-Syu` sagrado, nunca actualizaciones parciales; AUR con yay/paru; `zypper` (SUSE) y `apk` (Alpine/Docker)  
✅ **Universales:** Flatpak (escritorio, Flathub, sandbox), Snap (Canonical, auto-update), AppImage (portable); nativo siempre en servidores  
✅ **Compilar:** `./configure --prefix && make -j$(nproc) && make install`; checkinstall o stow para no perder el control; CMake/Meson en proyectos modernos  
✅ **Mantenimiento:** unattended-upgrades / dnf-automatic para seguridad; `apt clean`, `autoremove --purge`, `flatpak uninstall --unused`  
✅ **Reparación:** lock de dpkg (esperar, no borrar), `--fix-broken`, claves GPG renovadas, `hash -r`, evitar FrankenDebian  

**Próximo paso:** [Módulo 09 — Procesos, servicios y systemd](/procesos-servicios-y-systemd). Todo lo que instalas acaba ejecutándose como un proceso o un servicio: aprenderás a verlos, controlarlos y gestionarlos con systemd.

---

**Última actualización:** 2024-06  
**Versión:** 1.0  
**Estado:** ✅ Listo para enseñanza
