---
title: "Módulo 16 — Virtualización y contenedores"
sidebar_label: "16 · Contenedores"
description: KVM/QEMU y libvirt, LXC, Docker y Podman a fondo, imágenes, redes y volúmenes, Compose e introducción a Kubernetes.
---

# Módulo 16 — Virtualización y contenedores

Linux es la plataforma donde nació la revolución de los contenedores. Este
módulo cubre **desde la virtualización clásica con KVM hasta Docker/Podman y
una introducción honesta a Kubernetes**.

## Objetivos

- Crear y administrar máquinas virtuales con KVM/QEMU y libvirt.
- Entender qué es realmente un contenedor (namespaces + cgroups).
- Dominar el flujo de trabajo con Docker/Podman: imágenes, redes, volúmenes.
- Orquestar servicios con Compose y conocer las bases de Kubernetes.

## Capítulos

### 16.1 — Virtualización: conceptos

- Hipervisores tipo 1 y 2; virtualización asistida por hardware (VT-x/AMD-V).
- VMs vs. contenedores: qué aísla cada uno y a qué coste.
- Casos de uso de cada tecnología.

### 16.2 — KVM, QEMU y libvirt

- La pila: KVM (kernel) + QEMU (emulación) + libvirt (gestión).
- `virt-manager` y `virsh`: crear, clonar, instantáneas.
- Redes virtuales (NAT, bridge) y almacenamiento de VMs.
- VirtIO y paravirtualización; `cloud-init` para plantillas.

### 16.3 — Qué es un contenedor por dentro

- **Namespaces**: PID, red, montaje, usuario...
- **cgroups**: límites de CPU y memoria.
- Imágenes por capas y sistemas de archivos de unión (overlayfs).
- LXC/LXD: contenedores de sistema.

### 16.4 — Docker / Podman: primeros pasos

- Instalación; Docker vs. Podman (daemon vs. sin demonio, rootless).
- `run`, `ps`, `logs`, `exec`, `stop`, `rm`: ciclo de vida.
- Imágenes: `pull`, `images`, registros (Docker Hub) y etiquetas.

### 16.5 — Construir imágenes

- Dockerfile/Containerfile: instrucciones (`FROM`, `RUN`, `COPY`, `CMD`,
  `ENTRYPOINT`, `EXPOSE`, `ENV`).
- Buenas prácticas: capas, caché, imágenes mínimas (Alpine, distroless),
  *multi-stage builds*.
- Publicar en un registro; escaneo de vulnerabilidades de imágenes.

### 16.6 — Redes y almacenamiento de contenedores

- Redes: bridge, host, none; publicar puertos (`-p`).
- Comunicación entre contenedores y DNS interno.
- Volúmenes vs. *bind mounts*; persistencia de datos.

### 16.7 — Docker Compose / podman-compose

- `compose.yaml`: servicios, redes, volúmenes, variables.
- Aplicación multi-contenedor completa (web + base de datos).
- Perfiles, dependencias y healthchecks.

### 16.8 — Contenedores en producción (sin orquestador)

- Contenedores como servicios systemd (Podman + Quadlet).
- Actualizaciones, etiquetado de versiones y rollback.
- Límites de recursos y reinicio automático.
- Seguridad: rootless, usuarios no-root dentro de la imagen, secretos.

### 16.9 — Introducción a Kubernetes

- Qué problema resuelve (y cuándo es matar moscas a cañonazos).
- Arquitectura: nodos, pods, deployments, services.
- Laboratorio local: `minikube`/`kind`/`k3s`; `kubectl` básico.
- Hacia dónde seguir: el ecosistema cloud-native.

## Requisitos previos

Módulos 09, 11 y 12.
