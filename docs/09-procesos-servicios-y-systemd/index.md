---
title: "Módulo 09 — Procesos, servicios y systemd"
sidebar_label: "09 · Procesos y systemd"
description: Gestión de procesos, señales, prioridades, cgroups, systemd/systemctl, journalctl, escritura de unidades propias y tareas programadas con cron y timers.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Módulo 09 — Procesos, servicios y systemd

## Introducción

Todo lo que ocurre en Linux ocurre dentro de un **proceso**. Cada vez que abres una terminal, cada vez que el servidor web responde una petición, cada vez que un trabajo de cron ejecuta un backup: todo es un proceso con un PID, un estado, recursos asignados y una jerarquía de padre a hijo.

Este módulo tiene dos partes complementarias. La primera — procesos — te da el vocabulario para *observar y controlar* lo que está ocurriendo en el sistema en tiempo real. La segunda — systemd — te da el sistema para *definir y gestionar* lo que debe ocurrir de forma persistente, incluso tras reinicios.

En los módulos anteriores ya tocaste ambos mundos: en el [Módulo 07](/usuarios-grupos-y-permisos) configuraste PAM, cuyos módulos son invocados por `systemd-logind`; en el [Módulo 08](/gestion-de-software) instalaste software que dejó servicios corriendo. Aquí entenderás en profundidad lo que hay detrás.

### Objetivos de aprendizaje

Al finalizar este módulo, serás capaz de:

- ✅ Explicar el modelo de procesos de Linux: PID/PPID, estados, fork/exec
- ✅ Inspeccionar procesos con `ps`, `top`, `htop`, `btop`, `pgrep`, `lsof`
- ✅ Enviar señales con `kill`/`pkill` y entender qué hace cada señal
- ✅ Gestionar primer/segundo plano y hacer procesos independientes con `nohup`
- ✅ Ajustar prioridades de CPU con `nice`/`renice` y de I/O con `ionice`
- ✅ Entender cgroups como base del control de recursos
- ✅ Gestionar servicios con `systemctl` (start/stop/enable/disable/status)
- ✅ Leer y filtrar logs con `journalctl`
- ✅ Escribir unidades `.service` propias con reinicio automático y hardening
- ✅ Programar tareas con crontab, `/etc/cron.d` y timers de systemd

---

## 9.1 — Qué es un proceso

### El árbol de procesos

Cuando el kernel arranca, crea un único proceso: **PID 1** (en sistemas modernos: `systemd`). Todos los demás procesos del sistema son descendientes de él. Esta jerarquía padre-hijo es la columna vertebral del sistema.

```
PID 1 — systemd
├── PID 432 — sshd (servidor SSH)
│   └── PID 1024 — sshd (sesión de juan)
│       └── PID 1025 — bash (shell de juan)
│           └── PID 1876 — ps aux (tú ejecutando ps)
├── PID 512 — nginx (servidor web, master)
│   ├── PID 513 — nginx worker
│   └── PID 514 — nginx worker
├── PID 601 — mariadbd (servidor de base de datos)
└── PID 700 — cron (demonio de tareas programadas)
```

```bash
# Ver el árbol completo
pstree                 # árbol compacto
pstree -p              # con PIDs
pstree -pu             # con PIDs y usuarios
pstree juan            # árbol de procesos del usuario juan

# Ver información básica de tu shell
echo "Mi PID: $$"
echo "PID del padre: $PPID"
```

### El modelo fork/exec

Todo proceso nuevo nace a través de dos llamadas al sistema:

```
fork()  →  copia exacta del proceso padre (mismo código, misma memoria)
exec()  →  reemplaza el contenido del proceso por un programa nuevo

Ejemplo: bash ejecuta 'ls'

  bash (PID 1025)
       │
       │ fork()
       ▼
  bash COPIA (PID 1876)    ← clon exacto de bash
       │
       │ exec("/bin/ls")
       ▼
    ls (PID 1876)          ← mismo PID, nuevo programa
```

### Estados de un proceso

```
Estados en Linux (visibles en ps con STAT o S):

  R — Running/Runnable: ejecutándose o listo en la cola de CPU
  S — Sleeping (interruptible): esperando evento (I/O, timer, señal)
  D — Disk sleep (uninterruptible): esperando I/O de disco, NO puede ser interrumpido
      ↑ Muchos procesos en D = problema de I/O (disco lento, NFS colgado)
  T — sTopped: pausado con SIGSTOP o Ctrl+Z
  Z — Zombie: terminó pero el padre no recogió su código de salida
      ↑ Pocos zombies son normales; muchos = bug en el padre
  I — Idle kernel thread (Linux 4.14+)

Modificadores adicionales:
  s — session leader (creó una nueva sesión)
  + — en el grupo de procesos en primer plano
  l — multihilo (multi-threaded)
  < — prioridad alta (nice negativo)
  N — prioridad baja (nice positivo)
```

```bash
# Verificar estados en tu sistema ahora mismo
ps aux --sort=stat | head -20
ps aux | awk '$8 ~ /^D/' | head    # Procesos en D (esperando I/O)
ps aux | awk '$8 ~ /^Z/'           # Procesos zombie
```

### El directorio `/proc`

Cada proceso tiene un directorio en `/proc/<pid>/` con información en tiempo real extraída del kernel. **No es un sistema de archivos real**: el kernel lo genera al vuelo cuando lo lees.

```bash
# Explorar el proceso actual (la shell)
ls /proc/$$
cat /proc/$$/status       # Estado detallado: PID, PPID, UID, memoria...
cat /proc/$$/cmdline | tr '\0' ' '  # Comando que nos lanzó (args separados por \0)
cat /proc/$$/environ | tr '\0' '\n' | head  # Variables de entorno
ls -la /proc/$$/fd/       # Descriptores de archivo abiertos
cat /proc/$$/maps | head  # Mapa de memoria virtual

# Archivos globales útiles
cat /proc/cpuinfo          # Información de las CPUs
cat /proc/meminfo          # Información de memoria
cat /proc/loadavg          # Carga del sistema (los tres números de uptime)
cat /proc/uptime           # Segundos que lleva encendido el sistema
cat /proc/net/dev          # Estadísticas de red por interfaz
```

---

## 9.2 — Observar procesos

### `ps` — El comando definitivo

```bash
# Las dos formas canónicas (la más común cada una en su tradición)
ps aux         # Estilo BSD: a=todos los terminales, u=formato usuario, x=sin terminal
ps -ef         # Estilo POSIX: -e=todos, -f=formato completo

# Salida de ps aux:
# USER    PID  %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
# root      1   0.0  0.1 169652  8124 ?        Ss   Jun01   0:03 /sbin/init
# └──────────────────────────────────────────────────────────────────────┘
# VSZ = memoria virtual total (incluye compartida, ficheros mapeados...)
# RSS = Resident Set Size: memoria RAM realmente usada
# TTY = terminal asociado (? = sin terminal, demonio)
```

```bash
# FORMATOS PERSONALIZADOS: la opción -o es muy potente
ps -eo pid,ppid,user,stat,pcpu,pmem,comm --sort=-pcpu | head -15
# -e = todos, -o = campos personalizados, --sort=-pcpu = orden descendente por CPU

# Ver un proceso específico
ps -fp 1024                          # Por PID
ps -C nginx                          # Por nombre del comando
ps -u www-data                       # Todos los procesos del usuario www-data

# El árbol con ps
ps auxf                              # Árbol ASCII en ps (forest)
ps -ejH | head -30                   # Alternativa

# Campos más útiles de -o:
# pid ppid pgid sid  → identifiers
# user uid           → propietario
# stat s             → estado
# pcpu %cpu pmem %mem → recursos
# vsz rss            → memoria
# comm cmd args      → comando (comm=solo nombre, cmd=con path, args=con argumentos)
# lstart start etime → tiempos (lstart=inicio completo, etime=tiempo transcurrido)
# nice ni            → prioridad

# Ver cuánto tiempo lleva corriendo cada proceso
ps -eo pid,comm,etime --sort=-etime | head -10
```

### `top` — Monitor interactivo clásico

```bash
top    # Lanzar (actualiza cada 3s por defecto)

# Atajos dentro de top:
# q         → salir
# h         → ayuda
# 1         → mostrar cada CPU individual
# M         → ordenar por memoria (más usado)
# P         → ordenar por CPU (por defecto)
# T         → ordenar por tiempo de CPU acumulado
# R         → invertir el orden
# k         → matar proceso (pide PID y señal)
# r         → renice (cambiar prioridad)
# u         → filtrar por usuario
# f         → configurar campos visibles
# W         → guardar la configuración en ~/.toprc
# d         → cambiar el intervalo de refresco
# z         → colorear
# Espacio   → refrescar ahora

# Ejecutar top con opciones:
top -d 1           # Refrescar cada segundo
top -u www-data    # Solo procesos de www-data
top -b -n 1        # Batch mode: una sola captura (ideal para scripts)
top -b -n 1 | head -20  # Las 20 primeras líneas en batch
```

### `htop` y `btop` — Monitores modernos

```bash
# htop: monitor mejorado (colores, mouse, árbol, selección múltiple)
sudo apt install htop
htop

# Atajos en htop:
# F1/h    → ayuda
# F2      → configuración (añadir columnas, colores, etc.)
# F3      → buscar proceso por nombre
# F4      → filtrar por nombre
# F5      → vista árbol
# F6      → ordenar por columna
# F9      → enviar señal al proceso seleccionado
# F10/q   → salir
# Espacio → marcar proceso (para señalizar varios a la vez)
# t       → árbol/plano
# u       → filtrar por usuario
# l       → archivos abiertos del proceso (llama a lsof)

# btop: el más moderno, con gráficos de red/disco/CPU/memoria
sudo apt install btop
btop
```

### `pgrep`, `pidof` y `lsof`

```bash
# pgrep: buscar PIDs por nombre o atributos
pgrep nginx                    # PIDs de todos los procesos llamados nginx
pgrep -l nginx                 # Con nombre
pgrep -a nginx                 # Con línea de comando completa
pgrep -u www-data              # Todos los procesos del usuario www-data
pgrep -P 1                     # Hijos directos del PID 1
pgrep -x bash                  # Solo si el nombre exacto es 'bash'

# pidof: más simple, solo por nombre exacto
pidof nginx
pidof systemd

# lsof: List Open Files — quién tiene abierto qué
# Recuerda del Módulo 04: en Linux todo es un archivo
sudo lsof | head                      # Todos los archivos abiertos (¡miles!)
sudo lsof -p 1024                     # Archivos abiertos por el PID 1024
sudo lsof -u juan                     # Todos los archivos de juan
sudo lsof /var/log/nginx/access.log   # ¿Quién tiene abierto este archivo?
sudo lsof -i :80                      # ¿Qué proceso escucha en el puerto 80?
sudo lsof -i :80,443                  # Puertos 80 y 443
sudo lsof -i TCP                      # Todas las conexiones TCP
sudo lsof +D /var/www/html/           # Todos los archivos abiertos en ese directorio

# ss: alternativa moderna a netstat para ver sockets
ss -tulnp                   # TCP/UDP listening, números, con proceso
ss -tulnp | grep :443       # ¿Quién escucha en 443?
```

---

## 9.3 — Señales: controlar procesos

### ¿Qué es una señal?

Una señal es una **notificación asíncrona** enviada a un proceso. El kernel la entrega y el proceso puede: manejarla (ejecutar una función), ignorarla, o aceptar la acción por defecto.

```
Las señales más importantes:

Nº  Nombre      Acción por defecto   Descripción
─────────────────────────────────────────────────────────────────
 1  SIGHUP      Terminar             "Hang Up": terminal cerrada.
                                     Los demonios lo usan para RECARGAR CONFIG
 2  SIGINT      Terminar             Ctrl+C (interrupción de teclado)
 3  SIGQUIT     Core dump            Ctrl+\ (quit con volcado)
 9  SIGKILL     Terminar FORZADO     No puede ser ignorada ni capturada.
                                     Mata instantáneamente. Última opción.
15  SIGTERM     Terminar             La señal "educada" de terminación.
                                     El proceso puede limpiarse antes de morir.
                                     SIEMPRE inténtalo antes de SIGKILL.
17  SIGCHLD     Ignorar              Hijo terminó (el padre debe hacer wait())
18  SIGCONT     Continuar            Reanudar proceso detenido (SIGSTOP)
19  SIGSTOP     Detener FORZADO      No puede ser ignorada. Pausa el proceso.
20  SIGTSTP     Detener              Ctrl+Z (puede ser ignorada)
10  SIGUSR1     Terminar             Señal definida por el usuario 1
12  SIGUSR2     Terminar             Señal definida por el usuario 2
                                     (muchos demonios las usan para acciones custom)
```

```bash
# kill: enviar señales (el nombre es engañoso: no solo mata)
kill PID              # Envía SIGTERM (15) al proceso
kill -15 PID          # Explícito: SIGTERM
kill -9 PID           # SIGKILL: matar a la fuerza
kill -1 PID           # SIGHUP: recargar configuración (nginx, sshd, etc.)
kill -TERM PID        # Por nombre en lugar de número

# Listar todas las señales
kill -l

# pkill: kill por nombre en lugar de PID (más práctico)
pkill nginx                    # SIGTERM a todos los procesos llamados nginx
pkill -9 nginx                 # SIGKILL
pkill -HUP nginx               # SIGHUP (recarga)
pkill -u juan bash             # SIGTERM a las shells bash de juan
pkill -f "python script.py"    # Busca en la línea de comando completa

# killall: como pkill pero requiere nombre exacto
killall nginx
killall -9 nginx
killall -HUP rsyslogd          # Recargar rsyslogd

# El flujo correcto para matar un proceso que no responde:
kill PID                       # 1. Intenta SIGTERM (educado)
sleep 5                        # 2. Espera 5 segundos
kill -9 PID                    # 3. Si sigue vivo: SIGKILL
```

:::danger **SIGKILL es la última opción**
`kill -9` termina el proceso sin darle oportunidad de limpiar: los ficheros temporales no se borran, las conexiones de base de datos no se cierran, los buffers no se vacían, las transacciones no se completan. Siempre usa `SIGTERM` primero y espera unos segundos.
:::

---

## 9.4 — Primer plano, segundo plano y persistencia

### Gestión de trabajos (job control)

```bash
# Ejecutar en segundo plano desde el principio
sleep 100 &           # El & lo manda al background; muestra [1] PID
sleep 200 &           # Otro trabajo

# Ver trabajos de la sesión
jobs                  # Lista: [1] Running   sleep 100 &
jobs -l               # Con PIDs

# Mover entre planos
fg                    # Traer al primer plano el último trabajo
fg %1                 # Traer el trabajo [1] al primer plano
bg %2                 # Mandar el trabajo [2] al background (si estaba pausado)

# Ctrl+Z: pausar (SIGTSTP) el proceso en primer plano y mandarlo a jobs
# Ctrl+C: terminar (SIGINT) el proceso en primer plano

# Patrón típico:
./mi-programa-largo    # Lanzas y ves que tarda
Ctrl+Z                 # Lo pausas → aparece [1] Stopped
bg %1                  # Lo reanuadas en background
# ahora puedes seguir usando la terminal
fg %1                  # Cuando quieras volver a verlo
```

### Sobrevivir al cierre de la terminal: `nohup` y `disown`

Cuando cierras la terminal, la shell envía `SIGHUP` a todos sus procesos hijos. Para evitar que mueran:

```bash
# nohup: lanzar ignorando SIGHUP (redirige stdout/stderr a nohup.out)
nohup ./backup.sh &
nohup ./servidor.py > servidor.log 2>&1 &

# disown: separar un proceso que ya está corriendo de la shell actual
sleep 9999 &           # Lanzamos en background
jobs                   # Aparece como [1]
disown %1              # Lo separamos: ya no recibirá SIGHUP
jobs                   # Ya no aparece en jobs, pero sigue vivo
ps aux | grep sleep    # Podemos verlo con ps

# disown -h: marcar para ignorar SIGHUP pero conservarlo en jobs
disown -h %1

# La alternativa robusta: usar tmux o screen (Módulo 03)
# Diferencia clave:
# nohup/disown: proceso corre, pero no puedes volver a verlo
# tmux/screen:  proceso corre EN una sesión a la que puedes reconectar
```

---

## 9.5 — Prioridades y recursos

### Prioridades de CPU: `nice` y `renice`

El scheduler del kernel asigna tiempo de CPU según la **prioridad**. Linux usa el rango de -20 (máxima prioridad, "el proceso más importante") a +19 (mínima, "usa CPU solo cuando nadie más la quiere").

```
nice value:  -20 ... 0 ... +19
              ↑           ↑
           prioritario   cortés
           (solo root)

Por defecto: 0
Usuarios normales: solo pueden reducir su prioridad (0 → 1..19)
root: puede usar cualquier valor
```

```bash
# Lanzar un proceso con prioridad baja (recomendado para backups, compilaciones)
nice -n 10 ./compilar-proyecto.sh      # nice +10
nice -n 19 tar czf backup.tar.gz /data # La compilación o backup más cortés posible

# Cambiar prioridad de un proceso ya corriendo
renice -n 5 -p PID          # Subir a nice 5
sudo renice -n -5 -p PID    # Bajar a nice -5 (solo root)
renice -n 10 -u juan        # Todos los procesos de juan a nice 10

# Ver la columna NI (nice) y PRI (prioridad interna del kernel) en ps
ps -eo pid,ni,pri,comm --sort=ni | head -15

# Dónde se ve en htop: columna NI
```

### Prioridades de I/O: `ionice`

La CPU no es el único cuello de botella. Los accesos a disco también tienen prioridades con el scheduler de I/O:

```bash
# ionice usa 3 clases:
# 1 = Realtime: acceso inmediato al disco (cuidado: puede ayunar a otros)
# 2 = Best-effort: la clase normal (niveles 0-7, 0=más prioritario)
# 3 = Idle: solo accede al disco cuando NADIE más lo necesita

# Lanzar un backup con la menor prioridad posible en CPU e I/O
ionice -c 3 nice -n 19 rsync -av /origen /backup

# Ver la clase de I/O de un proceso
ionice -p PID

# Combinar con tar para backups sin molestar al servidor:
ionice -c 2 -n 7 nice -n 15 tar czf /backup/home.tar.gz /home/
```

### Límites de recursos: `ulimit`

```bash
# Ver todos los límites del proceso actual
ulimit -a

# Límites importantes:
ulimit -n           # Archivos abiertos simultáneos (default: 1024)
ulimit -u           # Procesos máximos
ulimit -v           # Memoria virtual máxima
ulimit -s           # Tamaño de pila (stack size)
ulimit -c           # Tamaño de core dumps (0 = desactivado)

# Cambiar para la sesión actual
ulimit -n 65536     # Aumentar límite de archivos (necesario para servidores)
ulimit -n unlimited # Sin límite (solo root puede hacer esto)

# Para cambios permanentes: /etc/security/limits.conf (PAM, Módulo 07)
# www-data  soft  nofile  65536
# www-data  hard  nofile  65536
```

### cgroups: la base del control de recursos

Los **cgroups** (control groups) son la tecnología del kernel que permite limitar, medir y aislar recursos (CPU, memoria, I/O, red) para grupos de procesos. Es la base de:
- Los límites de recursos en systemd (`MemoryLimit=`, `CPUQuota=`)
- Los contenedores Docker/Podman
- La separación entre servicios en systemd

```bash
# Ver la jerarquía de cgroups de tu sistema (systemd crea uno por servicio)
systemd-cgls | head -40         # Árbol de cgroups
systemd-cgtop                   # Monitor de recursos por cgroup (como top)

# Ver a qué cgroup pertenece un proceso
cat /proc/$$/cgroup

# Ver los límites de memoria de un servicio
systemctl show nginx | grep -E "Memory|CPU"
```

---

## 9.6 — systemd: visión general

### De SysV init a systemd

```
Historia del proceso de inicio (PID 1):

1969-2010  SysV init:  /etc/inittab + scripts en /etc/rc.d/
           Problema: inicio SECUENCIAL (paso a paso, muy lento)
           cada servicio esperaba al anterior

2006       Upstart (Ubuntu): inicio paralelo basado en eventos
           (iPhrase: "este servicio empieza cuando aparece el evento X")

2010       systemd (Lennart Poettering): unidades declarativas,
           inicio masivamente paralelo, socket activation,
           gestión de logs integrada (journald), cgroups nativos
           → Se convirtió en el estándar de prácticamente todas las distros

2012-2015  La gran controversia (systemd es complejo, hace demasiado
           para la filosofía Unix de "una cosa bien" — debate que sigue)
```

### Conceptos fundamentales

```
Unidad (Unit): el objeto básico que systemd gestiona
  → Cada servicio, cada punto de montaje, cada socket, cada timer
    es una "unidad" descrita en un archivo de texto

Tipos de unidad:
  .service  → proceso demonio (nginx, sshd, mariadb...)
  .socket   → socket de red o Unix (activación bajo demanda)
  .timer    → equivalente a cron (tareas programadas)
  .mount    → punto de montaje de sistema de archivos
  .automount→ montaje automático al acceder
  .target   → grupo de unidades (equivalente a runlevel)
  .path     → activación al cambiar un archivo/directorio
  .device   → dispositivo de hardware
  .scope    → grupo de procesos externos (sesiones de usuario)
  .slice    → nodo de la jerarquía de cgroups

Targets (equivalente a runlevels de SysV):
  poweroff.target  → runlevel 0: apagar
  rescue.target    → runlevel 1: monousuario / recovery
  multi-user.target→ runlevel 3: multiusuario sin gráficos
  graphical.target → runlevel 5: con entorno gráfico
  reboot.target    → runlevel 6: reiniciar

Rutas de los archivos de unidad:
  /lib/systemd/system/       → los que instalan los paquetes (no tocar)
  /etc/systemd/system/       → los del administrador (tienen prioridad)
  ~/.config/systemd/user/    → unidades de usuario (sin root)
```

---

## 9.7 — `systemctl` en el día a día

### Gestión de servicios

```bash
# El ciclo de vida de un servicio
sudo systemctl start nginx        # Iniciar ahora
sudo systemctl stop nginx         # Parar ahora
sudo systemctl restart nginx      # Parar + iniciar (interrupción de servicio)
sudo systemctl reload nginx       # Recargar configuración SIN parar (si lo soporta)
sudo systemctl reload-or-restart nginx  # reload si puede; restart si no

# Estado detallado
systemctl status nginx
# ● nginx.service - A high performance web server and a reverse proxy server
#      Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
#      Active: active (running) since Thu 2024-06-01 10:15:32 UTC; 2h 5min ago
#    Main PID: 512 (nginx)
#       Tasks: 3 (limit: 4915)
#      Memory: 12.4M
#         CPU: 521ms
#      CGroup: /system.slice/nginx.service
#              ├─512 "nginx: master process /usr/sbin/nginx -g daemon on; ..."
#              ├─513 "nginx: worker process"
#              └─514 "nginx: worker process"
#
# Jun 01 10:15:32 servidor systemd[1]: Starting nginx...
# Jun 01 10:15:32 servidor systemd[1]: Started nginx.

# Habilitar/deshabilitar: ¿arranca al inicio?
sudo systemctl enable nginx        # Crea los symlinks para el arranque automático
sudo systemctl disable nginx       # Elimina esos symlinks
sudo systemctl enable --now nginx  # Habilitar Y arrancar en un solo paso
sudo systemctl disable --now nginx # Deshabilitar Y parar

# La diferencia CRÍTICA:
# start/stop → afecta AHORA (esta sesión)
# enable/disable → afecta EN REINICIOS FUTUROS
# Son independientes: un servicio puede estar started pero disabled (no arrancará sola)

# Masking: impedir que un servicio pueda arrancarse (ni manual ni automático)
sudo systemctl mask bluetooth.service   # → symlink a /dev/null
sudo systemctl unmask bluetooth.service # Deshacer
```

### Consultas y diagnóstico

```bash
# Listar unidades
systemctl list-units                    # Todas las unidades cargadas
systemctl list-units --type=service     # Solo servicios
systemctl list-units --state=failed     # ¡Las que fallaron!
systemctl list-unit-files               # Todos los archivos de unidad y su estado
systemctl list-unit-files --type=service | grep enabled   # Los que arrancan solos

# Comprobaciones rápidas
systemctl is-active nginx       # ¿Está corriendo? (imprime "active" o "inactive")
systemctl is-enabled nginx      # ¿Arranca al inicio?
systemctl is-failed nginx       # ¿Falló?
# Muy útil en scripts:
if systemctl is-active --quiet nginx; then echo "nginx OK"; fi

# Ver dependencias
systemctl list-dependencies nginx
systemctl list-dependencies --reverse nginx  # ¿Quién depende de nginx?

# Gestión del sistema completo
sudo systemctl poweroff          # Apagar
sudo systemctl reboot            # Reiniciar
sudo systemctl suspend           # Suspender
sudo systemctl hibernate         # Hibernar
sudo systemctl get-default       # Ver el target por defecto
sudo systemctl set-default multi-user.target   # Cambiar el target por defecto

# Análisis del tiempo de arranque
systemd-analyze                          # Tiempo total
systemd-analyze blame                    # Qué servicio tardó más
systemd-analyze critical-chain           # La cadena crítica (el cuello de botella)
systemd-analyze plot > arranque.svg      # Gráfico SVG del arranque
```

---

## 9.8 — Escribir unidades `.service` propias

Esta es la habilidad que distingue al administrador que solo usa herramientas de quien entiende el sistema. Con una unidad `.service` conviertes cualquier programa en un servicio gestionado: con logs, reinicio automático, dependencias y seguridad.

### Anatomía de un archivo `.service`

```ini
# /etc/systemd/system/mi-aplicacion.service

[Unit]
# Descripción legible por humanos
Description=Mi Aplicación Web Python
# Documentación (puede ser URL o man page)
Documentation=https://mi-proyecto.com/docs
# Dependencias de orden: arrancar DESPUÉS de network y database
After=network-online.target mariadb.service
# Dependencias fuertes: si mariadb no arranca, yo tampoco
Requires=network-online.target
# Dependencias débiles: intenta tener esto, pero no es obligatorio
Wants=redis.service

[Service]
# Tipo de servicio:
# simple:  el proceso es el servicio (el más común, PID del ExecStart)
# forking: el proceso hace fork() y el padre termina (demonios clásicos)
# oneshot: ejecutar una vez y terminar (para scripts de inicio)
# notify:  como simple pero el proceso avisa a systemd cuando está listo
# exec:    como simple pero systemd espera a que exec() tenga éxito
Type=simple

# Usuario y grupo bajo el que corre (NUNCA root a menos que sea imprescindible)
User=www-data
Group=www-data

# Directorio de trabajo
WorkingDirectory=/opt/mi-aplicacion

# Variables de entorno (o cargarlas desde un archivo)
Environment=FLASK_ENV=production
Environment=PORT=8080
EnvironmentFile=/etc/mi-aplicacion/config.env   # Archivo de variables

# El comando principal
ExecStart=/opt/mi-aplicacion/venv/bin/python app.py

# Comandos opcionales pre/post inicio
ExecStartPre=/usr/bin/test -f /opt/mi-aplicacion/app.py
ExecStartPost=/usr/bin/curl -sf http://localhost:8080/health
ExecReload=/bin/kill -HUP $MAINPID     # Para reload
ExecStop=/bin/kill -TERM $MAINPID

# Reinicio automático
Restart=on-failure        # Reiniciar si el proceso sale con código ≠ 0
RestartSec=5              # Esperar 5 segundos antes de reiniciar
StartLimitIntervalSec=60  # En una ventana de 60 segundos
StartLimitBurst=3         # Máximo 3 reinicios (luego marca como failed)

# Timeout
TimeoutStartSec=30        # Si no arranca en 30s, fallo
TimeoutStopSec=30         # Si no para en 30s, SIGKILL

# Salida estándar va al journal
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mi-aplicacion   # Nombre en el journal

[Install]
# En qué target se instala (= cuándo arranca)
WantedBy=multi-user.target
```

### Caso práctico: servicio para un script Python

```bash
# 1. Crear el script de aplicación de ejemplo
sudo mkdir -p /opt/mi-app
sudo tee /opt/mi-app/servidor.py <<'EOF'
#!/usr/bin/env python3
import http.server, socketserver, datetime, time

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        msg = f"Servidor OK - {datetime.datetime.now()}\n"
        self.wfile.write(msg.encode())

with socketserver.TCPServer(("", 8080), Handler) as httpd:
    print("Servidor en puerto 8080")
    httpd.serve_forever()
EOF
sudo chmod +x /opt/mi-app/servidor.py

# 2. Crear el usuario sin privilegios para el servicio
sudo useradd -r -s /usr/sbin/nologin -d /opt/mi-app miapp
sudo chown -R miapp: /opt/mi-app

# 3. Crear la unidad
sudo tee /etc/systemd/system/mi-app.service <<'EOF'
[Unit]
Description=Mi servidor HTTP de ejemplo
After=network.target

[Service]
Type=simple
User=miapp
WorkingDirectory=/opt/mi-app
ExecStart=/usr/bin/python3 /opt/mi-app/servidor.py
Restart=on-failure
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 4. Activar y arrancar
sudo systemctl daemon-reload       # ← OBLIGATORIO después de crear/editar unidades
sudo systemctl enable --now mi-app
systemctl status mi-app
curl http://localhost:8080
```

### `systemctl edit` y los drop-ins

Los drop-ins permiten **modificar una unidad sin tocar el archivo original** del paquete (que sería sobreescrito en la próxima actualización):

```bash
# Editar con soporte de drop-in automático
sudo systemctl edit nginx
# Abre un editor; lo que escribas va a:
# /etc/systemd/system/nginx.service.d/override.conf
# y se FUSIONA con el archivo original

# Ejemplo de drop-in para nginx:
# [Service]
# LimitNOFILE=65536
# Environment=EXTRA_VAR=valor

# Ver el resultado de la fusión
systemctl cat nginx        # Muestra el archivo base + los drop-ins

# Para reemplazar completamente el archivo original (no recomendado):
sudo systemctl edit --full nginx   # Copia el original a /etc/systemd/system/
```

### Hardening de servicios

systemd ofrece opciones de sandboxing que van muy por encima de solo `User=`. Para un servicio de producción:

```ini
[Service]
# Restricciones de sistema de archivos
ProtectSystem=strict          # /usr, /boot, /etc de solo lectura
ProtectHome=true              # /home, /root, /run/user inaccesibles
ReadWritePaths=/var/lib/mi-app  # Solo este directorio es escribible
PrivateTmp=true               # /tmp privado y aislado

# Restricciones de red
PrivateNetwork=false          # (true = sin acceso a red)
RestrictAddressFamilies=AF_INET AF_INET6   # Solo IPv4 e IPv6

# Restricciones de procesos
NoNewPrivileges=true          # Impedir escalada de privilegios (SUID, etc.)
ProtectKernelTunables=true    # Solo lectura en /proc/sys
ProtectKernelModules=true     # No cargar módulos del kernel
ProtectControlGroups=true     # cgroups de solo lectura

# Capacidades del kernel (usar solo las necesarias)
CapabilityBoundingSet=        # Vacío = ninguna capability
# AmbientCapabilities=CAP_NET_BIND_SERVICE  # Para binding en puerto < 1024

# Syscalls permitidos
SystemCallFilter=@system-service  # Solo syscalls de un servicio normal
```

---

## 9.9 — Logs con `journalctl`

### Por qué journald

`journald` es el demonio de logging de systemd. A diferencia de los archivos de texto de rsyslog, almacena los logs en formato binario estructurado con metadatos: PID, UID, unidad de systemd, prioridad, timestamp con precisión de microsegundos.

```bash
# Ver todos los logs del sistema (paginado con less)
journalctl

# Logs en tiempo real (como tail -f /var/log/syslog pero mejor)
journalctl -f
journalctl -f -u nginx    # Solo nginx, en tiempo real

# FILTRAR POR UNIDAD (el más usado en administración)
journalctl -u nginx
journalctl -u nginx -u php-fpm    # Varios servicios a la vez

# FILTRAR POR TIEMPO
journalctl --since "2024-06-01"
journalctl --since "2024-06-01 10:00" --until "2024-06-01 11:00"
journalctl --since "1 hour ago"
journalctl --since yesterday
journalctl -b                    # Solo el arranque actual
journalctl -b -1                 # El arranque anterior
journalctl -b -2                 # El de hace dos arranques
journalctl --list-boots          # Ver todos los arranques registrados

# FILTRAR POR PRIORIDAD (escala de syslog: 0=emerg ... 7=debug)
journalctl -p err              # Solo errores y superiores (0-3)
journalctl -p warning          # Warnings y superiores (0-4)
journalctl -p err -u nginx     # Errores de nginx

# FILTRAR POR PROCESO/USUARIO
journalctl _PID=1024
journalctl _UID=1000
journalctl _COMM=nginx         # Por nombre del proceso

# FORMATOS DE SALIDA
journalctl -u nginx --no-pager            # Sin paginación (para scripts)
journalctl -u nginx -o json | jq          # JSON (integración con otras herramientas)
journalctl -u nginx -o json-pretty | head
journalctl -u nginx -o cat                # Solo el mensaje, sin metadatos
journalctl -u nginx -o short-iso         # Timestamp ISO 8601

# NÚMERO DE LÍNEAS
journalctl -n 50 -u nginx          # Últimas 50 líneas
journalctl -u nginx --reverse | head -20  # Las 20 más recientes primero

# COMBINAR CON GREP (del Módulo 05):
journalctl -u nginx --no-pager | grep "404"
journalctl -u nginx --no-pager | awk '/error/ {print $1, $2, $NF}'
```

### Gestión del espacio del journal

```bash
# Ver cuánto espacio ocupa
journalctl --disk-usage

# Limpiar logs antiguos
sudo journalctl --vacuum-size=500M    # Reducir a 500 MB
sudo journalctl --vacuum-time=30d     # Eliminar más de 30 días
sudo journalctl --vacuum-files=5      # Conservar solo 5 archivos de journal

# Configuración persistente en /etc/systemd/journald.conf
sudo nano /etc/systemd/journald.conf
# [Journal]
# Storage=persistent       # persistent = conservar entre reinicios (default en muchas distros)
# Compress=yes             # Comprimir logs
# SystemMaxUse=1G          # Máximo 1 GB en disco
# SystemKeepFree=500M      # Dejar al menos 500 MB libres
# MaxRetentionSec=1month   # Eliminar logs con más de 1 mes
sudo systemctl restart systemd-journald
```

### Convivencia con rsyslog

En muchas instalaciones coexisten journald y rsyslog:

```bash
# rsyslog puede leer del socket de journald y escribir en archivos clásicos
ls /var/log/
# auth.log  kern.log  syslog  nginx/access.log  nginx/error.log  ...

# Ver si rsyslog está activo
systemctl status rsyslog

# Los logs de algunos servicios van a ambos sitios
tail -f /var/log/auth.log            # Clásico
journalctl -f _SYSTEMD_UNIT=ssh.service  # Mismo contenido vía journald
```

---

## 9.10 — Tareas programadas

### `cron` — La herramienta clásica

```bash
# Editar el crontab del usuario actual
crontab -e        # Abre $EDITOR con el crontab
crontab -l        # Ver el crontab actual
crontab -r        # Eliminar el crontab (¡cuidado! sin confirmación)
crontab -u juan -e  # Editar el crontab de juan (como root)

# Sintaxis de cron: 5 campos + el comando
# ┌─────── minuto (0-59)
# │ ┌───── hora (0-23)
# │ │ ┌─── día del mes (1-31)
# │ │ │ ┌─ mes (1-12 o jan,feb...)
# │ │ │ │ ┌ día de la semana (0-7, 0 y 7 = domingo; o sun,mon...)
# │ │ │ │ │
# * * * * *   comando

# Ejemplos:
# Cada día a las 3:00 AM
0 3 * * * /usr/local/bin/backup.sh

# Cada lunes a las 8:30
30 8 * * 1 /usr/bin/python3 /opt/reporte-semanal.py

# Cada 5 minutos
*/5 * * * * /usr/local/bin/check-servicio.sh

# A las 9:00 los días 1 y 15 de cada mes
0 9 1,15 * * /usr/local/bin/facturacion.sh

# De lunes a viernes, de 9 a 18, cada hora
0 9-18 * * 1-5 /usr/local/bin/sync-datos.sh

# Atajos especiales:
@reboot   /usr/local/bin/al-arrancar.sh     # Una vez al arrancar
@daily    /usr/local/bin/diario.sh          # Equivalente a: 0 0 * * *
@weekly   /usr/local/bin/semanal.sh         # Equivalente a: 0 0 * * 0
@monthly  /usr/local/bin/mensual.sh         # Equivalente a: 0 0 1 * *
@hourly   /usr/local/bin/cada-hora.sh       # Equivalente a: 0 * * * *
```

### El entorno de cron (la trampa más común)

```bash
# PROBLEMA: un script funciona en la terminal pero falla en cron

# CAUSA: cron tiene un entorno MINIMAL
# PATH=/usr/bin:/bin   ← muy reducido
# HOME=/home/usuario
# SHELL=/bin/sh        ← sh, no bash
# Sin DISPLAY, sin USER a veces, sin variables personalizadas

# SOLUCIONES en el crontab:
# 1. Especificar el PATH al inicio del crontab:
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# 2. Usar rutas absolutas en los comandos:
0 3 * * * /usr/bin/python3 /opt/scripts/backup.py

# 3. Cargar el entorno al inicio del script:
0 3 * * * . /home/juan/.bashrc && /opt/scripts/backup.sh

# 4. Redirigir la salida (por defecto cron envía email):
0 3 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
0 3 * * * /opt/scripts/backup.sh > /dev/null 2>&1   # Silencioso total

# Ver logs de cron
grep CRON /var/log/syslog | tail -20
journalctl -u cron --since today
```

### `/etc/cron.d` y los directorios de cron del sistema

```bash
# Crontabs del sistema (una línea extra: el campo USUARIO)
# min  hora  dia  mes  dds  USUARIO  comando
ls /etc/cron.d/
# e2scrub_all  mdadm  sysstat  php  logrotate

cat /etc/cron.d/sysstat
# */10 * * * * root /usr/lib/sysstat/sa1 1 1
# 53 23 * * * root /usr/lib/sysstat/sa2 -A

# Directorios de ejecución periódica (run-parts)
ls /etc/cron.daily/      # Scripts que corren una vez al día
ls /etc/cron.weekly/     # Una vez a la semana
ls /etc/cron.monthly/    # Una vez al mes
ls /etc/cron.hourly/     # Cada hora

# Añadir un script a cron.daily (debe ser ejecutable y sin extensión)
sudo cp mi-script.sh /etc/cron.daily/mi-script
sudo chmod +x /etc/cron.daily/mi-script
# El nombre no debe tener puntos ni extensión: cron.daily los ignora
```

### `at` — Tareas puntuales

```bash
# Ejecutar UN COMANDO una sola vez en un momento futuro
# (no repetitivo como cron)
sudo apt install at
sudo systemctl enable --now atd

# Usar at
at 14:30                         # Interactivo: escribe el comando, Ctrl+D para terminar
at now + 1 hour                  # En 1 hora
at midnight                      # A medianoche
at 08:00 tomorrow                # Mañana a las 8
at 09:00 Jul 15                  # El 15 de julio a las 9

# Con here document (cómodo para scripts):
at now + 2 hours <<'EOF'
/usr/local/bin/reiniciar-nginx.sh
echo "nginx reiniciado" | mail -s "Alerta" admin@empresa.com
EOF

# Gestionar la cola de at
atq                  # Ver los trabajos programados
atrm 3               # Eliminar el trabajo número 3
at -c 3              # Ver el contenido del trabajo número 3
```

### Timers de systemd — La alternativa moderna a cron

Los timers de systemd tienen ventajas sobre cron: logs en journald, manejo de overlaps, ejecución al arrancar si se perdió una ejecución, y las mismas opciones de hardening que los servicios.

```bash
# Un timer consiste en DOS archivos:
# 1. nombre.service  → qué ejecutar
# 2. nombre.timer    → cuándo ejecutarlo

# Ejemplo: backup diario
# /etc/systemd/system/backup-diario.service
sudo tee /etc/systemd/system/backup-diario.service <<'EOF'
[Unit]
Description=Backup diario de /home
After=local-fs.target

[Service]
Type=oneshot
User=root
ExecStart=/usr/local/bin/backup.sh
StandardOutput=journal
StandardError=journal
EOF

# /etc/systemd/system/backup-diario.timer
sudo tee /etc/systemd/system/backup-diario.timer <<'EOF'
[Unit]
Description=Ejecutar backup-diario cada día a las 3:00

[Timer]
# Opciones de tiempo:
OnCalendar=*-*-* 03:00:00      # Todos los días a las 3:00
# OnCalendar=Mon *-*-* 08:00:00  # Los lunes a las 8:00
# OnCalendar=daily               # Equivalente a *-*-* 00:00:00
# OnCalendar=weekly              # Lunes a las 00:00
# OnBootSec=5min                 # 5 minutos después de arrancar
# OnActiveSec=1h                 # Cada hora desde la última activación
# OnUnitInactiveSec=30min        # 30 min después de que el servicio terminó

# Ejecutar si se perdió una ejecución (ej: el sistema estaba apagado)
Persistent=true

# Aleatorizar la hora de inicio (para no sobrecargar si muchos servers)
RandomizedDelaySec=10min

[Install]
WantedBy=timers.target
EOF

# Activar el timer (no el servicio)
sudo systemctl daemon-reload
sudo systemctl enable --now backup-diario.timer

# Gestionar timers
systemctl list-timers                    # Ver todos los timers y cuándo se ejecutan
systemctl list-timers --all              # Incluye los inactivos
systemctl status backup-diario.timer
journalctl -u backup-diario.service      # Ver logs de la última ejecución

# Probar la sintaxis de OnCalendar
systemd-analyze calendar "Mon *-*-* 08:00:00"
systemd-analyze calendar "daily"
```

---

## 9.11 — Problemas reales y soluciones

### Problema 1: Un servicio no arranca

```bash
# DIAGNÓSTICO SISTEMÁTICO

# 1. Ver el estado y los últimos logs
systemctl status mi-servicio
journalctl -u mi-servicio -n 50 --no-pager

# 2. Si el servicio arrancó alguna vez pero falló:
journalctl -u mi-servicio --since "1 hour ago"

# 3. Verificar el archivo de unidad
systemctl cat mi-servicio         # Ver el archivo completo
systemd-analyze verify mi-servicio.service  # Validar sintaxis

# 4. ¿El binario existe y es ejecutable?
ExecStart=$(systemctl show mi-servicio --property=ExecStart)
# o lee el archivo de unidad:
cat /etc/systemd/system/mi-servicio.service | grep ExecStart

# 5. Intentar ejecutar el comando manualmente como el mismo usuario
sudo -u www-data /opt/mi-app/servidor.py
# Si falla aquí → el problema es el programa, no systemd

# 6. Verificar dependencias
systemctl list-dependencies mi-servicio
# ¿Alguna dependencia está en failed?
```

### Problema 2: El sistema tarda mucho en arrancar

```bash
# Identificar el culpable
systemd-analyze                    # Tiempo total
systemd-analyze blame | head -10   # Top 10 por tiempo
systemd-analyze critical-chain     # La cadena que está bloqueando el arranque

# Deshabilitar servicios innecesarios
# (en un servidor, ¿para qué quieres bluetooth o cups?)
sudo systemctl disable bluetooth.service cups.service
# O masquear los que nunca deben arrancar:
sudo systemctl mask cups.socket cups.service

# Ver qué está esperando qué
systemd-analyze dot | dot -Tsvg > dependencias.svg
```

### Problema 3: El disco se llena con logs

```bash
# Ver cuánto ocupan los logs
journalctl --disk-usage
du -sh /var/log/

# Vaciar el journal (emergencia)
sudo journalctl --vacuum-time=7d    # Solo conservar los últimos 7 días

# Configurar límite permanente
sudo tee -a /etc/systemd/journald.conf <<'EOF'
[Journal]
SystemMaxUse=500M
MaxRetentionSec=2weeks
EOF
sudo systemctl restart systemd-journald

# ¿Qué archivos de log crecen más rápido?
sudo find /var/log -name "*.log" -newer /tmp/ahora -size +10M 2>/dev/null
# o usando lo del Módulo 05:
sudo du -sh /var/log/* | sort -rh | head -10
```

### Problema 4: Proceso zombie acumulado

```bash
# Ver zombies
ps aux | awk '$8 ~ /^Z/ {print $0}'
# Z en la columna STAT

# Los zombies NO consumen CPU ni memoria significativa
# pero SÍ ocupan un slot de PID y pueden indicar un bug en el padre

# Ver quién es el padre del zombie
ps -eo pid,ppid,stat,comm | awk '$3 ~ /Z/ {print $0}'
# Con el PPID, identificar el padre:
ps -p PPID_DEL_ZOMBIE -o pid,comm

# Solución: enviar SIGCHLD al padre para que recoja el estado
kill -17 PPID_DEL_ZOMBIE    # SIGCHLD

# Si el padre ignora SIGCHLD y acumula zombies: reiniciar el padre
sudo systemctl restart servicio-con-zombies

# Los zombies desaparecen cuando muere su padre (los adopta init/PID1)
```

---

## Anexos

### A. Señales más usadas — referencia rápida

```
SIGTERM (15) → terminación educada (siempre primero)
SIGKILL (9)  → terminación forzada (sin limpieza, última opción)
SIGHUP  (1)  → recargar configuración (nginx, sshd, rsyslogd)
SIGINT  (2)  → Ctrl+C
SIGSTOP (19) → pausar (no ignorable)
SIGCONT (18) → continuar (tras SIGSTOP)
SIGUSR1 (10) → definida por el usuario (nginx: reabrir logs)
SIGUSR2 (12) → definida por el usuario (nginx: graceful shutdown)
```

### B. systemctl — referencia rápida

```bash
systemctl start/stop/restart/reload UNIT
systemctl enable/disable UNIT
systemctl enable --now UNIT        # enable + start
systemctl status UNIT
systemctl cat UNIT                 # Ver el archivo de unidad
systemctl edit UNIT                # Crear drop-in
systemctl list-units --failed      # Servicios en fallo
systemctl list-timers              # Ver todos los timers
systemd-analyze blame              # Qué tarda en arrancar
journalctl -u UNIT -f              # Logs en tiempo real
```

### C. Referencias cruzadas entre módulos

```
◀ Módulo 03 — Terminal y shell
│  Ctrl+Z, &, fg/bg, nohup: control de trabajos (vista básica)
│  tmux/screen: la forma correcta de procesos persistentes

◀ Módulo 05 — Procesamiento de texto
│  journalctl --no-pager | grep/awk para análisis de logs
│  ps -eo ... | sort/awk para auditoría de procesos

◀ Módulo 07 — Usuarios, grupos y permisos
│  PAM (pam_limits.so) establece ulimits por usuario
│  Los servicios corren con usuarios del sistema (User= en .service)

◀ Módulo 08 — Gestión de software
│  apt install crea unidades .service automáticamente (postinst)
│  dnf-automatic y unattended-upgrades usan timers de systemd

▶ Módulo 10 — Shell scripting Bash
│  → Scripts llamados desde cron y timers de systemd
│  → trap para limpiar al recibir señales

▶ Módulo 14 — Seguridad y hardening
│  → Hardening de servicios con systemd (ProtectSystem, NoNewPrivileges)
│  → Auditoría de servicios habilitados (superficie de ataque)

▶ Módulo 15 — Monitorización y rendimiento
│  → htop, btop, vmstat, iostat como herramientas de diagnóstico
│  → systemd-cgls/cgtop para ver recursos por servicio
```

---

## Referencias y Bibliografía

1. **systemd man pages**: `man systemd.service`, `man systemd.timer`, `man systemd.exec`, `man journalctl`  
   https://www.freedesktop.org/software/systemd/man/

2. **The systemd Project** — https://systemd.io/

3. **ArchWiki — systemd** (la mejor documentación práctica)  
   https://wiki.archlinux.org/title/Systemd

4. **ArchWiki — systemd/Timers**  
   https://wiki.archlinux.org/title/Systemd/Timers

5. **POSIX — Signals**  
   https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/signal.h.html

6. **Linux man pages — proc(5)**  
   https://man7.org/linux/man-pages/man5/proc.5.html

7. **Understanding systemd Units and Unit Files** — DigitalOcean  
   https://www.digitalocean.com/community/tutorials/understanding-systemd-units-and-unit-files

8. **Linux Journal: Cgroups v2**  
   https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html

9. **cron(5), crontab(1), crontab(5)** man pages  
   https://man7.org/linux/man-pages/man5/crontab.5.html

10. **Systemd Security Features** — Lennart Poettering  
    https://0pointer.net/blog/

11. **ps(1), kill(1), nice(1), ionice(1)** — man7.org  
    https://man7.org/linux/man-pages/man1/ps.1.html

12. **Unix and Linux System Administration Handbook** — Nemeth et al., 5ª ed.  
    Capítulos 2 (Booting), 3 (Access Control), 4 (Process Control).

13. **How Linux Works** — Brian Ward, 3ª ed.  
    Capítulo 6: How User Space Starts; Capítulo 8: Process and Resource Utilization.

14. **Linux System Programming** — Robert Love, 2ª ed. O'Reilly.  
    Capítulo 5: Process Management; Capítulo 9: Signals.

15. **lsof — An Introduction to the lsof Utility** — Vic Abell  
    https://people.freebsd.org/~abe/

---

## Preguntas de autoevaluación

1. ¿Qué son `fork()` y `exec()`? ¿Por qué Linux siempre crea procesos mediante `fork()` en lugar de crear uno desde cero?
2. ¿Cuál es la diferencia entre un proceso en estado `S` (sleeping) y uno en estado `D` (uninterruptible sleep)? ¿Por qué muchos procesos en `D` indican un problema?
3. ¿Qué es un proceso zombie? ¿Consume recursos? ¿Cómo se elimina?
4. Explica la diferencia entre `SIGTERM` y `SIGKILL`. ¿Cuándo y por qué usar uno u otro?
5. ¿Qué hace `SIGHUP` en la mayoría de los demonios del sistema?
6. ¿Cuál es la diferencia entre `nohup ./script.sh &` y ejecutarlo dentro de `tmux`?
7. ¿Qué significa un nice value de -10 comparado con uno de +10? ¿Quién puede poner nice negativo?
8. Explica la diferencia entre `systemctl start nginx` y `systemctl enable nginx`.
9. ¿Qué es un drop-in de systemd y por qué es mejor que editar el archivo de unidad original?
10. ¿Cuáles son las ventajas de los timers de systemd sobre cron?
11. ¿Por qué un script que funciona en la terminal puede fallar en cron?
12. ¿Qué hace `Restart=on-failure` en una unidad `.service`? ¿Cuándo NO reinicia?
13. Interpreta la salida: `journalctl -u nginx -p err --since "1 hour ago"`. ¿Qué filtra exactamente?
14. ¿Qué significa `WantedBy=multi-user.target` en la sección `[Install]` de un servicio?

---

## Laboratorios prácticos

### Lab 9.1 — Explorar el árbol de procesos

```bash
# 1. Ver el árbol completo con PIDs
pstree -p | head -30

# 2. Explorar tu propio proceso
echo "Mi shell es PID $$, hija de PID $PPID"
cat /proc/$$/status | grep -E "^(Name|Pid|PPid|Uid|State)"
cat /proc/$$/cmdline | tr '\0' ' '
ls -la /proc/$$/fd/          # Descriptores abiertos

# 3. Ver el estado de todos los procesos
ps aux --sort=stat | awk '{print $8}' | sort | uniq -c | sort -rn
# ¿Cuántos procesos hay en cada estado?

# 4. Verificar si hay zombies
ps aux | awk '$8 ~ /^Z/ {print "Zombie:", $0}'
```

### Lab 9.2 — Señales y control de trabajos

```bash
# 1. Lanzar procesos en background y pausarlos
sleep 300 &
sleep 400 &
jobs -l                        # Ver los dos trabajos

# 2. Practicar fg/bg/Ctrl+Z
fg %1                          # Traer sleep 300 al frente
# Presionar Ctrl+Z              # Pausarlo
bg %1                          # Mandarlo de vuelta al background
jobs -l

# 3. Enviar señales
kill -SIGSTOP %2               # Pausar el segundo
jobs -l                        # Debe mostrar "Stopped"
kill -SIGCONT %2               # Reanudar
jobs -l

# 4. Matar todos y limpiar
kill %1 %2
jobs
```

### Lab 9.3 — Servicio propio desde cero

```bash
# 1. Crear un script que cuenta segundos
mkdir -p /tmp/lab-systemd
cat > /tmp/lab-systemd/contador.sh <<'EOF'
#!/bin/bash
while true; do
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Tick"
    sleep 5
done
EOF
chmod +x /tmp/lab-systemd/contador.sh

# 2. Crear la unidad
sudo tee /etc/systemd/system/lab-contador.service <<'EOF'
[Unit]
Description=Laboratorio: contador de ticks
[Service]
Type=simple
ExecStart=/tmp/lab-systemd/contador.sh
Restart=on-failure
StandardOutput=journal
[Install]
WantedBy=multi-user.target
EOF

# 3. Habilitar, iniciar y verificar
sudo systemctl daemon-reload
sudo systemctl enable --now lab-contador
systemctl status lab-contador
journalctl -u lab-contador -f &    # Ver logs en tiempo real (background)
sleep 15                            # Esperar 3 ticks
kill %1                             # Parar el journalctl

# 4. Reinicio automático
sudo systemctl kill lab-contador    # Forzar la muerte
sleep 6                             # Esperar el reinicio (RestartSec default)
systemctl status lab-contador       # ¿Se reinició?

# 5. Limpiar
sudo systemctl disable --now lab-contador
sudo rm /etc/systemd/system/lab-contador.service
sudo systemctl daemon-reload
```

### Lab 9.4 — journalctl: navegación y filtros

```bash
# 1. Ver los arranques registrados
journalctl --list-boots

# 2. Ver errores de este arranque
journalctl -b -p err --no-pager | head -20

# 3. Ver logs del kernel del arranque actual
journalctl -k | head -20

# 4. Estadísticas de logs por unidad (los que más generan)
journalctl --no-pager -o json | \
    python3 -c "
import sys, json
from collections import Counter
c = Counter()
for line in sys.stdin:
    try:
        d = json.loads(line)
        c[d.get('_SYSTEMD_UNIT', 'kernel')] += 1
    except: pass
for unit, count in c.most_common(10):
    print(f'{count:6d}  {unit}')
"
```

### Lab 9.5 — Timer de systemd

```bash
# 1. Crear un timer que ejecuta cada 2 minutos
sudo tee /etc/systemd/system/lab-timer.service <<'EOF'
[Unit]
Description=Lab timer: registrar hora
[Service]
Type=oneshot
ExecStart=/bin/bash -c 'echo "Timer ejecutado: $(date)" >> /tmp/timer-lab.log'
EOF

sudo tee /etc/systemd/system/lab-timer.timer <<'EOF'
[Unit]
Description=Ejecutar lab-timer cada 2 minutos
[Timer]
OnCalendar=*:0/2
Persistent=true
[Install]
WantedBy=timers.target
EOF

# 2. Activar y observar
sudo systemctl daemon-reload
sudo systemctl enable --now lab-timer.timer
systemctl list-timers lab-timer.timer

# 3. Esperar y verificar
sleep 130                    # Esperar a que se ejecute al menos una vez
cat /tmp/timer-lab.log
journalctl -u lab-timer.service --no-pager

# 4. Limpiar
sudo systemctl disable --now lab-timer.timer
sudo rm /etc/systemd/system/lab-timer.{service,timer}
sudo systemctl daemon-reload
rm -f /tmp/timer-lab.log
```

---

## Resumen del módulo

✅ **Modelo de procesos:** PID/PPID, árbol, fork/exec, estados (R/S/D/T/Z), `/proc/<pid>`  
✅ **Observación:** `ps aux`, `ps -eo` personalizado, `top`/`htop`/`btop`, `pgrep`, `lsof -i` para sockets  
✅ **Señales:** SIGTERM (educada) antes de SIGKILL (forzada), SIGHUP para recargar config; `kill`/`pkill`/`killall`  
✅ **Trabajos:** `&`, `jobs`, `fg`/`bg`, `Ctrl+Z`, `nohup` para persistencia; `disown` para separar de la shell  
✅ **Prioridades:** `nice`/`renice` para CPU, `ionice` para I/O, `ulimit` para límites por proceso  
✅ **systemd:** unidades, targets, `systemctl start/stop/enable/disable/status`, `systemctl edit` para drop-ins  
✅ **Unidades propias:** anatomía `[Unit][Service][Install]`, `User=`, `Restart=on-failure`, hardening con `ProtectSystem=`  
✅ **journalctl:** filtrar por unidad, tiempo, prioridad y proceso; limpiar con `--vacuum-*`  
✅ **Cron:** sintaxis de 5 campos, entorno minimal (usar rutas absolutas), `/etc/cron.d`, `at` para tareas únicas  
✅ **Timers:** `OnCalendar=`, `Persistent=true`, ventajas sobre cron (logs, overlaps, hardening)  

**Próximo paso:** [Módulo 10 — Shell scripting Bash](/shell-scripting-bash). Con el control de procesos y servicios de este módulo como base, aprenderás a automatizar todo con scripts de Bash: variables, bucles, condiciones, funciones y las mejores prácticas para escribir scripts de producción.

---

**Última actualización:** 2024-06  
**Versión:** 1.0  
**Estado:** ✅ Listo para enseñanza
