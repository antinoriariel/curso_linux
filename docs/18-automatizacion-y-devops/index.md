---
title: "Módulo 18 — Automatización y DevOps"
sidebar_label: "18 · Automatización y DevOps"
description: Git a fondo, Ansible, infraestructura como código, CI/CD, estrategias de backup y la cultura DevOps desde Linux.
---

# Módulo 18 — Automatización y DevOps

Un buen administrador automatiza todo lo que hace dos veces. Este módulo
lleva el scripting del módulo 10 al siguiente nivel: **control de versiones,
gestión de configuración con Ansible, CI/CD y backups serios**.

## Objetivos

- Versionar configuración y scripts con Git con fluidez.
- Automatizar la administración de múltiples máquinas con Ansible.
- Entender los pipelines CI/CD y construir uno básico.
- Diseñar e implantar una estrategia de copias de seguridad real.

## Capítulos

### 18.1 — Git esencial para administradores

- `init`, `add`, `commit`, `status`, `log`, `diff`.
- Ramas y fusiones; resolución de conflictos.
- Remotos: `clone`, `push`, `pull`; GitHub/GitLab/Gitea.
- `.gitignore`, etiquetas y versionado de archivos de configuración
  (dotfiles, `/etc` con etckeeper).

### 18.2 — Git intermedio

- `rebase` vs. `merge`; reescritura de historia con criterio.
- `stash`, `cherry-pick`, `bisect` (depurar con git).
- Flujos de trabajo: trunk-based, git-flow, pull requests.
- Firmar commits (enlaza con GPG del módulo 14).

### 18.3 — Ansible: fundamentos

- Por qué gestión de configuración: idempotencia y estado deseado.
- Arquitectura sin agentes: SSH + Python.
- Inventarios, módulos y comandos *ad-hoc*.
- Playbooks: YAML, tareas, handlers, variables.

### 18.4 — Ansible: nivel práctico

- Plantillas Jinja2 y archivos de configuración dinámicos.
- Roles: estructura reutilizable; Ansible Galaxy.
- Secretos con `ansible-vault`.
- Proyecto: aprovisionar desde cero el servidor web del módulo 17.

### 18.5 — Infraestructura como código

- Conceptos: declarativo vs. imperativo, *drift*, reproducibilidad.
- Panorama: Terraform/OpenTofu, cloud-init, Packer.
- Caso práctico: levantar la VM de laboratorio de forma reproducible.

### 18.6 — CI/CD

- Integración y despliegue continuos: conceptos y beneficios.
- **GitHub Actions** / **GitLab CI**: anatomía de un pipeline.
- Pipeline real: lint (ShellCheck) + pruebas + despliegue de este propio
  sitio de documentación.
- Runners autoalojados sobre Linux.

### 18.7 — Copias de seguridad en serio

- Estrategia 3-2-1; RPO y RTO en lenguaje llano.
- Herramientas: `rsync` + instantáneas, **restic**, **borgbackup**,
  `rsnapshot`.
- Backups cifrados a almacenamiento remoto/cloud.
- Lo más importante: **probar la restauración** (simulacro guiado).

### 18.8 — El ecosistema DevOps desde Linux

- Cultura DevOps/SRE: qué significa en el día a día.
- Mapa de herramientas y cómo encaja lo aprendido en el curso.
- Linux en la nube: AWS/GCP/Azure a vista de pájaro; imágenes cloud.

## Requisitos previos

Módulos 10, 11, 16 y 17.
