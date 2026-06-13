---
title: "Módulo 12 — Almacenamiento avanzado"
sidebar_label: "12 · Almacenamiento"
description: Discos y particionado MBR/GPT, sistemas de archivos ext4/XFS/Btrfs, LVM, RAID por software, cifrado LUKS, swap, cuotas y SMART.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Módulo 12 — Almacenamiento avanzado

## Introducción

El almacenamiento es la capa más profunda de cualquier sistema. Cuando todo lo demás falla —el sistema se cuelga, el proceso muere, la corriente se corta— lo que determina si tus datos sobreviven es cómo está organizado tu almacenamiento.

Linux ofrece el stack de almacenamiento más flexible del mercado. Puedes apilar capas: discos físicos → RAID por software → LVM → sistema de archivos → cifrado, eligiendo en cada nivel la tecnología adecuada. Este módulo te enseña a entender y gestionar esa pila completa.

Ya viste los conceptos básicos en el [Módulo 04](/sistema-de-archivos): el árbol de directorios, los inodos, `df` y `du`. Aquí vas más abajo: qué hay antes del sistema de archivos, cómo se organizan los discos físicos y cómo construir almacenamiento flexible y resistente.

### Objetivos de aprendizaje

Al finalizar este módulo, serás capaz de:

- ✅ Identificar y gestionar dispositivos de bloque con `lsblk`, `blkid`, `smartctl`
- ✅ Particionar discos con MBR/GPT usando `fdisk`, `gdisk` y `parted`
- ✅ Crear y mantener sistemas de archivos ext4, XFS y Btrfs
- ✅ Montar sistemas de archivos permanentemente en `/etc/fstab`
- ✅ Construir volúmenes lógicos con LVM (PV → VG → LV)
- ✅ Crear y gestionar RAID por software con `mdadm`
- ✅ Trabajar con subvolúmenes y snapshots en Btrfs
- ✅ Cifrar discos con LUKS/dm-crypt
- ✅ Configurar swap, cuotas de disco y mantenimiento de SSDs

---

## 12.1 — Discos y dispositivos de bloque

### Nomenclatura de dispositivos

```
Tipos de dispositivos de bloque en Linux:

/dev/sda, /dev/sdb...   → discos SATA, SAS o USB (sd = SCSI Disk)
/dev/sda1, /dev/sda2... → particiones del disco sda

/dev/nvme0n1            → disco NVMe (nvme0=controlador, n1=namespace 1)
/dev/nvme0n1p1          → primera partición del NVMe

/dev/vda, /dev/vdb...   → discos virtuales (VirtIO, usados en VMs KVM)

/dev/mmcblk0            → tarjeta SD o eMMC
/dev/mmcblk0p1          → primera partición

/dev/md0, /dev/md1...   → arrays RAID por software (mdadm)
/dev/mapper/nombre      → dispositivos de device-mapper (LVM, LUKS)

/dev/loop0...           → loop devices (archivos montados como disco)
/dev/sr0                → lector óptico (CD/DVD)
```

### Inventariar el almacenamiento

```bash
# lsblk: visión en árbol de todos los dispositivos de bloque
lsblk
# NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
# sda           8:0    0   500G  0 disk
# ├─sda1        8:1    0   512M  0 part /boot/efi
# ├─sda2        8:2    0     1G  0 part /boot
# └─sda3        8:3    0 498.5G  0 part
#   ├─vg0-root 253:0   0    50G  0 lvm  /
#   └─vg0-home 253:1   0 448.5G  0 lvm  /home
# nvme0n1     259:0    0   1T    0 disk
# └─nvme0n1p1 259:1    0   1T    0 part /data

lsblk -f           # Con sistemas de archivos, UUID y punto de montaje
lsblk -o NAME,SIZE,TYPE,FSTYPE,UUID,MOUNTPOINT  # Columnas personalizadas

# blkid: identificadores únicos (UUID) y tipo de sistema de archivos
sudo blkid
# /dev/sda1: UUID="ABCD-1234" TYPE="vfat" PARTUUID="..."
# /dev/sda2: UUID="abc123..." TYPE="ext4" PARTUUID="..."

sudo blkid /dev/sda1    # Un dispositivo específico
sudo blkid -t TYPE=ext4 # Filtrar por tipo

# fdisk -l: detalles técnicos de la tabla de particiones
sudo fdisk -l
sudo fdisk -l /dev/sda  # Un disco específico
```

### Identificadores estables: UUID vs nombre de dispositivo

```bash
# El nombre del dispositivo (/dev/sda) NO es estable:
# Un disco que hoy es /dev/sda puede ser /dev/sdb mañana si
# cambias el orden de arranque o añades un disco.

# El UUID SÍ es estable: está escrito en el propio sistema de archivos
# Úsalo SIEMPRE en /etc/fstab (lo veremos en §12.4)

# Ver UUID de un dispositivo:
sudo blkid -s UUID -o value /dev/sda1    # Solo el UUID

# /dev/disk/by-*: symlinks estables mantenidos por udev
ls -la /dev/disk/by-uuid/                # Por UUID
ls -la /dev/disk/by-label/               # Por etiqueta (si fue configurada)
ls -la /dev/disk/by-id/                  # Por ID del hardware (WWN, serial)
ls -la /dev/disk/by-path/               # Por ruta de hardware

# Etiquetar un sistema de archivos (para usar en /dev/disk/by-label)
sudo e2label /dev/sda2 "datos"           # ext4
sudo xfs_admin -L "datos" /dev/sdb1      # XFS
sudo btrfs filesystem label /dev/sdc1 "datos"  # Btrfs
```

### SMART: salud del disco

```bash
sudo apt install smartmontools

# Test rápido de salud
sudo smartctl -H /dev/sda             # Health: PASSED o FAILED
sudo smartctl -a /dev/sda             # Informe completo
sudo smartctl -i /dev/sda             # Solo información del disco (modelo, serie, firmware)

# Tests SMART
sudo smartctl -t short /dev/sda       # Test corto (~2 minutos)
sudo smartctl -t long /dev/sda        # Test completo (horas)
sudo smartctl -l selftest /dev/sda    # Ver resultados de tests anteriores

# Atributos SMART importantes (señales de fallo inminente):
# ID 5  Reallocated Sectors    → sectores reubicados (malos) — si sube: disco muriendo
# ID 187 Reported Uncorr Errors→ errores no corregibles
# ID 197 Current Pending Sector → sectores pendientes de reubicar
# ID 198 Offline Uncorrectable → sectores que no se pudieron releer

# Monitoring automático
sudo systemctl enable --now smartd    # Demonio que monitoriza y avisa por email

# Para NVMe
sudo smartctl -a /dev/nvme0n1
nvme smart-log /dev/nvme0n1           # Si tienes nvme-cli instalado
```

---

## 12.2 — Particionado

### MBR vs. GPT

```
MBR (Master Boot Record) — el formato antiguo (1983):
  • Tabla de particiones en el primer sector (512 bytes)
  • Máximo 4 particiones primarias (o 3 primarias + 1 extendida con lógicas)
  • Soporte máximo de disco: 2 TB
  • No hay redundancia de la tabla de particiones
  → Solo para discos viejos o compatibilidad con BIOS antigua

GPT (GUID Partition Table) — el estándar moderno (UEFI):
  • Soporta hasta 128 particiones sin trucos
  • Soporte de discos > 2 TB
  • Tabla de particiones redundante (inicio + fin del disco)
  • Requiere UEFI o un "protective MBR" para BIOS legacy
  → SIEMPRE usa GPT para discos nuevos
```

### `fdisk` y `gdisk`

```bash
# fdisk: para MBR (y GPT con -g)
sudo fdisk /dev/sdb           # Iniciar particionado interactivo
# Comandos dentro de fdisk:
# m → menú de ayuda
# p → imprimir tabla de particiones actual
# n → nueva partición
# d → borrar partición
# t → cambiar tipo de partición
# g → crear nueva tabla GPT
# o → crear nueva tabla MBR
# w → escribir y salir (¡hace los cambios reales!)
# q → salir sin guardar

# gdisk: para GPT (más claro que fdisk para GPT)
sudo gdisk /dev/sdb
# Mismos comandos básicos que fdisk

# Ejemplo de sesión fdisk para crear una partición ext4:
# sudo fdisk /dev/sdb
# g         → crear tabla GPT
# n         → nueva partición
# 1         → número de partición
# (Enter)   → sector inicial por defecto
# +100G     → tamaño: 100 GB
# t         → cambiar tipo
# 20        → tipo: Linux filesystem (83 en MBR)
# w         → guardar

# Actualizar el kernel sobre las nuevas particiones sin reiniciar:
sudo partprobe /dev/sdb       # Notificar al kernel
# o:
sudo blockdev --rereadpt /dev/sdb
```

### `parted` — Particionado avanzado y scriptable

```bash
# parted: opera sin modo interactivo (ideal para scripts)
sudo parted /dev/sdb print                   # Ver tabla de particiones
sudo parted /dev/sdb mklabel gpt             # Crear tabla GPT
sudo parted /dev/sdb mkpart primary ext4 1MiB 100GiB  # Crear partición
sudo parted /dev/sdb mkpart primary 100GiB 100%        # El resto del disco
sudo parted /dev/sdb align-check optimal 1             # Verificar alineación

# Alineación: MUY IMPORTANTE para rendimiento en SSDs y RAID
# Los sectores deben alinearse a bloques de 4K o 1MiB
# parted con "1MiB" de inicio garantiza la alineación correcta
```

:::danger **Hacer particionado sin backup es un juego de ruleta rusa**
`fdisk -w`, `parted`, `gdisk -w`: estos comandos destruyen datos permanentemente. Antes de particionar un disco con datos:  
1. Verificar el nombre del dispositivo con `lsblk` (confundir `/dev/sda` con `/dev/sdb` destruye el sistema operativo)  
2. Hacer backup de los datos  
3. Confirmar el UUID actual para montar el disco después
:::

---

## 12.3 — Sistemas de archivos

### Conceptos fundamentales

```
┌──────────────────────────────────────────────────────────────┐
│                  Estructura de un sistema de archivos         │
│                                                              │
│  Superbloque    → metadatos globales: tamaño total, bloques  │
│                   libres, última comprobación, UUID           │
│                                                              │
│  Tabla de inodos → inodo por cada archivo/directorio         │
│                    Contiene: propietario, permisos, tamaño,  │
│                    timestamps, punteros a bloques de datos    │
│                                                              │
│  Bloques de datos → donde está el contenido real             │
│                     Tamaño típico: 4096 bytes                │
│                                                              │
│  Journal (diario) → ext4, XFS, etc. registran los cambios    │
│                     pendientes antes de hacerlos.            │
│                     Si hay un corte de corriente, el journal │
│                     permite recuperar el estado consistente  │
└──────────────────────────────────────────────────────────────┘
```

### `ext4` — El estándar estable

```bash
# Crear sistema de archivos ext4
sudo mkfs.ext4 /dev/sdb1
sudo mkfs.ext4 -L "datos" /dev/sdb1          # Con etiqueta
sudo mkfs.ext4 -m 0 /dev/sdb1                # Sin espacio reservado para root (discos de datos)
# Por defecto ext4 reserva el 5% para root (para que no se llene del todo)
# En discos de datos puros (-m 0) no hace falta esa reserva

# Ajustar parámetros después de crear
sudo tune2fs -l /dev/sdb1                    # Ver toda la configuración
sudo tune2fs -L "nuevo-label" /dev/sdb1      # Cambiar etiqueta
sudo tune2fs -m 1 /dev/sdb1                  # Reducir espacio reservado a 1%
sudo tune2fs -e remount-ro /dev/sdb1         # Ante errores: montar solo lectura

# Comprobar y reparar (con el FS DESMONTADO)
sudo e2fsck /dev/sdb1                        # Comprobación básica
sudo e2fsck -f /dev/sdb1                     # Forzar comprobación
sudo e2fsck -p /dev/sdb1                     # Reparar automáticamente
# NUNCA ejecutar e2fsck en un sistema de archivos MONTADO
# (la excepción: el sistema comprueba el FS en /etc/fstab con fsck automático en el arranque)

# Redimensionar un ext4 EN CALIENTE (si está en LVM)
# Primero extender el volumen lógico, luego el sistema de archivos:
sudo resize2fs /dev/mapper/vg0-datos         # Usa todo el espacio del LV
sudo resize2fs /dev/mapper/vg0-datos 100G    # Redimensionar a 100 GB
```

### `XFS` — Alto rendimiento para grandes archivos

XFS es el sistema de archivos por defecto en RHEL, Rocky Linux y AlmaLinux. Excelente para archivos grandes y cargas de trabajo de alto rendimiento.

```bash
# Crear XFS
sudo mkfs.xfs /dev/sdb1
sudo mkfs.xfs -L "datos-xfs" /dev/sdb1      # Con etiqueta

# Herramientas XFS
sudo xfs_info /dev/sdb1                      # Información (como tune2fs -l)
sudo xfs_repair /dev/sdb1                    # Reparar (desmontado)
sudo xfs_growfs /mnt/datos                   # Crecer XFS MONTADO (ventaja sobre ext4)
sudo xfs_admin -L "nueva-label" /dev/sdb1    # Cambiar etiqueta
sudo xfs_dump -f backup.xfs /mnt/datos       # Backup a nivel de bloque
sudo xfs_restore -f backup.xfs /mnt/destino  # Restaurar
sudo xfsdump -l 0 -F -f /backup/datos.dump /mnt/datos  # Backup completo

# IMPORTANTE: XFS no puede reducirse (solo crecer)
# Para reducir un XFS: backup + recrear + restaurar
```

### Otros sistemas de archivos relevantes

```bash
# FAT32/exFAT: interoperabilidad con Windows, tarjetas SD, USB
sudo mkfs.vfat /dev/sdb1               # FAT32
sudo mkfs.vfat -F 32 /dev/sdb1        # Forzar FAT32
sudo mkfs.exfat /dev/sdb1             # exFAT (>4GB por archivo, compatible Windows/Mac)

# NTFS: para particiones Windows
sudo apt install ntfs-3g
sudo mkfs.ntfs -f /dev/sdb1           # Formatear rápido
sudo mount -t ntfs-3g /dev/sdb1 /mnt  # Montar con lectura-escritura

# tmpfs: sistema de archivos en RAM
sudo mount -t tmpfs -o size=1G tmpfs /tmp/ramdisk
# Muy rápido para archivos temporales. Se borra al desmontar.
```

---

## 12.4 — Montaje

### `mount` y `umount`

```bash
# Montar manualmente
sudo mount /dev/sdb1 /mnt
sudo mount -t ext4 /dev/sdb1 /mnt             # Especificar tipo
sudo mount -o ro /dev/sdb1 /mnt               # Solo lectura
sudo mount -o remount,rw /                    # Remontar la raíz como R/W

# Opciones de montaje importantes:
# ro / rw          → solo lectura / lectura-escritura
# noexec           → no permitir ejecutar binarios (seguridad)
# nosuid           → ignorar bits SUID/SGID (seguridad)
# noatime          → no actualizar atime al leer (rendimiento en HDD/SSD)
# relatime         → actualizar atime solo si es anterior a mtime (compromiso)
# discard          → activar TRIM para SSDs
# errors=remount-ro→ ante errores, montar solo lectura
# sync             → E/S síncrona (más lento pero más seguro)

# Ver los sistemas de archivos montados
mount                                 # Todos los montajes activos
mount | grep "^/dev"                  # Solo dispositivos reales
findmnt                               # Vista en árbol (más legible)
findmnt --df                          # Con espacio usado

# Desmontar
sudo umount /mnt
sudo umount /dev/sdb1                 # También por dispositivo
sudo umount -l /mnt                   # Lazy: espera a que no haya actividad
sudo umount -f /mnt                   # Force (para NFS colgados)

# ¿Por qué falla umount? "target is busy"
sudo lsof /mnt | head                 # ¿Qué procesos tienen archivos abiertos?
sudo fuser -mv /mnt                   # qué procesos usan el directorio
sudo fuser -k /mnt                    # Matar esos procesos (cuidado)
```

### `/etc/fstab` — Montaje permanente

`/etc/fstab` es la tabla de sistemas de archivos que se montan automáticamente al arrancar.

```bash
# Estructura de /etc/fstab:
# dispositivo   punto_montaje   tipo   opciones   dump   fsck_orden
#
# Columnas:
# 1. Dispositivo: UUID=..., LABEL=..., /dev/sda1 (evitar este)
# 2. Punto de montaje
# 3. Tipo de FS: ext4, xfs, btrfs, vfat, swap, tmpfs, nfs, auto
# 4. Opciones (separadas por coma)
# 5. dump: 0=no backup con dump, 1=sí (obsoleto)
# 6. fsck: 0=no verificar, 1=primero (solo la raíz), 2=después

cat /etc/fstab
```

```
# /etc/fstab — Ejemplo bien configurado

# Partición raíz
UUID=a1b2c3d4-...    /           ext4    errors=remount-ro          0 1

# Partición /boot/efi (UEFI)
UUID=ABCD-1234       /boot/efi   vfat    umask=0077                 0 1

# Disco de datos con UUID (siempre usar UUID, no /dev/sdX)
UUID=e5f6a7b8-...    /data       ext4    defaults,noatime           0 2

# Swap
UUID=c9d0e1f2-...    none        swap    sw                         0 0

# Partición compartida con Windows (NTFS)
UUID=1A2B3C4D...     /media/win  ntfs-3g uid=1000,gid=1000,umask=022 0 0

# Disco de red NFS (del Módulo 11: redes)
servidor:/export/datos  /mnt/nas  nfs   defaults,_netdev            0 0

# tmpfs en RAM para /tmp (evitar writes en disco)
tmpfs                /tmp        tmpfs   defaults,size=2G,noexec    0 0
```

```bash
# Probar la entrada de fstab SIN reiniciar
sudo mount -a                         # Montar todo lo de fstab que no esté montado
sudo mount --all --verbose            # Con más detalle

# Verificar que fstab es correcto antes de reiniciar
sudo findmnt --verify                 # Verificar sintaxis y montajes
# Si hay errores aquí → el sistema podría no arrancar
```

:::danger **Un error en /etc/fstab puede dejar el sistema sin arranque**
Siempre usa UUIDs (nunca `/dev/sdX`). Prueba con `sudo mount -a` antes de reiniciar. Si el sistema no arranca por fstab: arrancar en modo recovery, editar fstab, corregir.
:::

---

## 12.5 — LVM: Volúmenes lógicos

LVM (Logical Volume Manager) añade una capa de abstracción entre los discos físicos y los sistemas de archivos. Su superpoder: **redimensionar en caliente**, añadir discos sin interrupciones y snapshots instantáneos.

```
Arquitectura de LVM:

Discos físicos   Volúmenes físicos (PV)   Grupos de volumen (VG)   Volúmenes lógicos (LV)
─────────────────────────────────────────────────────────────────────────────────────────
/dev/sdb   →   /dev/sdb (pv)    ─┐
/dev/sdc   →   /dev/sdc (pv)    ─┼→  vg-datos (VG)  →  /dev/vg-datos/web    (LV 50G)
/dev/sdd   →   /dev/sdd (pv)    ─┘                   →  /dev/vg-datos/db     (LV 200G)
                                                      →  /dev/vg-datos/logs   (LV 20G)

Los LVs se pueden:
- Redimensionar en caliente (si el FS lo soporta)
- Mover entre PVs sin interrupción
- Snapshots (copia en el momento, muy rápida)
- Striping (como RAID 0) o mirroring (como RAID 1)
```

### Crear la pila LVM

```bash
# Instalar LVM2
sudo apt install lvm2

# 1. CREAR VOLÚMENES FÍSICOS (PV) en las particiones o discos
sudo pvcreate /dev/sdb /dev/sdc
sudo pvdisplay                     # Ver PVs
sudo pvs                           # Resumen compacto

# 2. CREAR GRUPO DE VOLUMEN (VG) que agrupa los PVs
sudo vgcreate vg-datos /dev/sdb /dev/sdc
sudo vgdisplay vg-datos            # Información del VG
sudo vgs                           # Resumen compacto

# 3. CREAR VOLÚMENES LÓGICOS (LV) dentro del VG
sudo lvcreate -L 50G -n web vg-datos     # LV de 50 GB llamado 'web'
sudo lvcreate -L 200G -n db vg-datos     # LV de 200 GB
sudo lvcreate -l 100%FREE -n logs vg-datos  # Todo el espacio restante
sudo lvdisplay                     # Ver todos los LVs
sudo lvs                           # Resumen compacto

# 4. CREAR SISTEMA DE ARCHIVOS en los LVs
sudo mkfs.ext4 /dev/vg-datos/web
sudo mkfs.ext4 /dev/vg-datos/db
sudo mkfs.ext4 /dev/vg-datos/logs

# 5. MONTAR
sudo mount /dev/vg-datos/web /var/www
# En /etc/fstab:
# /dev/vg-datos/web  /var/www  ext4  defaults  0 2
```

### Operaciones del día a día

```bash
# VER la situación completa
sudo vgdisplay -v                  # VG + todos sus PVs y LVs
sudo pvs && sudo vgs && sudo lvs   # Resumen de todo

# EXTENDER un LV (añadir espacio)
# Primero verificar que hay espacio libre en el VG:
sudo vgs vg-datos                  # Ver VFree
sudo lvextend -L +20G /dev/vg-datos/web         # Añadir 20 GB
sudo lvextend -l +100%FREE /dev/vg-datos/web     # Usar todo lo libre
sudo lvextend -L 70G /dev/vg-datos/web           # Establecer tamaño total

# Después extender el sistema de archivos (sin desmontar para ext4 y XFS):
sudo resize2fs /dev/vg-datos/web              # Para ext4
sudo xfs_growfs /var/www                      # Para XFS (usa el punto de montaje)

# O en un solo paso (--resizefs):
sudo lvextend -L +20G --resizefs /dev/vg-datos/web

# REDUCIR un LV (con cuidado: solo ext4, con el FS desmontado)
sudo umount /var/www
sudo e2fsck -f /dev/vg-datos/web              # Verificar FS primero
sudo resize2fs /dev/vg-datos/web 45G          # Reducir FS a 45 GB
sudo lvreduce -L 45G /dev/vg-datos/web        # Reducir LV
sudo mount /dev/vg-datos/web /var/www

# AÑADIR un disco al VG (expansión en caliente)
sudo pvcreate /dev/sdd
sudo vgextend vg-datos /dev/sdd
# Ahora el VG tiene más espacio libre para crear LVs o extender los existentes

# ELIMINAR un PV del VG (mover sus datos a otros PVs)
sudo pvmove /dev/sdb                          # Mover todos los extents de sdb
sudo vgreduce vg-datos /dev/sdb              # Quitar el PV del VG
sudo pvremove /dev/sdb                        # Eliminar las marcas de PV
```

### Snapshots LVM

```bash
# Un snapshot es una "fotografía" del LV en el momento actual
# Usa copy-on-write: solo copia los bloques que cambian después del snapshot
# USOS: backup consistente de bases de datos, punto de restauración antes de cambios

# Crear snapshot (necesita espacio libre en el VG para los bloques modificados)
sudo lvcreate -L 10G -s -n web-snap-20240601 /dev/vg-datos/web
# -s: snapshot de web, tamaño 10G para los deltas

# Ver el snapshot
sudo lvs
# LV                 VG       Attr       LSize Origin Data%
# web                vg-datos owi-aos---  50.00g             6.00
# web-snap-20240601  vg-datos swi-a-s---  10.00g web   12.50

# Montar el snapshot (para backup, está en estado consistente de la fecha del snap)
sudo mount /dev/vg-datos/web-snap-20240601 /mnt/snap -o ro
sudo tar czf /backup/web-20240601.tar.gz -C /mnt/snap .
sudo umount /mnt/snap

# Restaurar desde snapshot (si el original se estropeó)
sudo lvconvert --merge /dev/vg-datos/web-snap-20240601
# (requiere desmontar el LV origen y reiniciar el LV)

# Eliminar snapshot cuando ya no lo necesitas
sudo lvremove /dev/vg-datos/web-snap-20240601
```

---

## 12.6 — RAID por software

RAID (Redundant Array of Independent Disks) combina múltiples discos para **rendimiento** y/o **redundancia**.

```
Niveles RAID y sus características:

RAID 0 (Striping):
  • Datos distribuidos entre N discos en bloques alternos
  • Velocidad: N × disco
  • Redundancia: NINGUNA. Falla un disco → pierdes TODO
  • Uso: scratch space, caché temporal, donde el rendimiento > datos

RAID 1 (Mirroring):
  • Copia exacta en N discos
  • Espacio útil: 1 disco (el resto es espejo)
  • Resistencia: aguanta N-1 fallos
  • Lectura: puede leer de cualquier disco (más rápido)
  • Uso: discos del sistema, bases de datos críticas

RAID 5:
  • Datos + paridad distribuida entre N discos (mínimo 3)
  • Espacio útil: (N-1) × disco
  • Aguanta: 1 fallo de disco
  • Escritura penalizada (calcular paridad)
  • Uso: NAS, almacenamiento de documentos, archivo

RAID 6:
  • Como RAID 5 pero con doble paridad (mínimo 4 discos)
  • Aguanta: 2 fallos simultáneos
  • Uso: cuando los discos son grandes y la reconstrucción tarda días

RAID 10 (1+0):
  • Mirror de stripes: espejo de pares + striping de los pares
  • Espacio útil: 50% del total
  • Rendimiento: excelente
  • Aguanta: 1 fallo por par de espejos
  • Uso: bases de datos de alto rendimiento

⚠️ RAID NO ES BACKUP:
  • RAID protege contra fallo de HARDWARE de disco
  • No protege contra: borrado accidental, ransomware,
    corrupción lógica, fallo del controlador, incendio
  • Un backup en un lugar DISTINTO es irremplazable
```

### `mdadm` — RAID por software

```bash
sudo apt install mdadm

# Crear array RAID 1 (espejo) con dos discos
sudo mdadm --create /dev/md0 \
    --level=1 \
    --raid-devices=2 \
    /dev/sdb /dev/sdc

# Crear RAID 5 con 3 discos + 1 de reserva (spare)
sudo mdadm --create /dev/md1 \
    --level=5 \
    --raid-devices=3 \
    --spare-devices=1 \
    /dev/sdb /dev/sdc /dev/sdd /dev/sde

# Ver el estado del array
cat /proc/mdstat                               # Estado en tiempo real
sudo mdadm --detail /dev/md0                   # Detalles completos
sudo mdadm --query /dev/sdb                    # ¿De qué array es este disco?

# Guardar la configuración (para que se reconstruya en el arranque)
sudo mdadm --detail --scan >> /etc/mdadm/mdadm.conf
sudo update-initramfs -u                       # Actualizar initramfs

# Monitorizar y recibir alertas por email
# En /etc/mdadm/mdadm.conf:
# MAILADDR admin@empresa.com
sudo systemctl enable --now mdmonitor
```

```bash
# ── SIMULACIÓN DE FALLO Y RECUPERACIÓN ───────────────────────────────────

# 1. Simular fallo de un disco (marcarlo como defectuoso)
sudo mdadm --manage /dev/md0 --fail /dev/sdc
cat /proc/mdstat                   # Ver el estado "degraded"

# 2. Quitar el disco defectuoso
sudo mdadm --manage /dev/md0 --remove /dev/sdc

# 3. Si el disco se puede recuperar, re-añadir:
sudo mdadm --manage /dev/md0 --add /dev/sdc
# Si el disco es físicamente nuevo (reemplazo):
# copiar la tabla de particiones del disco bueno al nuevo:
sudo sfdisk --dump /dev/sdb | sudo sfdisk /dev/sdNUEVO
sudo mdadm --manage /dev/md0 --add /dev/sdNUEVO

# 4. Monitorizar la reconstrucción (puede tardar horas en discos grandes)
watch cat /proc/mdstat
# Muestra: [=>...................]  recovery = 5.3% (...)  finish=120.4min
```

---

## 12.7 — Sistemas de archivos de nueva generación

### Btrfs — El sistema de archivos de próxima generación

Btrfs (B-tree filesystem) integra muchas funcionalidades que en ext4+LVM requieren capas separadas: subvolúmenes, snapshots, compresión transparente, checksums de datos.

```bash
# Crear un sistema de archivos Btrfs
sudo mkfs.btrfs /dev/sdb1                         # Simple
sudo mkfs.btrfs -L "btrfs-datos" /dev/sdb1        # Con etiqueta
sudo mkfs.btrfs /dev/sdb /dev/sdc                  # RAID 1 integrado

# Ver información
sudo btrfs filesystem show
sudo btrfs filesystem df /mnt/btrfs                # Uso por tipo de datos
sudo btrfs device stats /mnt/btrfs                 # Estadísticas de dispositivos

# SUBVOLÚMENES: como particiones lógicas dentro de Btrfs
sudo btrfs subvolume create /mnt/btrfs/@           # Subvolumen raíz (convención)
sudo btrfs subvolume create /mnt/btrfs/@home       # Para /home
sudo btrfs subvolume create /mnt/btrfs/@snapshots  # Para snapshots
sudo btrfs subvolume list /mnt/btrfs               # Listar subvolúmenes

# Montar subvolúmenes específicos
sudo mount -o subvol=@ /dev/sdb1 /                 # Montar el subvolumen @
sudo mount -o subvol=@home /dev/sdb1 /home

# En fstab:
# UUID=...  /      btrfs  defaults,subvol=@,compress=zstd:3,noatime  0 0
# UUID=...  /home  btrfs  defaults,subvol=@home,compress=zstd:3      0 0

# SNAPSHOTS: instantáneos (casi instantáneos, copy-on-write)
sudo btrfs subvolume snapshot /mnt/btrfs/@ /mnt/btrfs/@snapshots/root-$(date +%Y%m%d)
sudo btrfs subvolume snapshot -r /mnt/btrfs/@ /mnt/btrfs/@snapshots/root-ro  # Solo lectura

# Ver y eliminar snapshots
sudo btrfs subvolume list /mnt/btrfs
sudo btrfs subvolume delete /mnt/btrfs/@snapshots/root-20240601

# COMPRESIÓN TRANSPARENTE
sudo mount -o compress=zstd:3 /dev/sdb1 /mnt/btrfs     # zstd nivel 3 (recomendado)
sudo mount -o compress=lzo /dev/sdb1 /mnt/btrfs         # lzo: más rápido, menos ratio
# Para comprimir los datos ya existentes:
sudo btrfs filesystem defragment -r -czstd /mnt/btrfs

# SCRUB: verificar integridad de todos los datos con checksums
sudo btrfs scrub start /mnt/btrfs
sudo btrfs scrub status /mnt/btrfs   # Ver progreso (deja correr en background)
# Programar scrubs mensuales con un timer de systemd (Módulo 09)

# BALANCEO: redistribuir datos entre dispositivos
sudo btrfs balance start /mnt/btrfs   # Puede tardar horas en volúmenes grandes
sudo btrfs balance status /mnt/btrfs
```

### ZFS — El sistema de archivos de nivel enterprise

ZFS es el rey del almacenamiento empresarial, originalmente de Solaris, portado a Linux como OpenZFS.

```bash
# Instalar
sudo apt install zfsutils-linux

# POOLS (equivalente a RAID + LVM en uno)
sudo zpool create pool-datos /dev/sdb             # Pool simple
sudo zpool create pool-datos mirror /dev/sdb /dev/sdc  # Mirror (RAID 1)
sudo zpool create pool-datos raidz /dev/sdb /dev/sdc /dev/sdd  # RAIDZ (RAID 5)
sudo zpool create pool-datos raidz2 /dev/sd{b,c,d,e}  # RAIDZ2 (RAID 6)

sudo zpool status                                  # Estado del pool
sudo zpool list                                    # Resumen compacto

# DATASETS (subvolúmenes con propiedades propias)
sudo zfs create pool-datos/web
sudo zfs create pool-datos/db
sudo zfs create pool-datos/backups

# Propiedades
sudo zfs set compression=lz4 pool-datos           # Compresión en todo el pool
sudo zfs set quota=100G pool-datos/web            # Cuota de espacio
sudo zfs set recordsize=128K pool-datos/db        # Tamaño de bloque para BDs

# Snapshots
sudo zfs snapshot pool-datos/web@2024-06-01        # Snapshot instantáneo
sudo zfs list -t snapshot                           # Ver snapshots
sudo zfs rollback pool-datos/web@2024-06-01        # Revertir al snapshot
sudo zfs destroy pool-datos/web@2024-06-01         # Eliminar snapshot

# SCRUB: verificar integridad
sudo zpool scrub pool-datos
sudo zpool status pool-datos                        # Ver progreso
```

---

## 12.8 — Cifrado de discos con LUKS

LUKS (Linux Unified Key Setup) es el estándar de cifrado de discos en Linux. Cifra **todos los datos del dispositivo** a nivel de bloque, con una clave derivada de tu contraseña.

```
Arquitectura LUKS:

Disco físico
└── Cabecera LUKS (metadatos + hasta 8 slots de clave)
    └── Volumen cifrado (dm-crypt)
        └── Sistema de archivos (ext4, XFS, etc.)

Los "slots" permiten tener múltiples contraseñas/claves
para el mismo volumen (administrador + backup key + etc.)
```

```bash
# Instalar herramientas
sudo apt install cryptsetup

# 1. CREAR un volumen LUKS (sobreescribe el dispositivo)
sudo cryptsetup luksFormat /dev/sdb1
# Pide confirmación (escribe "YES" en mayúsculas) y la passphrase

# Con opciones explícitas (algoritmo y clave modernos):
sudo cryptsetup luksFormat \
    --type luks2 \
    --cipher aes-xts-plain64 \
    --key-size 512 \
    --hash sha512 \
    /dev/sdb1

# 2. ABRIR el volumen (descifrar)
sudo cryptsetup luksOpen /dev/sdb1 datos-cifrados
# Crea /dev/mapper/datos-cifrados

# 3. CREAR sistema de archivos en el volumen descifrado
sudo mkfs.ext4 /dev/mapper/datos-cifrados

# 4. MONTAR
sudo mount /dev/mapper/datos-cifrados /mnt/datos

# 5. USAR (normal, la E/S es cifrada/descifrada automáticamente)
# ...

# 6. CERRAR (desmontar + cerrar el volumen cifrado)
sudo umount /mnt/datos
sudo cryptsetup luksClose datos-cifrados

# Gestión de cabecera LUKS
sudo cryptsetup luksDump /dev/sdb1         # Ver información de la cabecera
sudo cryptsetup luksAddKey /dev/sdb1       # Añadir otra clave/contraseña (backup)
sudo cryptsetup luksRemoveKey /dev/sdb1   # Quitar una clave
sudo cryptsetup luksChangeKey /dev/sdb1  # Cambiar contraseña
```

:::danger **BACKUP de cabecera LUKS — CRÍTICO**
Si la cabecera LUKS se corrompe o el dispositivo tiene sectores malos en esa zona, pierdes acceso a TODOS tus datos aunque la contraseña sea correcta. Haz backup de la cabecera y guárdala en un lugar SEGURO y SEPARADO del disco cifrado.

```bash
# Backup de la cabecera LUKS (¡hazlo ahora, antes de poner datos!)
sudo cryptsetup luksHeaderBackup /dev/sdb1 --header-backup-file luks-header-sdb1.bin
# Guárdala en USB, otro servidor, gestor de contraseñas...

# Restaurar la cabecera (si se corrompe)
sudo cryptsetup luksHeaderRestore /dev/sdb1 --header-backup-file luks-header-sdb1.bin
```
:::

### Automontaje de LUKS en el arranque

```bash
# /etc/crypttab: tabla de volúmenes cifrados
# nombre    dispositivo           clave     opciones
# datos-cifrados  UUID=abc123...  none      luks,noearly

# Con 'none': pide la contraseña en el arranque
# Con un archivo de clave: automático (útil para discos de datos, NO para el sistema)

# Crear un archivo de clave (para automontaje sin interacción)
sudo dd if=/dev/urandom of=/etc/luks/datos.keyfile bs=512 count=4
sudo chmod 400 /etc/luks/datos.keyfile
sudo cryptsetup luksAddKey /dev/sdb1 /etc/luks/datos.keyfile

# /etc/crypttab con archivo de clave:
# datos-cifrados  UUID=abc123...  /etc/luks/datos.keyfile  luks

# /etc/fstab para montaje automático:
# /dev/mapper/datos-cifrados  /mnt/datos  ext4  defaults  0 2
```

---

## 12.9 — Swap, cuotas y mantenimiento

### Swap

```bash
# SWAP EN PARTICIÓN
sudo mkswap /dev/sdb2                  # Preparar partición como swap
sudo swapon /dev/sdb2                  # Activar
sudo swapoff /dev/sdb2                 # Desactivar

# SWAP EN ARCHIVO (más flexible, se puede redimensionar)
sudo fallocate -l 2G /swapfile         # Crear archivo de 2 GB
sudo chmod 600 /swapfile               # Permisos seguros
sudo mkswap /swapfile                  # Preparar
sudo swapon /swapfile                  # Activar
swapon --show                          # Ver swap activa
free -h                                # Ver uso de swap

# En /etc/fstab para persistencia:
# /swapfile  none  swap  sw  0 0

# swappiness: cuánto usa el kernel la swap (0-100)
# 0 = solo cuando la RAM está casi llena
# 60 = valor por defecto (agresivo para escritorio)
# 10-20 = recomendado para servidores (priorizar RAM)
cat /proc/sys/vm/swappiness
sudo sysctl vm.swappiness=10                          # Temporal
echo "vm.swappiness=10" | sudo tee /etc/sysctl.d/99-swap.conf  # Permanente

# zram: swap comprimida en RAM (ideal para sistemas con poca RAM)
sudo apt install zram-config            # o: systemd-zram-generator
```

### Cuotas de disco

```bash
# Requisito: el sistema de archivos debe estar montado con usrquota y/o grpquota
# En /etc/fstab añadir las opciones:
# UUID=...  /home  ext4  defaults,usrquota,grpquota  0 2
sudo mount -o remount /home

# Inicializar las bases de datos de cuotas
sudo quotacheck -ugm /home             # Crear aquota.user y aquota.group
sudo quotaon /home                     # Activar cuotas

# Gestionar cuotas por usuario
sudo edquota -u juan                   # Editar en $EDITOR
# Disk quotas for user juan (uid 1000):
#   Filesystem   blocks   soft   hard   inodes   soft   hard
#   /dev/sda3   102400  900000  1000000    1024      0      0
# blocks: usado; soft: límite suave (con gracia); hard: límite absoluto

# Establecer cuota con setquota (scriptable)
sudo setquota -u juan 900000 1000000 0 0 /home    # 900M soft, 1G hard

# Ver cuotas
sudo quota -u juan                     # Cuota de juan
sudo repquota -a                       # Informe de todos los usuarios
sudo repquota -s /home                 # Con unidades legibles

# XFS usa su propio sistema de cuotas (integrado, sin quotacheck)
sudo mount -o usrquota /dev/sdb1 /home   # XFS: activar en el montaje
sudo xfs_quota -x -c 'limit bsoft=900m bhard=1g juan' /home
sudo xfs_quota -x -c 'report -h' /home
```

### TRIM y mantenimiento de SSDs

```bash
# Los SSDs necesitan TRIM para mantener su rendimiento
# TRIM informa al SSD de qué bloques están libres (puede sobreescribirlos en background)

# fstrim: TRIM manual
sudo fstrim /                   # TRIM del sistema de archivos raíz
sudo fstrim -av                 # TRIM de todos los FS con soporte

# Timer de systemd para TRIM semanal (viene activado por defecto en Ubuntu)
systemctl status fstrim.timer
systemctl list-timers fstrim    # Ver cuándo es la próxima ejecución

# Activar si no está activo
sudo systemctl enable --now fstrim.timer

# Para montaje con discard (TRIM en tiempo real): añadir 'discard' en fstab
# UUID=...  /  ext4  defaults,discard  0 1
# NOTA: el TRIM periódico (fstrim.timer) es preferible al discard continuo
# porque impacta menos en el rendimiento

# Verificar el uso de wear leveling en NVMe
sudo nvme smart-log /dev/nvme0n1 | grep "Percentage Used"
```

---

## Anexos

### A. Comandos de diagnóstico de almacenamiento

```bash
lsblk -f                          # Vista completa de discos y sistemas de archivos
sudo blkid                        # UUIDs y tipos
sudo fdisk -l                     # Tablas de particiones
sudo smartctl -H /dev/sda         # Salud SMART del disco
df -h                             # Espacio en uso por sistema de archivos
sudo du -sh /ruta                 # Uso de un directorio
sudo pvs && vgs && lvs            # Estado de LVM
cat /proc/mdstat                  # Estado de RAID
sudo btrfs filesystem show        # Pools Btrfs
sudo zpool status                 # Pools ZFS
sudo cryptsetup luksDump /dev/X   # Info de cabecera LUKS
```

### B. Tabla comparativa de sistemas de archivos

| Característica | ext4 | XFS | Btrfs | ZFS |
|---|---|---|---|---|
| Madurez/estabilidad | ✅✅✅ | ✅✅✅ | ✅✅ | ✅✅✅ |
| Snapshots | ❌ (LVM) | ❌ (LVM) | ✅ nativo | ✅ nativo |
| Compresión | ❌ | ❌ | ✅ nativo | ✅ nativo |
| Redimensionar | ✅ ambas | solo crecer | ✅ ambas | ✅ con pool |
| Checksums de datos | ❌ | ❌ | ✅ | ✅ |
| RAID integrado | ❌ | ❌ | ✅ básico | ✅ avanzado |
| Uso de RAM | bajo | bajo | medio | alto (ARC) |
| Caso ideal | uso general | grandes archivos | escritorio/NAS | almacenamiento crítico |

### C. Referencias cruzadas entre módulos

```
◀ Módulo 04 — Sistema de archivos
│  Árbol de directorios, inodos, df/du como base para entender
│  los sistemas de archivos que se estudian aquí en profundidad

◀ Módulo 07 — Usuarios y permisos
│  Cuotas de disco son una extensión de los permisos de sistema
│  El bit noexec en fstab refuerza la seguridad (Módulo 07)

◀ Módulo 09 — Procesos y systemd
│  fstrim.timer es un timer de systemd
│  Las unidades .mount y .automount de systemd

◀ Módulo 11 — Redes
│  fstab para NFS: /mnt/nas nfs defaults,_netdev
│  LUKS + almacenamiento en red = seguridad de datos

▶ Módulo 14 — Seguridad y hardening
│  → LUKS como capa de protección contra robo físico
│  → Opciones de montaje: noexec, nosuid, nodev para seguridad

▶ Módulo 17 — Linux como servidor
│  → LVM para redimensionar el disco de base de datos sin downtime
│  → RAID para disponibilidad del servidor
```

---

## Referencias y Bibliografía

1. **Linux man pages: fdisk(8), parted(8), mkfs(8), mount(8), fstab(5)**  
   https://man7.org/linux/man-pages/

2. **LVM HowTo** — tldp.org  
   https://tldp.org/HOWTO/LVM-HOWTO/

3. **mdadm documentation**  
   https://raid.wiki.kernel.org/index.php/A_guide_to_mdadm

4. **Btrfs documentation** — kernel.org  
   https://btrfs.readthedocs.io/

5. **OpenZFS documentation**  
   https://openzfs.github.io/openzfs-docs/

6. **LUKS/dm-crypt documentation**  
   https://gitlab.com/cryptsetup/cryptsetup/-/wikis/DMCrypt

7. **SMART — smartmontools**  
   https://www.smartmontools.org/

8. **ArchWiki — File systems**  
   https://wiki.archlinux.org/title/File_systems

9. **ArchWiki — LVM**  
   https://wiki.archlinux.org/title/LVM

10. **ArchWiki — dm-crypt/Device encryption**  
    https://wiki.archlinux.org/title/Dm-crypt/Device_encryption

11. **RAID — Wikipedia técnica** (niveles RAID)  
    https://en.wikipedia.org/wiki/Standard_RAID_levels

12. **The Design and Implementation of the 4.4BSD Operating System**  
    McKusick et al. Referencia académica sobre FFS (base conceptual de ext4).

13. **Unix and Linux System Administration Handbook** — Nemeth et al.  
    Capítulo 8: Storage; Capítulo 20: Disk Management.

14. **How Linux Works** — Brian Ward, 3ª ed.  
    Capítulo 4: Disks and Filesystems.

---

## Preguntas de autoevaluación

1. ¿Cuáles son las diferencias entre MBR y GPT? ¿Cuándo usarías cada uno?
2. ¿Por qué se recomienda usar el UUID en `/etc/fstab` en vez del nombre del dispositivo (`/dev/sda1`)?
3. Explica la arquitectura de LVM: ¿qué es un PV, un VG y un LV? ¿Cuál es la ventaja principal sobre las particiones tradicionales?
4. ¿Cómo extenderías un LV de 50 GB a 70 GB en caliente en un sistema con ext4? ¿Y con XFS?
5. Explica los niveles RAID 0, 1, 5 y 10. ¿Cuántos discos falla cada uno sin perder datos?
6. ¿Por qué "RAID no es backup"? Da un escenario donde RAID 1 no protege los datos.
7. ¿Qué ventaja tiene Btrfs sobre ext4+LVM para el caso de uso de snapshots frecuentes?
8. ¿Qué es un slot de clave en LUKS? ¿Para qué sirve tener múltiples slots?
9. ¿Por qué es crítico hacer backup de la cabecera LUKS? ¿Qué pasa si se corrompe?
10. ¿Cuándo usar `discard` en fstab vs. el timer `fstrim.timer`?
11. Un servidor muestra `/dev/md0 [UU_]` en `/proc/mdstat`. ¿Qué significa? ¿Qué harías?
12. ¿Cuál es el efecto de `swappiness=10` en un servidor comparado con el valor por defecto de 60?

---

## Laboratorios prácticos

### Lab 12.1 — Inventariar el almacenamiento

```bash
# 1. Ver todos los dispositivos de bloque
lsblk -f
# 2. Identificar los sistemas de archivos montados
findmnt
# 3. Ver el espacio disponible
df -h | grep -v tmpfs | grep -v udev
# 4. Ver los 5 directorios que más espacio usan en /var
sudo du -xh --max-depth=2 /var 2>/dev/null | sort -rh | head -10
# 5. Verificar la salud SMART del disco principal
sudo smartctl -H /dev/sda 2>/dev/null || sudo smartctl -H /dev/nvme0n1
```

### Lab 12.2 — Trabajar con un archivo como disco (loop device)

```bash
# 1. Crear un archivo que usaremos como disco de práctica (100 MB)
dd if=/dev/zero of=/tmp/disco-practica.img bs=1M count=100

# 2. Asociarlo a un loop device
sudo losetup /dev/loop10 /tmp/disco-practica.img
lsblk | grep loop10

# 3. Crear una tabla de particiones y una partición
sudo fdisk /dev/loop10 <<'EOF'
g
n
1


+90M
w
EOF
sudo partprobe /dev/loop10

# 4. Crear sistema de archivos en la partición
sudo mkfs.ext4 /dev/loop10p1

# 5. Montar y usar
sudo mount /dev/loop10p1 /mnt
sudo bash -c 'echo "Hola desde el loop device" > /mnt/prueba.txt'
cat /mnt/prueba.txt
df -h /mnt

# 6. Limpiar
sudo umount /mnt
sudo losetup -d /dev/loop10
rm /tmp/disco-practica.img
```

### Lab 12.3 — LVM con archivos de imagen

```bash
# Crear discos virtuales para practicar LVM sin discos reales
for i in 1 2 3; do
    dd if=/dev/zero of=/tmp/disco$i.img bs=1M count=200
    sudo losetup /dev/loop1$i /tmp/disco$i.img
done

# Crear LVM
sudo pvcreate /dev/loop11 /dev/loop12 /dev/loop13
sudo pvs

sudo vgcreate vg-lab /dev/loop11 /dev/loop12 /dev/loop13
sudo vgs vg-lab

sudo lvcreate -L 100M -n datos vg-lab
sudo lvcreate -L 200M -n logs vg-lab
sudo lvs vg-lab

# Formatear y montar
sudo mkfs.ext4 /dev/vg-lab/datos
sudo mkdir -p /mnt/datos-lab
sudo mount /dev/vg-lab/datos /mnt/datos-lab
df -h /mnt/datos-lab

# Extender el LV en caliente
sudo lvextend -L +100M --resizefs /dev/vg-lab/datos
df -h /mnt/datos-lab    # Debe mostrar el tamaño aumentado

# Limpiar
sudo umount /mnt/datos-lab
sudo lvremove -f /dev/vg-lab/datos /dev/vg-lab/logs
sudo vgremove vg-lab
sudo pvremove /dev/loop11 /dev/loop12 /dev/loop13
for i in 1 2 3; do sudo losetup -d /dev/loop1$i; done
rm -f /tmp/disco{1,2,3}.img
```

---

## Resumen del módulo

✅ **Dispositivos:** `lsblk`, `blkid`, UUIDs estables, `/dev/disk/by-*/`, `smartctl` para salud del disco  
✅ **Particionado:** MBR vs GPT; `fdisk`/`gdisk`/`parted`; alineación; `partprobe`  
✅ **Sistemas de archivos:** ext4 (`mkfs.ext4`, `tune2fs`, `e2fsck`, `resize2fs`); XFS (`xfs_growfs`); Btrfs; ZFS  
✅ **Montaje:** `mount` con opciones (`noexec`, `nosuid`, `noatime`); `/etc/fstab` con UUIDs; `findmnt --verify`  
✅ **LVM:** PV → VG → LV; `lvextend --resizefs`; snapshots copy-on-write; `pvmove` para migrar datos  
✅ **RAID:** niveles 0/1/5/6/10; `mdadm --create/--detail`; simulación y recuperación de fallos  
✅ **Btrfs:** subvolúmenes, snapshots instantáneos, compresión zstd, scrub con checksums  
✅ **LUKS:** `cryptsetup luksFormat/luksOpen/luksClose`; slots de clave; backup de cabecera (crítico)  
✅ **Swap:** partición vs archivo; `swappiness`; zram  
✅ **SSD:** `fstrim.timer`, opción `discard`, cuotas con `edquota`/`xfs_quota`  

**Próximo paso:** [Módulo 13 — Arranque, kernel y hardware](/arranque-kernel-y-hardware). Ahora que entiendes cómo se almacenan los datos, entenderás cómo el sistema arranca: UEFI/BIOS, GRUB, el kernel y el proceso de init.

---

**Última actualización:** 2024-06  
**Versión:** 1.0  
**Estado:** ✅ Listo para enseñanza
