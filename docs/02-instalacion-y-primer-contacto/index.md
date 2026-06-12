---
title: "Módulo 02 — Instalación y primer contacto"
sidebar_label: "02 · Instalación y primer contacto"
description: Preparar un entorno de prácticas con máquinas virtuales, WSL o instalación nativa, verificar ISOs, particionar, y configurar el escritorio Linux.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Módulo 02 — Instalación y primer contacto

## Introducción

En este módulo pasamos de la teoría a la práctica: montarás tu **entorno de trabajo Linux**. No hace falta romper tu máquina ni sacrificar Windows: comenzaremos con opciones seguras (máquinas virtuales, WSL2) y luego cubriremos la instalación nativa completa, incluido el arranque dual.

El objetivo no es simplemente "tener Linux instalado", sino **entender qué ocurre** en cada paso del proceso: cómo funciona el arranque UEFI/BIOS, por qué las particiones se organizan de cierta manera, y qué implica cada decisión de instalación.

### Objetivos de aprendizaje

Al finalizar este módulo, serás capaz de:

- ✅ Evaluar y elegir el método de instalación adecuado (VM, WSL2, nativo, live USB)
- ✅ Descargar y verificar una ISO con `sha256sum` y firmas GPG
- ✅ Crear un USB de arranque con Ventoy, balenaEtcher o `dd`
- ✅ Configurar UEFI/BIOS para arrancar desde USB
- ✅ Instalar Ubuntu o Fedora paso a paso con particionado correcto
- ✅ Configurar arranque dual Linux/Windows de forma segura
- ✅ Navegar el escritorio GNOME/KDE y sus aplicaciones básicas
- ✅ Instalar drivers privativos, codecs y hacer el primer snapshot del sistema

---

## 2.1 — Opciones para probar Linux sin riesgo

Antes de tocar particiones, tienes varias opciones que no modifican en absoluto tu sistema actual.

### Mapa de decisión

```
¿Quieres instalar Linux?
│
├─ NO / Quiero probar primero
│  ├─ ¿Tienes un USB disponible?
│  │  ├─ SÍ → Live USB (2.1.1)
│  │  └─ NO → Máquina virtual (2.1.2)
│  │
│  └─ ¿Estás en Windows y quieres línea de comandos?
│     └─ WSL2 (2.1.3) — Más limitado, muy cómodo
│
└─ SÍ
   ├─ Quiero mantener Windows también → Dual boot (2.4)
   └─ Solo Linux, máximo rendimiento → Instalación nativa (2.3)
```

### 2.1.1 — Sesión live desde USB

Una **sesión live** es Linux ejecutándose directamente desde el USB, sin instalar ni tocar el disco duro. Todo lo que hagas se pierde al apagar (excepto si usas persistencia).

```
USB Live Boot
│
├─ Sistema completo en RAM
├─ Lee archivos del USB
├─ No modifica el disco duro del equipo
├─ Cuando apagas: todo se pierde
└─ Con persistencia: un sector del USB guarda cambios
```

**¿Para qué sirve una sesión live?**

| Uso | Descripción |
|---|---|
| **Probar la distro** | Ver el escritorio, probar WiFi, hardware compatibility |
| **Rescate del sistema** | Recuperar archivos de un Windows dañado |
| **Mantenimiento** | Reparar GRUB, redimensionar particiones |
| **Privacidad** | Tails OS: sesión completamente amnesic |
| **Instalación** | El instalador se lanza desde el live |

**Limitaciones:**
- Sin persistencia: cambios perdidos al reiniciar
- Más lento que sistema instalado (lee desde USB)
- No todos los drivers están disponibles en el live

:::tip
**Recomendación:** Siempre prueba una sesión live antes de instalar. Así verificas que WiFi, pantalla y teclado funcionan correctamente en tu hardware.
:::

### 2.1.2 — Máquinas virtuales (VMs)

Una **máquina virtual** emula hardware completo dentro de tu sistema operativo actual. Linux corre como si fuera una computadora separada, pero es solo un proceso.

```
┌──────────────────────────────────────────┐
│  Tu sistema (Windows / macOS / Linux)    │
│  ┌────────────────────────────────────┐  │
│  │  Hypervisor (VirtualBox / VMware)  │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │   VM: Ubuntu Linux           │  │  │
│  │  │   CPU virtual: 2 cores       │  │  │
│  │  │   RAM virtual: 4 GB          │  │  │
│  │  │   Disco virtual: 25 GB .vdi  │  │  │
│  │  └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

#### Comparativa de hypervisores

| Hypervisor | Tipo | OS anfitrión | Precio | Rendimiento | Uso recomendado |
|---|---|---|---|---|---|
| **VirtualBox** | Tipo 2 | Win/Mac/Linux | Gratuito | Bueno | Aprendizaje, uso general |
| **VMware Workstation Pro** | Tipo 2 | Win/Linux | Gratis (2024) | Muy bueno | Profesional, rendimiento |
| **VMware Fusion** | Tipo 2 | macOS | Gratis (2024) | Muy bueno | macOS profesional |
| **GNOME Boxes** | Tipo 2 | Linux | Gratuito | Bueno | Linux desktop, simplicidad |
| **QEMU/KVM** | Tipo 1+2 | Linux | Gratuito | Excelente | Producción, máximo rendimiento |
| **Hyper-V** | Tipo 1 | Windows Pro | Incluido | Muy bueno | Windows integrado |
| **Parallels Desktop** | Tipo 2 | macOS M1+ | De pago | Excelente (ARM) | Mac con Apple Silicon |

:::info
**Tipo 1 vs Tipo 2:**
- **Tipo 1 (bare-metal):** El hypervisor corre directamente sobre el hardware. Más eficiente.
- **Tipo 2 (hosted):** El hypervisor corre sobre un SO anfitrión. Más fácil de usar.
:::

#### Instalar VirtualBox paso a paso

<Tabs>
<TabItem value="windows" label="Windows">

```powershell
# Opción 1: Descargar desde web oficial
# https://www.virtualbox.org/wiki/Downloads

# Opción 2: Con winget (Windows Package Manager)
winget install Oracle.VirtualBox

# Verificar instalación
VBoxManage --version
```

Después de instalar:
1. Abre VirtualBox
2. Clic en **Nueva** (New)
3. Nombre: `Ubuntu-24.04`, Tipo: Linux, Versión: Ubuntu (64-bit)
4. RAM: mínimo 2048 MB (recomendado 4096 MB)
5. Disco virtual: mínimo 20 GB (recomendado 25 GB)

</TabItem>
<TabItem value="macos" label="macOS">

```bash
# Con Homebrew
brew install --cask virtualbox

# Con brew cask (alternativo)
brew install --cask virtualbox-extension-pack

# O descarga directa desde virtualbox.org
```

:::warning
**macOS Ventura+ (13+):** VirtualBox puede requerir permisos adicionales en Seguridad y Privacidad → Extensiones de kernel. QEMU/UTM puede ser preferible en Mac con Apple Silicon (M1/M2/M3).
:::

</TabItem>
<TabItem value="linux" label="Linux (Ubuntu)">

```bash
# Instalar VirtualBox
sudo apt install virtualbox virtualbox-ext-pack

# Añadir tu usuario al grupo vboxusers
sudo usermod -aG vboxusers $USER

# Cerrar sesión y volver a abrir para aplicar el grupo
```

</TabItem>
</Tabs>

#### Configuración óptima de la VM

Después de crear la VM, antes de instalar, ajusta:

```
VirtualBox → Configuración de la VM → Sistema:
├─ Placa base → RAM: 4096 MB
├─ Procesador → 2 CPUs, Activar VT-x/AMD-V
└─ Aceleración → KVM (en Linux host)

Configuración → Pantalla:
├─ Memoria de vídeo: 128 MB
└─ Controlador gráfico: VMSVGA o VBoxSVGA

Configuración → Red:
├─ Adaptador 1: NAT (acceso a internet)
└─ Adaptador 2: Red solo-anfitrión (opcional, para acceso host↔VM)
```

**Instalar Guest Additions** (mejora resolución, portapapeles, etc.):

```bash
# Dentro de la VM Ubuntu, después de instalar
sudo apt install virtualbox-guest-additions-iso
sudo apt install virtualbox-guest-utils

# O desde el menú de VirtualBox:
# Devices → Insert Guest Additions CD image...
# Luego en la VM:
sudo /media/cdrom/VBoxLinuxAdditions.run
```

#### QEMU/KVM: El hypervisor de producción en Linux

Si tu sistema anfitrión ya es Linux, QEMU/KVM ofrece rendimiento cercano al nativo:

```bash
# Verificar soporte de virtualización hardware
egrep -c '(vmx|svm)' /proc/cpuinfo
# Resultado > 0: virtualización disponible

# Instalar stack QEMU/KVM
sudo apt install qemu-kvm libvirt-daemon-system virt-manager bridge-utils

# Añadir usuario a grupos necesarios
sudo usermod -aG libvirt $USER
sudo usermod -aG kvm $USER

# Iniciar servicio libvirt
sudo systemctl enable --now libvirtd

# Abrir gestor gráfico
virt-manager
```

### 2.1.3 — WSL2: Windows Subsystem for Linux

**WSL2** integra un kernel Linux real dentro de Windows 10/11, sin VM visible. Es la forma más cómoda para desarrolladores que trabajan primariamente en Windows.

```
Windows 11
│
├─ Win32 processes (Explorer, Chrome, VS Code...)
├─ WSL2 subsystem
│  ├─ Kernel Linux real (Microsoft-maintained)
│  └─ Distribución Linux (Ubuntu, Debian, Fedora...)
│     ├─ bash, python, gcc, npm, git
│     ├─ Puede acceder a archivos Windows (/mnt/c/)
│     └─ Windows puede acceder a archivos Linux
└─ Hardware (CPU, RAM, disco compartidos)
```

#### Instalar WSL2

```powershell
# Abrir PowerShell como Administrador

# Instalar WSL2 con Ubuntu (distribución por defecto)
wsl --install

# Ver distribuciones disponibles
wsl --list --online

# Instalar una distribución específica
wsl --install -d Debian
wsl --install -d kali-linux

# Actualizar WSL
wsl --update

# Comprobar versión
wsl --status
```

```
Resultado esperado:
Default Version: 2
Kernel version: 5.15.90.1
WSLg version: 1.0.47
```

#### Uso básico de WSL2

```bash
# Abrir Ubuntu en WSL desde PowerShell
wsl

# O abrir desde el menú inicio: "Ubuntu"

# Acceder a disco C de Windows
ls /mnt/c/Users/TuUsuario/

# Desde Windows, abrir archivos WSL en VS Code
code .

# Ejecutar comandos Linux desde PowerShell
wsl ls -la /home/usuario

# Copiar archivo de Windows a WSL
cp /mnt/c/Users/TuUsuario/archivo.txt ~/archivo.txt
```

#### Limitaciones de WSL2

| Capacidad | WSL2 | VM completa | Nativo |
|---|---|---|---|
| **Rendimiento I/O** | Medio (Windows filesystem) | Bueno | Excelente |
| **GUI (aplicaciones gráficas)** | Sí (WSLg) | Sí | Sí |
| **Acceso a hardware directo** | Limitado | Limitado | Completo |
| **Servicios de red** | Limitado | Completo | Completo |
| **Systemd** | Sí (desde 2022) | Sí | Sí |
| **Docker** | Sí (Docker Desktop) | Sí | Sí |
| **Costo de recursos** | Bajo | Medio-alto | N/A |
| **Ideal para** | Desarrollo, CLI | Aprendizaje, testing | Producción, servidor |

:::tip
**WSL2 + VS Code:** La combinación WSL2 + [VS Code Remote WSL extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl) es extremadamente productiva para desarrollo. El editor corre en Windows pero el código y terminal en Linux.
:::

### 2.1.4 — Contenedores como entorno de práctica

Si solo necesitas un shell Linux para practicar comandos, Docker es la opción más ligera:

```bash
# Desde Windows/macOS con Docker Desktop instalado

# Ubuntu interactivo
docker run -it ubuntu:24.04 bash

# Debian con herramientas básicas
docker run -it debian:bookworm bash

# Alpine: mínimo (5 MB)
docker run -it alpine:latest sh

# Con montaje de directorio local
docker run -it -v $(pwd):/trabajo ubuntu:24.04 bash
```

```
Limitaciones de Docker para aprendizaje:
├─ No hay systemd por defecto
├─ No simula arranque completo
├─ Sin kernel propio (comparte el del host)
└─ Ideal para: comandos básicos, scripting, procesamiento de texto
```

---

## 2.2 — Crear el medio de instalación

### 2.2.1 — Descargar la ISO

Una **imagen ISO** es un archivo que representa exactamente el contenido de un DVD o USB de instalación.

#### ¿Dónde descargar? Siempre desde fuentes oficiales

| Distribución | URL oficial |
|---|---|
| **Ubuntu** | https://ubuntu.com/download |
| **Fedora** | https://fedoraproject.org/workstation/download |
| **Debian** | https://www.debian.org/distrib/ |
| **Linux Mint** | https://linuxmint.com/download.php |
| **Arch Linux** | https://archlinux.org/download/ |
| **Kali Linux** | https://www.kali.org/get-kali/ |

:::warning
**Descarga solo desde sitios oficiales.** ISOs de terceros pueden contener malware. Siempre verifica la URL (HTTPS, dominio oficial).
:::

#### Variantes de Ubuntu que encontrarás

```
Ubuntu Desktop 24.04 LTS
├─ ubuntu-24.04-desktop-amd64.iso   → Escritorio estándar (GNOME)
├─ ubuntu-24.04-live-server-amd64.iso → Servidor (sin GUI)
└─ ubuntu-24.04-preinstalled-server-arm64+raspi.img → Raspberry Pi

Flavors oficiales (misma base, diferente escritorio):
├─ Kubuntu 24.04  → KDE Plasma
├─ Xubuntu 24.04  → XFCE (hardware antiguo)
├─ Ubuntu MATE    → MATE (clásico, ligero)
├─ Lubuntu        → LXQt (muy ligero)
└─ Ubuntu Studio  → Producción multimedia
```

### 2.2.2 — Verificar la integridad de la ISO

**Paso crítico e ignorado por muchos:** Verificar que la ISO descargada es auténtica y no está corrupta ni fue manipulada.

#### Verificación con SHA256

```bash
# Ubuntu proporciona un archivo SHA256SUMS junto a la ISO
# Descargar: https://releases.ubuntu.com/24.04/SHA256SUMS

# Verificar en Linux/macOS
sha256sum ubuntu-24.04-desktop-amd64.iso

# Verificar en Windows (PowerShell)
Get-FileHash ubuntu-24.04-desktop-amd64.iso -Algorithm SHA256

# Comparar la salida con el hash oficial:
# 45f873de9f8cb637345d6e66a583762730bbea30277ef7b32c9c3bd6700a32b2  *ubuntu-24.04-desktop-amd64.iso
```

Si el hash que obtienes **no coincide** con el oficial: **no uses esa ISO**. Está corrupta o fue manipulada.

```
Proceso de verificación:
│
Ubuntu descarga ISO
      ↓
sha256sum produce hash (64 caracteres hex)
      ↓
Comparas con hash en página de Ubuntu
      ↓
¿Coincide?
├─ SÍ → ISO íntegra, puedes continuar
└─ NO → ISO corrupta o adulterada → Descarga de nuevo
```

#### Verificación con GPG (nivel avanzado)

GPG (GNU Privacy Guard) permite verificar que el archivo fue **firmado por Ubuntu** (no solo que está intacto).

```bash
# 1. Descargar archivos necesarios de la página oficial:
#    SHA256SUMS  y  SHA256SUMS.gpg

# 2. Importar clave pública de Ubuntu
gpg --keyid-format long --keyserver hkp://keyserver.ubuntu.com \
    --recv-keys 0x46181433FBB75451 0xD94AA3F0EFE21092

# 3. Verificar la firma
gpg --keyid-format long --verify SHA256SUMS.gpg SHA256SUMS

# Resultado esperado (parcial):
# gpg: Good signature from "Ubuntu CD Image Automatic Signing Key"

# 4. Verificar el hash de la ISO contra el archivo firmado
sha256sum -c SHA256SUMS 2>&1 | grep OK
# ubuntu-24.04-desktop-amd64.iso: OK
```

**¿Cuándo importa la verificación GPG?**
- Siempre que la descarga sea crítica (servidor de producción)
- Cuando la conexión puede haber sido interceptada
- Cuando descargaste desde un mirror no oficial

### 2.2.3 — Grabar el USB

Necesitas un USB de **mínimo 4 GB** (recomendado 8+ GB). El proceso borrará todo el contenido del USB.

#### Opción A: Ventoy (recomendado para múltiples ISOs)

**Ventoy** es una herramienta que convierte el USB en un gestor de arranque multiboot. Solo copias las ISOs al USB como archivos normales, sin necesidad de regrabarlo.

```
USB con Ventoy:
├─ Partición de arranque Ventoy (oculta)
└─ Partición de datos (FAT32/exFAT)
   ├─ ubuntu-24.04-desktop-amd64.iso
   ├─ fedora-40-workstation.iso
   ├─ kali-linux-2024.1-installer-amd64.iso
   └─ ... (puedes tener todas las que quieras)

Al arrancar: Ventoy muestra menú para elegir cuál ISO usar
```

```bash
# En Linux: descargar Ventoy desde https://ventoy.net/
tar xzf ventoy-1.0.XX-linux.tar.gz
cd ventoy-1.0.XX

# Ver dispositivos USB disponibles
lsblk

# Instalar Ventoy en /dev/sdX (reemplaza X con tu dispositivo)
sudo ./Ventoy2Disk.sh -i /dev/sdX

# Montar la partición de datos y copiar ISOs
# (o usar el gestor de archivos normalmente)
```

```powershell
# En Windows: descargar Ventoy-X.X.XX-windows.zip desde ventoy.net
# Extraer y ejecutar Ventoy2Disk.exe como administrador
# Seleccionar el USB e instalar
# Luego copiar ISOs al USB normalmente (drag and drop)
```

#### Opción B: balenaEtcher (gráfico, multiplataforma)

La opción más simple para escribir una sola ISO:

1. Descargar desde [etcher.balena.io](https://etcher.balena.io/)
2. Ejecutar balenaEtcher
3. "Flash from file" → selecciona la ISO
4. "Select target" → selecciona el USB
5. "Flash!" → espera ~5-10 minutos

:::warning
**Etcher borra todo el USB** y lo hace de arranque. No uses Ventoy si ya tienes ISOs en el USB.
:::

#### Opción C: `dd` (línea de comandos, Linux/macOS)

`dd` es la herramienta Unix clásica para copiar bytes exactos. Muy potente pero **peligrosa si equivocas el dispositivo de destino**.

```bash
# 1. Identificar el dispositivo USB CORRECTAMENTE
lsblk
# o
fdisk -l
# Busca el dispositivo del tamaño correcto, ej: /dev/sdb o /dev/sdc

# ⚠️  NUNCA uses /dev/sda (suele ser el disco principal del sistema)

# 2. Desmontar si está montado
sudo umount /dev/sdX*

# 3. Escribir la ISO
sudo dd if=ubuntu-24.04-desktop-amd64.iso \
        of=/dev/sdX \
        bs=4M \
        status=progress \
        oflag=sync

# Parámetros explicados:
# if = input file (ISO)
# of = output file (dispositivo USB)
# bs = block size (4MB es óptimo)
# status=progress = mostrar progreso
# oflag=sync = forzar escritura sincronizada (seguro)
```

```
Salida esperada de dd:
3.5 GiB / 1+1 records in
1+0 records out
3758096384 bytes (3.8 GB, 3.5 GiB) copied, 312 s, 12.1 MB/s
```

:::danger
**`dd` puede destruir datos permanentemente** si escribes en el dispositivo equivocado. Verifica tres veces que `of=/dev/sdX` corresponde al USB y no al disco del sistema.

```bash
# Verificación de seguridad: debe mostrar removable=1
cat /sys/block/sdX/removable
```
:::

### 2.2.4 — Arrancar desde USB: BIOS/UEFI y Secure Boot

#### BIOS vs. UEFI

Hay dos tipos de firmware de arranque en las computadoras modernas:

```
BIOS (Basic Input/Output System) — hasta ~2012
│
├─ Interfaz de texto simple
├─ Arranque desde MBR (Master Boot Record)
├─ Límite de disco: 2 TB
├─ Particiones: máx. 4 primarias (MBR)
└─ No tiene Secure Boot

UEFI (Unified Extensible Firmware Interface) — 2012+
│
├─ Interfaz gráfica
├─ Arranque desde GPT (GUID Partition Table)
├─ Límite de disco: 9.4 ZB (sin límite práctico)
├─ Particiones: hasta 128 primarias (GPT)
├─ Arranque más rápido (Fast Boot)
├─ Secure Boot (opcional, firmware validation)
└─ Soporte para discos > 2 TB
```

#### Acceder al UEFI/BIOS

La tecla varía por fabricante:

| Fabricante | Tecla BIOS/UEFI |
|---|---|
| ASUS | `F2` o `Del` |
| MSI | `Del` |
| Gigabyte | `Del` o `F2` |
| ASRock | `F2` o `F6` |
| HP | `F10` o `Esc` |
| Dell | `F2` |
| Lenovo | `F1`, `F2` o `Fn+F2` |
| Acer | `F2` o `Del` |
| ASUS laptop | `F2` |

**Método alternativo en Windows 10/11:**

```
Configuración → Sistema → Recuperación →
Inicio avanzado → Reiniciar ahora →
Solucionar problemas → Opciones avanzadas → Configuración de firmware UEFI
```

#### Configurar orden de arranque

En la UEFI:
1. Ir a **Boot** (Arranque)
2. Cambiar **Boot Priority**: poner USB (o "UEFI USB") en primer lugar
3. Guardar y salir (F10 generalmente)

#### Secure Boot y Linux

**Secure Boot** es una función UEFI que solo permite cargar bootloaders con firma digital aprobada (por Microsoft).

```
Secure Boot: ON (por defecto en PCs modernos)
│
├─ Windows: Funciona siempre (firmado por Microsoft)
│
├─ Ubuntu/Fedora: Funciona (tienen firma Shim aprobada)
│
└─ Arch Linux, Debian (algunos), distros pequeñas:
   Requiere desactivar Secure Boot O generar tu propia firma
```

**¿Cómo desactivar Secure Boot?** (solo si es necesario)

```
UEFI → Security → Secure Boot → Disabled
```

:::warning
Desactivar Secure Boot es seguro y reversible. No afecta Windows (puedes volver a activarlo).
:::

---

## 2.3 — Instalación guiada paso a paso

Usaremos **Ubuntu 24.04 LTS** como ejemplo, por su instalador más intuitivo. El proceso para Fedora es muy similar.

### 2.3.1 — Conceptos de particionado

Antes de comenzar la instalación, es imprescindible entender cómo organiza Linux el disco.

#### Esquemas de tabla de particiones

```
MBR (Master Boot Record) — Legacy
├─ Creado 1983, IBM PC DOS
├─ Máximo 4 particiones primarias
├─ Máximo 2 TB por disco
├─ Bootloader en primeros 512 bytes del disco
└─ En desuso (usar solo en hardware muy antiguo)

GPT (GUID Partition Table) — Moderno
├─ Parte del estándar UEFI (2010+)
├─ Hasta 128 particiones primarias
├─ Máximo 9.4 ZB por disco
├─ Redundancia: tabla de particiones duplicada al final
└─ Recomendado para todo hardware moderno
```

#### Particiones recomendadas para un sistema desktop

```
Disco SSD 256 GB — Esquema recomendado:

Partición      Punto de montaje  Tamaño      Sistema de archivos  Propósito
───────────────────────────────────────────────────────────────────────────────
/dev/sda1      /boot/efi         512 MB      FAT32 (ESP)          UEFI bootloader
/dev/sda2      /boot             1 GB        ext4                 Kernel e initrd
/dev/sda3      swap              4-8 GB      swap                 Memoria virtual
/dev/sda4      /                 40-60 GB    ext4 o btrfs         Sistema raíz
/dev/sda5      /home             Resto       ext4 o btrfs         Datos del usuario
```

**¿Por qué `/home` separado?**

```
Con /home separado:
├─ Puedes reinstalar el sistema (/) sin perder datos (/home)
├─ Puedes cambiar de distro manteniendo archivos
├─ Más fácil hacer backup de datos (solo /home)
└─ Sistema y datos no compiten por espacio
```

#### Sistemas de archivos principales

| Sistema | Creado | Journaling | Max tamaño archivo | Uso recomendado |
|---|---|---|---|---|
| **ext4** | 2008 | Sí | 16 TB | Uso general, estable, más universal |
| **btrfs** | 2013 | Sí (CoW) | 16 EB | Desktop moderno, snapshots nativos |
| **XFS** | 1993 | Sí | 8 EB | Servidores, grandes archivos |
| **ZFS** | 2001 | Sí (CoW) | 16 EB | Servidores enterprise, NAS |
| **FAT32** | 1996 | No | 4 GB | ESP (partición EFI), compatibilidad |
| **exFAT** | 2006 | No | 128 PB | USBs, compatibilidad Windows |

**Journaling:** Registro de transacciones pendientes. Si el sistema se corta en medio de una escritura, el journal permite recuperar consistencia sin fsck completo.

**Copy-on-Write (CoW):** btrfs y ZFS no sobreescriben datos; crean una copia modificada. Permite snapshots instantáneos.

#### Swap: qué es y cuánta necesitas

**Swap** es espacio en disco usado como extensión de la RAM cuando esta se llena.

```
RAM disponible → Se usa primero (rápida)
RAM llena → Kernel mueve páginas "frías" al swap (lento)
           → Libera RAM para el proceso activo
```

```
Regla general para swap:

RAM < 2 GB    → Swap = 2x RAM
RAM 2-8 GB    → Swap = RAM
RAM 8-16 GB   → Swap = 4-8 GB
RAM > 16 GB   → Swap = 4 GB mínimo (o 0 si no usas hibernación)
RAM > 32 GB   → Sin swap o 8 GB si hibernas

Con hibernación (suspend to disk):
Swap debe ser ≥ RAM (guarda todo el contenido de RAM al hibernar)
```

### 2.3.2 — Instalador de Ubuntu 24.04 pantalla a pantalla

#### Pantalla 1: Bienvenida y tipo de instalación

```
Ubuntu 24.04 LTS — Instalador

¿Qué te gustaría hacer?
○ Probar Ubuntu       → Sesión live sin instalar
● Instalar Ubuntu     → Instalación definitiva

Accesibilidad, idioma y teclado se configuran aquí
```

Selecciona **Instalar Ubuntu** y el idioma preferido.

#### Pantalla 2: Diseño del teclado

Selecciona tu distribución de teclado. Si tienes dudas, usa el campo de prueba:

```
Detectar distribución del teclado → Escribe caracteres especiales
(ñ, ü, @, #, etc.) para verificar
```

#### Pantalla 3: Tipo de instalación

```
Tipo de instalación:
○ Instalación interactiva   → El instalador te guía (recomendado)
○ Instalación automática    → Usa un archivo de configuración (avanzado)

Actualización y otro software:
○ Instalación predeterminada  → Solo lo esencial
● Instalación extendida       → Incluye más apps de oficina y multimedia

□ Instalar controladores de terceros   ← Marcar siempre
  (NVIDIA, WiFi Broadcom, códecs)
```

#### Pantalla 4: Tipo de disco

```
¿Cómo deseas instalar Ubuntu?
○ Instalar junto a Windows   → Dual boot (ver sección 2.4)
○ Borrar disco e instalar    → Instalación limpia (borra todo)
○ Algo más                   → Particionado manual (recomendado aprender)
```

**Particionado manual** (la opción que aprendemos aquí):

```
Tabla de particiones existente:
/dev/sda   500 GB SSD
  /dev/sda1  ntfs  500 MB   (Windows Recovery)
  Espacio libre  499.5 GB

Crear nueva tabla GPT → Sí

[+] Nueva partición:
    Tamaño: 512 MB
    Tipo: Primaria
    Sistema de archivos: FAT32
    Punto de montaje: /boot/efi

[+] Nueva partición:
    Tamaño: 1024 MB
    Tipo: Primaria
    Sistema de archivos: ext4
    Punto de montaje: /boot

[+] Nueva partición:
    Tamaño: 8192 MB
    Tipo: Primaria
    Sistema de archivos: area de intercambio (swap)

[+] Nueva partición:
    Tamaño: 51200 MB (50 GB)
    Tipo: Primaria
    Sistema de archivos: ext4
    Punto de montaje: /

[+] Nueva partición:
    Tamaño: resto (≈440 GB)
    Tipo: Primaria
    Sistema de archivos: ext4
    Punto de montaje: /home
```

#### Pantalla 5: Zona horaria

```
Zona horaria: Buenos Aires / Madrid / Ciudad de México
(El instalador sugiere automáticamente basado en IP)

Nota sobre el reloj hardware:
Linux usa UTC en el reloj hardware
Windows usa hora local
→ Solución dual-boot en sección 2.4
```

#### Pantalla 6: Cuenta de usuario

```
Tu nombre: Juan García
Nombre del ordenador: juan-desktop
Nombre de usuario: juan

Contraseña: [elegir contraseña fuerte]
Confirmar: [repetir]

○ Iniciar sesión automáticamente
● Requerir contraseña para iniciar sesión (recomendado)

□ Usar Active Directory (no marcar a menos que sea necesario)
```

**Consejos para el nombre de usuario:**
- Solo minúsculas, sin espacios, sin caracteres especiales
- Evita palabras comunes (admin, user, test)
- El nombre de usuario se usará en el terminal: `juan@juan-desktop:~$`

#### Pantalla 7: Resumen y confirmación

```
Resumen de instalación:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sistema de archivos:
  /boot/efi → /dev/sda1 (FAT32, 512 MB)
  /boot     → /dev/sda2 (ext4, 1 GB)
  swap      → /dev/sda3 (8 GB)
  /         → /dev/sda4 (ext4, 50 GB)
  /home     → /dev/sda5 (ext4, 440 GB)

Zona horaria: America/Buenos_Aires
Usuario: juan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Instalar]   [Atrás]
```

**Tiempo de instalación:** 10-30 minutos dependiendo del hardware.

### 2.3.3 — Primer arranque y actualización inicial

Al arrancar por primera vez:

```bash
# 1. Actualizar la lista de paquetes
sudo apt update

# 2. Actualizar todos los paquetes instalados
sudo apt upgrade -y

# 3. Actualizar el kernel y paquetes críticos de seguridad
sudo apt full-upgrade -y

# 4. Limpiar paquetes obsoletos
sudo apt autoremove -y
sudo apt autoclean

# 5. Reiniciar para aplicar kernel nuevo (si se actualizó)
sudo reboot
```

```bash
# Verificar versión de Ubuntu
lsb_release -a

# Verificar versión del kernel
uname -r

# Ver información del sistema
hostnamectl
```

```
Resultado esperado de hostnamectl:
   Static hostname: juan-desktop
         Icon name: computer-desktop
           Chassis: desktop
        Machine ID: f1a2b3c4d5e6...
           Boot ID: 7g8h9i0j1k2l...
  Operating System: Ubuntu 24.04 LTS
            Kernel: Linux 6.8.0-35-generic
      Architecture: x86-64
```

---

## 2.4 — Arranque dual con Windows

El arranque dual (dual boot) permite tener Windows y Linux en el mismo equipo y elegir cuál iniciar en cada arranque.

### 2.4.1 — Preparar Windows antes de instalar Linux

Estos pasos son críticos para evitar pérdida de datos y problemas de arranque.

#### Paso 1: Hacer copia de seguridad

```
Antes de cualquier modificación de particiones:
├─ Backup completo del sistema en disco externo
├─ O imagen del sistema con Macrium Reflect / Clonezilla
└─ Verificar que el backup funciona
```

#### Paso 2: Desactivar Fast Startup en Windows

**Fast Startup** es un "apagado rápido" de Windows que en realidad no apaga completamente el sistema: guarda el estado en hibernación. Esto **bloquea** las particiones NTFS, impidiendo que Linux las monte correctamente.

```
Panel de Control → Hardware y sonido →
Opciones de energía → Elegir el comportamiento del botón de encendido →
Cambiar la configuración que actualmente no está disponible →
[Desmarcar] Activar inicio rápido (recomendado)
```

O mediante PowerShell como administrador:

```powershell
powercfg /h off
```

#### Paso 3: Desactivar BitLocker (si está activo)

BitLocker cifra el disco. Linux no puede redimensionar particiones cifradas.

```
Configuración → Privacidad y seguridad → Cifrado del dispositivo →
Desactivar cifrado del dispositivo

# O si usas BitLocker completo:
manage-bde -off C:
```

#### Paso 4: Desfragmentar (solo discos HDD, no SSD)

```
# Solo para HDD mecánicos
Defragmentar y optimizar unidades → Analizar → Optimizar
```

#### Paso 5: Reducir partición de Windows con `diskpart`

El instalador puede hacerlo, pero es más seguro hacerlo desde Windows:

```
Administración de discos (diskmgmt.msc):
1. Click derecho en C: → Reducir volumen
2. Espacio a reducir: (espacio para Linux, ej: 50000 MB = ~50 GB)
3. Confirmar → El espacio libre aparece como "Sin asignar"
```

O desde la línea de comandos (como administrador):

```cmd
diskpart
list disk
select disk 0
list partition
select partition 3    (la partición C:)
shrink desired=51200  (reducir 50 GB = 51200 MB)
exit
```

### 2.4.2 — Instalación de Linux junto a Windows

Con el espacio libre preparado, el instalador de Ubuntu detecta automáticamente Windows:

```
Tipo de instalación:
● Instalar Ubuntu junto a Windows Boot Manager
  ↓
  Ajustar tamaños arrastrando el divisor
  Ubuntu: 50 GB    Windows: restante
```

O puedes usar el particionado manual que vimos en 2.3.2, creando las particiones en el "espacio sin asignar".

:::warning
**No borres la partición EFI de Windows** (suele ser /dev/sda1, ~100-500 MB, FAT32). GRUB y Windows la compartirán.
:::

### 2.4.3 — GRUB: el gestor de arranque

**GRUB2** (Grand Unified Bootloader versión 2) es el gestor de arranque que Linux instala. Al encender, aparece un menú:

```
┌──────────────────────────────────────────────────────┐
│           GNU GRUB version 2.12                      │
├──────────────────────────────────────────────────────┤
│ *Ubuntu                                              │
│  Ubuntu (opciones avanzadas)                         │
│  Windows Boot Manager (on /dev/sda1)                 │
│                                                      │
│  Use the ↑ and ↓ keys to select which entry is      │
│  highlighted. Press enter to boot the selected OS.   │
└──────────────────────────────────────────────────────┘
     Countdown: 10 seconds    [e]dit   [c]ommand line
```

**Personalizar GRUB:**

```bash
# Editar configuración de GRUB
sudo nano /etc/default/grub

# Parámetros importantes:
GRUB_DEFAULT=0                    # Entrada predeterminada (0 = primera)
GRUB_TIMEOUT=10                   # Segundos antes de arrancar
GRUB_TIMEOUT_STYLE=menu           # Mostrar menú siempre
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash"  # Parámetros del kernel

# Guardar y aplicar
sudo update-grub
```

**¿Qué hace `update-grub`?**

```bash
# update-grub escanea /boot y todos los discos, encuentra:
# - Kernels de Linux instalados
# - Otros sistemas operativos (Windows, macOS)
# - Genera /boot/grub/grub.cfg automáticamente

# Ver la configuración generada
cat /boot/grub/grub.cfg | head -50
```

### 2.4.4 — Problemas típicos del dual boot

#### Problema 1: Hora del reloj incorrecta

**Causa:** Windows guarda hora local en el RTC (Real-Time Clock hardware). Linux guarda UTC. Cuando cambias entre SOs, la hora se desincroniza.

```
Solución: Configurar Windows para usar UTC
(más correcto técnicamente)
```

```powershell
# En Windows (PowerShell como administrador)
reg add "HKEY_LOCAL_MACHINE\System\CurrentControlSet\Control\TimeZoneInformation" `
    /v RealTimeIsUniversal /d 1 /t REG_DWORD /f
```

```bash
# En Linux (verificar)
timedatectl status
# Debe mostrar: RTC in local TZ: no
```

#### Problema 2: GRUB no muestra Windows

```bash
# Re-escanear y actualizar GRUB
sudo update-grub

# Si os-prober no detecta Windows:
sudo apt install os-prober
sudo os-prober           # Debe mostrar la partición de Windows
sudo update-grub
```

```bash
# Verificar que os-prober está habilitado en grub config
grep GRUB_DISABLE_OS_PROBER /etc/default/grub
# Si aparece: GRUB_DISABLE_OS_PROBER=true → cambiar a false
```

#### Problema 3: Secure Boot impide arrancar Linux

```
Síntomas: Pantalla negra o mensaje "Secure Boot Violation"
Solución:
1. Reiniciar y entrar a UEFI (tecla de acceso)
2. Security → Secure Boot → Disabled
3. Guardar y reiniciar

Alternativa (sin desactivar Secure Boot):
- Ubuntu y Fedora tienen Shim firmado por Microsoft
- Reinstalar con la opción "Install alongside Windows"
  que configura el Shim correctamente
```

#### Problema 4: Windows no arranca después de instalar Linux

Puede ocurrir si GRUB sobreescribió el bootloader de Windows incorrectamente.

```bash
# Desde sesión live de Linux:
sudo update-grub  # Regenerar, puede detectar Windows

# Si el problema persiste, reparar desde Windows Recovery:
# 1. Arrancar con USB de instalación de Windows
# 2. Reparar → Solucionar problemas → Opciones avanzadas
# 3. Símbolo del sistema:
bootrec /fixmbr
bootrec /fixboot
bootrec /rebuildbcd
```

---

## 2.5 — El escritorio Linux

### 2.5.1 — Entornos de escritorio (DE)

Un **entorno de escritorio** (Desktop Environment) proporciona la interfaz gráfica completa: ventanas, paneles, menús, aplicaciones básicas. En Linux existen múltiples opciones.

```
┌──────────────────────────────────────────────────────────────────┐
│ Entorno de Escritorio Linux                                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                  Aplicaciones                            │    │
│  │   (Nautilus, Dolphin, Gedit, GIMP, LibreOffice...)      │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │               Gestor de ventanas                         │    │
│  │            (Mutter, KWin, Openbox...)                    │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │         Toolkit gráfico (GTK, Qt)                        │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │      Servidor de pantalla (X11 o Wayland)                │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

#### GNOME

El DE por defecto de Ubuntu, Fedora, Debian.

```
Características:
├─ Filosofía: Minimalismo, consistencia, accesibilidad
├─ Toolkit: GTK4
├─ Gestor de ventanas: Mutter (Wayland nativo)
├─ Barra superior con actividades y reloj
├─ "Activities Overview" (tecla Super): buscar apps y ventanas
├─ Extensiones: Personalizable vía GNOME Shell Extensions
└─ RAM base: ~800 MB - 1.2 GB
```

**Atajos de teclado GNOME importantes:**

| Atajo | Acción |
|---|---|
| `Super` | Actividades (buscar apps/ventanas) |
| `Super + A` | Ver todas las aplicaciones |
| `Super + ↑/↓` | Maximizar/restaurar ventana |
| `Super + ←/→` | Dividir pantalla (tiling) |
| `Super + L` | Bloquear pantalla |
| `Ctrl + Alt + T` | Abrir terminal |
| `Alt + F4` | Cerrar ventana |
| `Alt + Tab` | Cambiar entre aplicaciones |

#### KDE Plasma

```
Características:
├─ Filosofía: Flexibilidad total, configuración granular
├─ Toolkit: Qt5/Qt6
├─ Gestor de ventanas: KWin (X11 y Wayland)
├─ Barra de tareas inferior (estilo Windows)
├─ Altamente personalizable: widgets, paneles, efectos
├─ Dolphin: gestor de archivos muy potente
└─ RAM base: ~600-900 MB
```

**Comparativa GNOME vs KDE:**

| Aspecto | GNOME | KDE Plasma |
|---|---|---|
| **Facilidad inicial** | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Personalización** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Uso de RAM** | Moderado | Menor |
| **Consistencia visual** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Gestor de archivos** | Nautilus (simple) | Dolphin (potente) |
| **Aplicaciones** | GNOME Apps (modernas) | KDE Apps (ricas) |
| **Wayland** | Excelente soporte | Muy buen soporte |

#### XFCE

Entorno ligero para hardware antiguo:

```
Características:
├─ Filosofía: Ligero, estable, tradicional
├─ Toolkit: GTK2/GTK3
├─ RAM base: ~350-500 MB
├─ Perfecto para: Equipos con 2-4 GB de RAM
└─ Distribuciones: Xubuntu, MX Linux, Manjaro XFCE
```

#### Comparativa general de entornos

| DE | Toolkit | RAM | Ideal para |
|---|---|---|---|
| **GNOME** | GTK4 | ~1 GB | Usuarios modernos, productividad |
| **KDE Plasma** | Qt6 | ~700 MB | Personalización, usuarios Windows |
| **XFCE** | GTK3 | ~400 MB | Hardware antiguo, tradicional |
| **LXQt** | Qt5 | ~300 MB | Hardware muy antiguo, mínimo |
| **MATE** | GTK3 | ~450 MB | Clásico GNOME 2, nostálgico |
| **Cinnamon** | GTK3 | ~600 MB | Fácil para usuarios Windows |
| **i3/Sway** | - | ~100 MB | Tiling WM, usuarios avanzados |

### 2.5.2 — X11 vs. Wayland: el servidor de pantalla

#### X11 (X Window System)

```
X11: El estándar histórico (1984 — MIT)

Arquitectura cliente-servidor:
┌────────────────────────────────────────────┐
│  Aplicación (cliente X11)                  │
│  "Dibuja ventana en posición X,Y"          │
│      ↕  protocolo X11 (red o socket local) │
│  Servidor X (Xorg)                         │
│  Gestiona pantalla, teclado, ratón         │
│      ↕  drivers del kernel                 │
│  Hardware (GPU, monitor)                   │
└────────────────────────────────────────────┘
```

**Problemas históricos de X11:**
- Protocolo complejo y con 40 años de extensiones
- Aplicaciones pueden espiar pantalla de otras (sin permisos)
- Latencia en compositing
- No apto para aislamiento de seguridad

#### Wayland

```
Wayland: El reemplazo moderno (2008 — Red Hat)

Arquitectura directa:
┌────────────────────────────────────────────┐
│  Aplicación (cliente Wayland)              │
│  Renderiza en buffer propio                │
│      ↕  protocolo Wayland (socket local)   │
│  Compositor Wayland (Mutter, KWin, sway)  │
│  Composita buffers y controla pantalla     │
│      ↕  DRM/KMS (kernel)                  │
│  Hardware (GPU, monitor)                   │
└────────────────────────────────────────────┘
```

**Ventajas de Wayland:**
- Aislamiento: Las apps no pueden espiar otras
- Menos latencia (un componente menos)
- Mejor soporte HiDPI (pantallas 4K)
- Mejor manejo de múltiples monitores con diferentes escalas

**Estado actual (2024):**

```
Wayland:
├─ GNOME: Usa Wayland por defecto desde GNOME 40 (2021)
├─ KDE Plasma 6: Wayland por defecto desde marzo 2024
├─ Soporte NVIDIA: Mejoró significativamente en 2023-2024
└─ XWayland: Capa de compatibilidad para apps X11 antiguas

X11:
└─ Aún disponible como fallback (GNOME, KDE tienen opción X11)
```

```bash
# Verificar qué servidor de pantalla usas
echo $XDG_SESSION_TYPE
# Resultado: wayland o x11

# Ver sesión activa
loginctl show-session $(loginctl | grep $(whoami) | awk '{print $1}') -p Type
```

### 2.5.3 — Aplicaciones esenciales del escritorio

Al instalar Ubuntu, estas aplicaciones vienen preinstaladas o disponibles fácilmente:

#### Gestión de archivos

```bash
# Nautilus (GNOME) — Gestor de archivos
nautilus

# Accesos de teclado en Nautilus:
# Ctrl+L → Barra de dirección
# Ctrl+H → Mostrar archivos ocultos (empiezan con .)
# Ctrl+Shift+N → Nueva carpeta
```

#### Terminal

```bash
# GNOME Terminal (predeterminado en Ubuntu)
gnome-terminal

# Alternativas populares:
# Konsole (KDE)
# Tilix (múltiples paneles)
# Alacritty (GPU-acelerado, rápido)
# Kitty (GPU-acelerado, extensible)
```

#### Tienda de software

```
Ubuntu Software Center / GNOME Software
├─ Aplicaciones de repositorios APT
├─ Snaps (formato de paquetes de Canonical)
├─ Flatpak (formato universal, agregar Flathub)
└─ Interfaz gráfica para instalar sin terminal
```

---

## 2.6 — Primeros ajustes recomendados

### 2.6.1 — Drivers privativos

Algunos componentes de hardware requieren drivers propietarios para funcionar al máximo rendimiento.

#### NVIDIA

NVIDIA es el caso más relevante: los drivers de código abierto (`nouveau`) ofrecen rendimiento limitado. Los drivers privativos de NVIDIA son indispensables para gaming, IA o trabajo gráfico.

```bash
# Verificar GPU NVIDIA instalada
lspci | grep -i nvidia

# Ver drivers disponibles
ubuntu-drivers devices

# Resultado esperado:
# == /sys/devices/pci0000:00/0000:00:01.0/0000:01:00.0 ==
# modalias : pci:v000010DEd00002204...
# vendor   : NVIDIA Corporation
# model    : GA102 [GeForce RTX 3090]
# driver   : nvidia-driver-550 - distro non-free recommended
# driver   : nvidia-driver-535 - distro non-free
# driver   : xserver-xorg-video-nouveau - distro free builtin

# Instalar el driver recomendado
sudo ubuntu-drivers autoinstall

# O instalar versión específica
sudo apt install nvidia-driver-550

# Reiniciar para activar el driver
sudo reboot
```

```bash
# Verificar que el driver NVIDIA está activo
nvidia-smi

# Resultado esperado:
# +-----------------------------------------------------------------------------+
# | NVIDIA-SMI 550.XX.XX    Driver Version: 550.XX.XX    CUDA Version: 12.4    |
# |-------------------------------+-----+----------------------------+          |
# | GPU  Name        Persistence-M| Bus-Id  Disp.A | Volatile Uncorr. ECC |   |
# |  0   NVIDIA RTX 3090   Off  | 00000000:01:00.0 Off |                  N/A | |
# +-----------------------------------------------------------------------------+
```

#### WiFi (Broadcom, Realtek)

Algunas tarjetas WiFi requieren firmware adicional:

```bash
# Instalar firmware de Broadcom (chips BCM)
sudo apt install bcmwl-kernel-source

# Para Realtek (algunos modelos)
sudo apt install firmware-realtek

# Actualizar firmware general
sudo apt install linux-firmware

# Ver interfaces de red disponibles
ip link show
iwconfig
```

#### AMD (GPU Radeon)

La mayoría de AMD funciona out-of-the-box con los drivers de código abierto (`amdgpu`):

```bash
# Verificar que amdgpu está cargado
lsmod | grep amdgpu

# Para Vulkan y mejor rendimiento:
sudo apt install mesa-vulkan-drivers

# Herramienta de monitorización AMD
sudo apt install radeontop
radeontop
```

### 2.6.2 — Codecs multimedia y formatos

Ubuntu (por razones legales en algunos países) no incluye todos los codecs por defecto.

```bash
# Instalar codecs multimedia completos
sudo apt install ubuntu-restricted-extras

# Incluye:
# ├─ MP3, AAC, WMA, Ogg Vorbis
# ├─ AVI, MKV, MP4, MOV, WMV
# ├─ H.264, H.265 (HEVC), VP8, VP9
# ├─ Flash (legacy)
# └─ Fuentes Microsoft (Times New Roman, Arial, etc.)

# Aceptar licencia de codecs cuando se solicite (EULA)
```

```bash
# Para reproducción de DVD cifrado (solo países donde es legal)
sudo apt install libdvd-pkg
sudo dpkg-reconfigure libdvd-pkg

# Verificar que VLC puede reproducir todo
sudo apt install vlc
```

### 2.6.3 — Configuración de Flatpak y Flathub

**Flatpak** es un sistema de paquetes universal que funciona en cualquier distribución Linux.

```bash
# Instalar Flatpak
sudo apt install flatpak

# Agregar repositorio Flathub (la mayor tienda de apps Flatpak)
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo

# Reiniciar para integración con GNOME Software
sudo reboot

# Instalar aplicaciones populares vía Flatpak
flatpak install flathub com.spotify.Client         # Spotify
flatpak install flathub com.discordapp.Discord      # Discord
flatpak install flathub org.gimp.GIMP               # GIMP
flatpak install flathub com.visualstudio.code       # VS Code
flatpak install flathub org.libreoffice.LibreOffice # LibreOffice

# Actualizar todas las apps Flatpak
flatpak update

# Listar instaladas
flatpak list
```

**¿Por qué Flatpak?**

```
Repositorios APT/DNF:
├─ Software empaquetado para esta distro específica
├─ Versiones pueden ser antiguas
└─ Dependencias compartidas (ahorra espacio)

Flatpak:
├─ Software empaquetado una vez para todas las distros
├─ Siempre versiones recientes (upstream)
├─ Sandbox: aislado del sistema
├─ Dependencias propias (usa más espacio)
└─ Ideal para: apps de escritorio, especialmente no oficiales
```

### 2.6.4 — Copias de seguridad y snapshots

Antes de experimentar, configura un sistema de snapshots que te permita revertir cambios.

#### Timeshift (Sistema)

**Timeshift** crea snapshots del sistema operativo (como System Restore en Windows).

```bash
# Instalar Timeshift
sudo apt install timeshift

# Configurar via interfaz gráfica
sudo timeshift-gtk

# O via línea de comandos:
# Crear snapshot manual
sudo timeshift --create --comments "Sistema base configurado"

# Listar snapshots
sudo timeshift --list

# Restaurar un snapshot (desde live USB si el sistema no inicia)
sudo timeshift --restore --snapshot '2024-06-01_10-00-00'
```

**Configuración recomendada de Timeshift:**

```
Tipo de snapshot: RSYNC (más compatible) o btrfs (si usas btrfs)
Programación:
├─ Mensual: 2 copias
├─ Semanal: 3 copias
├─ Diario: 5 copias
└─ Arranque: 3 copias

Incluir: Solo sistema (/) - NO incluir /home
(Los datos de usuario tienen su propio backup)
```

#### Backup de datos del usuario con Déjà Dup

```bash
# Instalar Déjà Dup (interfaz GNOME para backups)
sudo apt install deja-dup

# O usar rsync manualmente
rsync -av --progress /home/juan/ /media/usb-externo/backup-juan/

# Backup automático con cron
# Editar crontab:
crontab -e
# Agregar (backup diario a las 2 AM):
0 2 * * * rsync -av /home/juan/ /backup/juan/ >> /var/log/backup-juan.log 2>&1
```

#### btrfs: Snapshots integrados en el sistema de archivos

Si instalaste con btrfs (Fedora lo usa por defecto), puedes crear snapshots instantáneos:

```bash
# Ver subvolúmenes btrfs
sudo btrfs subvolume list /

# Crear snapshot manualmente
sudo btrfs subvolume snapshot / /snapshots/sistema-$(date +%Y%m%d)

# Listar snapshots
ls /snapshots/

# Herramienta snapper (gestión automática de snapshots btrfs)
sudo dnf install snapper  # Fedora
sudo apt install snapper  # Ubuntu

# Configurar snapper para root
sudo snapper -c root create-config /

# Crear snapshot
sudo snapper -c root create --description "Sistema base"

# Listar
sudo snapper -c root list
```

---

## Anexos

### A. Tabla comparativa: Métodos de instalación

| Método | Persistencia | Rendimiento | Riesgo hardware | Ideal para |
|---|---|---|---|---|
| **Live USB** | No (sin persistencia) | Bajo | Ninguno | Probar, rescate |
| **Live USB + persistencia** | Sí (limitada) | Bajo-medio | Ninguno | Uso temporal |
| **Máquina virtual** | Sí | Medio (~70-80%) | Ninguno | Aprendizaje, testing |
| **WSL2** | Sí | Medio-alto | Ninguno | Dev en Windows |
| **Contenedor Docker** | No (por defecto) | Alto | Ninguno | CLI, dev ligero |
| **Dual boot** | Sí | Nativo | Moderado | Uso regular ambos OS |
| **Instalación nativa** | Sí | Nativo (100%) | Alto | Producción, máximo |

### B. Distribuciones recomendadas por perfil

<Tabs>
<TabItem value="novato" label="Principiante">

**Ubuntu 24.04 LTS Desktop**

```bash
# Por qué Ubuntu para principiantes:
# ✅ Mayor comunidad (más respuestas en Google/StackOverflow)
# ✅ Instalador más amigable
# ✅ Soporte LTS: 5 años sin cambios disruptivos
# ✅ apt + snap: ecosistema de software enorme
# ✅ PPA: facilita instalar software de terceros

# Descarga:
# https://ubuntu.com/download/desktop

# Requisitos mínimos:
# CPU: 2+ GHz dual-core x86-64
# RAM: 4 GB (8 GB recomendado)
# Disco: 25 GB (50 GB recomendado)
```

</TabItem>
<TabItem value="windows" label="Usuario Windows">

**Linux Mint 21 (Cinnamon)**

```bash
# Por qué Mint para usuarios de Windows:
# ✅ Escritorio Cinnamon similar a Windows (taskbar abajo)
# ✅ Menú de inicio familiar
# ✅ Sin snaps por defecto (solo apt)
# ✅ Basado en Ubuntu LTS (misma estabilidad)
# ✅ Incluye codecs y drivers desde el inicio

# Descarga:
# https://linuxmint.com/download.php

# Requisitos:
# CPU: x86-64
# RAM: 2 GB mínimo (4 GB recomendado)
# Disco: 20 GB
```

</TabItem>
<TabItem value="developer" label="Desarrollador">

**Fedora 40 Workstation**

```bash
# Por qué Fedora para desarrolladores:
# ✅ Software actualizado (6 meses de ciclo)
# ✅ GNOME con Wayland de primera clase
# ✅ Kernel actualizado (menos tiempo en bugs arreglados)
# ✅ SELinux activo: buenas prácticas de seguridad
# ✅ Toolbox: contenedores para entornos de desarrollo aislados
# ✅ Soporte podman/containers nativo

# Descarga:
# https://fedoraproject.org/workstation/download

# Requisitos:
# CPU: 2 GHz dual-core x86-64
# RAM: 2 GB mínimo (4 GB recomendado)
# Disco: 15 GB (25 GB recomendado)
```

</TabItem>
<TabItem value="servidor" label="Servidor">

**Debian 12 "Bookworm" / Ubuntu Server 24.04 LTS**

```bash
# Por qué Debian/Ubuntu Server:
# ✅ Instalación mínima sin GUI (~1 GB)
# ✅ Estabilidad máxima (paquetes muy probados)
# ✅ LTS Ubuntu: 5 años de soporte
# ✅ Debian: soporte extendido de la comunidad
# ✅ apt: ecosistema de paquetes enorme

# Ubuntu Server:
# https://ubuntu.com/download/server

# Debian:
# https://www.debian.org/distrib/
```

</TabItem>
</Tabs>

### C. Comandos de diagnóstico post-instalación

Después de instalar, estos comandos te dan una visión completa del sistema:

```bash
# ─── Hardware ───────────────────────────────────────────────
# CPU
lscpu | grep -E 'Architecture|Model name|CPU\(s\)|Thread|MHz'

# RAM
free -h

# Discos y particiones
lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT,LABEL

# GPU
lspci | grep -E 'VGA|3D|Display'

# Tarjeta de red
ip link show
lspci | grep -i network

# ─── Sistema ────────────────────────────────────────────────
# Versión del sistema
lsb_release -a
uname -r

# Tiempo de arranque
systemd-analyze
systemd-analyze blame | head -15

# Servicios activos
systemctl list-units --type=service --state=running

# Espacio en disco
df -h

# ─── Logs recientes ─────────────────────────────────────────
# Últimos mensajes del sistema
journalctl -b --priority=err..warning

# Errores de hardware
dmesg | grep -iE 'error|fail|warn' | tail -20
```

### D. Solución de problemas comunes post-instalación

| Problema | Síntoma | Solución |
|---|---|---|
| **WiFi no detectado** | No aparece en redes | `sudo apt install linux-firmware` + reboot |
| **Pantalla negra con NVIDIA** | Blank screen post-boot | Arrancar con `nomodeset` en GRUB, instalar driver |
| **Sonido no funciona** | Sin audio | `pulseaudio --kill && pulseaudio --start` o `systemctl restart pipewire` |
| **Bluetooth no conecta** | Dispositivo no aparece | `sudo systemctl restart bluetooth` |
| **Suspensión no funciona** | No duerme / no despierta | `sudo apt install pm-utils` + revisar kernelparams |
| **Reloj incorrecto** | Hora errónea en dual boot | Configurar Windows para UTC (ver 2.4.4) |
| **Resolución incorrecta** | Pantalla baja resolución | Instalar drivers GPU + reiniciar Xorg/Wayland |

---

## Referencias y Bibliografía

### Documentación oficial

1. **Ubuntu 24.04 LTS Installation Guide**  
   https://ubuntu.com/tutorials/install-ubuntu-desktop  
   Tutorial oficial paso a paso con capturas de pantalla.

2. **Fedora 40 Installation Guide**  
   https://docs.fedoraproject.org/en-US/fedora/latest/install-guide/  
   Guía completa incluyendo particionado avanzado.

3. **Debian Installation Manual**  
   https://www.debian.org/releases/stable/installmanual  
   Documentación exhaustiva, incluyendo instalación por red.

4. **ArchWiki: Installation Guide**  
   https://wiki.archlinux.org/title/Installation_guide  
   La guía más detallada de instalación manual de Linux.

5. **VirtualBox Documentation**  
   https://www.virtualbox.org/wiki/Documentation  
   Manual completo de VirtualBox.

6. **WSL Documentation — Microsoft**  
   https://docs.microsoft.com/windows/wsl/  
   Documentación oficial de WSL2.

### Particionado y sistemas de archivos

7. **GNU Parted Manual**  
   https://www.gnu.org/software/parted/manual/  
   Herramienta de particionado de línea de comandos.

8. **Linux Filesystem Hierarchy Standard (FHS)**  
   https://refspecs.linuxfoundation.org/FHS_3.0/fhs-3.0.html  
   Especificación del árbol de directorios de Linux.

9. **btrfs Wiki**  
   https://btrfs.wiki.kernel.org/  
   Documentación del sistema de archivos btrfs.

10. **ext4 Design Document**  
    https://ext4.wiki.kernel.org/index.php/Ext4_Design  
    Diseño interno del sistema de archivos ext4.

### Arranque y UEFI

11. **UEFI Specification**  
    https://uefi.org/specifications  
    Especificación técnica completa del firmware UEFI.

12. **GRUB2 Manual**  
    https://www.gnu.org/software/grub/manual/grub/grub.html  
    Documentación oficial del gestor de arranque GRUB2.

13. **ArchWiki: UEFI**  
    https://wiki.archlinux.org/title/Unified_Extensible_Firmware_Interface  
    Artículo enciclopédico sobre UEFI y Linux.

14. **Ventoy Documentation**  
    https://www.ventoy.net/en/doc_start.html  
    Guía de uso de Ventoy para USB multiboot.

### Escritorio y gráficos

15. **GNOME Documentation**  
    https://help.gnome.org/users/gnome-help/stable/  
    Documentación oficial del entorno GNOME.

16. **KDE Plasma Documentation**  
    https://userbase.kde.org/Plasma  
    Documentación oficial de KDE Plasma.

17. **Wayland Architecture**  
    https://wayland.freedesktop.org/architecture.html  
    Documento técnico sobre la arquitectura de Wayland.

18. **NVIDIA Linux Driver Documentation**  
    https://docs.nvidia.com/cuda/cuda-installation-guide-linux/  
    Guía oficial de instalación de drivers NVIDIA en Linux.

### Herramientas del módulo

19. **sha256sum man page**  
    https://man7.org/linux/man-pages/man1/sha256sum.1.html

20. **GnuPG (GPG) Documentation**  
    https://www.gnupg.org/documentation/manuals/gnupg/  
    Manual completo de verificación de firmas GPG.

21. **dd man page**  
    https://man7.org/linux/man-pages/man1/dd.1.html  
    Manual de la herramienta `dd`.

22. **Timeshift GitHub**  
    https://github.com/linuxmint/timeshift  
    Herramienta de snapshots del sistema.

---

## Preguntas de autoevaluación

1. ¿Cuáles son las diferencias clave entre una sesión live, WSL2 y una VM? ¿Cuándo usarías cada una?
2. ¿Qué es SHA256 y por qué deberías verificar una ISO antes de usarla?
3. Explica qué son MBR y GPT y en qué difieren.
4. ¿Para qué sirve la partición EFI (ESP)? ¿Qué formato de sistema de archivos usa?
5. ¿Por qué se recomienda una partición `/home` separada?
6. ¿Cuánto swap necesita un sistema con 16 GB de RAM que usa hibernación?
7. ¿Por qué el Fast Startup de Windows puede causar problemas en dual boot?
8. ¿Qué hace `update-grub` exactamente?
9. ¿Cuál es la diferencia entre X11 y Wayland? ¿Por qué importa?
10. ¿Qué diferencia hay entre un paquete APT, un Snap y un Flatpak?

---

## Laboratorios prácticos

### Lab 2.1 — Crear y verificar un USB live

```bash
# Ejercicio:
# 1. Descargar Ubuntu 24.04 Desktop ISO
# 2. Verificar el SHA256 comparando con el hash oficial
# 3. Crear el USB con balenaEtcher o dd
# 4. Arrancar en live y verificar que WiFi funciona

# Verificación rápida de SHA256:
sha256sum ~/Downloads/ubuntu-24.04-desktop-amd64.iso
# Comparar con: https://releases.ubuntu.com/24.04/SHA256SUMS
```

### Lab 2.2 — VM con VirtualBox

```bash
# Ejercicio:
# 1. Instalar VirtualBox
# 2. Crear una VM con 4 GB RAM, 2 CPUs, 25 GB disco
# 3. Instalar Ubuntu en la VM con particionado manual:
#    /boot/efi: 512 MB (FAT32)
#    /: 20 GB (ext4)
#    /home: 4 GB (ext4)
#    swap: 1 GB
# 4. Instalar Guest Additions
# 5. Ejecutar los comandos de diagnóstico del Anexo C
```

### Lab 2.3 — Diagnóstico post-instalación

```bash
# Tras la instalación, ejecutar y documentar la salida de:
lscpu | head -20
free -h
lsblk
df -h
uname -r
lsb_release -a
systemd-analyze
ip link show
```

---

## Resumen del módulo

✅ **Entorno de prácticas:** Conoces todas las opciones (VM, WSL2, Live, nativo)  
✅ **Verificación de ISOs:** SHA256 y firmas GPG para seguridad  
✅ **Creación de USB:** Ventoy, Etcher y `dd`  
✅ **UEFI/BIOS:** Entiendes el arranque moderno y Secure Boot  
✅ **Particionado:** GPT, EFI, ext4, btrfs, swap  
✅ **Instalación completa:** Ubuntu paso a paso  
✅ **Dual boot:** Windows + Linux sin perder datos  
✅ **Escritorio:** GNOME, KDE, Wayland vs X11  
✅ **Ajustes iniciales:** Drivers, codecs, Flatpak, backups  

**Próximo paso:** Módulo 03 — Terminal y Shell. Comenzaremos a usar Linux realmente: la línea de comandos.

---

**Última actualización:** 2024-06  
**Versión:** 1.0  
**Estado:** ✅ Listo para enseñanza
