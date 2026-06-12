---
title: "Módulo 11 — Redes en Linux"
sidebar_label: "11 · Redes"
description: TCP/IP aplicado, iproute2, DNS, NetworkManager, SSH a fondo, transferencias, diagnóstico y firewalls.
---

# Módulo 11 — Redes en Linux

De la teoría TCP/IP imprescindible al manejo real: **configurar interfaces,
diagnosticar problemas, asegurar conexiones con SSH y levantar un
firewall**. Es el módulo que conecta tu máquina con el resto del curso
(servidores, contenedores, automatización).

## Objetivos

- Entender el modelo TCP/IP y el direccionamiento IP/CIDR.
- Configurar y diagnosticar la red con la suite `iproute2`.
- Dominar SSH: claves, túneles, configuración de cliente y servidor.
- Administrar firewalls con `nftables`, `ufw` y `firewalld`.

## Capítulos

### 11.1 — Fundamentos de redes para Linux

- Modelo TCP/IP: capas, puertos, TCP vs. UDP.
- Direcciones IP, máscaras y notación CIDR; subredes.
- IPv4 vs. IPv6: lo esencial.
- MAC, ARP/NDP, puerta de enlace y rutas.

### 11.2 — Configuración con iproute2

- `ip addr`, `ip link`, `ip route`, `ip neigh` (adiós a `ifconfig`).
- `ss`: sockets y puertos abiertos (sustituto de `netstat`).
- Configuración persistente: **NetworkManager** (`nmcli`, `nmtui`),
  `systemd-networkd` y Netplan.
- Nombres de interfaces predecibles; Wi-Fi desde terminal.

### 11.3 — Resolución de nombres: DNS

- Cómo se resuelve un nombre: `/etc/hosts`, `/etc/resolv.conf`,
  `systemd-resolved`, `nsswitch.conf`.
- Herramientas: `dig` (a fondo), `host`, `nslookup`, `resolvectl`.
- Tipos de registro: A, AAAA, CNAME, MX, TXT, NS, SOA, PTR.

### 11.4 — Diagnóstico de red

- `ping`, `traceroute`/`tracepath`, `mtr`.
- ¿Dónde está el fallo? Metodología por capas.
- Captura de tráfico: `tcpdump` esencial y nociones de **Wireshark**.
- `nmap`: escaneo de puertos (en redes propias) y `nc` (netcat) como navaja
  suiza; `iperf3` para medir ancho de banda.

### 11.5 — SSH a fondo

- Cliente: `ssh`, `~/.ssh/config`, *known hosts*.
- Autenticación con claves: `ssh-keygen`, `ssh-copy-id`, `ssh-agent`.
- Servidor: `sshd_config` y endurecimiento (sin root, sin contraseñas).
- Túneles: local (`-L`), remoto (`-R`), dinámico/SOCKS (`-D`); saltos
  (`ProxyJump`).
- `sftp` y montaje remoto con `sshfs`.

### 11.6 — Transferencia de archivos y descargas

- `scp` y sus límites; `rsync` a fondo: sincronización, `--delete`,
  compresión, reanudación.
- `curl` y `wget`: descargas, APIs HTTP, cabeceras, autenticación.

### 11.7 — Firewalls

- Netfilter: la base en el kernel; viaje de un paquete.
- **nftables**: tablas, cadenas, reglas (sucesor de `iptables`).
- `iptables`: lectura de reglas heredadas.
- Frontends: **ufw** (Debian/Ubuntu) y **firewalld** (RHEL/Fedora) con zonas.
- NAT y reenvío de puertos.

### 11.8 — Servicios de red del sistema

- `systemd-resolved` y `systemd-networkd` en servidores.
- Sincronización horaria: `chrony`, `systemd-timesyncd`, NTP.
- VPNs: **WireGuard** básico y nociones de OpenVPN.

## Requisitos previos

Módulos 03–10.
