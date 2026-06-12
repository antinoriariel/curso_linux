---
title: "Módulo 07 — Usuarios, grupos y permisos"
sidebar_label: "07 · Usuarios y permisos"
description: Gestión de usuarios y grupos, sudo, permisos clásicos, permisos especiales, ACLs, atributos y PAM.
---

# Módulo 07 — Usuarios, grupos y permisos

Linux es multiusuario desde su origen. Este módulo cubre **quién puede hacer
qué**: cuentas, grupos, escalado de privilegios con `sudo` y el modelo de
permisos completo, desde `chmod` hasta las ACLs.

## Objetivos

- Crear y administrar usuarios y grupos.
- Usar `sudo` correctamente y entender su configuración.
- Dominar el modelo de permisos: clásicos, especiales y ACLs.
- Conocer el papel de PAM en la autenticación.

## Capítulos

### 7.1 — Usuarios y grupos: el modelo

- UID, GID, usuario root y usuarios de sistema.
- Archivos clave: `/etc/passwd`, `/etc/shadow`, `/etc/group`, `/etc/gshadow`.
- `id`, `whoami`, `groups`, `who`, `w`, `last`.

### 7.2 — Administrar cuentas

- `useradd`, `usermod`, `userdel` (y los amigables `adduser`/`deluser`).
- `groupadd`, `groupmod`, `groupdel`, `gpasswd`.
- Contraseñas: `passwd`, `chage`, políticas de caducidad.
- El esqueleto `/etc/skel` y los valores por defecto (`/etc/login.defs`).

### 7.3 — Escalado de privilegios: su y sudo

- `su` vs. `su -` vs. `sudo`: diferencias reales.
- `/etc/sudoers` y `visudo`: sintaxis y reglas seguras.
- `sudoers.d`, alias de comandos, `NOPASSWD` y sus riesgos.
- Auditoría: quién ejecutó qué (`journalctl`, `/var/log/auth.log`).

### 7.4 — Permisos clásicos

- Lectura, escritura y ejecución para usuario, grupo y otros (`rwxrwxrwx`).
- `chmod` simbólico y octal; `chown` y `chgrp`.
- Qué significan los permisos en directorios (¡no es lo mismo!).
- `umask`: los permisos por defecto.

### 7.5 — Permisos especiales

- **SUID** y **SGID** en ejecutables: cómo funcionan `passwd` y compañía.
- SGID en directorios: colaboración en equipo.
- **Sticky bit**: el caso de `/tmp`.
- Riesgos de seguridad y cómo auditar binarios SUID (`find -perm`).

### 7.6 — ACLs y atributos extendidos

- Cuándo los permisos clásicos se quedan cortos.
- `getfacl` y `setfacl`: ACLs de acceso y por defecto.
- Atributos de archivo: `lsattr`, `chattr` (inmutable, append-only).
- Atributos extendidos (`getfattr`, `setfattr`).

### 7.7 — PAM: módulos de autenticación

- Qué es PAM y cómo encaja en el login, sudo y ssh.
- Anatomía de `/etc/pam.d/`: tipos, controles y módulos.
- Casos prácticos: límites (`pam_limits`), políticas de contraseña
  (`pam_pwquality`), bloqueo por intentos (`pam_faillock`).

## Requisitos previos

Módulos 03–05.
