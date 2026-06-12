---
title: "Módulo 02 — Instalación y primer contacto"
sidebar_label: "02 · Instalación y primer contacto"
description: Preparar un entorno de prácticas con máquinas virtuales, WSL o instalación nativa, y conocer el escritorio.
---

# Módulo 02 — Instalación y primer contacto

En este módulo montarás tu **entorno de prácticas**. No hace falta romper
nada: empezaremos con máquinas virtuales y WSL, y veremos la instalación
nativa (incluido el arranque dual) para quien quiera dar el paso completo.

## Objetivos

- Tener un Linux funcional donde practicar todo el curso sin riesgo.
- Entender el proceso de instalación: particiones, usuario, cargador de arranque.
- Familiarizarse con un entorno de escritorio y sus aplicaciones básicas.

## Capítulos

### 2.1 — Opciones para probar Linux sin riesgo

- Sesiones *live* desde USB: probar sin instalar.
- Máquinas virtuales: **VirtualBox**, **VMware**, **GNOME Boxes**, **QEMU**.
- **WSL2** en Windows: instalación y limitaciones.
- Contenedores y entornos en la nube como alternativa rápida.

### 2.2 — Crear el medio de instalación

- Descargar ISOs y verificar su integridad (`sha256sum`, firmas GPG).
- Grabar el USB: **Ventoy**, **balenaEtcher**, `dd`.
- Arrancar desde USB: BIOS/UEFI, *Secure Boot* y orden de arranque.

### 2.3 — Instalación guiada paso a paso

- El instalador de Ubuntu/Fedora explicado pantalla a pantalla.
- Particionado básico: `/`, `swap`, `/home` separado, EFI System Partition.
- Elección de zona horaria, teclado y usuario inicial.
- Primer arranque y actualización inicial del sistema.

### 2.4 — Arranque dual con Windows

- Reducir la partición de Windows de forma segura.
- Instalar junto a Windows y entender GRUB como selector.
- Problemas típicos: hora del reloj, *fast startup*, Secure Boot.

### 2.5 — El escritorio Linux

- Entornos de escritorio: **GNOME**, **KDE Plasma**, **XFCE**, otros.
- Anatomía del escritorio: panel, lanzador, áreas de notificación.
- Instalar aplicaciones desde la tienda de software.
- X11 y Wayland: qué son y por qué te puede importar.

### 2.6 — Primeros ajustes recomendados

- Drivers privativos (NVIDIA, Wi-Fi) y firmware.
- Codecs multimedia y fuentes.
- Copias de seguridad del sistema recién instalado (instantáneas, Timeshift).

## Requisitos previos

Módulo 01.
