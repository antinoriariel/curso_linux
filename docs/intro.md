---
sidebar_position: 0
slug: /
title: Índice del curso
description: Curso completo de Linux, desde cero hasta conceptos avanzados de administración de sistemas.
---

# Curso de Linux: de cero a conceptos avanzados

Bienvenido/a. Este curso te lleva desde el primer contacto con Linux hasta la
administración avanzada de sistemas: terminal, scripting, redes,
almacenamiento, seguridad, contenedores y servidores en producción.

## ¿A quién va dirigido?

- **Principiantes absolutos** que nunca han usado Linux.
- **Usuarios de escritorio** que quieren dominar la terminal.
- **Desarrolladores** que necesitan Linux como entorno de trabajo.
- **Futuros administradores de sistemas / DevOps** que buscan una base sólida
  orientada a certificaciones (LPIC, RHCSA) y al mundo laboral.

## Cómo está organizado

El curso se divide en **cuatro niveles** y **19 módulos**. Cada módulo
contiene su propio índice detallado de capítulos y las herramientas que se
trabajan en él. Se recomienda seguir el orden propuesto, aunque a partir del
nivel intermedio los módulos son razonablemente independientes.

---

## Nivel 1 — Fundamentos (de cero)

| # | Módulo | Contenido principal |
|---|--------|---------------------|
| 01 | [Introducción al mundo Linux](01-introduccion-al-mundo-linux/index.md) | Historia, filosofía UNIX, distribuciones, licencias, ecosistema |
| 02 | [Instalación y primer contacto](02-instalacion-y-primer-contacto/index.md) | Máquinas virtuales, WSL, particionado básico, dual boot, escritorios |
| 03 | [La terminal y la shell](03-terminal-y-shell/index.md) | Bash, comandos esenciales, ayuda (`man`, `info`, `tldr`), historial, atajos |
| 04 | [El sistema de archivos](04-sistema-de-archivos/index.md) | Jerarquía FHS, rutas, `ls`, `cp`, `mv`, `rm`, `find`, enlaces, comodines |
| 05 | [Archivos y procesamiento de texto](05-archivos-y-procesamiento-de-texto/index.md) | `grep`, `sed`, `awk`, tuberías, redirecciones, compresión y archivado |
| 06 | [Editores de texto](06-editores-de-texto/index.md) | `nano`, `vim` a fondo, nociones de `emacs` |

## Nivel 2 — Usuario avanzado

| # | Módulo | Contenido principal |
|---|--------|---------------------|
| 07 | [Usuarios, grupos y permisos](07-usuarios-grupos-y-permisos/index.md) | `sudo`, `chmod`, `chown`, permisos especiales, ACLs, PAM |
| 08 | [Gestión de software](08-gestion-de-software/index.md) | `apt`, `dnf`, `pacman`, `zypper`, Flatpak, Snap, compilar desde fuente |
| 09 | [Procesos, servicios y systemd](09-procesos-servicios-y-systemd/index.md) | `ps`, `top`, señales, `systemctl`, `journalctl`, `cron`, temporizadores |
| 10 | [Shell scripting con Bash](10-shell-scripting-bash/index.md) | Variables, condicionales, bucles, funciones, depuración, buenas prácticas |

## Nivel 3 — Administración de sistemas

| # | Módulo | Contenido principal |
|---|--------|---------------------|
| 11 | [Redes en Linux](11-redes-en-linux/index.md) | `ip`, `ss`, DNS, SSH, `rsync`, `curl`, firewalls (`nftables`, `ufw`, `firewalld`) |
| 12 | [Almacenamiento avanzado](12-almacenamiento-avanzado/index.md) | Particionado, sistemas de archivos, LVM, RAID, Btrfs/ZFS, cifrado LUKS |
| 13 | [Arranque, kernel y hardware](13-arranque-kernel-y-hardware/index.md) | UEFI/GRUB, initramfs, módulos del kernel, `sysctl`, udev, drivers |
| 14 | [Seguridad y hardening](14-seguridad-y-hardening/index.md) | SELinux/AppArmor, `auditd`, `fail2ban`, GPG, certificados, auditoría |
| 15 | [Monitorización y rendimiento](15-monitorizacion-y-rendimiento/index.md) | `vmstat`, `iostat`, `sar`, `perf`, `strace`, `lsof`, tuning, observabilidad |

## Nivel 4 — Conceptos avanzados y mundo profesional

| # | Módulo | Contenido principal |
|---|--------|---------------------|
| 16 | [Virtualización y contenedores](16-virtualizacion-y-contenedores/index.md) | KVM/QEMU, libvirt, LXC, Docker, Podman, introducción a Kubernetes |
| 17 | [Linux como servidor](17-linux-como-servidor/index.md) | Nginx/Apache, bases de datos, NFS/Samba, DNS, DHCP, correo, proxies |
| 18 | [Automatización y DevOps](18-automatizacion-y-devops/index.md) | Git, Ansible, CI/CD, infraestructura como código, copias de seguridad |
| 19 | [Apéndices y recursos](19-apendices-y-recursos/index.md) | Chuleta de comandos, certificaciones, glosario, bibliografía |

---

## Itinerarios recomendados

- **Solo quiero defenderme en la terminal:** módulos 01–06.
- **Quiero ser usuario avanzado / desarrollador:** módulos 01–11 y 16.
- **Quiero ser sysadmin / DevOps:** el curso completo, en orden.
- **Preparación de certificaciones:** ver la tabla de correspondencias en el
  [módulo 19](19-apendices-y-recursos/index.md).

## Convenciones del curso

- Los comandos que se ejecutan como usuario normal se muestran con el prompt
  `$`; los que requieren privilegios de administrador, con `#` o con `sudo`.
- Los ejemplos están probados sobre **Debian/Ubuntu** y **Fedora/RHEL**; las
  diferencias relevantes entre familias de distribuciones se señalan en cada
  capítulo.
- Cada capítulo termina con una sección de **ejercicios prácticos** y otra de
  **lecturas recomendadas** (páginas `man` y documentación oficial).
