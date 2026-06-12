---
title: "Módulo 12 — Almacenamiento avanzado"
sidebar_label: "12 · Almacenamiento"
description: Discos y particiones, sistemas de archivos, montaje y fstab, LVM, RAID, Btrfs, ZFS, cifrado LUKS, swap y cuotas.
---

# Módulo 12 — Almacenamiento avanzado

Del disco físico al archivo: **particionar, formatear, montar, redimensionar
y cifrar**. Este módulo cubre el stack de almacenamiento completo, incluidos
LVM, RAID y los sistemas de archivos de nueva generación.

## Objetivos

- Particionar discos con seguridad (MBR/GPT, `fdisk`, `parted`).
- Crear, montar y mantener sistemas de archivos.
- Gestionar volúmenes lógicos (LVM) y RAID por software.
- Cifrar discos con LUKS y administrar swap y cuotas.

## Capítulos

### 12.1 — Discos y dispositivos de bloque

- Nomenclatura: `/dev/sda`, `/dev/nvme0n1`, `/dev/vda`.
- `lsblk`, `blkid`, `fdisk -l`: inventariar el almacenamiento.
- Identificadores estables: UUID, etiquetas, `/dev/disk/by-*`.
- Salud del disco: **SMART** (`smartctl`).

### 12.2 — Particionado

- Tablas MBR vs. GPT; tipos de partición.
- `fdisk`, `gdisk` y `parted`/`gparted`.
- Alineación, redimensionado y errores que destruyen datos (y cómo evitarlos).

### 12.3 — Sistemas de archivos

- Conceptos: inodos, journaling, bloques, fragmentación.
- **ext4**: el estándar (`mkfs.ext4`, `tune2fs`, `e2fsck`).
- **XFS** (RHEL por defecto): características y herramientas.
- FAT32/exFAT/NTFS: interoperabilidad con Windows.
- `fsck`: reparación y cuándo NO ejecutarlo.

### 12.4 — Montaje

- `mount`, `umount` y opciones (`ro`, `noexec`, `nosuid`, `noatime`).
- `/etc/fstab` línea a línea; montajes por UUID.
- Unidades `.mount` y `.automount` de systemd.
- `udisksctl` y el automontaje del escritorio; imágenes ISO y loop devices.

### 12.5 — LVM: volúmenes lógicos

- Arquitectura: PV → VG → LV.
- `pvcreate`, `vgcreate`, `lvcreate` y comandos de inspección.
- Redimensionar en caliente: `lvextend` + crecimiento del sistema de archivos.
- Instantáneas (*snapshots*) y *thin provisioning*.

### 12.6 — RAID por software

- Niveles RAID: 0, 1, 5, 6, 10 — qué protege cada uno (y qué no).
- `mdadm`: crear, monitorizar y reconstruir arrays.
- RAID no es backup: el porqué, demostrado.

### 12.7 — Sistemas de archivos de nueva generación

- **Btrfs**: subvolúmenes, instantáneas, compresión, `btrfs send/receive`.
- **ZFS**: pools, datasets, scrub, RAIDZ — conceptos y comandos básicos.
- Casos de uso frente a ext4/XFS + LVM.

### 12.8 — Cifrado de discos

- **LUKS/dm-crypt**: `cryptsetup`, cabeceras y slots de claves.
- Cifrado en la instalación vs. a posteriori; `/etc/crypttab`.
- Copias de seguridad de cabeceras LUKS (crítico).

### 12.9 — Swap, cuotas y mantenimiento

- Swap: partición vs. archivo, `swappiness`, zram/zswap.
- Cuotas de disco por usuario y grupo.
- TRIM/discard en SSDs (`fstrim.timer`).
- Recuperación de datos: `testdisk`, `photorec` y prevención con backups.

## Requisitos previos

Módulos 04, 07 y 09.
