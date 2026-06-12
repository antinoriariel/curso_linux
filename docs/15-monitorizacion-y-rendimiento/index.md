---
title: "Módulo 15 — Monitorización y rendimiento"
sidebar_label: "15 · Rendimiento"
description: Metodología de análisis de rendimiento; CPU, memoria, disco y red; strace, perf, lsof; logs y observabilidad con Prometheus y Grafana.
---

# Módulo 15 — Monitorización y rendimiento

"El servidor va lento" es el ticket más común del mundo. Este módulo da una
**metodología sistemática para encontrar cuellos de botella** y las
herramientas para observar CPU, memoria, disco y red — de `vmstat` a
Prometheus.

## Objetivos

- Aplicar una metodología de análisis (USE) en vez de probar comandos al azar.
- Diagnosticar problemas de CPU, memoria, E/S y red.
- Trazar procesos con `strace` y perfilar con `perf`.
- Montar monitorización continua con Prometheus y Grafana.

## Capítulos

### 15.1 — Metodología de análisis

- El método **USE**: utilización, saturación, errores por recurso.
- Carga media (*load average*): qué significa de verdad.
- Las primeras herramientas en los primeros 60 segundos:
  `uptime`, `dmesg -T | tail`, `vmstat 1`, `top`.

### 15.2 — CPU

- `top`/`htop` en profundidad: %us, %sy, %wa, %st.
- `mpstat`, `pidstat`: por núcleo y por proceso.
- Procesos en estado D (E/S ininterrumpible) y *run queue*.
- Frecuencias y gobernadores de CPU (`cpupower`).

### 15.3 — Memoria

- Cómo usa Linux la RAM: caché de páginas y el mito de la "memoria llena"
  (`free -h` bien leído).
- `vmstat`, `smem`, `/proc/meminfo`.
- Swap: cuándo es problema y cuándo no; `swappiness` en la práctica.
- OOM killer: por qué mató a tu proceso y cómo influir en él.

### 15.4 — Disco y E/S

- `iostat -x`: utilización, latencia (await) y colas.
- `iotop`: quién está escribiendo.
- Latencia vs. ancho de banda; pruebas con `fio` (y por qué `dd` engaña).
- Schedulers de E/S.

### 15.5 — Red (rendimiento)

- `ss`, `nstat`, `ethtool`: errores y descartes.
- `iftop`, `nethogs`: consumo por conexión y proceso.
- `iperf3` para líneas base; retransmisiones y pérdidas.

### 15.6 — Trazado y perfilado de procesos

- `strace`: llamadas al sistema (`-c`, `-f`, `-e trace=`), su coste.
- `ltrace`: llamadas a bibliotecas.
- `lsof`: archivos y sockets abiertos; recuperar archivos borrados abiertos.
- `perf`: `perf top`, `perf record/report`, *flame graphs*.
- eBPF y `bpftrace`: la nueva generación de observabilidad (introducción).

### 15.7 — Recolección histórica

- `sar`/`sysstat`: el histórico que te salva en el análisis post-mortem.
- `atop` con registro continuo.
- Recopilación con `collectl`/`dstat`.

### 15.8 — Gestión de logs

- Repaso de journald y rsyslog; severidades y *facilities*.
- `logrotate`: que los logs no llenen el disco.
- Centralización de logs: conceptos y opciones (syslog remoto, Loki).

### 15.9 — Observabilidad moderna

- Métricas, logs y trazas: los tres pilares.
- **Prometheus** + node_exporter: instalación y consultas PromQL básicas.
- **Grafana**: paneles y alertas.
- Alternativas: Zabbix, Netdata, Nagios — cuándo elegir cada una.

## Requisitos previos

Módulos 09, 11 y 12.
