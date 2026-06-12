---
title: "Módulo 13 — Arranque, kernel y hardware"
sidebar_label: "13 · Arranque y kernel"
description: Proceso de arranque UEFI/GRUB, initramfs, el kernel y sus módulos, sysctl, udev, gestión de hardware y rescate del sistema.
---

# Módulo 13 — Arranque, kernel y hardware

¿Qué pasa entre que pulsas el botón de encendido y aparece el login? Este
módulo recorre **el arranque completo, el kernel y la gestión del
hardware** — el conocimiento que te permite rescatar un sistema que no
arranca.

## Objetivos

- Entender cada etapa del arranque: firmware → GRUB → kernel → systemd.
- Administrar GRUB y recuperar sistemas que no arrancan.
- Gestionar módulos y parámetros del kernel (`sysctl`).
- Inspeccionar y gestionar el hardware desde la terminal.

## Capítulos

### 13.1 — El proceso de arranque, etapa a etapa

- BIOS vs. UEFI; Secure Boot y shim.
- La ESP (EFI System Partition) y los gestores de arranque.
- GRUB2 → kernel + initramfs → `init` (systemd) → targets.
- Analizar el arranque: `dmesg`, `journalctl -b`, `systemd-analyze`.

### 13.2 — GRUB2 a fondo

- `/etc/default/grub`, `grub.cfg` y `update-grub`/`grub2-mkconfig`.
- Parámetros del kernel desde GRUB (modo rescate, `nomodeset`...).
- Reinstalar GRUB tras un desastre; arranque dual revisitado.
- Alternativa moderna: `systemd-boot`.

### 13.3 — initramfs y el arranque temprano

- Qué es y por qué existe el initramfs.
- `mkinitcpio`, `dracut`, `update-initramfs` según la distro.
- Casos donde importa: cifrado, RAID, drivers de almacenamiento.

### 13.4 — El kernel Linux

- Versiones, LTS y el ciclo de desarrollo.
- Kernels de la distro vs. mainline; instalar/quitar kernels.
- Compilar un kernel: cuándo tiene sentido y proceso resumido.
- `vmlinuz`, `System.map` y el contenido de `/boot`.

### 13.5 — Módulos del kernel

- `lsmod`, `modinfo`, `modprobe`, `rmmod`.
- Configuración: `/etc/modprobe.d`, opciones de módulo, listas negras.
- DKMS: módulos que sobreviven a actualizaciones del kernel.

### 13.6 — Parámetros del kernel: sysctl

- `/proc/sys` y `sysctl`: leer y modificar en caliente.
- Persistencia en `/etc/sysctl.d/`.
- Parámetros típicos: red, memoria (`vm.swappiness`), seguridad.

### 13.7 — udev y los dispositivos

- `/dev` dinámico: cómo aparecen los dispositivos.
- Reglas udev: escribir reglas propias (permisos, nombres, acciones).
- `udevadm`: monitor, info y test.

### 13.8 — Inspeccionar el hardware

- `lspci`, `lsusb`, `lscpu`, `lsmem`, `dmidecode`, `hwinfo`, `inxi`.
- Sensores y temperatura: `lm-sensors`.
- Firmware y microcódigo: `fwupd`.
- Gestión de energía: `tlp`, estados ACPI, `powertop`.

### 13.9 — Rescate de sistemas

- Modo rescate y modo emergencia de systemd.
- `chroot` desde un live USB: la técnica universal de reparación.
- Recuperar contraseña de root.
- Diagnóstico de fallos de arranque más comunes.

## Requisitos previos

Módulos 09 y 12.
