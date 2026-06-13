---
title: "Módulo 14 — Seguridad y hardening"
sidebar_label: "14 · Seguridad"
description: Modelo de seguridad de Linux, hardening sistemático, SELinux y AppArmor, auditd, fail2ban, criptografía GPG/TLS y detección de intrusiones.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Módulo 14 — Seguridad y hardening

## Introducción

La seguridad no es un estado que se alcanza: es un proceso continuo de reducción de riesgos. Un sistema recién instalado con la configuración por defecto expone más superficie de ataque de la necesaria —servicios activos que nadie usa, permisos permisivos por compatibilidad, parámetros del kernel sin endurecer.

Este módulo enseña a **pensar en seguridad como un administrador**, no como alguien que instala herramientas esperando que lo protejan. La diferencia es el modelo mental: entender qué atacante existe, qué vector usa, cómo reducir su impacto.

Las bases están en módulos anteriores: [permisos DAC](/usuarios-grupos-y-permisos) en el Módulo 07, [SSH y firewalls](/redes-en-linux) en el Módulo 11, [LUKS](/almacenamiento-avanzado) en el Módulo 12, [sysctl de seguridad](/arranque-kernel-y-hardware) en el Módulo 13. Aquí añadimos las capas MAC, auditoría, criptografía y detección de intrusiones.

### Objetivos de aprendizaje

Al finalizar este módulo, serás capaz de:

- ✅ Aplicar una metodología sistemática de hardening sobre un servidor real
- ✅ Gestionar Linux Capabilities como alternativa granular a SUID/sudo
- ✅ Entender y operar SELinux: contextos, políticas, booleans, diagnóstico
- ✅ Crear y ajustar perfiles AppArmor para confinamiento de servicios
- ✅ Configurar `auditd` con reglas para detectar accesos y cambios críticos
- ✅ Desplegar `fail2ban` con jaulas personalizadas contra ataques de fuerza bruta
- ✅ Cifrar, firmar y verificar datos con GPG
- ✅ Inspeccionar y generar certificados TLS con `openssl`
- ✅ Verificar la integridad del sistema con AIDE y detectar rootkits con `rkhunter`

---

## 14.1 — El modelo de seguridad de Linux

### Superficie de ataque y principio de mínimo privilegio

```
Superficie de ataque = todo lo que un atacante puede tocar para comprometer el sistema

  Servicios en red         → puertos abiertos, protocolos, versiones de software
  Código ejecutable        → setuid binaries, scripts world-writable
  Cuentas de usuario       → contraseñas débiles, cuentas inactivas, sudo excesivo
  Acceso físico            → consola sin contraseña, unidades sin cifrar (módulo 12)
  Software instalado       → paquetes sin actualizar, dependencias con CVEs
  Configuración del kernel → módulos cargados, parámetros permisivos (módulo 13)

Principio de mínimo privilegio (PoLP):
  "Cada componente debe tener exactamente los privilegios necesarios
   para su función, y ninguno más"
  
  → Un servidor web no necesita leer /etc/shadow
  → Un script de backup no necesita poder escribir en /bin
  → Un usuario de aplicación no necesita ser root ni estar en sudoers
```

### DAC vs MAC

```
DAC (Discretionary Access Control) — El modelo clásico de UNIX/Linux:
  • Los permisos los define el PROPIETARIO del recurso
  • chmod, chown (módulo 07)
  • Si root ejecuta un proceso malicioso → acceso total al sistema
  • Si un servicio se compromete con uid=1000 → acceso a todos sus archivos

MAC (Mandatory Access Control) — Seguridad adicional obligatoria:
  • Los permisos los define una POLÍTICA del sistema, no el propietario
  • El propietario no puede relajar las restricciones de la política
  • Incluso root está sujeto a las reglas de MAC (en enforcing mode)
  • Implementations: SELinux (RHEL), AppArmor (Ubuntu/Debian)
  
  Ejemplo: Apache comprometido con SELinux activo
  → Apache tiene el tipo httpd_t
  → La política solo permite a httpd_t leer /var/www, no /etc/shadow
  → Aunque el atacante ejecute código como root dentro de Apache:
    SELinux deniega el acceso → contenido del ataque limitado
```

### Linux Capabilities

Las capabilities dividen los privilegios de root en unidades granulares que se pueden asignar a procesos o binarios individuales sin darles acceso total de root.

```bash
# Ver capabilities actuales del proceso
cat /proc/$$/status | grep Cap
capsh --decode=0000000000000000   # Decodificar máscara

# Listar capabilities de un binario
getcap /usr/bin/ping
# /usr/bin/ping cap_net_raw=ep
# ep = efectivas + permitidas
# i = inheritable, p = permitidas, e = efectivas, a = ambient

# Principales capabilities (man 7 capabilities):
# CAP_NET_BIND_SERVICE  → bind en puertos < 1024 sin ser root
# CAP_NET_RAW           → sockets raw (ping, tcpdump)
# CAP_NET_ADMIN         → configurar interfaces, rutas, iptables
# CAP_SYS_ADMIN         → montaje, cambio de namespace... (muy amplia, evitar)
# CAP_CHOWN             → cambiar propietario de archivos
# CAP_SETUID / SETGID   → cambiar UID/GID del proceso
# CAP_DAC_OVERRIDE      → ignorar los permisos DAC (peligrosa)
# CAP_KILL              → enviar señales a cualquier proceso
# CAP_SYS_PTRACE        → usar ptrace (debugger) en cualquier proceso
# CAP_AUDIT_WRITE       → escribir en el log de auditoría

# Asignar capabilities a un binario (en lugar de setuid root)
sudo setcap cap_net_bind_service=+ep /usr/local/bin/mi-servidor
# Ahora mi-servidor puede escuchar en el puerto 80 sin ser root ni setuid

# Eliminar todas las capabilities de un binario
sudo setcap -r /usr/local/bin/mi-servidor

# Ver todos los binarios con capabilities asignadas
sudo getcap -r / 2>/dev/null
# o en los directorios típicos:
sudo getcap -r /usr/bin /usr/sbin /usr/local/bin 2>/dev/null
```

### CVEs y actualizaciones de seguridad

```bash
# Ver vulnerabilidades conocidas pendientes de parche
sudo apt list --upgradable 2>/dev/null | grep security

# Información de seguridad de paquetes instalados
sudo apt-cache policy openssh-server | grep Installed
sudo dpkg -l openssh-server | grep '^ii'

# Ubuntu Security Notices: https://ubuntu.com/security/notices
# RHEL CVE database: https://access.redhat.com/security/cve/

# unattended-upgrades: aplicar automáticamente parches de seguridad (módulo 08)
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades

# Verificar si hay reboot pendiente tras un kernel de seguridad
ls /var/run/reboot-required 2>/dev/null && cat /var/run/reboot-required.pkgs
```

---

## 14.2 — Hardening básico del sistema

### Checklist de hardening inicial

```bash
# ── 1. SERVICIOS Y PUERTOS ─────────────────────────────────────────────
# Ver qué servicios están activos y escuchando (módulo 09 + 11)
sudo systemctl list-units --type=service --state=running
sudo ss -tlnp                            # Puertos TCP en escucha
sudo ss -ulnp                            # Puertos UDP en escucha

# Deshabilitar servicios innecesarios
sudo systemctl disable --now avahi-daemon     # Descubrimiento de red (innecesario en servidor)
sudo systemctl disable --now cups             # Impresoras
sudo systemctl disable --now bluetooth        # Bluetooth (si no se usa)
sudo systemctl disable --now ModemManager     # Módems

# ── 2. ACTUALIZACIONES ─────────────────────────────────────────────────
sudo apt update && sudo apt upgrade -y
# (Ver módulo 08 para unattended-upgrades)

# ── 3. CUENTAS DE USUARIO ─────────────────────────────────────────────
# Ver cuentas con UID 0 (solo debe ser root)
awk -F: '$3==0 {print}' /etc/passwd

# Ver cuentas con shell válida que no son usuarios reales
awk -F: '$7 !~ /false|nologin/ && $1 !~ /^root$/ {print $1, $7}' /etc/passwd

# Bloquear cuentas de sistema que no deben iniciar sesión
sudo usermod -s /usr/sbin/nologin usuario-servicio

# Forzar expiración de contraseñas (módulo 07)
sudo chage -M 90 usuario    # Expirar cada 90 días
sudo chage -l usuario       # Ver política actual

# ── 4. SUDO ────────────────────────────────────────────────────────────
# Ver quién tiene sudo (módulo 07)
grep -v '^#' /etc/sudoers /etc/sudoers.d/* 2>/dev/null | grep -v '^$'
getent group sudo            # Miembros del grupo sudo

# ── 5. BINARIOS SUID/SGID ─────────────────────────────────────────────
# Inventariar todos los binarios SUID y SGID
sudo find / -perm /4000 -type f 2>/dev/null | sort    # SUID
sudo find / -perm /2000 -type f 2>/dev/null | sort    # SGID
# Comparar con una línea base y quitar bits innecesarios:
sudo chmod u-s /usr/bin/programa-innecesario

# ── 6. ARCHIVOS WORLD-WRITABLE ────────────────────────────────────────
sudo find / -writable -not -path "/proc/*" -not -path "/sys/*" \
    -not -path "/tmp/*" -not -path "/dev/*" -type f 2>/dev/null

# ── 7. FIREWALL ─────────────────────────────────────────────────────
# (Ver módulo 11 para ufw/nftables en detalle)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw enable
sudo ufw status verbose
```

### Endurecer SSH (profundización del Módulo 11)

```bash
sudo nano /etc/ssh/sshd_config

# Configuración de alta seguridad para sshd_config:
Port 2222                          # Cambiar puerto (reduce ruido en logs, no es seguridad real)
AddressFamily inet                 # Solo IPv4 (o inet6 para solo IPv6)

PermitRootLogin no                 # Nunca permitir login directo como root
PasswordAuthentication no          # Solo claves públicas (módulo 11)
PubkeyAuthentication yes
AuthenticationMethods publickey    # Solo claves, sin password fallback

MaxAuthTries 3                     # Máximo 3 intentos por conexión
MaxSessions 5                      # Máximo 5 sesiones simultáneas por usuario
LoginGraceTime 30                  # Segundos para autenticar (luego desconectar)

AllowUsers deployer admin          # Lista blanca de usuarios que pueden conectar
# AllowGroups sshusers             # Alternativa: por grupo

PermitEmptyPasswords no
X11Forwarding no                   # Deshabilitar si no se usa (módulo 11)
AllowAgentForwarding no            # Deshabilitar si no se necesita
AllowTcpForwarding no              # Deshabilitar si no se necesita
PermitUserEnvironment no           # No cargar variables de entorno del usuario

Banner /etc/ssh/banner             # Mostrar aviso legal antes del login
PrintLastLog yes                   # Mostrar última sesión al entrar

# Algoritmos modernos (deshabilitar los débiles)
KexAlgorithms curve25519-sha256,diffie-hellman-group16-sha512
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
HostKeyAlgorithms ssh-ed25519,rsa-sha2-512

# Desconectar sesiones inactivas
ClientAliveInterval 300            # Ping al cliente cada 5 minutos
ClientAliveCountMax 2              # Si no responde 2 veces → desconectar

sudo sshd -t                       # Verificar sintaxis ANTES de reiniciar
sudo systemctl restart sshd
```

### Particiones con opciones de montaje seguras

```bash
# Reforzar la seguridad con opciones en /etc/fstab (módulo 12):
# noexec   → no ejecutar binarios (impide ejecución de malware en esa partición)
# nosuid   → ignorar bits SUID/SGID (impide escalada de privilegios via SUID)
# nodev    → no interpretar ficheros de dispositivo

# Ejemplo de fstab endurecido:
# /tmp: separado, noexec, nosuid
tmpfs /tmp tmpfs defaults,noexec,nosuid,nodev,size=2G 0 0

# /var: nosuid y nodev (la ejecución sí puede ser necesaria)
UUID=xxx /var ext4 defaults,nosuid,nodev 0 2

# /home: sin ejecución de binarios de los usuarios
UUID=yyy /home ext4 defaults,noexec,nosuid,nodev 0 2

# CUIDADO: noexec en /tmp puede romper algunas aplicaciones que
# descomprimen y ejecutan desde /tmp. Verificar antes de aplicar.
```

### Política de contraseñas y bloqueo de cuentas

```bash
# Política de contraseñas con PAM (módulo 07)
sudo apt install libpam-pwquality

# /etc/security/pwquality.conf:
# minlen = 12             → mínimo 12 caracteres
# dcredit = -1            → al menos 1 dígito
# ucredit = -1            → al menos 1 mayúscula
# lcredit = -1            → al menos 1 minúscula
# ocredit = -1            → al menos 1 carácter especial
# difok = 5               → al menos 5 caracteres diferentes al anterior
# maxrepeat = 3           → máximo 3 caracteres iguales consecutivos

# Bloquear cuentas tras intentos fallidos (PAM faillock)
# /etc/security/faillock.conf:
# deny = 5                → bloquear tras 5 intentos fallidos
# unlock_time = 900       → desbloquear después de 15 minutos
# fail_interval = 900     → ventana de tiempo para contar intentos

# Ver cuentas bloqueadas
sudo faillock                      # Todas las cuentas
sudo faillock --user juan          # Usuario específico

# Desbloquear manualmente
sudo faillock --user juan --reset
```

### Auditoría con `lynis`

```bash
# lynis: auditoría de seguridad automatizada
sudo apt install lynis

sudo lynis audit system            # Auditoría completa (tarda varios minutos)
# Produce un informe con:
# - Puntuación de endurecimiento (Hardening index: 0-100)
# - Sugerencias ordenadas por importancia
# - Warnings críticos

sudo lynis audit system --quick    # Más rápido, sin pausa entre pruebas
sudo lynis show warnings           # Solo los warnings
sudo lynis show suggestions        # Solo las sugerencias

# El informe completo en /var/log/lynis.log
# El resumen en /var/log/lynis-report.dat
```

---

## 14.3 — SELinux

SELinux (Security-Enhanced Linux) es el sistema MAC implementado por la NSA y adoptado por Red Hat. Es el estándar en RHEL, Rocky Linux, AlmaLinux, Fedora y CentOS Stream.

```
Conceptos fundamentales de SELinux:

Contexto de seguridad: usuario_SELinux:rol:tipo:nivel
  Ejemplo: system_u:object_r:httpd_exec_t:s0
  
  • Usuario SELinux (≠ usuario Unix): system_u, user_u, unconfined_u
  • Rol: object_r (archivos), system_r (procesos del sistema)
  • Tipo: el componente más importante (Type Enforcement)
           → httpd_t: procesos Apache
           → httpd_sys_content_t: archivos que Apache puede leer
           → shadow_t: /etc/shadow (solo shadow_t puede leerlo)
  • Nivel MLS/MCS: s0 (la mayoría de sistemas no usan MLS real)

Type Enforcement (TE): la regla fundamental
  "El proceso con tipo A SOLO puede acceder a objetos con tipo B
   si la política lo permite explícitamente"
  
  Si httpd_t intenta leer un archivo de tipo shadow_t:
  → La política NO lo permite → SELinux deniega → log en /var/log/audit/audit.log
  
Booleans: interruptores para activar/desactivar grupos de reglas
  Ejemplo: httpd_can_network_connect → ¿puede Apache hacer conexiones TCP salientes?
```

### Modos de SELinux

```bash
# Ver el modo actual
getenforce                         # Enforcing / Permissive / Disabled
sestatus                           # Información completa: modo, política, estado

# Cambiar modo EN CALIENTE (se pierde al reiniciar)
sudo setenforce 1                  # Enforcing: negar y logear
sudo setenforce 0                  # Permissive: solo logear (no denegar)

# Cambiar modo PERMANENTE
# /etc/selinux/config (RHEL/Fedora):
# SELINUX=enforcing    → activo y bloqueando
# SELINUX=permissive   → activo pero sin bloquear (para diagnóstico)
# SELINUX=disabled     → completamente desactivado (requiere reinicio)
```

:::danger **Nunca desactivar SELinux como solución**
`setenforce 0` o `SELINUX=disabled` es la "solución rápida" que convierte una denegación de SELinux en una brecha de seguridad real. La denegación es una señal: hay que diagnosticar y corregir la política, no desactivar la protección. Ver §14.3.4 para el diagnóstico correcto.
:::

### Gestión de contextos

```bash
# Ver contextos de archivos
ls -Z /var/www/html/                # Contexto de archivos
ls -Z /etc/shadow                  # Debería mostrar shadow_t
ps -eZ | grep httpd                # Contexto de procesos

# Cambiar el contexto de un archivo (temporal, se pierde con restorecon)
sudo chcon -t httpd_sys_content_t /var/www/mis-datos/
sudo chcon -Rt httpd_sys_content_t /var/www/mis-datos/  # Recursivo

# Restaurar el contexto según la política (la forma correcta)
sudo restorecon /var/www/html/index.html     # Restaurar un archivo
sudo restorecon -Rv /var/www/                # Restaurar árbol completo (-v verbose)

# Definir el contexto por defecto para una ruta (permanente)
sudo semanage fcontext -a -t httpd_sys_content_t "/opt/miapp/www(/.*)?"
sudo restorecon -Rv /opt/miapp/www/          # Aplicar inmediatamente

# Ver las reglas de contexto para una ruta
semanage fcontext -l | grep "/var/www"

# Caso práctico: mover el DocumentRoot de Apache a /srv/web
# Sin SELinux: solo cambiar en httpd.conf y funciona
# Con SELinux: además hay que definir el contexto correcto
sudo semanage fcontext -a -t httpd_sys_content_t "/srv/web(/.*)?"
sudo restorecon -Rv /srv/web/
# Ahora Apache puede leer /srv/web
```

### Gestión de booleans

```bash
# Ver todos los booleans relacionados con un servicio
getsebool -a | grep httpd
semanage boolean -l | grep httpd

# Booleans comunes de Apache:
# httpd_can_network_connect      → ¿puede Apache conectar a puertos externos?
# httpd_can_network_connect_db   → ¿puede Apache conectar a bases de datos?
# httpd_enable_homedirs          → ¿puede servir desde home dirs?
# httpd_read_user_content        → ¿puede leer contenido de usuarios?
# httpd_execmem                  → ¿puede ejecutar código en memoria anónima?

# Activar un boolean
sudo setsebool httpd_can_network_connect on          # Temporal
sudo setsebool -P httpd_can_network_connect on       # Persistente (-P)
getsebool httpd_can_network_connect                  # Verificar

# Cambiar el puerto en el que escucha un servicio (SELinux bloquea puertos no listados)
semanage port -l | grep http                         # Puertos permitidos para httpd
sudo semanage port -a -t http_port_t -p tcp 8443    # Añadir el puerto 8443
```

### Diagnosticar denegaciones SELinux

```bash
# Las denegaciones se registran en /var/log/audit/audit.log
sudo cat /var/log/audit/audit.log | grep denied | tail -20

# ausearch: buscar en los logs de auditoría
sudo ausearch -m AVC -ts recent          # Denegaciones recientes
sudo ausearch -m AVC -c httpd            # Denegaciones del proceso httpd

# audit2why: explicar en lenguaje legible POR QUÉ se denegó
sudo ausearch -m AVC -ts recent | audit2why

# Ejemplo de salida de audit2why:
# type=AVC msg=audit(1704067200.123:456): avc: denied { read } for
#   pid=1234 comm="httpd" name="config.php" dev="sda3" stype=httpd_t
#   ttype=user_home_t tclass=file permissive=0
#
# Was caused by:
#   Missing type enforcement (TE) allow rule.
#   You can use audit2allow to generate a loadable module to allow this access.

# audit2allow: generar módulo de política para permitir la operación denegada
sudo ausearch -m AVC -ts recent | audit2allow -a  # Ver qué reglas propone
sudo ausearch -m AVC -ts recent | audit2allow -a -M mi-modulo  # Crear módulo
sudo semodule -i mi-modulo.pp          # Instalar el módulo

# ADVERTENCIA: audit2allow genera la regla mínima para que funcione,
# pero puede ser demasiado permisiva si el proceso tuvo acceso excesivo.
# Revisar siempre antes de instalar.

# sealert: análisis guiado (setroubleshoot)
sudo apt install setroubleshoot-server   # RHEL/Fedora
sudo sealert -a /var/log/audit/audit.log  # Análisis completo con sugerencias
```

---

## 14.4 — AppArmor

AppArmor es el sistema MAC de Ubuntu y Debian. A diferencia de SELinux, usa rutas de archivos en lugar de etiquetas, lo que lo hace más fácil de configurar pero menos robusto ante cambios de nombres.

```
Conceptos de AppArmor:

Perfil: archivo de texto que define lo que un programa PUEDE hacer
  Ubicación: /etc/apparmor.d/

Modos:
  enforce  → el perfil se aplica activamente (denegar + logear)
  complain → modo aprendizaje (solo logear, no denegar)
  disabled → sin restricciones

Cada línea del perfil: ruta y permisos
  /etc/passwd r,          → leer /etc/passwd
  /var/www/** rw,         → leer y escribir en /var/www/ y subdirectorios
  network inet stream,    → crear sockets TCP IPv4
  capability net_bind_service,  → capacidad específica
```

### Gestión básica de perfiles

```bash
sudo apt install apparmor apparmor-utils apparmor-profiles

# Ver el estado de todos los perfiles
sudo aa-status
# Muestra: perfiles cargados en enforce, en complain, procesos confinados

# Activar/desactivar perfiles
sudo aa-enforce /etc/apparmor.d/usr.sbin.nginx    # Poner en enforce
sudo aa-complain /etc/apparmor.d/usr.sbin.nginx   # Poner en complain (diagnóstico)
sudo aa-disable /etc/apparmor.d/usr.sbin.nginx    # Deshabilitar

# Recargar un perfil modificado
sudo apparmor_parser -r /etc/apparmor.d/usr.sbin.nginx

# Ver qué perfiles están disponibles (pero no cargados)
ls /etc/apparmor.d/

# Ver logs de denegaciones AppArmor
sudo dmesg | grep apparmor
sudo journalctl -k | grep apparmor
sudo cat /var/log/syslog | grep apparmor
```

### Crear un perfil AppArmor propio

```bash
# MÉTODO 1: aa-genprof — generación guiada (modo aprendizaje)
# 1. Iniciar el proceso de generación del perfil
sudo aa-genprof /usr/local/bin/mi-script
# 2. En otra terminal, ejecutar el programa normalmente para "enseñarle"
# 3. Volver a la terminal de aa-genprof y pulsar 's' para scanear
# 4. Responder a las preguntas de qué accesos permitir
# 5. Pulsar 'f' para finalizar → genera el perfil

# MÉTODO 2: Escribir el perfil manualmente
sudo tee /etc/apparmor.d/usr.local.bin.mi-app << 'EOF'
#include <tunables/global>

/usr/local/bin/mi-app {
  #include <abstractions/base>
  #include <abstractions/nameservice>

  # El propio binario
  /usr/local/bin/mi-app mr,

  # Archivos de configuración (solo lectura)
  /etc/mi-app/ r,
  /etc/mi-app/** r,

  # Directorio de datos (lectura/escritura)
  /var/lib/mi-app/ rw,
  /var/lib/mi-app/** rw,

  # Logs
  /var/log/mi-app.log rw,

  # Red
  network inet stream,

  # Denegación explícita
  deny /etc/shadow r,
  deny /proc/*/mem rw,
}
EOF

sudo apparmor_parser -r /etc/apparmor.d/usr.local.bin.mi-app
sudo aa-enforce /etc/apparmor.d/usr.local.bin.mi-app

# MÉTODO 3: aa-logprof — ajustar un perfil existente con logs reales
# (más práctico que aa-genprof para perfiles ya escritos)
sudo aa-logprof   # Lee /var/log/syslog y propone cambios al perfil
```

---

## 14.5 — Auditoría con auditd

`auditd` es el subsistema de auditoría del kernel Linux. Registra eventos a nivel del kernel —llamadas al sistema, accesos a archivos, cambios de autenticación— con más detalle que los logs del sistema convencionales.

```
Arquitectura del subsistema de auditoría:

  Espacio de kernel: reglas de auditoría
      │ cada evento que coincide con una regla
      ▼
  audit daemon (auditd): recibe eventos del kernel
      │
      ├→ /var/log/audit/audit.log    ← log principal
      └→ audisp (plugin): puede enviar a syslog, SIEM, etc.

  Herramientas de análisis:
  ausearch    → buscar en los logs
  aureport    → generar informes estadísticos
  auditctl    → gestionar reglas en caliente
  auditd.conf → configuración del demonio
  audit.rules → reglas persistentes
```

### Configuración básica

```bash
sudo apt install auditd audispd-plugins

sudo systemctl enable --now auditd

# Verificar que auditd está activo
sudo auditctl -s                   # Estado del subsistema
sudo auditctl -l                   # Reglas actuales

# /etc/audit/auditd.conf:
# log_file = /var/log/audit/audit.log
# max_log_file = 50              → tamaño máximo del log en MB
# num_logs = 10                  → número de rotaciones a mantener
# space_left = 75                → MB libres antes de avisar
# space_left_action = SYSLOG     → qué hacer cuando queda poco espacio
# admin_space_left_action = SUSPEND → suspender auditing si muy poco espacio
```

### Reglas de auditoría

```bash
# Las reglas se definen en /etc/audit/rules.d/*.rules
# Se aplican con: sudo augenrules --load  (o al reiniciar auditd)

# Sintaxis: auditctl -w ruta -p permisos -k etiqueta
# -w: watch (archivo o directorio)
# -p: permisos a auditar: r=read w=write x=execute a=attribute
# -k: clave/etiqueta para buscar en los logs

# Reglas esenciales para un servidor:
sudo tee /etc/audit/rules.d/50-servidor.rules << 'EOF'
# Borrar las reglas existentes al inicio
-D
# Tamaño del buffer del kernel para eventos
-b 8192
# Fallos: 2=kernel panic, 1=printk (no recomendado en prod: 2 puede colgar)
-f 1

# Acceso a archivos sensibles de autenticación
-w /etc/passwd -p wa -k auth-cambios
-w /etc/shadow -p wa -k auth-cambios
-w /etc/group -p wa -k auth-cambios
-w /etc/sudoers -p wa -k privilegios
-w /etc/sudoers.d/ -p wa -k privilegios

# Cambios de configuración del sistema
-w /etc/ssh/sshd_config -p wa -k ssh-config
-w /etc/hosts -p wa -k red
-w /etc/cron.d/ -p wa -k cron
-w /etc/crontab -p wa -k cron
-w /var/spool/cron/ -p wa -k cron

# Módulos del kernel (módulo 13)
-w /sbin/insmod -p x -k modulos
-w /sbin/rmmod -p x -k modulos
-w /sbin/modprobe -p x -k modulos
-a always,exit -F arch=b64 -S init_module,finit_module -k modulos

# Escalada de privilegios
-a always,exit -F arch=b64 -S setuid -k setuid
-a always,exit -F arch=b64 -S setgid -k setgid
-w /usr/bin/sudo -p x -k sudo-uso

# Acceso a archivos de hora (detectar manipulación)
-a always,exit -F arch=b64 -S adjtimex,settimeofday -k tiempo

# Comandos de red (módulo 11)
-w /sbin/iptables -p x -k firewall
-w /sbin/nft -p x -k firewall

# Procesos con ejecuciones desde directorios temporales (posible malware)
-a always,exit -F arch=b64 -S execve -F dir=/tmp -k exec-tmp
-a always,exit -F arch=b64 -S execve -F dir=/dev/shm -k exec-shm

# Hacer el conjunto de reglas inmutable (requiere reinicio para cambiar)
# -e 2
EOF

sudo augenrules --load             # Cargar las reglas
sudo auditctl -l                   # Verificar que se cargaron
```

### Consultar los logs de auditoría

```bash
# ausearch: búsqueda en /var/log/audit/audit.log
sudo ausearch -k auth-cambios                    # Por etiqueta
sudo ausearch -k auth-cambios -ts today          # Solo hoy
sudo ausearch -k privilegios -ts recent          # Últimos 10 minutos
sudo ausearch -m USER_AUTH -ts today             # Autenticaciones de hoy
sudo ausearch -ua juan -ts today                 # Actividad del usuario juan
sudo ausearch -p 1234                            # Actividad del proceso PID 1234

# Interpretar un evento típico:
# type=SYSCALL msg=audit(1704067200.123:456): arch=c000003e syscall=188
#   success=yes exit=0 a0=7f... items=1 ppid=1000 pid=1001 auid=1000 uid=0
#   gid=0 euid=0 ses=5 comm="chmod" exe="/usr/bin/chmod" key="auth-cambios"
# type=PATH msg=audit(same): item=0 name="/etc/passwd" inode=... dev=...
#   mode=0100644 ouid=0 ogid=0 rdev=00:00 nametype=NORMAL

# aureport: informes estadísticos
sudo aureport                                    # Resumen completo
sudo aureport -au                                # Resumen de autenticaciones
sudo aureport -x --summary                      # Comandos ejecutados (resumen)
sudo aureport --failed                          # Solo eventos fallidos
sudo aureport -k                                # Resumen por clave/etiqueta
```

---

## 14.6 — Protección frente a ataques de red

### `fail2ban` — Bloqueo de fuerza bruta

`fail2ban` monitoriza los logs del sistema y, cuando detecta patrones de ataque (múltiples intentos fallidos de autenticación), añade reglas al firewall para bloquear la IP atacante.

```bash
sudo apt install fail2ban

# fail2ban usa el concepto de "jaulas" (jails):
# Una jaula = un servicio monitorizad + una acción de bloqueo

# /etc/fail2ban/jail.conf → configuración global y jaulas por defecto
# /etc/fail2ban/jail.local → SIEMPRE personalizar en jail.local (no jail.conf)
# /etc/fail2ban/filter.d/ → filtros (expresiones regulares para detectar ataques)
# /etc/fail2ban/action.d/ → acciones (cómo bloquear: iptables, ufw, nftables...)
```

```bash
sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
# Tiempo de ban en segundos (3600=1h, 86400=24h)
bantime  = 3600
# Ventana de tiempo para contar intentos fallidos
findtime = 600
# Intentos fallidos antes de banear
maxretry = 5
# IP propias que nunca se banean
ignoreip = 127.0.0.1/8 ::1 192.168.1.0/24

# Backend de log (systemd en distribuciones modernas)
backend = systemd

# Acción de ban por defecto: iptables con IPv4+IPv6
banaction = iptables-multiport
banaction_allports = iptables-allports

[sshd]
enabled  = true
port     = ssh,2222              # Los puertos a bloquear (módulo 11)
logpath  = /var/log/auth.log
maxretry = 3
bantime  = 7200                  # 2 horas para SSH (más agresivo)

[nginx-http-auth]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/error.log
maxretry = 6

[nginx-limit-req]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/error.log
maxretry = 10
EOF

sudo systemctl enable --now fail2ban
```

```bash
# Gestión de fail2ban
sudo fail2ban-client status                      # Todas las jaulas activas
sudo fail2ban-client status sshd                 # Estado de la jaula sshd
# Muestra: Currently banned: N, Total banned: M, Banned IP list: ...

# Gestionar IPs baneadas
sudo fail2ban-client set sshd unbanip 192.168.1.50  # Desbanear una IP
sudo fail2ban-client set sshd banip 10.0.0.1        # Banear manualmente una IP

# Ver los logs de fail2ban
sudo journalctl -u fail2ban -n 50
sudo tail -f /var/log/fail2ban.log
```

### Limitación de tasa en el firewall

```bash
# ufw: limitar conexiones SSH a 6 por minuto (built-in)
sudo ufw limit ssh                       # Activa rate limiting automático

# nftables: limitación de tasa más granular (módulo 11)
# Añadir a la configuración nftables:
# chain input {
#   ...
#   tcp dport 22 ct state new limit rate 3/minute accept
#   tcp dport 22 ct state new drop
# }

# iptables equivalente:
sudo iptables -A INPUT -p tcp --dport 22 -m state --state NEW \
    -m recent --set --name SSH --rsource
sudo iptables -A INPUT -p tcp --dport 22 -m state --state NEW \
    -m recent --update --seconds 60 --hitcount 4 --name SSH --rsource -j DROP
```

### Escaneo defensivo del propio sistema

```bash
# Escanear los propios puertos con nmap (ver qué expone el sistema)
# Hacer siempre en el propio sistema o con autorización explícita (módulo 11)
sudo nmap -sS -O -p- localhost              # Escaneo completo TCP
sudo nmap -sU -p- --top-ports 100 localhost # UDP top 100 puertos

# Contrastar con ss:
sudo ss -tlnp                              # TCP en escucha
sudo ss -ulnp                              # UDP en escucha

# Ver conexiones establecidas y quién conecta
sudo ss -tnp state established             # Conexiones TCP activas

# Log de autenticaciones recientes
sudo last -n 30                            # Últimos 30 logins
sudo lastb -n 20                           # Últimos 20 intentos fallidos
sudo journalctl _SYSTEMD_UNIT=sshd.service -n 50  # Logs de SSH
```

---

## 14.7 — Criptografía práctica: GPG

GPG (GNU Privacy Guard) implementa el estándar OpenPGP para cifrado asimétrico, cifrado simétrico y firma digital. Sus usos prácticos: proteger archivos, firmar commits de git, verificar ISOs y paquetes, y gestionar contraseñas.

```
Criptografía asimétrica (clave pública/privada):

  Clave pública:  puede distribuirse libremente.
                  Sirve para CIFRAR (solo la clave privada puede descifrar)
                  y para VERIFICAR FIRMAS (hechas con la clave privada)

  Clave privada:  SECRETO ABSOLUTO. Protegida con passphrase.
                  Sirve para DESCIFRAR mensajes cifrados con tu clave pública
                  y para FIRMAR (demostrar que el mensaje es tuyo)

  Flujo de cifrado:
  Remitente cifra con la clave PÚBLICA del destinatario
  → Solo el destinatario (con su clave PRIVADA) puede descifrar

  Flujo de firma:
  Firmante firma con su clave PRIVADA
  → Cualquiera con la clave PÚBLICA puede verificar la firma
```

```bash
# Generar un par de claves (ed25519 + Curve25519: modernas y seguras)
gpg --full-gen-key
# Tipo: (9) ECC and ECC
# Curva: (1) Curve 25519
# Expiración: 1y (renovar anualmente)
# Nombre y email: los del usuario real

# Ver las claves en el keyring
gpg --list-keys                            # Claves públicas
gpg --list-secret-keys                     # Claves privadas (local)

# Exportar clave pública (para compartir)
gpg --armor --export tu@email.com > mi-clave-publica.asc
gpg --armor --export tu@email.com | xclip  # Al portapapeles

# Publicar en servidor de claves
gpg --keyserver keys.openpgp.org --send-keys FINGERPRINT

# Importar clave pública de otro usuario
gpg --import clave-de-alguien.asc
gpg --keyserver keys.openpgp.org --recv-keys FINGERPRINT

# Verificar y firmar la clave importada (web of trust)
gpg --fingerprint clave@email.com          # Verificar fingerprint (por teléfono/en persona)
gpg --sign-key clave@email.com             # Firmar la clave (confiar en ella)
```

```bash
# CIFRAR un archivo para un destinatario
gpg --encrypt --recipient destinatario@email.com archivo.txt
# Crea: archivo.txt.gpg

# CIFRAR para múltiples destinatarios
gpg -e -r uno@email.com -r dos@email.com archivo.txt

# DESCIFRAR
gpg --decrypt archivo.txt.gpg              # Pide tu passphrase
gpg --decrypt archivo.txt.gpg > archivo-descifrado.txt

# CIFRADO SIMÉTRICO (solo con contraseña, sin claves)
gpg --symmetric --cipher-algo AES256 archivo.txt   # Pide contraseña
gpg --decrypt archivo.txt.gpg                       # Descifrar

# FIRMAR un archivo
gpg --sign archivo.txt                     # Genera archivo.txt.gpg (firmado, comprimido)
gpg --clearsign archivo.txt                # Firma en texto claro (legible sin GPG)
gpg --detach-sign archivo.txt              # Firma separada: archivo.txt.sig

# VERIFICAR una firma
gpg --verify archivo.txt.sig archivo.txt
gpg --verify archivo.txt.gpg
# "Good signature from ..." → firma válida
# "BAD signature" → archivo modificado o clave incorrecta
```

```bash
# Verificar una ISO de Ubuntu (ejemplo práctico)
# 1. Descargar la ISO y los archivos de verificación
wget https://releases.ubuntu.com/24.04/ubuntu-24.04-desktop-amd64.iso
wget https://releases.ubuntu.com/24.04/SHA256SUMS
wget https://releases.ubuntu.com/24.04/SHA256SUMS.gpg

# 2. Importar la clave de Ubuntu
gpg --keyserver hkp://keyserver.ubuntu.com --recv-keys 0x843938DF228D22F7B3742BC0D94AA3F0EFE21092

# 3. Verificar la firma del archivo SHA256SUMS
gpg --verify SHA256SUMS.gpg SHA256SUMS

# 4. Verificar el hash de la ISO
sha256sum -c SHA256SUMS --ignore-missing
# ubuntu-24.04-desktop-amd64.iso: OK
```

### `pass` — Gestor de contraseñas basado en GPG

```bash
# pass: gestor de contraseñas que cifra con GPG, almacena en git
sudo apt install pass
pass init tu@email.com               # Inicializar con tu clave GPG

# Uso básico
pass insert trabajo/github           # Añadir contraseña
pass trabajo/github                  # Ver contraseña (descifra con tu clave privada)
pass -c trabajo/github               # Copiar al portapapeles (borra en 45s)
pass generate web/amazon 20          # Generar contraseña aleatoria de 20 caracteres
pass rm trabajo/viejo                # Eliminar

# Integración con git (historial cifrado de contraseñas)
pass git init
pass git remote add origin git@github.com:tu/passwords.git
pass git push -u --all
```

---

## 14.8 — TLS y certificados

TLS (Transport Layer Security) es el protocolo que protege las comunicaciones en red: HTTPS, FTPS, IMAPS, SMTPS. Comprenderlo es fundamental para configurar correctamente cualquier servicio expuesto en red.

```
Cadena de confianza TLS:

  Autoridad de Certificación Raíz (Root CA)
    └── CA Intermedia
          └── Certificado del servidor (midominio.com)
                  → Firmado por la CA Intermedia
                  → Contiene: clave pública, dominio, fecha de expiración

  El navegador verifica:
  1. ¿La firma del certificado es válida? (firmado por la CA)
  2. ¿El dominio coincide? (midominio.com o *.midominio.com)
  3. ¿No ha expirado?
  4. ¿No está revocado? (CRL o OCSP)
  5. ¿La CA raíz está en el almacén de confianza del SO?

  Si CUALQUIER comprobación falla → error de certificado en el navegador
```

```bash
# INSPECCIONAR un certificado con openssl
# Ver el certificado de un servidor remoto
openssl s_client -connect google.com:443 -servername google.com < /dev/null 2>/dev/null \
    | openssl x509 -noout -text | grep -E "Subject|Issuer|Not Before|Not After|DNS"

# Información compacta sobre expiración
echo | openssl s_client -servername github.com -connect github.com:443 2>/dev/null \
    | openssl x509 -noout -dates
# notBefore=Jan  1 00:00:00 2024 GMT
# notAfter=Dec 31 23:59:59 2024 GMT

# Ver un certificado local
openssl x509 -in /etc/ssl/certs/mi-cert.pem -noout -text
openssl x509 -in /etc/ssl/certs/mi-cert.pem -noout -subject -issuer -dates

# GENERAR un certificado autofirmado (para desarrollo/interno)
openssl req -x509 -newkey rsa:4096 \
    -keyout clave-privada.pem \
    -out certificado.pem \
    -days 365 \
    -subj "/C=ES/ST=Madrid/L=Madrid/O=MiOrg/CN=mi-servidor.local"

# Con curva elíptica (más moderno y eficiente):
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out clave-ec.pem
openssl req -new -x509 -key clave-ec.pem -out cert-ec.pem -days 365 \
    -subj "/CN=mi-servidor.local"

# GENERAR un CSR (Certificate Signing Request) para enviarlo a una CA
openssl req -newkey rsa:4096 -keyout clave.pem -out solicitud.csr \
    -subj "/C=ES/ST=Madrid/O=MiOrg/CN=midominio.com"
# Enviar solicitud.csr a la CA → te devuelven el certificado firmado
```

### Let's Encrypt y `certbot`

```bash
# Let's Encrypt: CA gratuita y automatizada
# certbot: cliente oficial
sudo apt install certbot

# Para Apache
sudo apt install python3-certbot-apache
sudo certbot --apache -d midominio.com -d www.midominio.com

# Para Nginx
sudo apt install python3-certbot-nginx
sudo certbot --nginx -d midominio.com

# Renovación automática (certbot instala un timer de systemd)
sudo systemctl status certbot.timer
sudo certbot renew --dry-run       # Probar renovación sin hacer cambios

# Verificar los certificados instalados
sudo certbot certificates
```

### Almacén de confianza del sistema

```bash
# /etc/ssl/certs/: certificados de CAs de confianza del sistema
# /usr/share/ca-certificates/: fuente de los certificados

# Añadir un certificado de CA propio (para CAs internas)
sudo cp mi-ca-interna.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates          # Actualizar el almacén
# Ahora todas las herramientas del sistema confían en esa CA
```

---

## 14.9 — Integridad y detección de intrusiones

### AIDE — Detección de cambios en archivos

AIDE (Advanced Intrusion Detection Environment) calcula y almacena checksums de todos los archivos del sistema. Periodicamente, compara el estado actual con la línea base para detectar modificaciones no autorizadas.

```bash
sudo apt install aide

# 1. CONFIGURAR qué directorios monitorizar
# /etc/aide/aide.conf (no editar directamente en Debian/Ubuntu)
# /etc/aide/aide.conf.d/: añadir reglas aquí

# 2. INICIALIZAR la base de datos (¡en un sistema limpio, recién instalado!)
sudo aideinit                          # Genera /var/lib/aide/aide.db.new
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db  # Activar

# 3. COMPROBAR cambios (comparar estado actual con la base de datos)
sudo aide --check                      # Informe completo
sudo aide --check 2>&1 | grep -E "changed|added|removed"

# 4. ACTUALIZAR la base de datos tras cambios legítimos (actualizaciones, etc.)
sudo aide --update                     # Genera la nueva db con el estado actual
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db  # Reemplazar

# Programar la comprobación diaria (timer de systemd o cron)
# cron job en /etc/cron.daily/aide:
# #!/bin/sh
# nice -n 19 aide --check | mail -s "AIDE check $(hostname)" admin@empresa.com
```

### `rkhunter` y `chkrootkit`

```bash
# rkhunter: buscar rootkits, backdoors y ficheros sospechosos
sudo apt install rkhunter

sudo rkhunter --update                   # Actualizar base de datos de firmas
sudo rkhunter --check --skip-keypress    # Análisis completo (sin pausas)
sudo rkhunter --check --rwo              # Solo mostrar los warnings

# /var/log/rkhunter.log: log detallado
# Advertencias comunes BENIGNAS (falsos positivos):
# - Comandos en /usr/bin que deberían estar en /bin → enlace simbólico de distro
# - Permisos de archivos modificados por actualizaciones → verificar con dpkg -V

# chkrootkit: comprobaciones complementarias
sudo apt install chkrootkit
sudo chkrootkit                          # Análisis básico de rootkits conocidos

# Limitaciones: rkhunter y chkrootkit buscan firmas CONOCIDAS
# Un rootkit sofisticado y nuevo puede evadir ambas herramientas
# No son suficientes solos: complementar con AIDE + auditd + logs centralizados
```

### Verificación de integridad de paquetes

```bash
# Verificar que los archivos instalados por paquetes no han sido modificados

# Debian/Ubuntu: debsums
sudo apt install debsums
sudo debsums openssh-server            # Verificar archivos de un paquete
sudo debsums -c                        # Solo los archivos CAMBIADOS (de todos los paquetes)
sudo debsums -s                        # Silencioso: solo errores

# RHEL/Fedora/Rocky: rpm -V
rpm -V openssh-server                  # Verificar un paquete
rpm -Va 2>/dev/null | grep "^..5"      # Todos los paquetes, solo checksum modificado
# Columnas: S=tamaño, M=permisos, 5=MD5, D=dispositivo, L=enlace simbólico, ...
# Un '.' significa sin cambios; una letra indica qué ha cambiado
```

### Metodología ante sospecha de compromiso

```bash
# Si sospechas que el sistema ha sido comprometido:
# REGLA DE ORO: No confíes en los binarios del sistema comprometido.
# Un rootkit puede haber reemplazado ls, ps, find, etc.

# PASO 1: NO REINICIAR (puede borrar evidencia en RAM o logs)
# PASO 2: AISLAR la red (desconectar físicamente o bajar interfaces)
sudo ip link set eth0 down            # Bajar la interfaz (usando ip del sistema comprometido, pero si ps/ls están comprometidos esto tampoco es fiable)

# PASO 3: PRESERVAR evidencia antes de apagarlo
sudo dd if=/dev/sda of=/mnt/usb-externo/disco-forense.img bs=4M  # Imagen forense
# Documentar: fecha, hora, uptime, procesos, conexiones de red activas

# PASO 4: ARRANCAR desde un live USB LIMPIO
# → Usar los binarios del live USB, no los del sistema comprometido
# → Montar el sistema comprometido en solo lectura para análisis

# PASO 5: ANALIZAR
# Comparar /bin, /sbin, /usr/bin con checksums de instalación limpia
# Buscar procesos con nombre extraño en los logs (journalctl, auth.log)
# Revisar crontabs: /etc/cron*, /var/spool/cron/
# Revisar autorized_keys de todos los usuarios: ~/.ssh/authorized_keys
# Buscar archivos SUID inesperados (ver §14.2)
# Revisar /tmp, /dev/shm, /var/tmp (binarios ejecutables aquí = señal de alerta)

# PASO 6: RECONSTRUIR desde cero
# Un sistema comprometido no se "limpia": se reinstala
# Los backups anteriores al compromiso son la única fuente fiable de datos
```

---

## Anexos

### A. Tabla de herramientas de seguridad por categoría

| Categoría | Herramienta | Función |
|---|---|---|
| Auditoría del sistema | `lynis` | Checklist de hardening automatizado |
| MAC (Ubuntu/Debian) | AppArmor | Confinamiento de procesos por ruta |
| MAC (RHEL/Fedora) | SELinux | Confinamiento por etiquetas de tipo |
| Auditoría de kernel | `auditd` | Log de syscalls y accesos a archivos |
| Anti-fuerza bruta | `fail2ban` | Bloqueo de IPs atacantes vía firewall |
| Integridad de archivos | AIDE | Detección de modificaciones (IDS host-based) |
| Rootkits | `rkhunter`, `chkrootkit` | Firmas de rootkits conocidos |
| Integridad de paquetes | `debsums`, `rpm -V` | Verificar archivos instalados |
| Criptografía | GPG | Cifrado y firma de archivos |
| Certificados TLS | `openssl`, `certbot` | Inspección y gestión de TLS |
| Capabilities | `getcap`/`setcap` | Privilegios granulares sin SUID |
| Análisis de red | `nmap`, `ss` | Inventario de puertos expuestos |

### B. Interrelaciones con otros módulos

```
◀ Módulo 07 — Usuarios y permisos (DAC)
│  El hardening parte del modelo DAC: chmod, chown, SUID, sudo
│  Este módulo añade la capa MAC encima del DAC

◀ Módulo 11 — Redes en Linux
│  SSH hardening: profundización de la configuración de sshd_config
│  Firewalls (ufw/nftables): fail2ban se integra con ellos
│  Escaneo defensivo: nmap contra el propio sistema

◀ Módulo 12 — Almacenamiento avanzado
│  LUKS: cifrado de discos como capa de seguridad física
│  Opciones de montaje noexec/nosuid en fstab

◀ Módulo 13 — Arranque y kernel
│  Secure Boot: cómo se relaciona con la cadena de confianza
│  sysctl de seguridad: kernel.randomize_va_space, dmesg_restrict
│  Módulos del kernel: blacklist para reducir superficie de ataque

▶ Módulo 17 — Linux como servidor
│  → Hardening de Apache/Nginx: headers de seguridad, TLS
│  → Let's Encrypt y renovación automática
│  → SELinux/AppArmor para confinamiento de servicios web
```

---

## Referencias y Bibliografía

1. **CIS Benchmarks** — Center for Internet Security  
   https://www.cisecurity.org/cis-benchmarks/ (requiere registro gratuito)

2. **NIST SP 800-123: Guide to General Server Security**  
   https://csrc.nist.gov/publications/detail/sp/800-123/final

3. **SELinux Project** — NSA / Red Hat  
   https://selinuxproject.org/page/Main_Page

4. **SELinux User and Administrator's Guide** — Red Hat  
   https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/9/html/using_selinux/

5. **AppArmor documentation** — Ubuntu  
   https://ubuntu.com/server/docs/security-apparmor

6. **auditd / Linux Audit System**  
   https://linux.die.net/man/8/auditd  
   https://github.com/linux-audit/audit-documentation

7. **fail2ban documentation**  
   https://www.fail2ban.org/wiki/index.php/MANUAL_0_8

8. **GPG / GnuPG documentation**  
   https://gnupg.org/documentation/

9. **OpenSSL Cookbook** — Ivan Ristić  
   https://www.feistyduck.com/books/openssl-cookbook/

10. **Let's Encrypt documentation**  
    https://letsencrypt.org/docs/

11. **AIDE documentation**  
    https://aide.github.io/

12. **rkhunter documentation**  
    http://rkhunter.sourceforge.net/

13. **Linux Capabilities** — man 7 capabilities  
    https://man7.org/linux/man-pages/man7/capabilities.7.html

14. **Lynis — CISOfy**  
    https://cisofy.com/lynis/

15. **The Linux Command Line, 2ª ed.** — William Shotts  
    No Starch Press. Cap. 9 (Permissions).

16. **Hacking: The Art of Exploitation, 2ª ed.** — Jon Erickson  
    No Starch Press, 2008. Contexto para entender las amenazas que se defienden.

17. **OWASP — Linux Security Cheat Sheet**  
    https://cheatsheetseries.owasp.org/

18. **ArchWiki — Security**  
    https://wiki.archlinux.org/title/Security

19. **ArchWiki — AppArmor**  
    https://wiki.archlinux.org/title/AppArmor

20. **Red Hat Blog — SELinux Coloring Book**  
    https://github.com/mairin/selinux-coloring-book (introducción conceptual accesible)

21. **Practical Linux Security Cookbook** — Tajinder Kalsi  
    Packt Publishing, 2018.

---

## Preguntas de autoevaluación

1. ¿Qué diferencia hay entre DAC y MAC? Da un ejemplo de por qué SELinux protege donde los permisos DAC fallan.
2. Un proceso de Apache con SELinux activo intenta leer `/etc/shadow`. ¿Qué ocurre? ¿Dónde se registra? ¿Cómo diagnosticarías la denegación?
3. ¿Por qué `setenforce 0` NO es la solución correcta cuando SELinux niega un acceso? ¿Cuál es la solución correcta?
4. Explica qué son los booleans de SELinux. Pon un ejemplo concreto con Apache y cuándo habría que activar `httpd_can_network_connect`.
5. ¿Qué diferencia hay entre un perfil AppArmor en modo `enforce` y en modo `complain`? ¿Para qué sirve el modo complain?
6. ¿Para qué sirve `auditd`? Escribe una regla que detecte cualquier escritura sobre `/etc/sudoers`.
7. Explica cómo funciona `fail2ban`. ¿Qué es una "jaula"? ¿Qué ocurre cuando una IP supera el `maxretry`?
8. ¿Cuál es la diferencia entre cifrar un archivo con la clave pública del destinatario y firmarlo con tu clave privada? ¿Qué garantiza cada operación?
9. ¿Qué es una CA (Certification Authority) y qué papel juega en TLS? ¿Por qué un certificado autofirmado genera advertencias en el navegador?
10. ¿Cuál es la diferencia conceptual entre AIDE y `rkhunter`? ¿Por qué no es suficiente usar solo uno de ellos?
11. Ante una sospecha de compromiso del sistema, ¿por qué no debes reiniciar inmediatamente? ¿Cuál es el primer paso crítico?
12. ¿Qué es una Linux Capability? Da un ejemplo de cuándo es preferible usar `setcap cap_net_bind_service=+ep` en lugar de ejecutar el proceso como root.

---

## Laboratorios prácticos

### Lab 14.1 — Inventario de seguridad inicial

```bash
# 1. Ver servicios en ejecución
sudo systemctl list-units --type=service --state=running | grep -v "@"

# 2. Ver puertos abiertos con el proceso que los ocupa
sudo ss -tlnp
sudo ss -ulnp

# 3. Buscar binarios SUID del sistema
sudo find /usr/bin /usr/sbin /bin /sbin -perm /4000 -type f 2>/dev/null | sort

# 4. Ver cuentas con contraseña o shell activa
awk -F: '$7 !~ /false|nologin/ {print $1, $7}' /etc/passwd | head -20

# 5. Ver quién tiene sudo
sudo grep -v '^#' /etc/sudoers 2>/dev/null | grep -v '^$' | grep -v "^Defaults"
getent group sudo wheel 2>/dev/null

# 6. Ejecutar lynis (si está instalado)
sudo lynis audit system --quick 2>/dev/null | tail -20
```

### Lab 14.2 — GPG: cifrar y firmar archivos

```bash
# Este lab usa solo cifrado SIMÉTRICO (no necesita par de claves):

# 1. Crear un archivo con datos sensibles de prueba
echo "Contraseñas de producción: NO COMPARTIR" > /tmp/datos-secretos.txt

# 2. Cifrarlo con AES256
gpg --symmetric --cipher-algo AES256 --armor /tmp/datos-secretos.txt
# Introduce una passphrase de prueba (y recuérdala)
cat /tmp/datos-secretos.txt.asc     # Armored: texto legible pero cifrado

# 3. Verificar que el original ya no es necesario (borrarlo)
rm /tmp/datos-secretos.txt

# 4. Descifrar (pide la passphrase)
gpg --decrypt /tmp/datos-secretos.txt.asc

# 5. Limpiar
rm /tmp/datos-secretos.txt.asc
```

### Lab 14.3 — openssl: inspeccionar certificados TLS

```bash
# 1. Inspeccionar el certificado de un sitio HTTPS real
echo | openssl s_client -servername github.com -connect github.com:443 2>/dev/null \
    | openssl x509 -noout -subject -issuer -dates -fingerprint

# 2. Generar un certificado autofirmado de prueba
openssl req -x509 -newkey rsa:2048 \
    -keyout /tmp/test-key.pem \
    -out /tmp/test-cert.pem \
    -days 30 -nodes \
    -subj "/CN=test.local" 2>/dev/null

# 3. Inspeccionar el certificado generado
openssl x509 -in /tmp/test-cert.pem -noout -text | \
    grep -E "Subject|Issuer|Not Before|Not After|Public Key"

# 4. Limpiar
rm -f /tmp/test-key.pem /tmp/test-cert.pem
```

### Lab 14.4 — auditd: activar y consultar reglas

```bash
# Verificar que auditd está activo
sudo systemctl status auditd --no-pager | head -5

# Añadir una regla temporal (no persistente) para monitorizar /etc/passwd
sudo auditctl -w /etc/passwd -p wa -k lab-passwd

# Generar un evento: tocar el archivo
sudo touch /etc/passwd

# Buscar el evento en los logs
sudo ausearch -k lab-passwd -ts recent

# Ver las reglas actuales
sudo auditctl -l | grep lab-passwd

# Eliminar la regla temporal
sudo auditctl -W /etc/passwd -p wa -k lab-passwd
```

### Lab 14.5 — AppArmor: explorar perfiles existentes

```bash
# 1. Ver el estado de AppArmor
sudo aa-status | head -30

# 2. Ver un perfil existente (por ejemplo nginx o apache2)
sudo aa-status | grep "^  /" | head -10    # Perfiles en enforce

# 3. Ver el contenido de un perfil
ls /etc/apparmor.d/ | head -10
sudo cat /etc/apparmor.d/usr.sbin.rsyslogd 2>/dev/null | head -30

# 4. Ver los logs de AppArmor del día de hoy
sudo journalctl -k --since today | grep apparmor | head -20
```

### Lab 14.6 — fail2ban: ver el estado de las jaulas

```bash
# Verificar que fail2ban está activo
sudo systemctl status fail2ban --no-pager | head -5

# Ver todas las jaulas configuradas
sudo fail2ban-client status

# Ver el estado de la jaula sshd
sudo fail2ban-client status sshd

# Ver los logs de fail2ban recientes
sudo journalctl -u fail2ban -n 20 --no-pager

# Contar intentos de acceso fallidos en SSH hoy
sudo journalctl -u sshd --since today | grep "Failed\|Invalid" | wc -l
```

---

## Resumen del módulo

✅ **Modelo de seguridad:** DAC + MAC, superficie de ataque, mínimo privilegio, Linux Capabilities  
✅ **Hardening:** inventario de servicios/SUID, SSH endurecido, fstab con noexec/nosuid, política de contraseñas, `lynis`  
✅ **SELinux:** contextos, tipos, booleans, `restorecon`, `semanage`, diagnóstico con `audit2why`/`audit2allow`  
✅ **AppArmor:** perfiles enforce/complain, `aa-status`, `aa-genprof`, `aa-logprof`, perfiles manuales  
✅ **auditd:** reglas con `-w` y `-a always,exit`, `ausearch`, `aureport`, monitorización de archivos críticos  
✅ **fail2ban:** jaulas, `jail.local`, gestión de bans, integración con firewall (módulo 11)  
✅ **GPG:** par de claves, cifrado/descifrado, firma/verificación, verificación de ISOs, `pass`  
✅ **TLS:** cadena de confianza, `openssl` para inspección y generación de certificados, Let's Encrypt  
✅ **Detección de intrusiones:** AIDE (integridad de archivos), `rkhunter`/`chkrootkit`, `debsums`/`rpm -V`  
✅ **Respuesta ante incidentes:** metodología de 6 pasos, preservación de evidencias, no reiniciar  

**Próximo paso:** [Módulo 15 — Monitorización y rendimiento](/monitorizacion-y-rendimiento). Con el sistema seguro y correctamente configurado, el siguiente desafío es mantenerlo saludable: métricas de CPU/memoria/disco/red, alertas proactivas y herramientas de profiling.

---

**Última actualización:** 2024-06  
**Versión:** 1.0  
**Estado:** ✅ Listo para enseñanza
