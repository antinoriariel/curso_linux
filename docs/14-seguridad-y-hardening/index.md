---
title: "Módulo 14 — Seguridad y hardening"
sidebar_label: "14 · Seguridad"
description: Modelo de seguridad de Linux, hardening, SELinux y AppArmor, auditd, fail2ban, criptografía con GPG, TLS y detección de intrusiones.
---

# Módulo 14 — Seguridad y hardening

La seguridad no es un producto sino un proceso. Este módulo enseña a
**reducir la superficie de ataque, confinar procesos, cifrar información y
auditar el sistema**, con un enfoque defensivo y práctico.

## Objetivos

- Aplicar una metodología de hardening sobre un sistema real.
- Entender y manejar SELinux y AppArmor sin desactivarlos.
- Usar criptografía práctica: GPG, TLS/certificados, hashes.
- Configurar auditoría y detección de intentos de intrusión.

## Capítulos

### 14.1 — El modelo de seguridad de Linux

- Superficie de ataque y principio de mínimo privilegio.
- DAC vs. MAC; capabilities de Linux (`getcap`, `setcap`).
- Amenazas típicas en escritorio y en servidor.
- Actualizaciones de seguridad y CVEs: cómo leerlos.

### 14.2 — Hardening básico del sistema

- Checklist inicial: servicios innecesarios, puertos abiertos, SUID.
- Endurecer SSH (revisión y ampliación del módulo 11).
- Particiones con `noexec`/`nosuid`; `/tmp` separado.
- Política de contraseñas y bloqueo de cuentas.
- Guías de referencia: CIS Benchmarks, `lynis` para auditar.

### 14.3 — SELinux

- Conceptos: contextos, tipos, políticas, booleans.
- Modos: enforcing, permissive, disabled.
- `ls -Z`, `chcon`, `restorecon`, `semanage`, `setsebool`.
- Diagnóstico de denegaciones: `ausearch`, `audit2why`, `audit2allow`.
- Por qué "desactivar SELinux" no es la solución.

### 14.4 — AppArmor

- Perfiles, modos *enforce* y *complain*.
- `aa-status`, `aa-enforce`, `aa-logprof`.
- Crear y ajustar perfiles para servicios propios.

### 14.5 — Auditoría con auditd

- Arquitectura del subsistema de auditoría.
- Reglas: vigilar archivos, llamadas al sistema, usuarios.
- `ausearch` y `aureport`: explotar los registros.

### 14.6 — Protección frente a ataques de red

- `fail2ban`: jaulas, filtros y acciones.
- Limitación de tasa en el firewall.
- Escaneo defensivo del propio sistema: `nmap` contra ti mismo,
  `ss -tlnp` como rutina.

### 14.7 — Criptografía práctica: GPG

- Cifrado simétrico y asimétrico: conceptos mínimos.
- `gpg`: generar claves, cifrar, descifrar, firmar y verificar.
- Firmas de paquetes e ISOs: cerrar el círculo del módulo 02.
- Gestores de contraseñas en terminal: `pass`.

### 14.8 — TLS y certificados

- Cadena de confianza, CAs y certificados X.509.
- `openssl`: inspeccionar certificados, generar CSRs, autofirmados.
- Let's Encrypt y `certbot` (se aplica en el módulo 17).
- Almacén de confianza del sistema (`update-ca-certificates`).

### 14.9 — Integridad y detección de intrusiones

- Verificación de integridad: AIDE, `rpm -V` / `debsums`.
- Rootkits: `rkhunter`, `chkrootkit` y sus limitaciones.
- Logs centralizados como herramienta forense básica.
- Qué hacer ante una sospecha de compromiso (metodología).

## Requisitos previos

Módulos 07, 09 y 11.
