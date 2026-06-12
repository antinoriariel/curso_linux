---
title: "Módulo 08 — Gestión de software"
sidebar_label: "08 · Gestión de software"
description: Gestores de paquetes apt, dnf, pacman y zypper; repositorios, Flatpak, Snap, AppImage y compilación desde fuente.
---

# Módulo 08 — Gestión de software

Instalar software en Linux es radicalmente distinto a Windows: **repositorios
centralizados, dependencias resueltas automáticamente y todo el sistema
actualizable con un comando**. Este módulo cubre los gestores de todas las
grandes familias y los formatos universales modernos.

## Objetivos

- Entender paquetes, repositorios, dependencias y firmas.
- Manejar el gestor de tu distribución y reconocer los de las demás.
- Usar Flatpak, Snap y AppImage con criterio.
- Compilar e instalar software desde el código fuente.

## Capítulos

### 8.1 — Conceptos: paquetes y repositorios

- Qué contiene un paquete (`.deb`, `.rpm`); metadatos y dependencias.
- Repositorios, espejos (*mirrors*) y firmas GPG.
- Dependencias, conflictos y el infierno que los gestores resuelven.
- Bibliotecas compartidas: `ldd`, `ldconfig` y el porqué de las dependencias.

### 8.2 — Familia Debian/Ubuntu: APT

- `apt update`, `upgrade`, `full-upgrade`, `install`, `remove`, `purge`,
  `autoremove`.
- Buscar e inspeccionar: `apt search`, `apt show`, `apt list`.
- `dpkg`: instalar `.deb` sueltos, `-l`, `-L`, `-S`.
- `sources.list`, PPAs y *pinning* de versiones.

### 8.3 — Familia Red Hat/Fedora: DNF/YUM

- `dnf install/remove/upgrade/search/info`.
- Grupos de paquetes y módulos.
- `rpm`: consultas (`-q`, `-ql`, `-qf`) y verificación.
- Repositorios: archivos `.repo`, EPEL y RPM Fusion.

### 8.4 — Otras familias

- **Arch**: `pacman` (sintaxis y operaciones) y el AUR (`yay`, `paru`).
- **openSUSE**: `zypper`.
- **Alpine**: `apk` (clave en contenedores).

### 8.5 — Formatos universales

- **Flatpak**: Flathub, permisos y sandbox.
- **Snap**: funcionamiento, ventajas y controversias.
- **AppImage**: aplicaciones portables.
- Comparativa: cuándo conviene cada formato frente al paquete nativo.

### 8.6 — Compilar desde el código fuente

- La tríada clásica: `./configure && make && make install`.
- Dependencias de compilación (`build-essential`, `-devel`).
- `make` y los Makefiles: lectura básica.
- Sistemas modernos: CMake, Meson/Ninja.
- Instalar sin ensuciar el sistema: `/usr/local`, `checkinstall`, `stow`.

### 8.7 — Mantenimiento del sistema

- Actualizaciones de seguridad y actualizaciones automáticas
  (`unattended-upgrades`, `dnf-automatic`).
- Limpiar cachés y paquetes huérfanos.
- Actualizar entre versiones de la distribución (release upgrade).

## Requisitos previos

Módulos 03–07.
