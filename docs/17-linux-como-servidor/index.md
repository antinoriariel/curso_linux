---
title: "Módulo 17 — Linux como servidor"
sidebar_label: "17 · Linux como servidor"
description: Servidores web Nginx y Apache, HTTPS con certbot, bases de datos, NFS y Samba, DNS, DHCP, correo y proxy inverso.
---

# Módulo 17 — Linux como servidor

Aquí se junta todo: **desplegar servicios reales sobre Linux**. Servidor web
con HTTPS, base de datos, compartición de archivos, DNS y proxy inverso —
los servicios que sostienen prácticamente todo Internet.

## Objetivos

- Desplegar y asegurar un servidor web con Nginx o Apache y HTTPS.
- Instalar y administrar bases de datos (MariaDB/PostgreSQL) a nivel sysadmin.
- Compartir archivos con NFS y Samba.
- Montar servicios de infraestructura: DNS, DHCP, proxy inverso.

## Capítulos

### 17.1 — Fundamentos de un servidor

- Diferencias servidor vs. escritorio; instalación mínima.
- Acceso remoto seguro (SSH revisitado) y usuarios de servicio.
- Checklist de puesta en producción: firewall, actualizaciones, backups,
  monitorización (integra módulos 11, 14 y 15).

### 17.2 — Servidor web: Nginx

- Arquitectura de Nginx; instalación y estructura de configuración.
- Bloques `server`, `location`, sitios virtuales.
- Servir contenido estático; compresión y caché.
- Logs de acceso y error: formato y análisis.

### 17.3 — Servidor web: Apache

- Cuándo Apache: `.htaccess`, módulos, hosting compartido.
- VirtualHosts, `a2ensite`/`a2enmod`.
- MPMs y ajuste básico de rendimiento.

### 17.4 — HTTPS en producción

- Certificados con **Let's Encrypt** y `certbot`; renovación automática.
- Configuración TLS moderna: protocolos, cifrados, HSTS.
- Redirección HTTP→HTTPS y pruebas de calidad (SSL Labs).

### 17.5 — Proxy inverso y aplicaciones

- Nginx como proxy inverso: `proxy_pass`, cabeceras, WebSockets.
- Desplegar una aplicación (Node/Python) detrás del proxy con systemd.
- Balanceo de carga básico: upstreams.
- Alternativas modernas: Caddy, HAProxy, Traefik.

### 17.6 — Bases de datos para administradores

- **MariaDB/MySQL**: instalación, `mysql_secure_installation`, usuarios y
  permisos, copias con `mysqldump`.
- **PostgreSQL**: roles, `pg_hba.conf`, `pg_dump`/`pg_restore`.
- **SQLite** y **Redis**: cuándo encajan.
- Copias de seguridad y restauración: la prueba que casi nadie hace.

### 17.7 — Compartición de archivos

- **NFS**: exportaciones, opciones, montaje en clientes y autofs.
- **Samba**: compartir con Windows, usuarios y permisos.
- Comparativa y casos de uso (incluye `sshfs` y rsync del módulo 11).

### 17.8 — DNS y DHCP propios

- Servidor DNS con **BIND9** o **dnsmasq**: zonas, registros, caché.
- DHCP: rangos, reservas por MAC, opciones.
- Escenario completo: red doméstica/laboratorio autogestionada.
- Filtrado DNS: Pi-hole como caso práctico.

### 17.9 — Correo electrónico (nociones)

- Por qué el correo es difícil: reputación, SPF, DKIM, DMARC.
- Arquitectura: MTA (Postfix), MDA (Dovecot), del envío a la bandeja.
- Caso práctico realista: relay de envío para notificaciones del servidor.

## Requisitos previos

Módulos 09, 11, 12 y 14.
