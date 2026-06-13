---
title: "Módulo 13 — Arranque, kernel y hardware"
sidebar_label: "13 · Arranque y kernel"
description: Proceso de arranque UEFI/GRUB, initramfs, kernel Linux y sus módulos, sysctl, udev, gestión de hardware y rescate del sistema.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Módulo 13 — Arranque, kernel y hardware

## Introducción

Cada vez que pulsas el botón de encendido de un servidor en producción pones en marcha una cadena de eventos que, en menos de treinta segundos, transforma un silicio inerte en un sistema operativo plenamente funcional. Esa cadena —firmware, cargador de arranque, kernel, espacio de usuario— es el conocimiento que separa al administrador que sabe qué está pasando del que solo sabe reiniciar.

Este módulo desglosa el arranque **etapa a etapa**, explica cómo el kernel gestiona el hardware a través de módulos y udev, y proporciona las técnicas de **rescate de sistemas** que usarás el día que un servidor no arranque a las 3 de la madrugada.

Los cimientos los construiste en módulos anteriores: los [servicios y systemd](/procesos-servicios-y-systemd) en el Módulo 09, el [almacenamiento y LUKS](/almacenamiento-avanzado) en el Módulo 12. Aquí conectas todo desde el principio absoluto: el firmware.

### Objetivos de aprendizaje

Al finalizar este módulo, serás capaz de:

- ✅ Describir cada etapa del arranque: UEFI → GRUB → kernel → initramfs → systemd
- ✅ Configurar y reparar GRUB2 desde cero, incluyendo reinstalación tras un desastre
- ✅ Construir y depurar initramfs para escenarios con LUKS, RAID y drivers especiales
- ✅ Gestionar módulos del kernel con `modprobe`, `modinfo`, listas negras y DKMS
- ✅ Leer y modificar parámetros del kernel en caliente con `sysctl`
- ✅ Escribir reglas `udev` para renombrar y configurar dispositivos
- ✅ Inventariar el hardware con `lspci`, `lscpu`, `dmidecode`, `fwupd`
- ✅ Rescatar un sistema que no arranca mediante `chroot` desde un live USB

---

## 13.1 — El proceso de arranque, etapa a etapa

```
Diagrama completo del arranque moderno (UEFI + systemd):

[ENCENDIDO]
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FIRMWARE UEFI                                                       │
│  • POST (Power-On Self Test): RAM, CPU, dispositivos PCI            │
│  • Lee la tabla de particiones GPT del disco de arranque            │
│  • Busca la EFI System Partition (ESP, tipo EF00)                   │
│  • Lee las entradas de arranque de la NVRAM (efibootmgr)            │
│  • Si Secure Boot activo: verifica firma del siguiente eslabón      │
└────────────────────────┬────────────────────────────────────────────┘
                         │  Carga y ejecuta el EFI binary
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CARGADOR DE ARRANQUE  (GRUB2 en /boot/efi/EFI/ubuntu/grubx64.efi) │
│  • Presenta el menú de selección de kernel                          │
│  • Lee /boot/grub/grub.cfg                                          │
│  • Carga en RAM: vmlinuz + initramfs.img                            │
│  • Transfiere el control al kernel con los parámetros definidos     │
└────────────────────────┬────────────────────────────────────────────┘
                         │  Kernel + initramfs en RAM
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  KERNEL (fase de inicialización)                                    │
│  • Se descomprime a sí mismo en memoria                             │
│  • Detecta y configura el procesador (SMP, NUMA)                    │
│  • Inicializa el gestor de memoria (MMU, zonas, slab allocator)     │
│  • Monta el initramfs como raíz temporal (rootfs en RAM)            │
│  • Ejecuta /init dentro del initramfs                               │
└────────────────────────┬────────────────────────────────────────────┘
                         │  initramfs /init
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  INITRAMFS (sistema mínimo en RAM)                                  │
│  • Carga los módulos necesarios (RAID, LVM, drivers de disco)       │
│  • Si LUKS: pide passphrase y abre el dm-crypt (módulo 12)          │
│  • Si LVM: activa el VG (módulo 12)                                 │
│  • Si mdadm: ensambla el array RAID (módulo 12)                     │
│  • Monta el sistema de archivos raíz real en /sysroot               │
│  • Pivot_root / switch_root al sistema real                         │
└────────────────────────┬────────────────────────────────────────────┘
                         │  Sistema de archivos raíz montado
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SYSTEMD (PID 1) — init del espacio de usuario                     │
│  • Lee el target por defecto (multi-user.target o graphical.target) │
│  • Activa unidades en paralelo según dependencias                   │
│  • Monta /etc/fstab, levanta la red, arranca servicios              │
│  → Ver Módulo 09 para el árbol completo de targets y unidades       │
└─────────────────────────────────────────────────────────────────────┘
```

### Analizar el arranque

```bash
# dmesg: el diario del kernel
dmesg                              # Todo el log del kernel desde el arranque
dmesg -T                           # Con timestamps legibles
dmesg -l err,crit,alert,emerg      # Solo errores y superior
dmesg -w                           # Modo seguimiento (como tail -f)
dmesg --color=auto | grep -i "fail\|error\|warn"

# journalctl -b: logs del arranque actual (el boot 0)
journalctl -b                      # Todo el arranque actual
journalctl -b -1                   # El arranque anterior
journalctl -b -p err               # Solo prioridad error o superior
journalctl --list-boots            # Listar todos los arranques registrados

# systemd-analyze: rendimiento del arranque
systemd-analyze                    # Tiempo total: firmware + loader + kernel + userspace
systemd-analyze blame              # Cuánto tardó cada unidad (de mayor a menor)
systemd-analyze critical-chain     # La cadena crítica (ruta más larga)
systemd-analyze plot > arranque.svg  # Gráfico SVG del arranque

# Ejemplo de salida de systemd-analyze:
# Startup finished in 4.291s (firmware) + 2.105s (loader) + 1.850s (kernel)
#                          + 8.392s (userspace) = 16.639s
```

### BIOS vs UEFI

```
BIOS (Basic Input/Output System) — 1981, el legado:
  • Arranca en modo real x86 (16-bit)
  • MBR en el primer sector (512 bytes): solo 446 bytes para código de arranque
  • Sin autenticación; cualquier código puede arrancar
  • Máximo 4 particiones primarias, discos hasta 2 TB
  → Ver módulo 12 sobre MBR vs GPT

UEFI (Unified Extensible Firmware Interface) — 2005+:
  • Arranca en modo protegido de 32/64-bit directamente
  • Lee EFI binaries (.efi) desde la ESP (partición FAT32)
  • Secure Boot: verifica firmas criptográficas de cada binario
  • NVRAM: guarda entradas de arranque persistentes
  • GPT: soporta 128 particiones, discos de cualquier tamaño
  • Shell UEFI: entorno de diagnóstico independiente del SO
```

```bash
# Verificar si el sistema arrancó con UEFI
[ -d /sys/firmware/efi ] && echo "UEFI" || echo "BIOS legacy"
ls /sys/firmware/efi/vars/              # Variables UEFI

# Gestionar entradas de arranque UEFI
sudo efibootmgr                         # Ver entradas actuales
sudo efibootmgr -v                      # Con detalles (rutas EFI)
sudo efibootmgr --bootorder 0001,0000   # Cambiar orden de arranque

# La EFI System Partition (ESP)
lsblk -f | grep -i fat                  # La ESP es FAT32
sudo mount /boot/efi                    # Normalmente ya está montada
ls /boot/efi/EFI/                       # Cargadores instalados
```

### Secure Boot

```bash
# Ver estado de Secure Boot
mokutil --sb-state                      # Secure Boot: enabled/disabled
sudo dmesg | grep -i "secure boot"

# Inscribir claves propias (para kernels/módulos propios firmados)
sudo mokutil --import mi-clave.der      # Añadir clave MOK (Machine Owner Key)
# Requiere reiniciar y confirmar en el menú MOK Manager
```

---

## 13.2 — GRUB2 a fondo

GRUB (GRand Unified Bootloader) versión 2 es el cargador de arranque estándar en la mayoría de distribuciones Linux. Actúa como intermediario entre el firmware y el kernel.

```
Archivos clave de GRUB2:

/boot/grub/grub.cfg          ← configuración GENERADA AUTOMÁTICAMENTE
                                (NO editar directamente)
/etc/default/grub            ← configuración del usuario (editar aquí)
/etc/grub.d/                 ← scripts que generan grub.cfg
  00_header                    variables base
  10_linux                     kernels Linux instalados (detección automática)
  30_os-prober                 otros sistemas operativos (dual boot)
  40_custom                    entradas manuales del administrador

/boot/efi/EFI/ubuntu/grubx64.efi  ← el binario UEFI de GRUB
/boot/grub/i386-pc/boot.img       ← stage 1 de GRUB para BIOS legacy
```

### Configurar GRUB

```bash
# /etc/default/grub — variables de configuración
GRUB_DEFAULT=0                    # Entrada seleccionada por defecto (0=primera)
GRUB_SAVEDEFAULT=true             # Guardar la última selección (con GRUB_DEFAULT=saved)
GRUB_TIMEOUT=5                    # Segundos hasta arranque automático
GRUB_TIMEOUT_STYLE=menu           # hidden / menu / countdown

# Parámetros pasados al kernel:
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash"    # Arranques normales
GRUB_CMDLINE_LINUX=""                         # Siempre, incluso en rescate

# Parámetros del kernel más usados:
# quiet         → silenciar mensajes durante arranque
# splash        → pantalla de carga gráfica
# nomodeset     → no usar KMS (problemas de GPU/driver gráfico)
# ro            → montar raíz como solo lectura
# single        → modo monousuario
# init=/bin/bash→ arrancar directamente bash (recuperación)
# net.ifnames=0 → volver a eth0/eth1 (deshabilitar nombres predictivos)
# console=ttyS0,115200 → consola serie (servidores sin monitor)

GRUB_DISABLE_OS_PROBER=false     # Detectar otros SO (Windows, etc.)

# Regenerar grub.cfg SIEMPRE después de editar /etc/default/grub
sudo update-grub                  # Debian/Ubuntu
sudo grub2-mkconfig -o /boot/grub2/grub.cfg   # RHEL/Fedora/Rocky
```

### Editar entradas en tiempo real

```bash
# En el menú GRUB:
# 1. Seleccionar la entrada y pulsar 'e' (edit)
# 2. Ir a la línea que empieza con 'linux' o 'linuxefi'
# 3. Al final de esa línea añadir/modificar parámetros
# 4. Ctrl+X o F10 para arrancar con esos parámetros (solo esta vez)

# Casos de uso frecuentes en la línea linux:
# nomodeset                       → pantalla negra por GPU
# systemd.unit=rescue.target      → arrancar en modo rescate
# systemd.unit=emergency.target   → modo emergencia (raíz R/O)
# init=/bin/bash                  → shell sin systemd (recuperar root)
# rd.break                        → parar dentro del initramfs
```

### Reinstalar GRUB tras un desastre

```bash
# ESCENARIO: grub.cfg corrompido o MBR/ESP sobreescrito
# SOLUCIÓN: live USB + chroot + reinstalar GRUB

# 1. Arrancar desde live USB
# 2. Identificar particiones del sistema instalado
lsblk
# /dev/sda1 → ESP (FAT32, /boot/efi)
# /dev/sda2 → /boot
# /dev/sda3 → / (raíz)

# 3. Montar el sistema instalado
sudo mount /dev/sda3 /mnt
sudo mount /dev/sda2 /mnt/boot
sudo mount /dev/sda1 /mnt/boot/efi

# 4. Montar pseudo-filesystems del kernel (imprescindible)
for d in dev proc sys run; do
    sudo mount --bind /$d /mnt/$d
done

# 5. Entrar en chroot
sudo chroot /mnt

# 6. Reinstalar y regenerar GRUB
grub-install --target=x86_64-efi --efi-directory=/boot/efi  # UEFI
# grub-install /dev/sda   # BIOS legacy: instalar en el MBR
update-grub

# 7. Salir y desmontar
exit
sudo umount -R /mnt
sudo reboot
```

### `systemd-boot`: la alternativa minimalista UEFI

```bash
# systemd-boot: más simple que GRUB, solo UEFI, sin soporte BIOS

sudo bootctl install                  # Instalar

# Configuración en la ESP:
# /boot/efi/loader/loader.conf        → timeout, default
# /boot/efi/loader/entries/*.conf     → una entrada por kernel

# Una entrada típica:
# title   Ubuntu
# linux   /vmlinuz
# initrd  /initrd.img
# options root=UUID=... ro quiet splash

bootctl status                        # Estado del cargador
bootctl list                          # Entradas disponibles
bootctl update                        # Actualizar si hay nueva versión
```

---

## 13.3 — initramfs y el arranque temprano

El **initramfs** (Initial RAM Filesystem) es un sistema de archivos comprimido que el kernel carga en memoria durante el arranque. Su trabajo: preparar el entorno mínimo necesario para montar el sistema de archivos raíz real.

```
¿Por qué existe el initramfs?

Dilema del huevo y la gallina:
  • El kernel necesita montar el FS raíz para cargar drivers
  • Pero necesita los drivers para acceder al disco

Solución: el initramfs contiene todos los drivers y herramientas
          necesarios para desbloquear y montar el disco antes
          de que el sistema esté disponible

Casos donde el initramfs hace trabajo crítico:
  • LUKS: descifrar el disco antes de montarlo (módulo 12)
  • LVM: activar el VG antes de acceder a los LVs (módulo 12)
  • mdadm: ensamblar el array RAID antes de montar (módulo 12)
  • NFS root: configurar red antes de montar /
  • Drivers de almacenamiento no compilados en el kernel
  • Sistemas de archivos: Btrfs, ZFS
```

```bash
# Ver qué hay dentro del initramfs
lsinitramfs /boot/initrd.img          # Debian/Ubuntu: listar contenidos
lsinitrd /boot/initramfs-*.img        # RHEL/Fedora

# Reconstruir el initramfs
sudo update-initramfs -u              # Actualizar el activo
sudo update-initramfs -u -k all       # Actualizar TODOS los kernels instalados
sudo update-initramfs -c -k $(uname -r)  # Crear nuevo para el kernel actual

# RHEL/Fedora:
sudo dracut --force                   # Reconstruir con dracut
sudo dracut --list-modules            # Ver módulos disponibles

# Arch Linux:
sudo mkinitcpio -P                    # Reconstruir todos
sudo mkinitcpio -p linux              # Solo para el preset 'linux'

# Configuración (Debian/Ubuntu)
# /etc/initramfs-tools/initramfs.conf:
# MODULES=most  → incluir los drivers más comunes (arranque universal)
# MODULES=dep   → solo los drivers necesarios para ESTE hardware

# Añadir un módulo específico al initramfs
echo "virtio_blk" | sudo tee /etc/initramfs-tools/modules
sudo update-initramfs -u

# Depurar el initramfs: parámetro rd.break en GRUB
# Añadir rd.break a la línea del kernel → shell dentro del initramfs
# Dentro del initramfs:
# mount -o remount,rw /sysroot
# chroot /sysroot
```

---

## 13.4 — El kernel Linux

### Estructura y versiones

```
Nomenclatura del kernel: MAJOR.MINOR.PATCH[-LOCALVERSION]
Ejemplo: 6.8.0-45-generic

  6     → versión mayor
  8     → versión menor (aumenta ~cada 9 semanas desde 2011)
  0     → parche
  45    → número de actualización del paquete de la distro
  generic → variante (generic, lowlatency, cloud, rt...)

Tipos de kernels:
  LTS (Long-Term Support): mantenidos 2-6 años. Ej: 5.15, 6.1, 6.6
  Mainline: la última versión activa de desarrollo
  Stable: versión estable actual, actualizada semanalmente
  Distro: kernels modificados y parcheados por la distribución
           (Ubuntu, Debian, RHEL añaden backports y parches propios)

Referencia canónica: https://kernel.org
```

```bash
# Información del kernel en ejecución
uname -r                              # Versión (ej: 6.8.0-45-generic)
uname -a                              # Toda la información
cat /proc/version                     # Versión + fecha de compilación

# Kernels instalados (no solo el activo)
dpkg --list | grep linux-image        # Debian/Ubuntu
rpm -qa | grep kernel                 # RHEL/Fedora

# Instalar un kernel específico
sudo apt install linux-image-6.8.0-45-generic

# Eliminar kernels viejos (liberar espacio en /boot)
sudo apt autoremove                   # Ubuntu: elimina los no usados automáticamente
sudo dpkg --purge linux-image-6.5.0-21-generic  # Eliminar uno específico

# /boot: archivos del kernel
ls -lh /boot/
# vmlinuz-6.8.0-45-generic      → el kernel comprimido
# initrd.img-6.8.0-45-generic   → el initramfs
# System.map-6.8.0-45-generic   → tabla de símbolos (para depuración)
# config-6.8.0-45-generic       → configuración de compilación
```

### Compilar un kernel (cuándo y cómo)

```bash
# ¿Cuándo compilar? Solo cuando el kernel de la distro no sirve:
# - Driver experimental no incluido
# - Optimizar para hardware embebido muy específico
# - Desarrollo o parcheado del kernel
# En producción normal: SIEMPRE usar el kernel de la distro
# (parches de seguridad, compatibilidad con DKMS, soporte)

sudo apt install build-essential libncurses-dev bison flex libssl-dev libelf-dev

# Obtener código fuente
wget https://cdn.kernel.org/pub/linux/kernel/v6.x/linux-6.8.tar.xz
tar xvf linux-6.8.tar.xz && cd linux-6.8

# Configurar
make menuconfig                    # Interfaz TUI — la más común
cp /boot/config-$(uname -r) .config && make oldconfig  # Partir de la config actual

# Compilar (tarda 30-90 minutos)
make -j$(nproc)
sudo make modules_install            # Instalar módulos en /lib/modules/
sudo make install                    # Copiar vmlinuz + initramfs a /boot
sudo update-grub                     # Añadir la entrada al menú
```

---

## 13.5 — Módulos del kernel

Los módulos son fragmentos de código que se cargan y descargan del kernel en tiempo de ejecución. Permiten soportar hardware y funcionalidades sin tenerlo todo compilado estáticamente.

```
/lib/modules/$(uname -r)/        → directorio de módulos del kernel activo
  kernel/drivers/                → drivers de hardware
  kernel/fs/                     → sistemas de archivos (ext4, xfs, btrfs...)
  kernel/net/                    → protocolos de red
  extra/                         → módulos de terceros (DKMS)
  modules.dep                    → grafo de dependencias entre módulos
  modules.alias                  → mapeo hardware (modalias) → módulo
```

### Gestión de módulos

```bash
# lsmod: módulos cargados actualmente
lsmod
# Module                  Size  Used by
# ext4                  999424  1
# mbcache                16384  1 ext4
# jbd2                  155648  1 ext4

# modinfo: información detallada
modinfo ext4
modinfo nvidia
# filename:  /lib/modules/.../ext4.ko.zst
# description: Fourth Extended Filesystem
# depends:    mbcache,jbd2
# parm:       errors:Behavior on errors...

# modprobe: cargar un módulo (con sus dependencias automáticamente)
sudo modprobe wireguard              # Cargar wireguard
sudo modprobe -v kvm_intel           # Con salida detallada
sudo modprobe -r wireguard           # Descargar (si no está en uso)

# insmod / rmmod: más primitivos (sin gestión de dependencias)
sudo insmod /lib/modules/$(uname -r)/kernel/drivers/net/wireguard.ko
sudo rmmod wireguard
```

### Configuración persistente de módulos

```bash
# /etc/modprobe.d/: configuración persistente
# /etc/modules-load.d/: módulos a cargar en el arranque

# Cargar un módulo en el arranque
echo "wireguard" | sudo tee /etc/modules-load.d/wireguard.conf

# Pasar parámetros permanentes a un módulo
echo "options iwlwifi 11n_disable=1" | sudo tee /etc/modprobe.d/iwlwifi.conf

# BLACKLIST: evitar que un módulo se cargue automáticamente
# Casos de uso: driver propietario vs. open-source, módulo defectuoso
echo "blacklist nouveau" | sudo tee /etc/modprobe.d/blacklist-nouveau.conf
echo "install nouveau /bin/false" | sudo tee -a /etc/modprobe.d/blacklist-nouveau.conf
# La línea 'install' es más robusta: evita la carga incluso como dependencia

sudo update-initramfs -u             # Reflejar los cambios en el initramfs
```

### DKMS — Módulos que sobreviven a actualizaciones del kernel

```bash
# DKMS recompila módulos externos automáticamente cuando se instala un nuevo kernel
sudo apt install dkms

# Ver módulos DKMS instalados
dkms status
# virtualbox-guest-additions/6.1.36, 6.8.0-45-generic, x86_64: installed
# zfs/2.2.2, 6.8.0-45-generic, x86_64: installed

# Registrar un módulo propio en DKMS
# (requiere un dkms.conf en el directorio fuente)
sudo dkms add -m mi-driver/1.0
sudo dkms build -m mi-driver/1.0 -k $(uname -r)
sudo dkms install -m mi-driver/1.0 -k $(uname -r)
```

---

## 13.6 — Parámetros del kernel: sysctl

El kernel expone cientos de parámetros ajustables en `/proc/sys/`. La herramienta `sysctl` permite leerlos y modificarlos sin reiniciar.

```bash
# Leer parámetros
sysctl vm.swappiness                         # Ver la swappiness actual (módulo 12)
sysctl net.ipv4.ip_forward                  # ¿Está activo el routing?
sysctl kernel.randomize_va_space            # Nivel de ASLR
sysctl -a 2>/dev/null | grep "net.ipv4"     # Filtrar por subsistema

# También directamente desde /proc/sys:
cat /proc/sys/vm/swappiness
cat /proc/sys/net/ipv4/ip_forward

# Modificar en caliente (se pierde al reiniciar)
sudo sysctl -w vm.swappiness=10
sudo sysctl -w net.ipv4.ip_forward=1        # Activar routing (necesario para VPN/NAT)
sudo sysctl -w kernel.panic=30              # Reiniciar automáticamente 30s tras kernel panic
```

```bash
# Persistencia: /etc/sysctl.d/*.conf
# Se aplican en el arranque

sudo tee /etc/sysctl.d/99-servidor.conf << 'EOF'
# Red
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 1

# Protecciones de red (ver módulo 14)
net.ipv4.conf.all.rp_filter = 1          # Reverse path filtering (anti-spoofing)
net.ipv4.conf.all.accept_redirects = 0   # No aceptar ICMP redirects
net.ipv4.tcp_syncookies = 1              # Protección contra SYN flood
net.ipv4.conf.all.log_martians = 1       # Log de paquetes con rutas imposibles

# Memoria
vm.swappiness = 10
vm.dirty_ratio = 15

# Kernel
kernel.sysrq = 1                         # Tecla SysRq (recuperación de emergencia)
kernel.panic = 30                        # Reiniciar 30s tras kernel panic
kernel.dmesg_restrict = 1               # Solo root puede leer dmesg
kernel.kptr_restrict = 2                # Ocultar punteros del kernel
kernel.randomize_va_space = 2           # ASLR completo
EOF

sudo sysctl --system                     # Aplicar todos los .conf sin reiniciar
```

---

## 13.7 — udev y los dispositivos

`udev` es el gestor de dispositivos dinámico del kernel Linux. Cuando conectas hardware, el kernel detecta el evento y lo comunica a udev, que crea el nodo en `/dev/`, aplica permisos y puede ejecutar comandos arbitrarios.

```
Flujo de un evento udev:

Hardware conectado
      │
      ▼
Kernel detecta evento → emite "uevent" (add/remove/change)
      │
      ▼
udevd recibe el uevent
      │
      ▼
udevd evalúa reglas en /etc/udev/rules.d/ y /lib/udev/rules.d/
      │
      ▼
udevd ejecuta acciones: crear /dev/*, permisos, symlinks, run=...
      │
      ▼
/dev/sdb creado, symlinks en /dev/disk/by-*, notificaciones enviadas
```

### Inspeccionar eventos y dispositivos

```bash
# udevadm monitor: ver eventos en tiempo real
sudo udevadm monitor                   # Todos los eventos
sudo udevadm monitor --udev            # Solo eventos procesados por udev
# (conectar/desconectar un USB para ver los eventos)

# udevadm info: atributos de un dispositivo
sudo udevadm info /dev/sda
sudo udevadm info --attribute-walk /dev/sda   # Árbol completo (para escribir reglas)

# Recargar reglas sin reiniciar
sudo udevadm control --reload-rules
sudo udevadm trigger                   # Reaplicar reglas a los dispositivos existentes
```

### Escribir reglas udev

Las reglas viven en `/etc/udev/rules.d/` (administrador). Se procesan en orden numérico.

```bash
# Estructura de una regla:
# CLAVE=="valor", CLAVE=="valor" → ACCION="valor"
# Claves de comparación (==): ACTION, SUBSYSTEM, KERNEL, ATTR{}, ENV{}
# Claves de asignación (=, +=): NAME, SYMLINK, OWNER, GROUP, MODE, RUN

# Ejemplo 1: disco USB con UUID fijo → symlink /dev/backup-disk
# Primero obtener los atributos:
sudo udevadm info --attribute-walk /dev/sdb | grep -E "idVendor|idProduct|serial"

sudo tee /etc/udev/rules.d/99-backup-disk.rules << 'EOF'
SUBSYSTEM=="block", ENV{ID_FS_UUID}=="abc123-def456", SYMLINK+="backup-disk"
EOF

# Ejemplo 2: permisos para dispositivo Arduino
sudo tee /etc/udev/rules.d/99-arduino.rules << 'EOF'
SUBSYSTEM=="tty", ATTRS{idVendor}=="2341", ATTRS{idProduct}=="0043", \
    GROUP="dialout", MODE="0660"
EOF

# Ejemplo 3: ejecutar script al conectar un dispositivo
sudo tee /etc/udev/rules.d/99-usb-mount.rules << 'EOF'
ACTION=="add", SUBSYSTEM=="block", ENV{ID_FS_UUID}=="abc123-def456", \
    RUN+="/usr/local/bin/montar-backup.sh"
EOF

sudo udevadm control --reload-rules
ls -la /dev/backup-disk              # Verificar el symlink
```

---

## 13.8 — Inspeccionar el hardware

```bash
# CPU
lscpu
lscpu | grep -E "Model name|CPU\(s\)|Thread|Core|Socket|MHz"
nproc                                # Número de procesadores disponibles

# MEMORIA RAM
free -h
sudo dmidecode -t memory             # Slots de RAM físicamente instalados
sudo dmidecode -t memory | grep -E "Size|Speed|Type|Manufacturer"

# PCI / PCIe
lspci                                # Todos los dispositivos PCI
lspci | grep -i "vga\|nvidia\|amd\|radeon"  # GPU
lspci | grep -i "network\|ethernet\|wireless"  # Tarjetas de red

# USB
lsusb                                # Dispositivos USB conectados
lsusb -t                             # Árbol de hubs y dispositivos

# SISTEMA / DMI
sudo dmidecode -t system             # Fabricante, modelo, número de serie
sudo dmidecode -t bios               # Versión del firmware/UEFI

# HERRAMIENTAS COMPLETAS
sudo apt install hwinfo inxi
hwinfo --short                       # Resumen de todo el hardware
inxi -Fxxx                           # Informe completo (CPU, RAM, disco, GPU, red)
```

### Temperaturas y sensores

```bash
sudo apt install lm-sensors
sudo sensors-detect                  # Detectar chips de sensores (responder YES)
sensors                              # Temperaturas: CPU, GPU, placa base, ventiladores
watch -n 1 sensors                   # Actualización cada segundo

# GPU (NVIDIA)
nvidia-smi                           # Temperatura, uso, memoria VRAM

# Prueba de estrés
sudo apt install stress-ng
stress-ng --cpu $(nproc) --timeout 60s --metrics-brief
```

### Firmware y actualizaciones con `fwupd`

```bash
sudo apt install fwupd

sudo fwupdmgr refresh                # Actualizar metadatos del servidor LVFS
sudo fwupdmgr get-devices            # Ver dispositivos gestionables
sudo fwupdmgr get-updates            # Ver actualizaciones disponibles
sudo fwupdmgr update                 # Instalar todas las actualizaciones

# Microcódigo del CPU (parches de seguridad: Spectre, Meltdown...)
sudo apt install intel-microcode     # Intel
sudo apt install amd64-microcode     # AMD
# El initramfs lo carga muy pronto en el arranque
```

### Gestión de energía

```bash
sudo apt install tlp tlp-rdw         # TLP para laptops
sudo tlp start
sudo tlp-stat -b                     # Estado de la batería
sudo tlp-stat -p                     # Estado de la CPU y energía

# powertop: análisis de consumo
sudo apt install powertop
sudo powertop                        # Interfaz TUI con sugerencias
sudo powertop --auto-tune            # Aplicar todas las optimizaciones
```

---

## 13.9 — Rescate de sistemas

### Los fallos más comunes

```
Síntoma                              Causa probable              Solución
───────────────────────────────────────────────────────────────────────────
Pantalla negra después del GRUB    Módulo GPU                   añadir nomodeset en GRUB
"error: file not found"            grub.cfg corrompido          reinstalar GRUB desde live
"You are in emergency mode"        fstab incorrecto o disco      corregir fstab, e2fsck
Systemd en bucle de reinicio       Servicio crasheando          deshabilitar servicio
Kernel panic                       Driver, RAM defectuosa       probar kernel anterior
Sin menú GRUB (UEFI)               ESP dañada o entrada NVRAM   efibootmgr, reinstalar GRUB
```

### Modo rescate y modo emergencia

```bash
# MODO RESCATE: systemd levanta entorno mínimo con FS montados en R/W
# Activar desde GRUB: systemd.unit=rescue.target  (o: single, o: 1)

# MODO EMERGENCIA: más bajo que rescate. FS raíz en solo lectura.
# Activar desde GRUB: systemd.unit=emergency.target
# Se activa automáticamente cuando systemd falla en sus dependencias básicas

# Dentro del modo emergencia (raíz R/O):
sudo mount -o remount,rw /           # Remontar como R/W
nano /etc/fstab                      # Corregir el error
sync && reboot
```

### `chroot` desde un live USB — La técnica universal

Esta es la técnica más importante del módulo. Permite reparar **cualquier sistema instalado** desde un live USB, trabajando como si estuvieras dentro del sistema dañado.

```bash
# PASO 1: Identificar las particiones del sistema dañado
lsblk -f

# PASO 2: Montar las particiones
sudo mount /dev/sda3 /mnt                       # Raíz
sudo mount /dev/sda2 /mnt/boot 2>/dev/null      # /boot (si es separada)
sudo mount /dev/sda1 /mnt/boot/efi 2>/dev/null  # ESP (si es UEFI)

# Si la raíz está en LVM:
sudo vgscan && sudo vgchange -ay
sudo mount /dev/vg0/root /mnt

# Si la raíz está en LUKS:
sudo cryptsetup luksOpen /dev/sda3 raiz-cifrada
sudo mount /dev/mapper/raiz-cifrada /mnt

# PASO 3: Montar los pseudo-filesystems del kernel (IMPRESCINDIBLE)
for d in dev proc sys run; do
    sudo mount --bind /$d /mnt/$d
done

# PASO 4: Entrar en chroot
sudo chroot /mnt

# PASO 5: Operaciones típicas dentro del chroot
update-grub                          # Regenerar GRUB
grub-install --target=x86_64-efi --efi-directory=/boot/efi  # Reinstalar GRUB UEFI
update-initramfs -u -k all           # Reconstruir initramfs
passwd root                          # Cambiar contraseña de root
nano /etc/fstab                      # Corregir fstab
apt update && apt install linux-image-generic  # Reinstalar el kernel
dpkg --configure -a                  # Reparar paquetes en estado roto

# PASO 6: Salir y desmontar
exit
sudo umount -R /mnt
sudo reboot
```

### Recuperar la contraseña de root

```bash
# MÉTODO 1: Desde GRUB (sin live USB)
# Editar la entrada en GRUB ('e')
# Al final de la línea 'linux' añadir: init=/bin/bash
# Ctrl+X para arrancar → shell root sin contraseña

# Una vez dentro:
mount -o remount,rw /                # Montar / como R/W
passwd root
exec /sbin/init                      # Continuar el arranque

# MÉTODO 2: Live USB + chroot (el más fiable)
# (ver sección anterior, luego 'passwd root' dentro del chroot)
```

---

## Anexos

### A. Interrelaciones con otros módulos

```
◀ Módulo 04 — Sistema de archivos
│  El initramfs monta el FS raíz. El journaling de ext4 explica
│  por qué e2fsck es necesario tras un corte de corriente.

◀ Módulo 09 — Procesos y systemd
│  Systemd es el PID 1 que arranca cuando el kernel e initramfs
│  terminan. Los targets y unidades se explican en el módulo 09.

◀ Módulo 12 — Almacenamiento avanzado
│  LUKS, LVM y RAID se desbloquean/activan en el initramfs.
│  Un fallo de la cabecera LUKS impide el arranque completo.

▶ Módulo 14 — Seguridad y hardening
│  Secure Boot, sysctl de seguridad, restricción de módulos,
│  kernel.dmesg_restrict, kernel.kptr_restrict, ASLR.

▶ Módulo 17 — Linux como servidor
│  sysctl de red para servidores de alto tráfico.
│  Optimización del arranque en infraestructura cloud (cloud-init).
```

---

## Referencias y Bibliografía

1. **Linux Kernel Documentation** — kernel.org  
   https://www.kernel.org/doc/html/latest/

2. **GRUB2 Manual** — GNU Project  
   https://www.gnu.org/software/grub/manual/grub/

3. **Freedesktop.org — systemd-boot**  
   https://www.freedesktop.org/wiki/Software/systemd/systemd-boot/

4. **ArchWiki — GRUB**  
   https://wiki.archlinux.org/title/GRUB

5. **ArchWiki — Unified Extensible Firmware Interface**  
   https://wiki.archlinux.org/title/Unified_Extensible_Firmware_Interface

6. **ArchWiki — Mkinitcpio**  
   https://wiki.archlinux.org/title/Mkinitcpio

7. **ArchWiki — Udev**  
   https://wiki.archlinux.org/title/Udev

8. **Dracut documentation** — kernel.org  
   https://dracut.wiki.kernel.org/

9. **DKMS: Dynamic Kernel Module Support** — Kroah-Hartman et al., Dell, 2003.

10. **Linux Device Drivers, 3ª ed.** — Corbet, Rubini, Kroah-Hartman  
    O'Reilly, 2005. Caps. 1 (kernel modules), 14 (device model).  
    https://lwn.net/Kernel/LDD3/

11. **Understanding the Linux Kernel, 3ª ed.** — Bovet & Cesati  
    O'Reilly, 2005.

12. **fwupd / LVFS** — Richard Hughes  
    https://fwupd.org/

13. **UEFI Specification** — UEFI Forum  
    https://uefi.org/specifications

14. **The Linux Programming Interface** — Michael Kerrisk  
    No Starch Press, 2010.

15. **sysctl documentation** — Linux kernel  
    https://www.kernel.org/doc/Documentation/sysctl/

16. **Brendan Gregg — Linux Performance**  
    http://www.brendangregg.com/linuxperf.html

17. **How Linux Works, 3ª ed.** — Brian Ward  
    No Starch Press, 2021. Capítulo 5: How the Linux Kernel Boots.

18. **Unix and Linux System Administration Handbook** — Nemeth et al.  
    Pearson, 2017. Capítulo 5: The Boot Process.

19. **Red Hat — Managing, monitoring, and updating the kernel**  
    https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/9/

20. **Brendan Gregg — Systems Performance, 2ª ed.**  
    Addison-Wesley, 2020. Capítulo 6: CPUs.

---

## Preguntas de autoevaluación

1. Describe las cinco etapas del arranque moderno con UEFI y systemd. ¿Qué hace exactamente cada etapa?
2. ¿Qué es la EFI System Partition (ESP)? ¿Por qué debe ser FAT32 y no ext4?
3. ¿Por qué no se debe editar directamente `/boot/grub/grub.cfg`? ¿Qué archivo se edita y con qué comando se regenera?
4. Explica para qué sirve el initramfs y en qué tres escenarios del Módulo 12 hace trabajo crítico.
5. ¿Cuál es la diferencia entre `modprobe` e `insmod`? ¿Cuándo usarías cada uno?
6. ¿Qué hace exactamente `blacklist nouveau`? ¿Por qué se añade también `install nouveau /bin/false`?
7. ¿Qué es DKMS y qué problema resuelve con drivers de terceros como NVIDIA o VirtualBox?
8. Explica el flujo de eventos udev cuando conectas un disco USB. ¿Cómo harías para que ese disco siempre se llame `/dev/mi-backup`?
9. ¿Cuáles son los dos modos de recuperación de systemd (`rescue.target` y `emergency.target`)? ¿En qué difieren?
10. Describe el proceso completo de `chroot` desde un live USB para reinstalar GRUB en un sistema UEFI. ¿Por qué es necesario montar `/dev`, `/proc` y `/sys`?
11. Un servidor tiene `net.ipv4.ip_forward = 0`. ¿Qué implica? ¿Cómo lo activarías permanentemente y para qué casos de uso es necesario?
12. Compilaste e instalaste un kernel propio pero el sistema arranca el kernel antiguo. ¿Cuál es la causa más probable y cómo la solucionarías?

---

## Laboratorios prácticos

### Lab 13.1 — Analizar el arranque del sistema

```bash
# 1. Ver cuánto tardó el último arranque
systemd-analyze

# 2. Las 10 unidades que más tardaron
systemd-analyze blame | head -10

# 3. Ver la cadena crítica
systemd-analyze critical-chain multi-user.target

# 4. Revisar errores del arranque
journalctl -b -p err --no-pager | head -30

# 5. Ver los kernels disponibles
ls -lh /boot/vmlinuz*
uname -r

# 6. Comprobar UEFI vs BIOS
[ -d /sys/firmware/efi ] && echo "UEFI mode" || echo "BIOS/Legacy mode"
```

### Lab 13.2 — Explorar módulos del kernel

```bash
# 1. Ver todos los módulos cargados
lsmod | wc -l
lsmod | head -20

# 2. Información de un módulo concreto
modinfo ext4 | grep -E "filename|description|license|depends|parm"

# 3. Cargar y descargar un módulo inocuo
sudo modprobe dummy              # Módulo de interfaz de red virtual
lsmod | grep dummy
ip link show dummy0              # La interfaz creada
sudo modprobe -r dummy
lsmod | grep dummy               # Ya no aparece

# 4. Ver dependencias de un módulo
modinfo kvm_intel 2>/dev/null | grep "^depends" || \
modinfo kvm_amd 2>/dev/null | grep "^depends"
```

### Lab 13.3 — sysctl: leer y modificar parámetros

```bash
# 1. Parámetros clave
sysctl vm.swappiness
sysctl net.ipv4.ip_forward
sysctl kernel.randomize_va_space    # 2 = ASLR completo

# 2. Modificar temporalmente la swappiness
sudo sysctl -w vm.swappiness=1
sysctl vm.swappiness               # Confirmar
# Se restaura al reiniciar

# 3. Contar los parámetros de red IPv4
sysctl -a 2>/dev/null | grep "^net.ipv4" | wc -l
```

### Lab 13.4 — Hardware: inventariar el sistema

```bash
# 1. Procesador
lscpu | grep -E "Architecture|CPU\(s\)|Thread|Core|Socket|Model name"

# 2. Dispositivos PCI
lspci | grep -i "vga\|display\|3d"    # GPU
lspci | grep -i "network\|ethernet"   # NICs

# 3. Dispositivos USB
lsusb

# 4. BIOS/UEFI (puede requerir sudo)
sudo dmidecode -t bios | grep -E "Vendor|Version|Release" 2>/dev/null

# 5. Temperatura del sistema
sensors 2>/dev/null || echo "Instala: sudo apt install lm-sensors && sudo sensors-detect"
```

### Lab 13.5 — udev: monitorizar eventos

```bash
# Monitorizar eventos udev en background
sudo udevadm monitor --udev &
UDEV_PID=$!

# Crear un loop device para generar eventos
dd if=/dev/zero of=/tmp/test.img bs=1M count=10 2>/dev/null
sudo losetup /dev/loop20 /tmp/test.img
# Observar el evento en la salida del monitor

# Información del dispositivo recién creado
sudo udevadm info /dev/loop20

# Limpiar
sudo losetup -d /dev/loop20
rm /tmp/test.img
kill $UDEV_PID 2>/dev/null
```

### Lab 13.6 — Rescate: recuperar un fstab roto (en VM o sistema de prueba)

```bash
# ADVERTENCIA: modifica fstab. Hacer en VM o sistema de prueba.

# 1. Backup de fstab
sudo cp /etc/fstab /etc/fstab.backup

# 2. Introducir un error deliberado
echo "UUID=INEXISTENTE /mnt/fake ext4 defaults 0 2" | sudo tee -a /etc/fstab

# 3. Probar que mount -a falla
sudo mount -a   # Dará error

# 4. Recuperar: eliminar la línea incorrecta
sudo sed -i '/UUID=INEXISTENTE/d' /etc/fstab

# 5. Verificar
sudo findmnt --verify
sudo mount -a && echo "fstab correcto"

# 6. Restaurar desde backup
sudo cp /etc/fstab.backup /etc/fstab
```

---

## Resumen del módulo

✅ **Arranque:** UEFI → ESP → GRUB → vmlinuz+initramfs → kernel → pivot_root → systemd PID 1  
✅ **Análisis:** `systemd-analyze blame`, `journalctl -b -p err`, `dmesg -T`  
✅ **GRUB2:** editar `/etc/default/grub` + `update-grub`; reinstalación con chroot desde live USB  
✅ **initramfs:** `update-initramfs -u`, `lsinitramfs`, `rd.break` para depuración; crucial para LUKS/LVM/RAID  
✅ **Módulos:** `lsmod`, `modinfo`, `modprobe`, blacklist en `/etc/modprobe.d/`, DKMS  
✅ **sysctl:** leer/modificar `/proc/sys/` en caliente; persistencia en `/etc/sysctl.d/`  
✅ **udev:** eventos → reglas en `/etc/udev/rules.d/`; `udevadm monitor/info/trigger`  
✅ **Hardware:** `lspci`, `lscpu`, `lsusb`, `dmidecode`, `sensors`, `fwupdmgr`  
✅ **Rescate:** modo emergencia/rescate; chroot universal; recuperación de root  

**Próximo paso:** [Módulo 14 — Seguridad y hardening](/seguridad-y-hardening). Ahora que entiendes el arranque y el kernel, aplica ese conocimiento para blindar el sistema: Secure Boot, AppArmor, auditd, cifrado y detección de intrusiones.

---

**Última actualización:** 2024-06  
**Versión:** 1.0  
**Estado:** ✅ Listo para enseñanza
