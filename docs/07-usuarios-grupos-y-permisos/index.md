---
title: "Módulo 07 — Usuarios, grupos y permisos"
sidebar_label: "07 · Usuarios y permisos"
description: Modelo multiusuario de Linux, gestión de cuentas y grupos, sudo, permisos clásicos UGO, bits especiales SUID/SGID/sticky, ACLs, atributos chattr y PAM.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Módulo 07 — Usuarios, grupos y permisos

## Introducción

Linux nació como sistema operativo **multiusuario**. Desde su concepción en 1991, Torvalds diseñó un sistema donde múltiples personas podían trabajar simultáneamente en la misma máquina sin interferirse. El mecanismo que lo hace posible es el modelo de permisos: cada proceso, cada archivo y cada directorio tiene un **propietario** y un conjunto de **reglas de acceso**.

Este modelo no es solo una característica técnica: es la base de la **seguridad en Linux**. Un servidor web comprometido no puede borrar el sistema operativo porque el proceso `nginx` no tiene permisos sobre `/etc/`. Un script malicioso que consiga ejecutarse como tu usuario no puede instalar un rootkit porque no es `root`.

En el [Módulo 04](/sistema-de-archivos) ya viste el primer carácter de `ls -la` (tipo de archivo) y los nueve siguientes (permisos). En el [Módulo 06](/editores-de-texto) aprendiste a editar archivos del sistema con `sudo`. En este módulo entenderás en profundidad **qué son esos permisos, cómo funcionan, cómo administrarlos y dónde están sus límites**.

### Objetivos de aprendizaje

Al finalizar este módulo, serás capaz de:

- ✅ Explicar el modelo de usuarios y grupos de Linux (UID/GID, passwd, shadow)
- ✅ Crear, modificar y eliminar usuarios y grupos con las herramientas adecuadas
- ✅ Gestionar contraseñas y políticas de caducidad
- ✅ Configurar y usar `sudo` de forma segura con `visudo`
- ✅ Interpretar y modificar permisos clásicos (rwx) en notación simbólica y octal
- ✅ Entender qué significan los permisos en directorios vs. archivos
- ✅ Usar los bits especiales: SUID, SGID y sticky bit
- ✅ Aplicar ACLs cuando los permisos clásicos son insuficientes
- ✅ Usar `chattr` para proteger archivos críticos
- ✅ Entender el rol de PAM en la autenticación del sistema

---

## 7.1 — El modelo de usuarios y grupos

### Identidades en Linux: UID y GID

Linux no identifica a los usuarios por su nombre. Internamente, **todo se gestiona por números enteros**: el UID (User ID) y el GID (Group ID). El nombre de usuario es solo una etiqueta amigable que el sistema traduce consultando `/etc/passwd`.

```
┌──────────────────────────────────────────────────────────┐
│                Identidad de un proceso                   │
│                                                          │
│  UID real      → quién eres realmente (quién te inició)  │
│  UID efectivo  → quién eres para el sistema de archivos  │
│  UID guardado  → UID efectivo anterior (para restaurar)  │
│                                                          │
│  GID real      → grupo real del proceso                  │
│  GID efectivo  → grupo para comprobación de permisos     │
│  GIDs supl.    → lista de grupos adicionales              │
│                                                          │
│  Normalmente UID real = UID efectivo = UID guardado      │
│  Excepto con SUID (lo veremos en §7.5)                   │
└──────────────────────────────────────────────────────────┘
```

```bash
# Ver tu identidad completa
id
# uid=1000(juan) gid=1000(juan) groups=1000(juan),4(adm),24(cdrom),27(sudo),
#  30(dip),46(plugdev),122(lpadmin),135(sambashare)

id -u          # Solo tu UID
id -g          # Solo tu GID principal
id -G          # Todos tus GIDs
id -nG         # Todos los nombres de grupo
id usuario     # Identidad de otro usuario
whoami         # Solo tu nombre de usuario

# Ver quién está conectado al sistema
who            # Usuarios conectados con terminal y tiempo
who -a         # Más información (boot time, runlevel, etc.)
w              # Quién está conectado y qué están haciendo
users          # Solo los nombres de usuario conectados
last           # Historial de logins (desde /var/log/wtmp)
last -n 20     # Últimos 20 logins
lastb          # Intentos de login fallidos (requiere root)
last root      # Solo logins del usuario root
```

### Los rangos de UID

```
Rangos estándar de UID en Linux:

UID 0         → root (el superusuario)
UID 1–99      → Usuarios del sistema (daemon, bin, sys...)
UID 100–999   → Usuarios de servicio creados por paquetes
               (www-data, postgres, mysql, sshd...)
UID 1000+     → Usuarios humanos reales (el primer humano = 1000)
UID 65534     → nobody (usuario sin privilegios para daemons)
```

```bash
# Confirmar los rangos en tu sistema
grep -E "^UID_MIN|^UID_MAX|^SYS_UID_MIN|^SYS_UID_MAX" /etc/login.defs
# SYS_UID_MIN   100
# SYS_UID_MAX   999
# UID_MIN       1000
# UID_MAX       65534
```

### Los archivos de base de datos de usuarios

#### `/etc/passwd` — Cuentas de usuario

```bash
cat /etc/passwd
# root:x:0:0:root:/root:/bin/bash
# daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
# www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
# juan:x:1000:1000:Juan García,,,:/home/juan:/bin/bash

# Campos separados por :
# 1. Login name
# 2. Contraseña ('x' = en /etc/shadow; '' = sin contraseña)
# 3. UID
# 4. GID primario
# 5. GECOS (nombre completo, teléfono, etc.)
# 6. Directorio home
# 7. Shell de login
```

```bash
# Parsear /etc/passwd con las herramientas del Módulo 05
# Ver todos los usuarios con shell interactiva
grep -E "bash|zsh|fish" /etc/passwd | cut -d: -f1

# Ver usuarios con su UID y shell (formatear como tabla)
awk -F: '{printf "%-15s UID:%-6d Shell:%s\n", $1, $3, $7}' /etc/passwd

# Ver usuarios con UID >= 1000 (usuarios reales)
awk -F: '$3 >= 1000 && $3 < 65534 {print $1}' /etc/passwd

# Verificar integridad: usuarios sin contraseña (campo 2 vacío)
awk -F: '$2 == "" {print "SIN CONTRASEÑA:", $1}' /etc/passwd
```

#### `/etc/shadow` — Contraseñas hasheadas

Solo `root` puede leer este archivo. Las contraseñas nunca se guardan en texto plano.

```bash
sudo cat /etc/shadow | head -3
# root:$6$salt$hash_muy_largo:19500:0:99999:7:::
# daemon:*:18858:0:99999:7:::
# juan:$6$xyz$abc...:19500:0:99999:7:::

# Campos:
# 1. Login name
# 2. Hash de contraseña:
#    $1$ = MD5 (obsoleto)
#    $5$ = SHA-256
#    $6$ = SHA-512 (estándar actual)
#    $y$ = yescrypt (Ubuntu 22.04+)
#    * o ! = cuenta bloqueada / sin contraseña válida
# 3. Días desde epoch (1/1/1970) del último cambio
# 4. Días mínimos entre cambios
# 5. Días máximos antes de expirar
# 6. Días de aviso antes de expirar
# 7. Días de gracia después de expirar
# 8. Fecha de expiración de la cuenta (días desde epoch)
# 9. Reservado
```

#### `/etc/group` — Grupos

```bash
cat /etc/group
# root:x:0:
# sudo:x:27:juan,maria
# docker:x:998:juan
# www-data:x:33:

# Campos:
# 1. Nombre del grupo
# 2. Contraseña ('x' = en /etc/gshadow; raramente usada)
# 3. GID
# 4. Lista de miembros (separados por ,)
```

```bash
# Ver grupos de un usuario
groups juan
# juan : juan adm cdrom sudo dip plugdev

# Ver todos los grupos del sistema ordenados por GID
sort -t: -k3 -n /etc/group | column -t -s:

# Grupos con más de un miembro
awk -F: 'NF>0 && $4 != "" {print $1": "$4}' /etc/group
```

---

## 7.2 — Administrar cuentas de usuario

### Crear usuarios

Linux ofrece dos niveles de herramientas para crear usuarios:

```
┌─────────────────────────────────────────────────────────┐
│  Herramientas de bajo nivel    │  Herramientas de alto nivel │
│  (configuración manual)        │  (wrappers interactivos)   │
├──────────────────────────────────────────────────────────┤
│  useradd                       │  adduser (Debian/Ubuntu)   │
│  usermod                       │  (equivalente amigable)    │
│  userdel                       │  deluser                   │
└─────────────────────────────────────────────────────────┘
```

#### `useradd` — Crear usuario (bajo nivel)

```bash
# Sintaxis: useradd [opciones] nombre_usuario

# Crear usuario básico (sin home, sin shell interactiva)
sudo useradd operador

# Crear usuario completo para una persona real
sudo useradd \
    --create-home \           # Crear /home/maria
    --shell /bin/bash \       # Shell interactiva
    --comment "María López" \ # Nombre completo (GECOS)
    --groups sudo,docker \    # Grupos adicionales
    --uid 1500 \              # UID específico (opcional)
    maria

# Forma abreviada con opciones cortas
sudo useradd -m -s /bin/bash -c "María López" -G sudo,docker maria

# Después de crear el usuario, establecer contraseña
sudo passwd maria

# Opciones de useradd más importantes:
# -m, --create-home    Crear directorio home
# -d, --home-dir DIR   Especificar directorio home (default: /home/USER)
# -s, --shell SHELL    Shell de login
# -c, --comment TEXT   Comentario/nombre completo (GECOS)
# -g, --gid GID        GID primario (por defecto crea grupo igual al username)
# -G, --groups G1,G2   Grupos adicionales (separados por coma, SIN espacio)
# -u, --uid UID        UID específico
# -r, --system         Crear usuario de sistema (UID < 1000, sin home)
# -e, --expiredate     Fecha de expiración (YYYY-MM-DD)
# -f, --inactive DAYS  Días de gracia tras expirar contraseña
# -k, --skel DIR       Directorio skel alternativo
```

#### `adduser` — Crear usuario (alto nivel, Debian/Ubuntu)

```bash
# Interactivo: hace preguntas y configura todo automáticamente
sudo adduser maria

# Salida de adduser:
# Adding user `maria' ...
# Adding new group `maria' (1001) ...
# Adding new user `maria' (1001) with group `maria' ...
# Creating home directory `/home/maria' ...
# Copying files from `/etc/skel' ...
# New password: ____
# Retype new password: ____
# passwd: password updated successfully
# Full Name []: María López
# Room Number []:
# Work Phone []:
# Home Phone []:
# Other []:
# Is the information correct? [Y/n]

# Añadir usuario a un grupo adicional
sudo adduser maria sudo
sudo adduser maria docker
```

#### El esqueleto `/etc/skel`

Cuando se crea un usuario con `--create-home`, los archivos de `/etc/skel` se copian a su home:

```bash
ls -la /etc/skel/
# .bash_logout   .bashrc   .profile

# Personalizar el skel para que todos los usuarios nuevos tengan:
sudo cp /mi-vimrc /etc/skel/.vimrc
sudo cp /mi-bashrc-corporativo /etc/skel/.bashrc

# A partir de ahora, cada nuevo usuario tendrá esos archivos en su home
```

```bash
# Valores por defecto para nuevos usuarios
cat /etc/login.defs | grep -v "^#" | grep -v "^$"
# MAIL_DIR        /var/mail
# PASS_MAX_DAYS   99999    ← Días máx. antes de forzar cambio
# PASS_MIN_DAYS   0        ← Días mín. entre cambios
# PASS_WARN_AGE   7        ← Días de aviso antes de expirar
# UID_MIN         1000
# UID_MAX         60000
# GID_MIN         1000
# GID_MAX         60000
# UMASK           022
# USERGROUPS_ENAB yes      ← Crear grupo con el mismo nombre al crear user
# ENCRYPT_METHOD  SHA512   ← Algoritmo de hash de contraseñas
```

### Modificar usuarios

```bash
# usermod: modificar un usuario existente
sudo usermod [opciones] usuario

# Cambiar shell
sudo usermod --shell /bin/zsh juan
sudo usermod -s /bin/zsh juan

# Cambiar nombre de usuario (login)
sudo usermod --login nuevo_nombre --move-home --home /home/nuevo_nombre viejo_nombre
# IMPORTANTE: el usuario NO debe estar conectado al hacer esto

# Añadir a grupos adicionales (SIN -G, -aG = append to Groups)
sudo usermod -aG docker juan
sudo usermod -aG sudo,lpadmin juan
# ATENCIÓN: -G sin -a REEMPLAZA todos los grupos adicionales
# Siempre usa -aG para añadir grupos

# Bloquear/desbloquear una cuenta
sudo usermod --lock juan       # Bloquea (pone ! en shadow)
sudo usermod --unlock juan     # Desbloquea
sudo usermod -L juan           # Lock (abreviado)
sudo usermod -U juan           # Unlock (abreviado)

# Establecer fecha de expiración
sudo usermod --expiredate 2024-12-31 juan    # Expira el 31/12/2024
sudo usermod --expiredate "" juan            # Sin expiración

# Cambiar comentario (nombre completo)
sudo usermod --comment "Juan García Martínez" juan

# Ver cambios: la información queda en /etc/passwd
grep "^juan:" /etc/passwd
```

### Eliminar usuarios

```bash
# userdel: eliminar usuario
sudo userdel juan              # Solo elimina la cuenta (deja el home)
sudo userdel --remove juan     # Elimina cuenta Y directorio home
sudo userdel -r juan           # Abreviado de --remove

# deluser (Debian/Ubuntu): más seguro
sudo deluser juan              # Solo la cuenta
sudo deluser --remove-home juan     # Con home
sudo deluser --backup juan     # Hace backup del home antes de borrar
sudo deluser --remove-all-files juan  # Busca y borra TODOS sus archivos

# Verificar que no quedan archivos huérfanos
sudo find / -nouser 2>/dev/null    # Archivos sin propietario
sudo find / -nogroup 2>/dev/null   # Archivos sin grupo
```

### Gestión de contraseñas

```bash
# Cambiar contraseña
passwd              # Cambiar la propia (pide la actual)
sudo passwd juan    # Cambiar la de otro usuario (root no pide la actual)

# Forzar cambio de contraseña en el próximo login
sudo passwd --expire juan
sudo chage -d 0 juan    # Pone la fecha del último cambio a 0

# Ver el estado de la contraseña
sudo passwd --status juan
# juan P 2024-01-15 0 99999 7 -1
# Campos: nombre, P=activa/L=bloqueada/NP=sin contraseña, 
#         fecha cambio, min días, max días, aviso, inactivo

# Ver política de caducidad con chage (change age)
sudo chage --list juan
# Last password change                                    : Jan 15, 2024
# Password expires                                        : never
# Password inactive                                       : never
# Account expires                                         : never
# Minimum number of days between password change          : 0
# Maximum number of days between password change          : 99999
# Number of days of warning before password expires       : 7

# Establecer política de caducidad
sudo chage --maxdays 90 juan         # Cambio obligatorio cada 90 días
sudo chage --mindays 7 juan          # Mínimo 7 días entre cambios
sudo chage --warndays 14 juan        # Aviso 14 días antes
sudo chage --expiredate 2025-01-01 juan  # Cuenta expira en esa fecha

# Desbloquear cuenta bloqueada por intentos fallidos (PAM faillock)
sudo faillock --user juan --reset
```

### Gestión de grupos

```bash
# Crear grupo
sudo groupadd desarrolladores
sudo groupadd --gid 2000 ops        # Con GID específico
sudo groupadd --system apache       # Grupo de sistema (GID < 1000)

# Modificar grupo
sudo groupmod --new-name devs desarrolladores    # Renombrar
sudo groupmod --gid 2001 ops                     # Cambiar GID

# Eliminar grupo
sudo groupdel desarrolladores
# IMPORTANTE: No puedes eliminar el grupo primario de ningún usuario activo

# Administrar miembros con gpasswd
sudo gpasswd --add juan desarrolladores        # Añadir miembro
sudo gpasswd --delete juan desarrolladores     # Eliminar miembro
sudo gpasswd --members juan,maria desarrolladores  # Establecer lista completa

# Administrador del grupo (puede añadir/eliminar miembros sin sudo)
sudo gpasswd --administrator juan desarrolladores
# Ahora juan puede: gpasswd --add otro_usuario desarrolladores

# Cambiar temporalmente tu grupo primario (en la sesión)
newgrp docker    # Cambia el GID efectivo para el resto de la sesión
# (útil cuando te añaden a un grupo y no quieres cerrar sesión)

# Verificar pertenencia a grupos
groups                # Mis grupos
groups juan           # Grupos de juan
getent group sudo     # Miembros del grupo sudo
```

---

## 7.3 — Escalado de privilegios: `su` y `sudo`

### `su` — Cambiar de usuario

```bash
# su: switch user
su root              # Cambiar a root (pide contraseña de ROOT)
su -                 # Cambiar a root con entorno completo de root
su - juan            # Cambiar a juan con su entorno completo
su -c "comando" juan # Ejecutar un comando como juan y volver

# Diferencia crítica: su vs su -
su root     # Cambia el UID pero mantiene tu entorno (PATH, HOME, etc.)
su - root   # Simula un login completo: nuevo PATH, HOME=/root, variables limpias
            # Esta es la forma correcta casi siempre

# Verificar quién eres después del su
id
whoami
echo $HOME
```

:::warning
En Ubuntu y derivados, la cuenta `root` no tiene contraseña por defecto (está desactivada). `su root` fallará. Usa `sudo -i` para obtener una shell de root.
:::

### `sudo` — Execute as Superuser

`sudo` es más granular y auditable que `su`. Permite ejecutar comandos específicos con privilegios elevados sin conocer la contraseña de `root`.

```bash
# Sintaxis básica
sudo comando                     # Ejecutar como root
sudo -u juan comando             # Ejecutar como otro usuario
sudo -i                          # Shell interactiva de root (login shell)
sudo -s                          # Shell de root sin cambiar el entorno
sudo -l                          # Listar qué puedes hacer con sudo
sudo -l -U juan                  # Listar qué puede hacer juan (como root)
sudo -v                          # Renovar el ticket (evitar pedir contraseña)
sudo -k                          # Invalidar el ticket (pide contraseña siguiente vez)

# El "ticket" de sudo: por defecto, una vez autenticado,
# no pide contraseña durante 15 minutos (configurable)

# Ejecutar el último comando con sudo (el típico "olvidé el sudo")
sudo !!         # !! = último comando ejecutado (expansión del historial)
# Ejemplo: apt update → "Permission denied" → sudo !!

# Editar archivo protegido con el editor configurado
sudo -e /etc/hosts          # Usa $EDITOR (nunca abre como root el editor)
sudoedit /etc/hosts         # Equivalente, más seguro
```

### `/etc/sudoers` y `visudo`

El archivo `/etc/sudoers` controla quién puede ejecutar qué con sudo. **Nunca edites este archivo directamente**: usa `visudo`, que valida la sintaxis antes de guardar y previene bloqueos del sistema.

```bash
# SIEMPRE editar sudoers con visudo
sudo visudo                     # Edita /etc/sudoers
sudo visudo -f /etc/sudoers.d/mi_regla   # Edita un archivo adicional
```

**Anatomía de `/etc/sudoers`:**

```
# Comentario: explicar qué hace cada regla

# ALIASES: agrupar para reutilizar
User_Alias    ADMINS = juan, maria, root
Cmnd_Alias    SERVICIOS = /bin/systemctl restart *, /bin/systemctl stop *
Cmnd_Alias    APAGAR = /sbin/shutdown, /sbin/reboot, /sbin/halt
Host_Alias    SERVIDORES = srv1, srv2, srv3

# FORMATO DE REGLA:
# usuario  hosts=(usuario_destino:grupo_destino) [NOPASSWD:] comandos

# Reglas básicas:
root           ALL=(ALL:ALL) ALL   # root puede hacer todo desde cualquier host

# Dar sudo completo a juan
juan           ALL=(ALL:ALL) ALL

# Dar sudo completo al GRUPO sudo (sin especificar usuario)
%sudo          ALL=(ALL:ALL) ALL   # % indica grupo

# Reglas específicas (principio de mínimo privilegio):
juan           ALL=(root) /bin/systemctl restart nginx, /usr/bin/tail /var/log/nginx/*
operador       ALL=(root) NOPASSWD: /bin/systemctl status *, /usr/bin/journalctl

# Usar alias:
ADMINS         SERVIDORES=(root) SERVICIOS
%developers    ALL=(root) NOPASSWD: /usr/bin/docker *

# Denegar explícitamente (!) — se evalúa antes que las reglas permisivas
juan           ALL=(ALL) !/bin/su, !/bin/bash, !/bin/sh

# Variables de entorno a preservar (importante para algunos workflows)
Defaults        env_keep += "EDITOR VISUAL"
Defaults        timestamp_timeout=30    # Timeout del ticket en minutos
Defaults        logfile=/var/log/sudo.log
Defaults        mail_always             # Enviar email por cada uso
Defaults:%sudo  !requiretty             # Permitir sudo sin TTY (para scripts)
```

### Archivos en `/etc/sudoers.d/`

La buena práctica es no tocar el sudoers principal y añadir reglas en archivos separados:

```bash
# Crear regla para el equipo de desarrollo
sudo visudo -f /etc/sudoers.d/desarrollo

# Contenido del archivo:
%desarrollo  ALL=(root) NOPASSWD: /usr/bin/docker *, /usr/local/bin/kubectl *
%desarrollo  ALL=(root) /bin/systemctl restart nginx, /bin/systemctl restart php-fpm

# Los archivos en sudoers.d NO deben terminar en ~ ni contener .
# Los archivos se incluyen automáticamente si la línea de /etc/sudoers contiene:
# @includedir /etc/sudoers.d

# Verificar sintaxis sin aplicar
sudo visudo -c -f /etc/sudoers.d/desarrollo
# /etc/sudoers.d/desarrollo: parsed OK

# Listar archivos actuales
ls -la /etc/sudoers.d/
```

### Auditoría de sudo

Cada ejecución de `sudo` queda registrada:

```bash
# Ver log de sudo en sistemas con journald
sudo journalctl -e | grep sudo
sudo journalctl _COMM=sudo | tail -20

# O en /var/log/auth.log (Debian/Ubuntu)
grep sudo /var/log/auth.log | tail -20
# Jun  1 10:23:45 servidor juan : TTY=pts/0 ; PWD=/home/juan ;
#   USER=root ; COMMAND=/bin/systemctl restart nginx

# Parsear con awk para ver quién hace qué
grep sudo /var/log/auth.log | \
    awk '/COMMAND/ {print $1, $2, $3, $5, $NF}' | \
    sort | uniq -c | sort -rn

# Ver intentos de sudo denegados (seguridad)
grep "command not allowed" /var/log/auth.log
grep "NOT in sudoers" /var/log/auth.log
```

---

## 7.4 — Permisos clásicos

### El modelo UGO: User, Group, Others

Cada archivo y directorio en Linux tiene asociados:
- Un **propietario** (usuario)
- Un **grupo propietario**
- Un conjunto de **permisos** para tres sujetos: propietario, grupo y todos los demás

```
ls -la /home/juan/documento.txt

-rw-r--r-- 1 juan adm 4096 Jun 1 10:00 documento.txt
│└────────┘   └──┘ └─┘
│  permisos  propiet. grupo
│
│ Primer carácter: tipo de archivo
│   - = regular    d = directorio   l = symlink
│   b = bloque     c = carácter     p = FIFO   s = socket
│
│ Los 9 caracteres siguientes: 3 grupos de rwx
│
│  rw-  r--  r--
│  │    │    └── Otros (o): puede leer, no escribir, no ejecutar
│  │    └─────── Grupo (g): puede leer, no escribir, no ejecutar
│  └──────────── Usuario/propietario (u): puede leer y escribir, no ejecutar

┌──────────────────────────────────────────────────────┐
│  Significado de r, w, x en ARCHIVOS REGULARES        │
├────────┬─────────────────────────────────────────────┤
│ r (4)  │ Leer el contenido del archivo               │
│ w (2)  │ Modificar el contenido del archivo          │
│ x (1)  │ Ejecutar el archivo (como programa/script)  │
└────────┴─────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Significado de r, w, x en DIRECTORIOS               │
├────────┬─────────────────────────────────────────────┤
│ r (4)  │ Listar el contenido (ls)                    │
│ w (2)  │ Crear/borrar/renombrar archivos dentro       │
│ x (1)  │ Entrar al directorio (cd) y acceder a        │
│        │ archivos si sabes el nombre (traversal)      │
└────────┴─────────────────────────────────────────────┘
```

:::info **La trampa de los permisos en directorios**
El bit `x` en un directorio es necesario para **cualquier** acceso a su contenido. Sin `x`, ni siquiera puedes leer un archivo cuyo nombre conoces, aunque tengas `r`. Con `x` pero sin `r`, puedes acceder a archivos si conoces el nombre exacto, pero no puedes listar el contenido.

Esto se usa intencionalmente: un servidor web puede tener `--x` en directorios para que el proceso pueda servir archivos conocidos sin que los visitantes puedan listar el directorio.
:::

### Notación octal

Los permisos se representan como tres dígitos octales (base 8), donde cada dígito es la suma de los bits activos:

```
r = 4
w = 2
x = 1

rw-  = 4+2+0 = 6
r-x  = 4+0+1 = 5
r--  = 4+0+0 = 4
rwx  = 4+2+1 = 7
---  = 0+0+0 = 0

Ejemplos completos:
rwxr-xr-x = 755   (ejecutable compartido: owner rw+x, group r+x, others r+x)
rw-r--r-- = 644   (archivo de texto normal)
rw-rw-r-- = 664   (archivo editable por el grupo)
rw-------  = 600   (privado del propietario)
rwx------  = 700   (directorio privado)
rwxrwxrwx = 777   (¡peligroso! todos pueden hacer todo)
```

### `chmod` — Cambiar permisos

```bash
# NOTACIÓN SIMBÓLICA: [ugoa][+-=][rwxXst]
# u=user, g=group, o=others, a=all

chmod u+x script.sh          # Añadir ejecución al propietario
chmod g+w archivo.txt        # Añadir escritura al grupo
chmod o-r secreto.txt        # Quitar lectura a otros
chmod a+r publico.txt        # Todos pueden leer
chmod u=rwx,g=rx,o= dir/     # Establecer permisos exactos
chmod ug+x script.sh         # Añadir ejecución a user y group

# El bit X especial: solo añadir x si ya existe x en algún sitio
chmod a+X directorio/        # Añade x solo si es directorio o ya tiene x
# Útil para: chmod -R a+X dir/  (solo pone x en dirs, no en archivos)

# NOTACIÓN OCTAL: más rápida, establece permisos exactos
chmod 755 script.sh          # rwxr-xr-x
chmod 644 documento.txt      # rw-r--r--
chmod 600 ~/.ssh/id_rsa      # rw------- (clave privada SSH)
chmod 700 ~/.ssh/            # rwx------ (directorio SSH)
chmod 777 /tmp/temporal/     # rwxrwxrwx (¡raramente apropiado!)

# RECURSIVO: aplicar a directorio y todo su contenido
chmod -R 755 /var/www/html/
chmod -R g+w /srv/proyecto/

# Recomendación para proyectos web:
find /var/www/html -type f -exec chmod 644 {} \;   # Archivos: 644
find /var/www/html -type d -exec chmod 755 {} \;   # Directorios: 755
```

### `chown` y `chgrp` — Cambiar propietario y grupo

```bash
# chown: cambiar propietario
sudo chown juan archivo.txt
sudo chown juan:desarrolladores archivo.txt   # Cambiar propietario y grupo
sudo chown :desarrolladores archivo.txt        # Solo cambiar grupo
sudo chown -R www-data:www-data /var/www/html/ # Recursivo

# chgrp: cambiar solo el grupo
sudo chgrp desarrolladores proyecto/
sudo chgrp -R www-data /var/www/html/

# Combinación para proyectos compartidos:
sudo chown -R root:desarrolladores /srv/proyecto/
sudo chmod -R 775 /srv/proyecto/
# root es propietario, el grupo puede leer y escribir, otros solo leer
```

### `umask` — Permisos por defecto

`umask` define qué permisos se **restan** al crear nuevos archivos y directorios. Funciona como una máscara de bits.

```bash
# Ver el umask actual
umask
# 0022

# Interpretación:
# Permisos máximos para archivos: 666 (rw-rw-rw-)
# Permisos máximos para directorios: 777 (rwxrwxrwx)

# Con umask 022:
# Archivos:     666 - 022 = 644 (rw-r--r--)  ← estándar
# Directorios:  777 - 022 = 755 (rwxr-xr-x)  ← estándar

# Con umask 027:
# Archivos:     666 - 027 = 640 (rw-r-----)  ← más restrictivo
# Directorios:  777 - 027 = 750 (rwxr-x---)

# Con umask 077:
# Archivos:     666 - 077 = 600 (rw-------)  ← privado total
# Directorios:  777 - 077 = 700 (rwx------)

# Cambiar umask para la sesión actual
umask 027           # Nuevos archivos: 640, directorios: 750

# Cambiar umask permanentemente en ~/.bashrc o ~/.profile
echo "umask 027" >> ~/.bashrc

# Verificar:
touch prueba.txt && ls -la prueba.txt    # Debe mostrar los permisos calculados
```

**Usos prácticos del umask:**

```bash
# Servidor de archivos compartido: todos los archivos del grupo son editables
umask 002       # Archivos: 664, directorios: 775
# Uso: en /etc/profile o /etc/bash.bashrc para equipos

# Usuario root en scripts: máxima privacidad por defecto
umask 077       # Solo root puede leer lo que crea

# Verificar umask en un script
old_umask=$(umask)
umask 077
# ... crear archivos sensibles ...
umask $old_umask   # Restaurar
```

---

## 7.5 — Bits especiales: SUID, SGID y sticky

### SUID — Set User ID

Cuando se activa en un **ejecutable**, el proceso corre con el **UID del propietario del archivo**, no del usuario que lo ejecuta.

```bash
# Ejemplo clásico: el comando passwd
ls -la /usr/bin/passwd
# -rwsr-xr-x 1 root root 68208 /usr/bin/passwd
#    ↑ La 's' en el bit de ejecución del owner = SUID activo

# ¿Por qué passwd necesita SUID?
# - Tu usuario no puede escribir en /etc/shadow (solo root puede)
# - Pero cuando ejecutas 'passwd', el proceso se ejecuta como root
# - passwd valida que solo cambias TU contraseña
# - Esto es SUID usado correctamente (con validación interna)
```

```
Sin SUID:          Con SUID:
juan ejecuta       juan ejecuta
/usr/bin/passwd    /usr/bin/passwd
       ↓                  ↓
Proceso con        Proceso con
UID=1000 (juan)    UID=0 (root)
       ↓                  ↓
Intenta escribir   Puede escribir
/etc/shadow        /etc/shadow ✓
       ↓
Permission denied ✗
```

```bash
# Activar SUID
chmod u+s /ruta/ejecutable
chmod 4755 /ruta/ejecutable    # 4 = bit SUID

# Ver archivos con SUID (importante para auditorías de seguridad)
sudo find / -perm /4000 -type f 2>/dev/null | sort
# /usr/bin/chfn
# /usr/bin/chsh
# /usr/bin/gpasswd
# /usr/bin/mount
# /usr/bin/newgrp
# /usr/bin/passwd
# /usr/bin/sudo
# /usr/bin/su
# /usr/bin/umount
# /usr/bin/pkexec
```

:::danger **SUID: un vector de ataque**
Un binario con SUID y una vulnerabilidad es una escalada de privilegios garantizada. Cualquier binario con SUID que permita ejecutar comandos arbitrarios (shells, editores de texto, intérpretes) representa un riesgo crítico.

**Regla:** nunca pongas SUID en shells (`bash`, `sh`, `python`, `perl`), editores (`vim`, `nano`) ni intérpretes. Un `vim` con SUID permite ejecutar `!/bin/sh` y obtener una shell root.
:::

### SGID — Set Group ID

Tiene dos comportamientos según si se aplica a un **ejecutable** o a un **directorio**:

<Tabs>
<TabItem value="ejecutable" label="SGID en ejecutables">

El proceso corre con el **GID del grupo propietario del archivo**.

```bash
# Ejemplo: /usr/bin/write (comunicación entre terminales)
ls -la /usr/bin/write
# -rwxr-sr-x 1 root tty 14456 /usr/bin/write
#       ↑ La 's' en el bit de ejecución del grupo = SGID activo

# write necesita acceder al dispositivo /dev/pts/N
# que pertenece al grupo 'tty'

# Activar SGID en ejecutable
chmod g+s /ruta/ejecutable
chmod 2755 /ruta/ejecutable    # 2 = bit SGID
```

</TabItem>
<TabItem value="directorio" label="SGID en directorios">

Cuando se activa en un **directorio**, todos los archivos y subdirectorios creados dentro **heredan el grupo del directorio**, no el grupo primario del creador.

```bash
# Escenario: directorio compartido por un equipo
sudo mkdir /srv/proyecto
sudo chown root:desarrollo /srv/proyecto
sudo chmod 2775 /srv/proyecto   # 2 = SGID, 775 = rwxrwxr-x
ls -la /srv/
# drwxrwsr-x 2 root desarrollo 4096 /srv/proyecto
#       ↑ 's' en posición de ejecución del grupo = SGID activo

# Ahora cuando juan (miembro del grupo 'desarrollo') crea un archivo:
su juan
touch /srv/proyecto/nuevo.txt
ls -la /srv/proyecto/
# -rw-rw-r-- 1 juan desarrollo 0 nuevo.txt
#                  ↑ ¡El grupo es 'desarrollo', no el grupo primario de juan!

# Sin SGID, el archivo sería:
# -rw-rw-r-- 1 juan juan 0 nuevo.txt
# y el equipo no podría escribirlo (a menos que sean del mismo grupo)
```

**Caso de uso típico:** directorios de trabajo compartidos por equipos.

```bash
# Configurar un directorio colaborativo correctamente:
sudo mkdir /srv/equipo_web
sudo chown root:webteam /srv/equipo_web
sudo chmod 2770 /srv/equipo_web   # Solo el grupo puede leer/escribir/entrar
# + SGID para que todo lo creado pertenezca al grupo webteam
```

</TabItem>
</Tabs>

### Sticky bit — Protección en directorios compartidos

Cuando el sticky bit está activado en un directorio, **solo el propietario del archivo puede borrarlo**, aunque otros tengan permiso de escritura en el directorio.

```bash
# El ejemplo clásico: /tmp
ls -la / | grep tmp
# drwxrwxrwt 14 root root 4096 /tmp
#          ↑ La 't' = sticky bit activo

# Sin sticky bit en /tmp:
# Cualquier usuario podría borrar los archivos de otros usuarios
# (tienen w en el directorio, que permite borrar)

# Con sticky bit:
# Solo el propietario del archivo (o root) puede borrarlo
# aunque todos tengan escritura en el directorio

# Otro ejemplo: /var/tmp
ls -la / | grep -E "^d" | grep tmp

# Activar sticky bit
chmod +t /directorio/compartido
chmod 1777 /tmp   # 1 = sticky, 777 = rwxrwxrwx
chmod 1775 /srv/subidas/   # 1 = sticky, 775 = rwxrwxr-x

# Verificar: la 't' en la posición de ejecución de 'others'
ls -la /tmp
# drwxrwxrwt ... /tmp      ← t minúscula: sticky ON y x ON
# drwxrwxrwT ... /dir      ← T mayúscula: sticky ON pero x OFF (raro)
```

### Resumen de bits especiales

```
┌──────────────────────────────────────────────────────────────┐
│                    Bits especiales                           │
├──────────┬───────────────┬──────────────────────────────────┤
│ Bit      │ En ejecutable │ En directorio                    │
├──────────┼───────────────┼──────────────────────────────────┤
│ SUID (4) │ Ejecuta como  │ (ignorado en Linux)              │
│          │ propietario   │                                  │
├──────────┼───────────────┼──────────────────────────────────┤
│ SGID (2) │ Ejecuta como  │ Nuevos archivos heredan el grupo │
│          │ grupo dueño   │ del directorio                   │
├──────────┼───────────────┼──────────────────────────────────┤
│Sticky(1) │ (obsoleto en  │ Solo el propietario puede borrar │
│          │ Linux)        │ su propio archivo                │
└──────────┴───────────────┴──────────────────────────────────┘

Notación octal con bits especiales (4 dígitos):
chmod 4755  → SUID + rwxr-xr-x
chmod 2775  → SGID + rwxrwxr-x
chmod 1777  → Sticky + rwxrwxrwx
chmod 6755  → SUID+SGID + rwxr-xr-x (los dos juntos)

La 's' en ls vs la 'S':
s = el bit especial está ON y x también está ON
S = el bit especial está ON pero x está OFF (poco útil, puede ser un error)
```

---

## 7.6 — ACLs y atributos extendidos

### Cuándo los permisos clásicos son insuficientes

El modelo UGO tiene una limitación: **solo puede expresar permisos para un propietario, un grupo y "todos los demás"**. No puedes hacer:

- "María puede leer este archivo, pero Pedro no"
- "El equipo A puede editar y el equipo B solo leer"
- Sin mover archivos a un grupo especial

Para estos casos existen las **ACLs** (Access Control Lists).

```bash
# Verificar soporte de ACL en el sistema de archivos
mount | grep -E "ext4|xfs|btrfs" | grep acl
# Si no aparece "acl" explícitamente, ext4 y xfs lo soportan por defecto

# En fstab, asegurarse de que no está desactivado:
grep -E "ext4|xfs" /etc/fstab
# Si aparece "noacl", eliminarlo y volver a montar
```

### `getfacl` y `setfacl`

```bash
# Instalar si no está disponible
sudo apt install acl

# Ver ACL de un archivo
getfacl archivo.txt
# # file: archivo.txt
# # owner: juan
# # group: desarrollo
# user::rw-                 ← Propietario
# group::r--                ← Grupo
# other::r--                ← Otros
# (Si no hay ACL adicionales, es solo la vista de los permisos normales)

# AÑADIR PERMISOS A UN USUARIO ESPECÍFICO
setfacl --modify user:maria:rw archivo.txt
setfacl -m u:maria:rw archivo.txt          # Abreviado

# AÑADIR PERMISOS A UN GRUPO ESPECÍFICO
setfacl -m g:ops:rx directorio/

# Ver que la ACL se aplicó (aparece un '+' en ls -la)
ls -la archivo.txt
# -rw-rw-r--+ 1 juan desarrollo 4096 archivo.txt
#           ↑ El '+' indica que hay ACL extendida

getfacl archivo.txt
# # file: archivo.txt
# # owner: juan
# # group: desarrollo
# user::rw-
# user:maria:rw-             ← ¡María tiene rw!
# group::r--
# mask::rw-                  ← La máscara efectiva
# other::r--
```

### La máscara de ACL

La **máscara** limita los permisos máximos efectivos para grupos y usuarios adicionales:

```bash
# Ver la máscara actual
getfacl archivo.txt | grep mask

# Cambiar la máscara (limitar permisos efectivos)
setfacl -m mask::r-- archivo.txt
# Ahora maria solo puede leer, aunque su ACL diga rw-
# Los permisos "efectivos" son: ACL ∩ mask

getfacl archivo.txt
# user:maria:rw-            #effective:r--   ← Máscara limita a r--
```

### ACLs por defecto (para directorios)

Las ACLs por defecto se heredan automáticamente por nuevos archivos y subdirectorios:

```bash
# Poner ACL por defecto en un directorio
setfacl --default --modify user:maria:rw /srv/proyecto/
setfacl -d -m u:maria:rw /srv/proyecto/      # Abreviado

# A partir de ahora, cualquier archivo creado en /srv/proyecto/
# heredará automáticamente "user:maria:rw"

# Ver ACLs por defecto
getfacl /srv/proyecto/
# default:user::rwx
# default:user:maria:rw-
# default:group::rwx
# default:mask::rwx
# default:other::r-x

# Establecer ACL compleja en un solo comando
setfacl -m u:juan:rw,u:maria:r,g:ops:rwx,o::--- archivo.txt

# ELIMINAR entradas de ACL
setfacl --remove user:maria archivo.txt      # Quitar entrada de maria
setfacl -x u:maria archivo.txt               # Abreviado

# ELIMINAR TODAS las ACLs (volver a permisos clásicos)
setfacl --remove-all archivo.txt
setfacl -b archivo.txt                        # Abreviado

# Copiar ACL de un archivo a otro
getfacl origen.txt | setfacl --set-file=- destino.txt

# Aplicar ACL recursivamente
setfacl -R -m g:desarrollo:rwx /srv/proyecto/
setfacl -R -d -m g:desarrollo:rwx /srv/proyecto/   # + por defecto
```

### `chattr` — Atributos de archivo

`chattr` permite cambiar atributos especiales del sistema de archivos (ext2/3/4, xfs) que van **más allá de los permisos**. Afectan incluso a `root`.

```bash
# Ver atributos actuales
lsattr archivo.txt
# -------- archivo.txt    (sin atributos especiales)

# Atributos más importantes:
# i = immutable: NADIE puede modificar/borrar/renombrar (ni root)
# a = append-only: solo se puede añadir contenido (perfecto para logs)
# e = extents mapping (normalmente activo por defecto en ext4)
# A = no actualizar atime
# c = comprimido automáticamente
# u = undeletable: se guarda una copia al borrar

# INMUTABLE: proteger archivos críticos
sudo chattr +i /etc/resolv.conf    # Nadie puede modificar resolv.conf
sudo chattr +i /etc/hosts           # Ni root puede cambiarlo
lsattr /etc/resolv.conf
# ----i--- /etc/resolv.conf   ← 'i' = immutable

# Intentar modificar un archivo inmutable (incluso como root):
sudo echo "8.8.8.8 dns" >> /etc/resolv.conf
# bash: /etc/resolv.conf: Operation not permitted

# Quitar atributo inmutable (para hacer cambios legítimos)
sudo chattr -i /etc/resolv.conf
sudo nano /etc/resolv.conf
sudo chattr +i /etc/resolv.conf

# APPEND-ONLY: ideal para logs de seguridad
sudo chattr +a /var/log/auditoria.log
lsattr /var/log/auditoria.log
# -----a-- /var/log/auditoria.log

# Con append-only:
echo "registro" >> /var/log/auditoria.log   # ✓ Funciona
echo "borrar" > /var/log/auditoria.log      # ✗ Permission denied (truncado)
rm /var/log/auditoria.log                   # ✗ Permission denied

# Ver atributos de manera recursiva
lsattr -R /etc/ 2>/dev/null | grep "\-i\-"   # Ver archivos inmutables

# Aplicar a directorio completo
sudo chattr -R +i /srv/produccion-readonly/   # Directorio completamente inmutable
```

:::info **chattr vs. permisos clásicos**
Los permisos (`chmod`) son comprobados por el VFS (Virtual FileSystem). Los atributos de `chattr` son comprobados a nivel de sistema de archivos, más bajo. Por eso `chattr +i` bloquea incluso a `root`: el kernel rechaza la operación antes de comprobar los permisos UGO.
:::

---

## 7.7 — PAM: módulos de autenticación

### ¿Qué es PAM?

**PAM** (Pluggable Authentication Modules) es una capa de abstracción entre los servicios del sistema (login, ssh, sudo, su) y los mecanismos reales de autenticación.

Sin PAM, cada programa que necesita autenticar usuarios tendría que implementar su propia lógica. Con PAM, `login`, `sshd`, `sudo`, `su`, `passwd` y cualquier otro servicio usan los mismos módulos configurables.

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  Aplicaciones que autentican:                          │
│  login   sshd   sudo   su   passwd   lightdm   ...    │
│     │       │     │     │      │         │             │
│     └───────┴─────┴─────┴──────┴─────────┘             │
│                          │                             │
│              ┌───────────▼──────────────┐              │
│              │       libpam.so          │              │
│              │  (API de PAM)            │              │
│              └───────────┬──────────────┘              │
│                          │                             │
│         ┌────────────────┼────────────────┐            │
│         ▼                ▼                ▼            │
│  pam_unix.so    pam_pwquality.so  pam_faillock.so      │
│  pam_ldap.so    pam_limits.so     pam_google_auth.so   │
│  (contraseña    (calidad de       (bloqueo por          │
│   local)         contraseña)       intentos)           │
└────────────────────────────────────────────────────────┘
```

### Anatomía de `/etc/pam.d/`

```bash
ls /etc/pam.d/
# chfn  chpasswd  chsh  common-account  common-auth  common-password
# common-session  cron  login  newusers  other  passwd  runuser
# runuser-l  sshd  su  sudo  ...

# Los archivos "common-*" son incluidos por los demás
cat /etc/pam.d/common-auth
```

**Formato de las reglas PAM:**

```
tipo    control    módulo    [argumentos]

TIPOS:
auth        → ¿Es quien dice ser? (contraseña, biométrica, token)
account     → ¿Tiene permiso para acceder? (horarios, expiración)
password    → Cambiar credenciales
session     → Configurar entorno de sesión (home, límites, env)

CONTROLES:
required    → Debe pasar. Si falla, sigue evaluando pero el resultado final es fallo.
requisite   → Si falla, para inmediatamente. No evalúa más módulos.
sufficient  → Si pasa (y ningún required anterior falló), éxito inmediato.
optional    → El resultado no afecta al resultado final (solo para side-effects).
[success=N  → Control avanzado: si éxito, saltar N módulos.

EJEMPLOS COMUNES:
auth    required    pam_unix.so       → Verificar contraseña local (/etc/shadow)
auth    required    pam_faillock.so   → Bloquear tras N intentos fallidos
account required    pam_time.so       → Restricciones horarias
session required    pam_limits.so     → Aplicar límites de recursos
session required    pam_env.so        → Cargar variables de entorno
password required   pam_pwquality.so  → Validar calidad de nueva contraseña
```

### Caso práctico 1: Límites de recursos con `pam_limits`

```bash
# Configurar límites de recursos para usuarios/grupos
sudo nano /etc/security/limits.conf

# Formato: dominio tipo elemento valor
# Dominios: usuario, @grupo, * (todos), % (solo con maxlogins)

# Ejemplo de configuración:
# Limitar procesos del usuario juan
juan            hard    nproc           100

# Limitar archivos abiertos para el grupo desarrollo
@desarrollo     soft    nofile          4096
@desarrollo     hard    nofile          8192

# Limitar sesiones simultáneas
@remoto         hard    maxlogins       3

# Limitar tamaño de archivos de core
*               soft    core            0
*               hard    core            0

# Limitar uso de memoria
@usuarios       hard    memlock         64           # KB bloqueados en RAM

# Tipos:
# soft = límite suave (el usuario puede aumentar hasta el hard)
# hard = límite duro (no puede superar esto)
# -    = establece soft y hard al mismo valor

# Elementos:
# nproc    = número de procesos
# nofile   = archivos abiertos simultáneos
# maxlogins = sesiones simultáneas
# core     = tamaño de archivos core (0 = desactivar core dumps)
# fsize    = tamaño máximo de archivo creado
# memlock  = KB de memoria bloqueados en RAM
# cpu      = tiempo de CPU en minutos

# Verificar que PAM carga los límites (/etc/pam.d/common-session)
grep pam_limits /etc/pam.d/common-session
# session required    pam_limits.so

# Verificar límites actuales del proceso
ulimit -a
ulimit -n       # Archivos abiertos
ulimit -u       # Procesos máximos
```

### Caso práctico 2: Política de contraseñas con `pam_pwquality`

```bash
sudo nano /etc/security/pwquality.conf

# Opciones de pwquality:
minlen = 12              # Longitud mínima de 12 caracteres
minclass = 3             # Al menos 3 tipos diferentes (mayús, minus, dígitos, especiales)
maxrepeat = 3            # Máximo 3 caracteres repetidos consecutivos
maxsequence = 3          # Máximo 3 caracteres en secuencia (abc, 123)
dcredit = -1             # Al menos 1 dígito (negativo = mínimo requerido)
ucredit = -1             # Al menos 1 mayúscula
lcredit = -1             # Al menos 1 minúscula
ocredit = -1             # Al menos 1 carácter especial
dictcheck = 1            # Comprobar contra diccionarios
usercheck = 1            # No puede contener el nombre del usuario
gecoscheck = 1           # No puede contener datos del campo GECOS
badwords = contraseña password passwd 123456  # Palabras prohibidas
retry = 3                # Intentos antes de fallar

# En /etc/pam.d/common-password (ya debería estar configurado):
grep pwquality /etc/pam.d/common-password
# password requisite pam_pwquality.so retry=3

# Probar la política sin cambiar la contraseña:
# (simplemente intentar cambiar la contraseña de un usuario de prueba)
```

### Caso práctico 3: Bloqueo por intentos fallidos con `pam_faillock`

```bash
# pam_faillock (moderno, reemplaza a pam_tally2)
sudo nano /etc/security/faillock.conf

# Configuración de faillock:
deny = 5                # Bloquear tras 5 intentos fallidos
fail_interval = 900     # Ventana de tiempo: 900 segundos (15 min)
unlock_time = 600       # Tiempo de bloqueo: 600 segundos (10 min)
even_deny_root          # Aplicar también a root (¡cuidado!)
root_unlock_time = 60   # Root se desbloquea antes (60 seg)
audit                   # Registrar en syslog/journal
silent                  # No revelar si el usuario existe

# Ver estado de bloqueo de usuarios
sudo faillock
# juan:
# When                Type  Source                                           Valid
# 2024-06-01 10:23:45 RHOST 192.168.1.100                                    V
# 2024-06-01 10:23:47 RHOST 192.168.1.100                                    V
# (muestra los intentos fallidos)

# Ver estado de un usuario específico
sudo faillock --user juan

# Desbloquear manualmente
sudo faillock --user juan --reset
```

---

## 7.8 — Problemas reales y soluciones

### Problema 1: Me quedé sin acceso sudo

```bash
# SITUACIÓN: Accidentalmente te removiste del grupo sudo

# SOLUCIÓN A: Si puedes acceder físicamente o con KVM/VNC
# 1. Reiniciar en modo recovery:
#    En GRUB: tecla 'e' → añadir "single" o "init=/bin/bash" al final de la línea del kernel
# 2. En la shell de recovery:
mount -o remount,rw /       # Remontar como lectura-escritura
usermod -aG sudo juan       # Añadir de vuelta al grupo
# 3. Reiniciar normalmente

# SOLUCIÓN B: Otro usuario con sudo
sudo usermod -aG sudo juan

# SOLUCIÓN C: usar su con la contraseña de root (si root tiene contraseña)
su - root
usermod -aG sudo juan
exit

# PREVENCIÓN: Siempre verificar antes de cerrar la sesión
sudo -l           # Ver qué puedo hacer con sudo
groups            # Verificar que pertenezco al grupo sudo
```

### Problema 2: Archivos creados con el grupo incorrecto

```bash
# SITUACIÓN: Eres miembro del grupo 'desarrollo' pero los archivos
# se crean con tu grupo primario

# CAUSA: Te añadieron al grupo pero no has cerrado sesión
# (o el directorio no tiene SGID)

# VERIFICAR: ver tus grupos activos en esta sesión
id -G -n          # Grupos de la sesión actual
# Si el nuevo grupo no aparece, necesitas renovar la sesión

# SOLUCIÓN A: Renovar membresía de grupo sin cerrar sesión
newgrp desarrollo
# Ahora estás en una sub-shell con 'desarrollo' como grupo activo
touch archivo.txt
ls -la archivo.txt  # El grupo será 'desarrollo'

# SOLUCIÓN B: Activar SGID en el directorio compartido
sudo chmod g+s /srv/proyecto/
# A partir de ahora, todos los archivos heredan el grupo del directorio

# SOLUCIÓN C: Cerrar sesión y volver a abrir (la forma definitiva)
```

### Problema 3: Permiso denegado en script ejecutable

```bash
# SITUACIÓN: tienes un script.sh con chmod 755 pero da "Permission denied"

# DIAGNÓSTICO:
ls -la script.sh       # ¿Tiene el bit x?
file script.sh         # ¿Tiene shebang correcto?
head -1 script.sh      # ¿La primera línea es #!/bin/bash o similar?

# CAUSAS COMUNES:

# 1. No tiene bit de ejecución (aunque parezca que sí)
chmod +x script.sh     # Añadir ejecución

# 2. El shebang es incorrecto o apunta a un ejecutable inexistente
head -1 script.sh
# #!/usr/bin/python    ← Python está en /usr/bin/python3 en tu sistema
# Solución: corregir el shebang o crear symlink

# 3. Está en un sistema de archivos montado con 'noexec'
mount | grep $(df -P script.sh | tail -1 | awk '{print $1}')
# Si aparece 'noexec', ese filesystem no permite ejecución
# Solución: mover el script a un filesystem sin noexec
# (típico en /tmp, /var/tmp, particiones NAS)

# 4. Los permisos están bien pero el directorio no tiene x
ls -la $(dirname script.sh)  # Ver permisos del directorio padre

# 5. SELinux o AppArmor bloqueando
dmesg | grep -i "avc: denied"     # SELinux
cat /var/log/syslog | grep apparmor  # AppArmor
```

### Problema 4: Quiero que dos usuarios compartan archivos

```bash
# ESCENARIO: juan y maria trabajan juntos en /srv/proyecto/
# Necesitan leer y escribir los archivos del otro

# OPCIÓN 1: Grupo compartido (solución clásica)
sudo groupadd proyecto-web
sudo usermod -aG proyecto-web juan
sudo usermod -aG proyecto-web maria
sudo chown -R root:proyecto-web /srv/proyecto/
sudo chmod -R 775 /srv/proyecto/
sudo chmod g+s /srv/proyecto/   # SGID: nuevos archivos heredan el grupo
# Requerir que ambos tengan umask 002:
# echo "umask 002" >> /home/juan/.bashrc
# echo "umask 002" >> /home/maria/.bashrc

# OPCIÓN 2: ACL (más granular)
sudo setfacl -R -m u:maria:rwx /srv/proyecto/juan-archivos/
sudo setfacl -R -m u:juan:rwx /srv/proyecto/maria-archivos/
sudo setfacl -R -d -m u:maria:rwx /srv/proyecto/juan-archivos/  # + herencia
```

---

## Anexos

### A. Permisos de referencia rápida

```
Permisos más comunes y su uso:

600  rw-------  Archivos privados del usuario (claves SSH, .pgpass)
640  rw-r-----  Logs y configuraciones que el grupo puede leer
644  rw-r--r--  Archivos de texto públicos (HTML, imágenes, docs)
660  rw-rw----  Archivos compartidos solo con el grupo
664  rw-rw-r--  Archivos colaborativos (con umask 002)
700  rwx------  Directorios privados del usuario
750  rwxr-x---  Directorios accesibles al grupo
755  rwxr-xr-x  Directorios y ejecutables públicos
775  rwxrwxr-x  Directorios colaborativos (con SGID)
777  rwxrwxrwx  ¡EVITAR! Todos pueden hacer todo

Permisos especiales más comunes:
4755  rwsr-xr-x  Ejecutable SUID (como passwd)
2775  rwxrwsr-x  Directorio SGID colaborativo
1777  rwxrwxrwt  /tmp y similares (sticky bit)
```

### B. Comandos de auditoría de seguridad

```bash
# 1. Encontrar binarios con SUID
sudo find / -xdev -perm /4000 -type f 2>/dev/null | sort

# 2. Encontrar binarios con SGID
sudo find / -xdev -perm /2000 -type f 2>/dev/null | sort

# 3. Encontrar archivos world-writable (peligrosos)
sudo find / -xdev -perm /o+w -type f 2>/dev/null | grep -v proc

# 4. Encontrar directorios world-writable sin sticky bit
sudo find / -xdev -type d -perm /o+w ! -perm /1000 2>/dev/null

# 5. Encontrar archivos sin propietario (huérfanos)
sudo find / -xdev -nouser -o -nogroup 2>/dev/null | head -20

# 6. Ver usuarios con UID 0 (solo debería ser root)
awk -F: '$3 == 0 {print "UID 0:", $1}' /etc/passwd

# 7. Ver usuarios sin contraseña (riesgo)
sudo awk -F: '$2 == "" {print "SIN CONTRASEÑA:", $1}' /etc/shadow

# 8. Ver últimas modificaciones de /etc/passwd y /etc/shadow
stat /etc/passwd /etc/shadow

# 9. Verificar integridad del sudoers
sudo visudo -c

# 10. Revisar quién tiene acceso sudo
getent group sudo
grep -v "^#" /etc/sudoers 2>/dev/null | grep -v "^$" | grep -v "Defaults"
ls /etc/sudoers.d/ 2>/dev/null
```

### C. Referencias cruzadas entre módulos

```
◀ Módulo 01 — Introducción al mundo Linux
│  Sección 1.3: "Seguridad por diseño" — el modelo multiusuario
│  → Este módulo es la implementación técnica de ese concepto
│  Los anillos de protección del kernel (ring 0 vs ring 3)
│  → SUID/SGID permiten cruzar temporalmente esos límites

◀ Módulo 04 — Sistema de archivos
│  Sección 4.5: Los tipos de archivo y el primer carácter de ls -la
│  → Los 9 caracteres de permisos se estudian aquí en profundidad
│  Los inodos guardan los bits de permisos, UID y GID

◀ Módulo 05 — Procesamiento de texto
│  awk -F: para parsear /etc/passwd y /etc/shadow
│  grep para auditar configuraciones de seguridad
│  find con -perm para buscar SUID/SGID (visto en §4.6)

◀ Módulo 06 — Editores de texto
│  visudo usa $EDITOR (vim/nano) para editar sudoers con validación
│  :w !sudo tee % para guardar archivos protegidos desde vim

▶ Módulo 09 — Procesos, servicios y systemd
│  → Cada servicio corre como un usuario del sistema (www-data, mysql)
│  → Los permisos de este módulo determinan qué puede hacer cada servicio

▶ Módulo 11 — Redes en Linux
│  → El grupo 'netdev' controla quién puede gestionar interfaces
│  → iptables/nftables requieren CAP_NET_ADMIN o ser root

▶ Módulo 14 — Seguridad y hardening
│  → Este módulo es el prerequisito directo: SUID audit, umask, PAM
│  → SELinux/AppArmor como capa adicional sobre los permisos
```

---

## Referencias y Bibliografía

### Documentación oficial

1. **Linux man pages: chmod(1), chown(1), chgrp(1), umask(1)**  
   https://man7.org/linux/man-pages/man1/chmod.1.html

2. **Linux man pages: useradd(8), usermod(8), userdel(8), passwd(1)**  
   https://man7.org/linux/man-pages/man8/useradd.8.html

3. **sudoers(5) — Linux man page**  
   https://man7.org/linux/man-pages/man5/sudoers.5.html  
   La referencia completa de la sintaxis de sudoers.

4. **acl(5) — POSIX ACL man page**  
   https://man7.org/linux/man-pages/man5/acl.5.html

5. **PAM documentation**  
   http://www.linux-pam.org/Linux-PAM-html/  
   Documentación oficial del proyecto Linux-PAM.

6. **chattr(1) y lsattr(1) — man pages**  
   https://man7.org/linux/man-pages/man1/chattr.1.html

7. **Filesystem Hierarchy Standard — /etc/passwd format**  
   https://refspecs.linuxfoundation.org/FHS_3.0/fhs-3.0.html

### Estándares y especificaciones

8. **POSIX.1-2017: File Permissions**  
   https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap10.html

9. **POSIX.1-2017: User and Group IDs**  
   https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap04.html

### Recursos de seguridad

10. **Linux Privilege Escalation via SUID** — HackTricks  
    https://book.hacktricks.xyz/linux-hardening/privilege-escalation#suid-and-sgid  
    Perspectiva defensiva: qué SUID pueden ser peligrosos.

11. **CIS Benchmark for Ubuntu Linux**  
    https://www.cisecurity.org/benchmark/ubuntu_linux  
    Guía de hardening que incluye configuraciones de PAM, umask y permisos.

12. **OWASP Testing Guide: Testing for Account Lockout**  
    https://owasp.org/www-project-web-security-testing-guide/  
    Cómo verificar que pam_faillock está correctamente configurado.

### Libros de referencia

13. **Linux System Administration** — Tom Adelstein & Bill Lubanovic  
    O'Reilly (2007). Capítulos 6-7: cuentas de usuario y permisos.

14. **Unix and Linux System Administration Handbook** — Nemeth et al.  
    5ª edición (2017). Capítulo 7: Access Control y Chapter 8: User Management.

15. **The Linux Command Line** — William Shotts  
    https://linuxcommand.org/tlcl.php — Capítulo 9: Permissions.

16. **Linux Security Cookbook** — Daniel J. Barrett  
    O'Reilly (2003). Capítulos 1-4: autenticación, sudo y permisos.

17. **Practical Linux Security Cookbook** — Tajinder Kalsi  
    Packt (2018). Capítulo 3: PAM y gestión de contraseñas.

---

## Preguntas de autoevaluación

1. ¿Qué diferencia hay entre UID real, UID efectivo y UID guardado? ¿Cuándo difieren?
2. Explica qué contiene cada campo de una línea de `/etc/passwd` y `/etc/shadow`.
3. ¿Cuál es la diferencia entre `useradd` y `adduser` en Debian/Ubuntu?
4. ¿Qué hace `usermod -aG docker juan`? ¿Qué pasaría si olvidaras la `-a`?
5. ¿Por qué `su -` es casi siempre mejor que `su`?
6. Explica la sintaxis de una regla en `/etc/sudoers` con todos sus campos.
7. ¿Qué significa `NOPASSWD` en sudoers y cuándo es apropiado usarlo?
8. ¿Cuál es la diferencia entre los permisos `r`, `w`, `x` en un **archivo** vs. en un **directorio**?
9. Si un directorio tiene permisos `d--xr--r--`, ¿qué puede hacer cada sujeto?
10. Explica con detalle cómo funciona el bit SUID en `/usr/bin/passwd`.
11. ¿Cuándo usarías SGID en un directorio en vez de simplemente `chmod 777`?
12. ¿Cuándo son insuficientes los permisos clásicos UGO y necesitas ACLs?
13. ¿Qué diferencia hay entre `chattr +i` y `chmod 444`? ¿Cuál es más fuerte?
14. Explica los cuatro tipos de control de PAM: `required`, `requisite`, `sufficient`, `optional`.

---

## Laboratorios prácticos

### Lab 7.1 — Explorar el sistema de usuarios

```bash
# 1. Ver tu identidad completa
id
groups

# 2. Ver todos los usuarios del sistema y clasificarlos
awk -F: '{
    if ($3 == 0) print "ROOT:", $1
    else if ($3 < 1000) print "SISTEMA:", $1, "(UID:"$3")"
    else if ($3 < 65534) print "HUMANO:", $1, "(UID:"$3")"
}' /etc/passwd

# 3. Ver usuarios con shell interactiva
awk -F: '$7 ~ /bash|zsh|fish/ {print $1, $7}' /etc/passwd

# 4. Ver el historial de logins
last | head -15
```

### Lab 7.2 — Crear y gestionar usuarios

```bash
# 1. Crear usuario de prueba (requiere sudo)
sudo useradd -m -s /bin/bash -c "Usuario de Prueba" testuser
sudo passwd testuser    # Establecer contraseña

# 2. Ver que se creó correctamente
grep testuser /etc/passwd
grep testuser /etc/group
ls -la /home/testuser/

# 3. Añadir a un grupo
sudo usermod -aG sudo testuser
groups testuser

# 4. Bloquear la cuenta
sudo usermod -L testuser
sudo passwd --status testuser    # Debe mostrar 'L'

# 5. Desbloquear
sudo usermod -U testuser

# 6. Eliminar el usuario de prueba
sudo userdel -r testuser
grep testuser /etc/passwd   # No debe aparecer
ls /home/ | grep testuser   # El home debe estar borrado
```

### Lab 7.3 — Permisos en la práctica

```bash
# 1. Crear estructura de archivos para el lab
mkdir -p /tmp/lab_permisos/{publico,privado,compartido}
echo "público" > /tmp/lab_permisos/publico/info.txt
echo "privado" > /tmp/lab_permisos/privado/secreto.txt

# 2. Aplicar permisos apropiados
chmod 755 /tmp/lab_permisos/publico/
chmod 644 /tmp/lab_permisos/publico/info.txt
chmod 700 /tmp/lab_permisos/privado/
chmod 600 /tmp/lab_permisos/privado/secreto.txt

# 3. Verificar
ls -la /tmp/lab_permisos/publico/
ls -la /tmp/lab_permisos/privado/

# 4. Calcular umask
umask          # Ver umask actual
touch /tmp/lab_permisos/nuevo_con_umask.txt
ls -la /tmp/lab_permisos/nuevo_con_umask.txt
# ¿Los permisos coinciden con lo que esperabas?
```

### Lab 7.4 — Bits especiales y ACLs

```bash
# 1. Crear directorio colaborativo con SGID
sudo mkdir /tmp/lab_sgid
sudo chmod 2775 /tmp/lab_sgid
sudo chown root:$(id -gn) /tmp/lab_sgid

ls -la /tmp/ | grep lab_sgid   # Debe mostrar 's' en el bit de grupo

# 2. Crear un archivo y verificar que hereda el grupo
touch /tmp/lab_sgid/prueba_sgid.txt
ls -la /tmp/lab_sgid/   # ¿El grupo del archivo es el del directorio?

# 3. Aplicar ACL a un archivo
touch /tmp/lab_acl.txt
echo "contenido de prueba" > /tmp/lab_acl.txt
chmod 640 /tmp/lab_acl.txt

# Dar acceso a otro usuario específico (usa tu propio usuario como ejemplo)
setfacl -m u:$(whoami):r /tmp/lab_acl.txt
getfacl /tmp/lab_acl.txt      # Ver la ACL resultante
ls -la /tmp/lab_acl.txt       # Debe mostrar '+'

# 4. Probar chattr
touch /tmp/lab_inmutable.txt
echo "contenido original" > /tmp/lab_inmutable.txt
sudo chattr +i /tmp/lab_inmutable.txt
lsattr /tmp/lab_inmutable.txt   # Debe mostrar 'i'

echo "intentando modificar" >> /tmp/lab_inmutable.txt   # Debe fallar
sudo chattr -i /tmp/lab_inmutable.txt   # Quitar para limpiar
rm /tmp/lab_inmutable.txt
```

### Lab 7.5 — Sudoers

```bash
# 1. Ver tu configuración sudo actual
sudo -l

# 2. Crear una regla de sudo para un comando específico
# (en un entorno de práctica)
sudo visudo -f /etc/sudoers.d/lab_practica
# Añadir la línea (cambia TUUSUARIO por tu nombre de usuario):
# TUUSUARIO ALL=(root) NOPASSWD: /usr/bin/journalctl, /bin/systemctl status *

# 3. Verificar que funciona
sudo -l          # Debe mostrar los nuevos permisos
sudo journalctl -n 5    # Debe funcionar sin contraseña

# 4. Verificar que la auditoría funciona
sudo journalctl _COMM=sudo | tail -5
# Debe mostrar tu uso reciente de sudo

# 5. Limpiar
sudo rm /etc/sudoers.d/lab_practica
```

---

## Resumen del módulo

✅ **Modelo de identidad:** UID/GID, UID real vs. efectivo, `/etc/passwd`, `/etc/shadow`, `/etc/group`  
✅ **Gestión de cuentas:** `useradd`/`adduser`, `usermod -aG`, `userdel`, `/etc/skel`, `chage`  
✅ **Grupos:** `groupadd`, `gpasswd`, `newgrp` para cambiar GID sin cerrar sesión  
✅ **sudo:** diferencia con `su -`, sintaxis de `/etc/sudoers`, `visudo`, `/etc/sudoers.d/`, auditoría  
✅ **Permisos clásicos:** UGO, significado diferenciado en archivos vs. directorios, `chmod` simbólico y octal, `umask`  
✅ **Bits especiales:** SUID (ejecutar como propietario), SGID en dirs (heredar grupo), sticky (proteger en /tmp)  
✅ **ACLs:** `setfacl`/`getfacl`, permisos a usuarios y grupos adicionales, ACLs por defecto, máscara  
✅ **chattr:** `+i` inmutable (ni root puede modificar), `+a` append-only para logs de seguridad  
✅ **PAM:** arquitectura, `/etc/pam.d/`, `pam_limits`, `pam_pwquality`, `pam_faillock`  

**Próximo paso:** [Módulo 08 — Gestión de software](/gestion-de-software). Aprenderás a instalar, actualizar y gestionar paquetes con APT, DNF y Flatpak — usando los permisos de este módulo para entender por qué `apt install` requiere sudo.

---

**Última actualización:** 2024-06  
**Versión:** 1.0  
**Estado:** ✅ Listo para enseñanza
