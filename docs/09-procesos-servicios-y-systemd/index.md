---
title: "Módulo 09 — Procesos, servicios y systemd"
sidebar_label: "09 · Procesos y systemd"
description: Gestión de procesos, señales, prioridades, systemd, systemctl, journalctl y tareas programadas con cron y timers.
---

# Módulo 09 — Procesos, servicios y systemd

Todo lo que se ejecuta en Linux es un proceso. Este módulo enseña a
**observarlos, controlarlos y priorizarlos**, y a gestionar los servicios del
sistema con `systemd`, el init dominante en el Linux moderno.

## Objetivos

- Inspeccionar y controlar procesos: estados, señales, prioridades.
- Gestionar servicios con `systemctl` y leer logs con `journalctl`.
- Escribir unidades de systemd propias.
- Programar tareas con `cron`, `at` y los timers de systemd.

## Capítulos

### 9.1 — Qué es un proceso

- PID, PPID, árbol de procesos (`pstree`).
- Estados: running, sleeping, stopped, zombie.
- `fork`/`exec` a nivel conceptual; procesos vs. hilos.
- `/proc/<pid>`: el proceso por dentro.

### 9.2 — Observar procesos

- `ps` a fondo: `aux`, `-ef`, formatos personalizados (`-o`).
- `top` interactivo: ordenar, filtrar, matar desde dentro.
- `htop` y `btop`: monitores modernos.
- `pgrep` y `pidof`: encontrar procesos por nombre.

### 9.3 — Controlar procesos: señales

- Qué es una señal; `SIGTERM` vs. `SIGKILL` vs. `SIGHUP` vs. `SIGSTOP`.
- `kill`, `pkill`, `killall`: matar con criterio.
- Trampas (`trap`) y limpieza al recibir señales.

### 9.4 — Primer y segundo plano

- `&`, `jobs`, `fg`, `bg`, `Ctrl+Z`, `Ctrl+C`.
- `nohup` y `disown`: sobrevivir al cierre de la terminal.
- `setsid` y relación con tmux/screen.

### 9.5 — Prioridades y recursos

- `nice` y `renice`: prioridad de CPU.
- `ionice`: prioridad de E/S.
- `ulimit` y límites por proceso.
- cgroups: la base moderna del control de recursos.

### 9.6 — systemd: visión general

- Historia: de SysV init a systemd (y el porqué de la polémica).
- Conceptos: unidades, targets (vs. runlevels), dependencias.
- Tipos de unidad: service, socket, timer, mount, target, path.

### 9.7 — systemctl en el día a día

- `start`, `stop`, `restart`, `reload`, `status`.
- `enable`/`disable` y la diferencia con start/stop.
- `list-units`, `list-unit-files`, `is-active`, `is-enabled`.
- `mask`, targets (`get-default`, `isolate`) y análisis de arranque
  (`systemd-analyze`, `systemd-analyze blame`).

### 9.8 — Escribir unidades propias

- Anatomía de un `.service`: `[Unit]`, `[Service]`, `[Install]`.
- Tipos de servicio (`simple`, `forking`, `oneshot`, `notify`).
- Reinicio automático, dependencias (`After`, `Requires`, `Wants`).
- Endurecimiento de servicios: `User=`, sandboxing básico.
- `systemctl edit` y los *drop-ins*.

### 9.9 — Logs con journald

- `journalctl`: por unidad (`-u`), por tiempo (`--since`), en vivo (`-f`),
  por prioridad (`-p`), de arranques anteriores (`-b`).
- Persistencia del journal y límites de espacio.
- Convivencia con rsyslog y los archivos clásicos de `/var/log`.

### 9.10 — Tareas programadas

- `cron` y `crontab -e`: la sintaxis de las cinco estrellas.
- `/etc/cron.d`, `cron.daily` y entorno de ejecución de cron.
- `at` y `batch`: tareas puntuales.
- Timers de systemd: ventajas, `OnCalendar`, unidades `.timer`.
- `anacron` y tareas en equipos que no están siempre encendidos.

## Requisitos previos

Módulos 03–07.
