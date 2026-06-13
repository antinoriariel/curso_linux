---
title: "Módulo 01 — Introducción al mundo Linux"
sidebar_label: "01 · Introducción al mundo Linux"
description: Historia, filosofía UNIX, distribuciones, licencias y el ecosistema del software libre.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Módulo 01 — Introducción al mundo Linux

## Introducción

Antes de tocar una sola tecla conviene entender **qué es Linux, de dónde viene y por qué funciona como funciona**. Este módulo establece el contexto histórico, conceptual y filosófico sobre el que se apoya todo el curso.

Linux no es simplemente un programa que descargamos e instalamos: es el resultado de décadas de innovación académica, batalla comercial, ideología de software libre y evolución de estándares técnicos. Para usarlo eficientemente, necesitamos comprender estas capas.

### Objetivos de aprendizaje

Al finalizar este módulo, serás capaz de:

- ✅ Explicar la arquitectura fundamental de un sistema operativo (kernel, espacio de usuario, llamadas al sistema)
- ✅ Distinguir entre Linux (el kernel) y GNU/Linux (el sistema completo)
- ✅ Narrar la historia técnica y política de UNIX, GNU y Linux
- ✅ Identificar y articular la filosofía UNIX en herramientas prácticas
- ✅ Analizar licencias de software libre y sus implicaciones legales
- ✅ Seleccionar una distribución adecuada para un caso de uso específico
- ✅ Ubicar Linux en el contexto actual del ecosistema informático

---

## 1.1 — ¿Qué es un sistema operativo?

### Definición fundamental

Un **sistema operativo (SO)** es un programa especializado que gestiona los recursos de hardware de una máquina y actúa como intermediario entre el usuario (y sus aplicaciones) y el hardware físico.

```
┌─────────────────────────────────────────────┐
│        Aplicaciones y Usuarios              │
│   (navegadores, editores, compiladores)    │
├─────────────────────────────────────────────┤
│     Bibliotecas y APIs del Sistema          │
│  (libc, libpthread, syscalls wrappers)     │
├─────────────────────────────────────────────┤
│             KERNEL (Linux)                  │
│  (gestión de memoria, procesos, I/O)       │
├─────────────────────────────────────────────┤
│         Hardware (CPU, RAM, disco)         │
└─────────────────────────────────────────────┘
```

#### Responsabilidades clave del SO

| Responsabilidad | Descripción | Ejemplo en Linux |
|---|---|---|
| **Gestión de procesos** | Controlar qué programas se ejecutan, en qué orden y durante cuánto tiempo | El kernel usa el scheduler para asignar tiempo de CPU |
| **Gestión de memoria** | Asignar RAM a procesos, proteger espacios de memoria, implementar virtual memory | Paginación, segmentación, memory protection rings |
| **Sistema de archivos** | Organizar y recuperar datos en almacenamiento persistente | ext4, btrfs, XFS |
| **Entrada/Salida (I/O)** | Comunicarse con periféricos (discos, red, USB, pantalla) | Drivers, IRQs, DMA |
| **Seguridad** | Controlar quién accede a qué recursos | Usuarios, grupos, permisos, SELinux, AppArmor |

### El kernel: corazón del SO

El **kernel** es la parte más privilegiada del sistema operativo. Es el único código que ejecuta directamente en el procesador en **modo privilegiado** (ring 0, en arquitectura x86).

#### Modo kernel vs. modo usuario

```
CPU
├── Ring 0 (Kernel mode) ← Solo el kernel puede ejecutar aquí
│   ├── Instrucciones privilegiadas (I/O, cambio de contexto)
│   ├── Acceso directo a memoria física
│   └── Acceso directo a recursos de hardware
│
├── Ring 1 (Modo supervisor) ← Rara vez usado en Linux
│
├── Ring 2 (Modo supervisor) ← Rara vez usado en Linux
│
└── Ring 3 (User mode) ← Aplicaciones normales ejecutan aquí
    ├── Instrucciones limitadas
    ├── Memoria virtual aislada
    └── Acceso a hardware solo a través de syscalls
```

**¿Por qué esta separación?** Protección. Si un programa en user mode puede acceder directamente al hardware, podría sabotear a otros programas, corromper el sistema de archivos o robar datos. El kernel actúa como policía, verificando que todo sea seguro.

#### Llamadas al sistema (syscalls)

Cuando una aplicación necesita acceso a recursos protegidos (abrir un archivo, crear un proceso, enviar datos por red), realiza una **llamada al sistema** (syscall).

```c
// Código en aplicación (user mode)
int fd = open("/etc/passwd", O_RDONLY);

// Lo que sucede internamente:
// 1. Cambio a modo kernel
// 2. Validación de permisos
// 3. Búsqueda del archivo en el sistema de archivos
// 4. Retorno al modo usuario con resultado
```

Linux implementa más de [400 syscalls](https://man7.org/linux/man-pages/man2/syscalls.2.html). Algunas fundamentales:

- `open()`, `read()`, `write()`, `close()` — I/O de archivos
- `fork()`, `exec()` — Creación y ejecución de procesos
- `socket()`, `connect()`, `send()` — Operaciones de red
- `mmap()` — Mapeo de memoria
- `kill()` — Envío de señales

### GNU/Linux: la distinción crítica

Aquí hay un punto que confunde a muchos principiantes:

- **Linux** es solo el kernel (el núcleo que gestiona hardware)
- **GNU/Linux** es el kernel Linux + herramientas GNU (shell, compilador, utilidades de texto, gestor de paquetes, etc.)

```
Linux = ❌ No puedes hacer nada útil directamente
        ✅ Puedes ejecutar un proceso, gestionar memoria

GNU/Linux = ✅ Tienes bash, gcc, grep, vim, python, apt, etc.
           ✅ Sistema operativo completo y funcional
```

Históricamente, Richard Stallman y el proyecto GNU crearon herramientas UNIX durante los años 80. Cuando Linus Torvalds escribió un kernel compatible en 1991, la combinación produjo un SO gratuito y completo.

:::info
**Nota terminológica:** Hoy en día decimos "Linux" coloquialmente para referirnos a GNU/Linux. Este curso también lo hará, pero es importante recordar la distinción técnica.
:::

### Comparativa: Linux vs. Windows vs. macOS

| Aspecto | Linux | Windows | macOS |
|---|---|---|---|
| **Kernel** | Linux | NT Kernel | XNU (Darwin) |
| **Licencia** | GPL (libre) | Propietario | Propietario (UNIX certified) |
| **Código fuente** | Público y auditable | Cerrado | Parcialmente cerrado |
| **Arquitectura** | Monolítico modular | Micronúcleo híbrido | Micronúcleo (Mach) |
| **Filosofía** | UNIX, minimalismo | Abstracción, GUI-first | UNIX + Apple design |
| **Costo** | Gratuito | Licencia requerida | Licencia con hardware |
| **Distribuciones** | 600+ variantes | Una versión estándar | Una versión estándar |

### Arquitectura de un SO Linux completo

```
┌────────────────────────────────────────────────────────┐
│  Aplicaciones de Usuario                               │
│  (GNOME, Firefox, PostgreSQL, Apache, etc.)            │
├────────────────────────────────────────────────────────┤
│  GNU C Library (glibc) - Interfaz entre apps y kernel  │
│  Herramientas GNU: bash, coreutils, diffutils, grep    │
├────────────────────────────────────────────────────────┤
│  KERNEL LINUX                                          │
│  ┌─────────────┬──────────────┬──────────┬──────────┐  │
│  │ Subsistema  │ Subsistema   │ VFS      │ Network  │  │
│  │ de Procesos │ de Memoria   │ Stack    │ Stack    │  │
│  └─────────────┴──────────────┴──────────┴──────────┘  │
├────────────────────────────────────────────────────────┤
│  Drivers de Dispositivos                               │
│  (Controladores de red, disco, USB, gráficos, etc.)    │
├────────────────────────────────────────────────────────┤
│  HARDWARE                                              │
│  (CPU, RAM, Disco, NIC, GPU, etc.)                     │
└────────────────────────────────────────────────────────┘
```

#### Componentes principales del kernel Linux

1. **Scheduler de procesos:** Decide qué proceso ejecuta en cada momento
2. **Gestor de memoria:** Asigna RAM, maneja paginación, swapping
3. **Virtual File System (VFS):** Abstracción unificada sobre sistemas de archivos
4. **Network Stack:** Implementación de protocolos TCP/IP
5. **Subsistema de I/O:** Control de periféricos
6. **Control de acceso:** Verificación de permisos y seguridad

### Tipos de kernel: monolítico vs. microkernel vs. híbrido

Esta distinción es fundamental para entender por qué Linux se comporta como lo hace.

#### Kernel monolítico

Todo el código del SO (drivers, sistemas de archivos, red, scheduler) vive en **un único espacio de memoria privilegiado**.

```
┌─────────────────────────────────────────────────────┐
│               KERNEL MONOLÍTICO                     │
│  ┌──────────┬────────────┬────────────┬──────────┐  │
│  │Scheduler │  Memoria   │    Red     │   VFS    │  │
│  │ de CPU   │ (paging)   │  (TCP/IP)  │(ext4,xfs)│  │
│  ├──────────┴────────────┴────────────┴──────────┤  │
│  │           Drivers (USB, disk, GPU…)            │  │
│  └────────────────────────────────────────────────┘  │
│  Todo en Ring 0 — Comunicación por llamadas directas │
└─────────────────────────────────────────────────────┘
```

**Ventajas:**
- Rendimiento máximo (sin overhead de IPC entre componentes)
- Acceso directo a funciones internas

**Desventajas:**
- Un bug en un driver puede colapsar **todo** el sistema
- Difícil aislar fallos

**Ejemplos:** Linux (monolítico **modular** — los drivers se cargan como módulos), FreeBSD

#### Microkernel

Solo las funciones más esenciales viven en kernel mode. El resto (drivers, sistemas de archivos) corren en **espacio de usuario**.

```
┌──────────────────────────────────────────────┐
│  User Space                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Driver   │ │ Driver   │ │  Servidor    │  │
│  │ de Disco │ │  de Red  │ │  de Archivos │  │
│  └──────────┘ └──────────┘ └──────────────┘  │
├──────────────────────────────────────────────┤
│  MICROKERNEL (Ring 0) — Solo lo esencial     │
│  IPC · Scheduler básico · Gestión memoria   │
└──────────────────────────────────────────────┘
```

**Ventajas:**
- Fallo de un driver no colapsa el kernel
- Más seguro y aislado

**Desventajas:**
- Comunicación entre componentes es más lenta (IPC overhead)
- Complejidad de implementación

**Ejemplos:** GNU/Hurd (Mach), QNX, seL4, Minix

#### Kernel híbrido

Intenta combinar lo mejor de ambos mundos: núcleo pequeño pero con algunos servicios en kernel space por rendimiento.

**Ejemplos:** Windows NT, macOS (XNU = Mach microkernel + BSD components en kernel space)

#### ¿Por qué Linux eligió monolítico modular?

Linus Torvalds y Andrew Tanenbaum (creador de Minix) tuvieron un debate histórico en 1992 sobre esto. Linus eligió monolítico por **pragmatismo**: mejor rendimiento para hardware real, y los módulos cargables ofrecen la flexibilidad necesaria sin sacrificar velocidad.

```bash
# Ver módulos cargados actualmente
lsmod

# Cargar un módulo manualmente
modprobe bluetooth

# Ver información de un módulo
modinfo ext4
```

---

## 1.2 — Historia: de UNIX a Linux

### Contexto: Los años 70 y el nacimiento de UNIX

En los años 60-70, los sistemas operativos eran monolíticos, complejos y específicos de cada fabricante de hardware. IBM tenía su SO, DEC el suyo, etc. Cambiar de hardware significaba reaprender todo.

En **1969**, en los Bell Labs (AT&T), un grupo de investigadores liderado por **Ken Thompson** y **Dennis Ritchie** creó **UNIX** como respuesta a esta fragmentación.

#### Objetivos de UNIX original

- **Portabilidad:** Funcionar en cualquier hardware
- **Simplicidad:** Código legible y mantenible
- **Composibilidad:** Pequeños programas que se conectan
- **Estabilidad:** Largo ciclo de vida sin reescrituras

UNIX fue escrito mayormente en **C** (un lenguaje creado por el mismo Ritchie), lo que permitió portabilidad. Un pequeño kernel (~8000 líneas) + herramientas modulares.

```
┌─ Bell Labs (AT&T)
├─ Ken Thompson & Dennis Ritchie: UNIX original (1969)
├─ Se distribuye con fuentes académicas (bajo licencia restrictiva)
└─ Florecen variantes académicas y comerciales
```

### La guerra de los UNIX comerciales (1980s-1990s)

La popularidad de UNIX llevó a múltiples implementaciones comerciales, cada una con extensiones propias:

| Variante | Origen | Características | Destino |
|---|---|---|---|
| **AT&T System V** | AT&T | Estándar oficial, SysVinit | Base de muchos UNIX comerciales |
| **BSD** (Berkeley) | UC Berkeley | Más liberal, TCP/IP nativo, permisos "permisivos" | Evoluciona en OpenBSD, NetBSD, FreeBSD |
| **AIX** | IBM | Propietario, para Power Systems | Aún en uso en servidores enterprise |
| **Solaris** | SUN Microsystems | Propietario, Sun-specific | Declina con Linux |
| **IRIX** | SGI | Propietario, gráficos 3D | Descontinuado |
| **HP-UX** | Hewlett-Packard | Propietario, para arquitectura PA-RISC | Descontinuado |

El problema: aunque todos fueran "UNIX", los programas escritos para uno no funcionaban fácilmente en otro. Fragmentación de nuevo.

```
┌── UNIX (1969)
│
├─ AT&T System V
│  ├─ SVR4 (última versión comercial)
│  └─ Legado en: Linux (SysVinit), Solaris, etc.
│
├─ Berkeley Software Distribution (BSD)
│  ├─ 4.2BSD, 4.3BSD
│  └─ Evoluciona en: FreeBSD, NetBSD, OpenBSD, macOS
│
└─ Variantes propietarias (AIX, Solaris, IRIX, HP-UX)
   └─ Reemplazadas gradualmente por Linux
```

### El proyecto GNU (1983-1991)

En **1983**, **Richard Stallman** (del MIT) declaró el **Proyecto GNU** (GNU's Not UNIX — un acrónimo recursivo, como era común en MIT):

> "Starting this Thanksgiving Day, I am spending the rest of the year writing a wholly compatible substitute for the UNIX operating system."

**Misión:** Crear un SO completamente libre, donde los usuarios tuvieran derecho a:

1. **Usar** el software sin restricciones
2. **Estudiar** el código fuente
3. **Modificar** el software
4. **Distribuir** copias y mejoras

Resultado: GNU creó herramientas equivalentes a las de UNIX:

| UNIX | GNU Equivalent |
|---|---|
| `cc` (compilador) | **GCC** (GNU Compiler Collection) |
| `ed` (editor) | **Emacs** |
| `sh` (shell) | **Bash** (Bourne Again Shell) |
| `awk`, `sed` | **Gawk**, **Sed** |
| Utilidades básicas | **Coreutils** (`ls`, `cat`, `grep`, etc.) |

Sin embargo, **GNU no creó un kernel**. Trabajaban en **Hurd** (un kernel microkernel), pero resultó demasiado ambicioso y nunca se completó. GNU/Hurd existe, pero es un proyecto académico, no uso general.

:::warning
**El problema irresuelto:** A principios de los 90, GNU tenía excelentes herramientas pero no un kernel funcional. El software libre estaba cerca, pero no era realidad.
:::

### El nacimiento de Linux (1991)

En **Agosto de 1991**, un estudiante finlandés de 21 años, **Linus Benedikt Torvalds**, escribió en el grupo de noticias `comp.os.minix`:

> "Hello everybody out there using minix - I'm doing a (free) operating system (just a hobby, won't be big and professional like gnu) for 386-AT computers."

Así nació **Linux**: un kernel gratuito, escrito por Linus, inicialmente para la plataforma Intel 386.

```
Comparación: Minix vs. Linux inicial

Minix (Andrew Tanenbaum)
├─ Kernel pequeño (12,000 líneas)
├─ Diseño microkernel académico
├─ No libre para uso comercial
└─ Educativo, no práctico

Linux (Linus Torvalds)
├─ Kernel monolítico modular
├─ Completamente libre
├─ Rápidamente funcional
└─ Pragmático: "Eso funciona? Adelante."
```

#### Cronología de Linux

```
1991-08: Linus publica Linux 0.01 (8,000 líneas)
1992-01: Linux 0.12 - Primer lanzamiento en ftp.iki.fi
1992-03: Sistema de archivos ext (extensible)
1993-03: Linux 0.99 - 100,000 descargas
         Kernel modular, mejor scheduler
1994-03: Linux 1.0 - Release "estable"
1996-06: Linux 2.0 - SMP (multiprocesador), threads
1999-05: Linux 2.2 - Mejor escalabilidad
2001-01: Linux 2.4 - 32-bit, mejor I/O, devtmpfs
2003-12: Linux 2.6 - Cambios masivos, hotplug, preemption
2011-05: Linux 3.0 - Cambio de versioning
2015-04: Linux 4.0 - Comienzo de kernel moderno
2022-05: Linux 5.15 - Estado actual de stable release
```

:::tip
**Dato curioso:** Linus eligió el nombre "Linux" (una combinación de "Linus" + "UNIX") un poco por casualidad. Originalmente lo llamaba "Freax". El administrador del servidor FTP lo cambió a "Linux".
:::

### POSIX: El estándar que vinculó todo

A medida que la fragmentación UNIX continuaba, el IEEE lanzó en **1988** el **estándar POSIX** (Portable Operating System Interface, X para "UNIX-like").

POSIX define:

- **API estándar** (syscalls, funciones de biblioteca)
- **Comportamiento de shells y utilidades**
- **Sistema de archivos y I/O**
- **Procesos y señales**

Una aplicación escrita para POSIX teóricamente funcionaría en cualquier POSIX-compliant OS.

```
┌─────────────────┐
│  Aplicación     │
│  (POSIX code)   │
├─────────────────┤
│  POSIX API      │
├─────────────────┤
│  SO (Linux, BSD,│
│  Solaris, etc.) │
├─────────────────┤
│  Hardware       │
└─────────────────┘

Resultado: Portabilidad real
```

**Linux y POSIX:**
- Linux es **POSIX-compliant** (certificado por The Open Group)
- Esto significa que código POSIX funciona en Linux sin cambios
- Pero Linux también tiene extensiones propias (systemd, epoll, netlink, etc.)

---

## 1.3 — La filosofía UNIX

La filosofía UNIX no es solo un conjunto de características técnicas; es una **forma de pensar sobre la ingeniería de software**. Fue codificada por Doug McIlroy (Bell Labs) a fines de los 70:

### Los 10 principios UNIX

#### 1. "Haz una cosa y hazla bien" (*Do One Thing and Do It Well*)

Cada programa debe tener una responsabilidad única y ejecutarla perfectamente.

```bash
# ❌ Anti-patrón: Un programa que hace todo
$ my-tool --compress --encrypt --upload file.txt
# Difícil de probar, mantener y extender

# ✅ Patrón UNIX: Programas especializados
$ gzip file.txt                    # Compresión
$ gpg --encrypt file.txt.gz        # Encriptación
$ scp file.txt.gz.gpg server:/     # Subida
```

**Beneficios:**
- Fácil de testear (test unitarios)
- Reutilizable en contextos diferentes
- Mantenible (menos código, menos bugs)
- Componible (ver principio #2)

#### 2. Componibilidad: "Conecta pequeños programas" (*Composition*)

El verdadero poder surge de la combinación de herramientas simples mediante **pipes** (|).

```bash
# Encontrar las líneas únicas más largas en un archivo
$ cat logas.txt | sort | uniq | awk '{print length, $0}' | sort -rn | head -5

# Desmenuzar:
cat logas.txt              # 1. Leer archivo
  | sort                   # 2. Ordenar líneas
  | uniq                   # 3. Eliminar duplicados
  | awk '{print length, $0}'  # 4. Prepend longitud
  | sort -rn               # 5. Ordenar por longitud (desc)
  | head -5                # 6. Top 5
```

Ningún programa individual es complejo, pero su combinación resuelve un problema concreto. **Este es el verdadero poder de UNIX.**

**Arquitectura de pipes:**

```
ENTRADA → Programa 1 → Programa 2 → Programa 3 → SALIDA
         (transforma)  (transforma)  (transforma)

Cada programa:
- Lee de stdin
- Procesa
- Escribe a stdout
- Opcional: Errores a stderr
```

#### 3. "Todo es un archivo"

En UNIX, la abstracción fundamental es el **archivo**. No solo documentos, sino:

```
/dev/null       → Sumidero infinito (descarta todo)
/dev/zero       → Fuente infinita de bytes nulos
/dev/random     → Números aleatorios
/dev/sda        → Disco duro (bloque)
/proc/cpuinfo   → Información de CPU (procfs)
/sys/class/net  → Interfases de red (sysfs)
/dev/pts/0      → Terminal (char device)
/etc/passwd     → Archivo de texto plano
/home/user/     → Directorio (tipo especial de archivo)
```

**Ventaja:** Una interfaz uniforme. Todos se leen con `open()`, `read()`, `write()`.

```bash
# Todos estos usan la misma interfaz de "archivo"
cat /etc/hostname           # Leer archivo de texto
hexdump -C /dev/sda         # Leer sector de disco
cat /proc/cpuinfo           # Leer info del kernel
ls -l /dev                  # Enumerar dispositivos
```

#### 4. Interfaz de texto plano

UNIX prefiere comunicación mediante **texto plano estructurado**, no binarios propietarios.

```bash
# ✅ UNIX: Archivos de configuración en texto
$ cat /etc/ssh/sshd_config
Port 22
PermitRootLogin no
PasswordAuthentication yes

# ✅ UNIX: Comandos reciben input de texto
$ echo "3+4" | bc
7

# ✅ UNIX: Output es fácilmente parseable
$ ps aux | grep nginx
root      1234  0.0  0.1 234567 12345 ?  Ss  10:00 nginx
nginx     1235  0.0  0.2 345678 23456 ?  S   10:00 nginx
```

**Ventajas:**
- Humano-legible
- Versiones, diffs y merges triviales (git)
- Herramientas de texto (grep, sed, awk) pueden procesar cualquier cosa
- Debugging fácil (leer logs directamente)

#### 5. Perspectiva de interoperabilidad

Las herramientas deben funcionar juntas, sin conocer los detalles de las demás.

```bash
# find (buscar archivos) no necesita saber cómo grep trabaja
find /var/log -name "*.log" -type f | xargs grep "ERROR"

# sort no necesita saber de dónde vienen los datos
cat archivo.txt | sort
ps aux | sort -k 2 -n
```

#### 6. Automatización: "Escribe programas que escriban programas"

Metaprogramación y scripting:

```bash
# Generar un archivo de configuración
$ for port in 8000 8001 8002; do
    echo "server { listen $port; }" >> nginx.conf
done

# Script que monitorea y reacciona
$ while true; do
    LOAD=$(uptime | awk '{print $(NF-2)}')
    if (( $(echo "$LOAD > 4.0" | bc -l) )); then
        systemctl restart service
    fi
    sleep 60
done
```

#### 7. Transparencia

Los mecanismos internos deben ser observables.

```bash
# Ver qué archivos abre un programa
$ strace -e openat ls /tmp
openat(AT_FDCWD, ".", O_RDONLY|O_CLOEXEC) = 3

# Ver qué syscalls ejecuta
$ strace -e trace=write echo "hello"
write(1, "hello\n", 6)

# Ver el grafo de procesos
$ pstree -p
init(1)─┬─systemd-journal(2345)
        ├─sshd(2346)─┬─sshd(2347)
        │            └─bash(2348)
        └─...
```

#### 8. Modulación: Mantén separados datos y programas

Datos y lógica deben estar desacoplados:

```bash
# ✅ Bueno: Datos en archivo, programa los procesa
$ cat datos.csv | awk -F',' '{print $1, $3}'

# ❌ Malo: Datos hardcoded en el programa
# (requiere recompilación para cambiar datos)
```

#### 9. Mejor simple que correcto (pragmatismo)

A veces, una solución "suficientemente buena" es mejor que esperar lo perfecto:

```bash
# Script rápido que funciona hoy
$ awk '{print $1}' /var/log/access.log | sort | uniq -c | sort -rn | head -10

# En lugar de escribir un parser robusto en C
```

#### 10. Libertad de pensamiento

Los usuarios deben tener libertad de escoger e innovar:

```bash
# Puedo usar el shell que prefiera
bash, zsh, fish, ksh, tcsh...

# Puedo reemplazar cualquier herramienta
ls → exa
cat → bat
grep → ripgrep
```

### Cómo estos principios moldean el curso

Verás estos principios a lo largo del curso:

- **Scripting en Bash:** Composición de comandos simples → [Módulo 10](/shell-scripting-bash)
- **Procesamiento de texto:** `grep`, `sed`, `awk` son especialistas → [Módulo 05](/archivos-y-procesamiento-de-texto)
- **Pipes y redirección:** Conectar programas → [Módulo 03, sección 3.5](/terminal-y-shell#35--expansiones-de-la-shell)
- **Archivos de configuración:** YAML, JSON, INI (texto plano) → [Módulo 03, sección 3.6](/terminal-y-shell#36--variables-de-entorno-y-configuraci%C3%B3n)
- **Logs y monitoreo:** Todo observable → [Módulo 15](/monitorizacion-y-rendimiento)

:::info **Próximo módulo relacionado**
En el [Módulo 03 — La terminal y la shell](/terminal-y-shell) materializarás estos principios: aprenderás a combinar comandos con pipes, a redirigir entrada/salida y a construir pipelines UNIX que resuelven problemas reales.
:::

---

## 1.4 — Licencias y software libre

### Las cuatro libertades del software libre

En **1986**, Richard Stallman formalizó qué significa que un software sea "libre" mediante las **Cuatro Libertades Fundamentales**:

```
Libertad 0: Usar el software para cualquier propósito
           (comercial, educativo, personal, malicioso)
           Sin restricciones de geografía, tiempo, etc.

Libertad 1: Estudiar cómo funciona el software
           Acceso al código fuente (requisito imprescindible)
           Estudiar sin restricciones de tiempo o recursos

Libertad 2: Distribuir copias (modificadas o no)
           Ayudar a otros copiando el software
           Vender copias (pero no crear monopolios)

Libertad 3: Mejorar el software y liberar mejoras
           Crear versiones derivadas
           Distribuir modificaciones
```

**Nota crítica:** "Libre" significa **libertad**, no **gratis**. Un software puede ser:

- **Libre y gratuito:** Linux (GPL)
- **Libre pero de pago:** Algunos softwares con licencia permisiva vendidos comercialmente
- **Propietario pero gratuito:** Chrome, Visual Studio Code Community Edition (aunque no completamente libre)
- **Propietario y de pago:** Windows, macOS, Adobe Creative Suite

:::info
Décimos "libre" en inglés como "free speech" (libertad), no "free beer" (gratis). El término original en español sería "software de fuentes abiertas" o "software libre" según el contexto.
:::

### Licencias de software libre principales

#### GPL v3 (GNU Public License) — Copyleft fuerte

```
┌─────────────────────────────────────┐
│ Software GPL v3                     │
├─────────────────────────────────────┤
│ Si lo modificas y lo liberas,       │
│ DEBES liberar el código bajo GPL    │
│ (Copyleft: el derecho se propaga)   │
└─────────────────────────────────────┘
```

**Características:**
- Copyleft **fuerte:** Modificaciones deben tener GPL
- Patentes explícitamente concedidas
- Protección anti-tiviización (TPM)
- Requisito de fuentes

**Ejemplos:** Linux kernel, Bash, GCC, GNU tools

**Implicaciones comerciales:**
- ✅ Puedes usar GPL software comercialmente
- ✅ Puedes modificarlo
- ❌ No puedes venderlo como propietario
- ❌ Debes distribuir fuentes
- ❌ Derivados deben ser GPL

```
Empresa A
├─ Desarrolla software propietario XYZ
├─ Incluye código GPL (p.ej. Linux)
└─ DEBE liberar el código bajo GPL
   (No es una opción)
```

#### LGPL (Lesser GPL) — Copyleft suave

```
┌──────────────────────────────────────┐
│ Biblioteca LGPL                      │
├──────────────────────────────────────┤
│ Puedes linkear desde código          │
│ propietario SIN heredar la licencia  │
│ (Solo cambios a la biblioteca misma) │
└──────────────────────────────────────┘
```

**Pensada para bibliotecas:**

```c
// Software propietario
#include <gpl-library.h>     // ❌ Heredaría GPL
#include <lgpl-library.h>    // ✅ Permitido, no hereda

int main() {
    lgpl_function();
    return 0;
}
// Compilado: Código propietario + LGPL biblioteca
```

**Ejemplos:** glibc, Qt (parcialmente), GTK

#### MIT / BSD — Permisivo

```
┌──────────────────────────────────┐
│ Software MIT/BSD                 │
├──────────────────────────────────┤
│ Haz lo que quieras:              │
│ - Usa comercialmente             │
│ - Modifica sin revelar           │
│ - Vende como propietario         │
│                                  │
│ Solo requisito:                  │
│ - Mantén la licencia/créditos    │
└──────────────────────────────────┘
```

**MIT (simplísima):**
```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

**Ejemplos:** Node.js, Rails, Kubernetes, Go

**Caso de uso:** Perfecto para bibliotecas que quieren máxima adopción

#### Apache 2.0 — Permisivo con patentes

Como MIT/BSD pero con **cláusula explícita de patentes**.

```
Si patento una mejora de Apache,
debo conceder una licencia gratuita a todos
los usuarios de Apache.
```

**Ejemplos:** Apache HTTP Server, Hadoop, Android

#### GPL vs. MIT: El debate

```
GPL (Copyleft)
├─ ✅ Protege la comunidad: mejoras se comparten
├─ ✅ Previene "tiranía del propietario"
├─ ✅ Incentiva contribución back
└─ ❌ Asusta a empresas (restricciones)

MIT (Permisivo)
├─ ✅ Máxima libertad
├─ ✅ Fácil adopción en empresas
├─ ✅ Puedes monetizar derivados
└─ ❌ Corporación puede tomar y cerrar código
   └─ (Pero comunidad tiene copia)
```

**Decisión histórica de Linux:** Linus eligió **GPL v2** inicialmente, luego migró a **v3**.

### Tabla comparativa de licencias

| Licencia | Tipo | Comercial | Modificar | Derivado | Copyleft |
|---|---|---|---|---|---|
| **GPL v3** | Copyleft fuerte | ✅ | ✅ | Debe ser GPL | Sí |
| **LGPL** | Copyleft suave | ✅ | ✅ | Código externo libre | Sí (suave) |
| **MIT** | Permisivo | ✅ | ✅ | Sin restricción | No |
| **Apache 2** | Permisivo | ✅ | ✅ | Sin restricción | No (pero patentes) |
| **BSD** | Permisivo | ✅ | ✅ | Sin restricción | No |
| **Propietario** | Cerrado | ❌ (típico) | ❌ | ❌ | N/A |

### Software libre vs. código abierto vs. freeware

Aunque los términos se usan indistintamente, hay diferencias:

```
┌─────────────────────────────────────────────┐
│ Software Libre (Free Software)              │
│ • Cuatro libertades garantizadas             │
│ • Acceso al código fuente OBLIGATORIO       │
│ • Licencia explícita (GPL, BSD, MIT)        │
│                                             │
│ Ejemplos: Linux, Bash, GCC                  │
└─────────────────────────────────────────────┘
         ↓
    (Relacionado pero distinto)
         ↓
┌─────────────────────────────────────────────┐
│ Código Abierto (Open Source)                │
│ • Código fuente disponible públicamente     │
│ • NO necesariamente libremente reutilizable │
│ • Enfoque pragmático, no ideológico         │
│                                             │
│ Ejemplos: GPL software, Apache 2, MIT       │
│ (Superset de software libre)                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Freeware (Gratuito)                         │
│ • Costo cero                                │
│ • NO necesariamente libre                   │
│ • Código fuente típicamente cerrado         │
│                                             │
│ Ejemplos: Skype (antiguo), Discord          │
│ (Propietario pero sin costo)                │
└─────────────────────────────────────────────┘
```

:::warning
**Confusión común:** Un software puede ser:
- ✅ Software libre (GPL) = Open source
- ✅ Open source (MIT) ≠ Software libre ideológicamente (sin ideología política)
- ✅ Freeware ≠ Libre (Adobe Reader es gratuito pero no libre)
:::

### Modelos de negocio alrededor del software libre

¿Cómo ganan dinero las empresas con software libre?

#### 1. Servicios (Red Hat, Canonical)

```
Software Linux/OpenStack → Libre (costo de descarga: $0)
                       ↓
Empresas pagan por:
├─ Soporte técnico 24/7
├─ SLA (garantías)
├─ Parches de seguridad
├─ Certificación
└─ Consultoría
```

**Red Hat**: Ganador: $4.7B (2022) vendiendo Red Hat Enterprise Linux como servicio.

#### 2. SaaS (Software as a Service)

```
Software libre (código disponible) → Usuario no tiene que administrarlo
                              ↓
Empresa cobra por:
├─ Infraestructura (servidores)
├─ Mantenimiento
├─ Updates
├─ Disponibilidad (uptime SLA)
```

**Ejemplo:** Automattic con WordPress, Canonical con Landscape.

#### 3. Dual licensing

```
Usuarios personales/pequeños → Software GPL (gratis)
                          ↓
Empresas grandes/propietarias → Licencia comercial (pago)
```

**Ejemplo:** Qt, MySQL (antes de Oracle)

#### 4. Extras propietarios

```
Core software libre → Acceso gratuito
                  ↓
Features premium, interface propietaria → Pago
```

**Ejemplo:** GitLab (Community Edition libre, Enterprise Edition paga)

#### 5. Hardware + Software

```
Hardware propietario caro → Software incluido (GPL)
```

**Ejemplo:** Routers, NAS, cajas STB. Venden el hardware; software es libre (a menudo GPL).

---

## 1.5 — Distribuciones: el ecosistema Linux

### ¿Qué es una distribución?

Una **distribución Linux** (o "distro") es un **paquete curado** que incluye:

```
┌────────────────────────────────────┐
│ Kernel Linux (monolítico)          │
├────────────────────────────────────┤
│ Init system (systemd, OpenRC, etc) │
├────────────────────────────────────┤
│ Herramientas GNU (bash, coreutils) │
├────────────────────────────────────┤
│ Gestor de paquetes (apt, rpm, etc) │
├────────────────────────────────────┤
│ Ecosistema de software (repos)     │
├────────────────────────────────────┤
│ Escritorio (GNOME, KDE, etc)       │
│ [Opcional, solo desktops]          │
├────────────────────────────────────┤
│ Documentación y comunidad          │
└────────────────────────────────────┘
```

**Ninguna distribución es "mejor":** Cada una optimiza para un caso de uso diferente.

```
┌──────────────┐
│   USUARIOS   │
└──────────────┘
       ↓ ¿Qué quiero?
    ┌──────────────────────────────────────┐
    │ ¿Caso de uso?                        │
    ├────────────────────────────────────┐
    │ Servidor / Cloud / Escritorio      │
    │ Estabilidad vs. Bleeding-edge      │
    │ Filosofía (libre vs. pragmático)   │
    │ Experiencia deseada                 │
    └────────────────────────────────────┘
       ↓
    Selecciona distro
```

### Las grandes familias de distribuciones

#### Familia Debian/Ubuntu

```
Debian (1993)
│
├─ Base: APT (Advanced Package Tool)
├─ Sistema init: systemd (desde Jessie 2015)
├─ Filosofía: Estabilidad, software libre
├─ Ciclo: Major release cada 2 años
│
├─ Ubuntu (2004) — Comercializado por Canonical
│  ├─ "Ubuntu = Linux para humanos"
│  ├─ Ciclo: Versión cada 6 meses (LTS cada 2 años)
│  ├─ Enfoque: Facilidad de uso
│  └─ Derivadas: Linux Mint, Pop!_OS, Elementary OS
│
├─ Linux Mint (2006)
│  ├─ Basado en Ubuntu/Debian
│  ├─ Objetivo: Amigable para nuevos usuarios
│  └─ Mayor: Cinnamon DE
│
└─ Derivadas menores: Zorin OS, Kali Linux
```

**Características:**
- ✅ Mayor comunidad (StackOverflow, etc)
- ✅ Excelente software de escritorio
- ✅ Ideal para principiantes
- ✅ Altamente estable
- ❌ Versiones antiguas del software (pero testeadas)

**Gestor de paquetes:** `apt`, `apt-get`, `dpkg`

```bash
# Instalar paquete
apt install nodejs

# Actualizar
apt update && apt upgrade

# Buscar
apt search nginx
```

#### Familia Red Hat / Fedora

```
Red Hat Enterprise Linux (RHEL) (1995)
│
├─ Base: YUM/DNF (Yellowdog Updater, Modified)
├─ Sistema init: systemd
├─ Filosofía: Enterprise, soporte comercial
├─ Ciclo: Versión cada 3 años (10 años soporte)
│
├─ Fedora (2003) — Upstream experimental
│  ├─ Versión cada 6 meses
│  ├─ Testing ground para RHEL
│  ├─ Más moderna que RHEL, menos estable
│  └─ Gratuita
│
└─ CentOS (2004)
   ├─ Reconstrucción libre de RHEL
   ├─ Ciclo idéntico a RHEL
   ├─ Cambio 2021: Se convierte en CentOS Stream
   └─ (Ahora entre Fedora y RHEL)
```

**Características:**
- ✅ Orientado a servidores empresariales
- ✅ Excelente soporte comercial (RHEL)
- ✅ Altamente estable y testeado
- ❌ Software más antiguo
- ❌ Comunidad más pequeña que Debian

**Gestor de paquetes:** `dnf` (moderno), `yum` (antiguo), `rpm`

```bash
# Instalar paquete
dnf install nodejs

# Actualizar
dnf update

# Buscar
dnf search nginx
```

#### Arch Linux (2002)

```
Filosofía: "Keep It Simple, Stupid" (KISS)
│
├─ Rolling release (no versiones fijas)
├─ Minimal: solo lo que instalas
├─ Gestor de paquetes: pacman
├─ Comunidad: Activa, Wiki excelente
└─ Curva de aprendizaje: Media-Alta
```

**Características:**
- ✅ Completamente modular (instalar solo lo que necesitas)
- ✅ Rolling release (siempre última versión)
- ✅ Gestor de paquetes muy simple (`pacman`)
- ✅ Comunidad técnica fuerte
- ✅ AUR (Arch User Repository) con miles de paquetes
- ❌ Requiere más configuración inicial
- ❌ Actualización rota ocasionalmente

```bash
# Instalar paquete
pacman -S nodejs

# AUR (user-built packages)
yay -S google-chrome  # AUR helper

# Actualizar todo
pacman -Syu
```

#### Alpine Linux (2009)

```
Objetivo: Minimalismo extremo
│
├─ Tamaño: ~5 MB en RAM
├─ Sistema init: OpenRC (no systemd)
├─ Enfoque: Contenedores, embebidos
├─ Musl libc (en lugar de glibc)
└─ Foco: Seguridad, tamaño mínimo
```

**Uso común:**
- Docker images
- Sistemas embebidos
- Servidores IoT

```dockerfile
# Imagen Docker mínima
FROM alpine:latest
RUN apk add --no-cache python3
CMD ["python3", "-m", "http.server"]
```

#### SUSE / openSUSE

```
Historia: Empresa alemana Novell
│
├─ openSUSE: Versión comunitaria (gratuita)
├─ SUSE Linux Enterprise: Versión corporativa
├─ Sistema init: systemd
├─ Gestor paquetes: zypper
├─ Entorno: Fuerte en YaST (herramienta config)
└─ Caso de uso: Europa corporativo
```

#### Gentoo (2002)

```
Filosofía: "Compila todo desde fuentes"
│
├─ Portage: Sistema de gestión de fuentes
├─ emerge: Compilación automática
├─ Altamente personalizable
├─ Curva aprendizaje: Muy alta
├─ Tiempo de instalación: Varias horas
└─ Caso de uso: Sistemas especializados, rendimiento máximo
```

### Modelos de publicación

#### Versiones fijas (Point Release)

```
Debian 12 "Bookworm" (2023)
│
├─ Versión congelada
├─ Solo actualizaciones de seguridad en 12.x
├─ Debian 13 llegará en 2 años (~2025)
├─ Predecible, estable
└─ Ideal para servidores

RHEL 9 (2021)
│
├─ 10 años de soporte
├─ Punto-releases: 9.0, 9.1, 9.2, ...
├─ Cambios mínimos entre versiones
└─ Ideal para enterprise
```

#### Rolling Release

```
Arch Linux
│
├─ Actualización continua
├─ Software siempre a última versión
├─ Kernel último, herramientas últimas
├─ Posible que algo se rompa
└─ Ideal para developers, latest-tech seekers

Fedora
│
├─ Hybrid: Entre point-release y rolling
├─ Versión cada 6 meses
├─ Soporte de 13 meses
└─ Buena para estar cerca del cutting edge
```

### Distribuciones especializadas

| Distro | Propósito | Características |
|---|---|---|
| **Kali Linux** | Pentesting / Seguridad | Herramientas de hacking preinstaladas |
| **Tails** | Privacidad / Anonimato | Enrutado a través de Tor, amnesic |
| **Qubes OS** | Seguridad extrema | Aislamiento de VM para cada aplicación |
| **Raspbian** | Raspberry Pi | Optimizado para ARM, pequeño |
| **Slackware** | UNIX puro | Sistema minimal, control total |
| **NixOS** | Reproducibilidad | Declarativo, immutable |

### Comparativa de distribuciones populares

| Aspecto | Ubuntu | Fedora | Arch | Alpine |
|---|---|---|---|---|
| **Filosofía** | Fácil de usar | Cutting-edge | Minimalismo | Minimalismo extremo |
| **Ciclo** | Point release (LTS: 5 años) | Point release (13 meses) | Rolling | Rolling |
| **Instalación** | Gráfica, fácil | Gráfica, moderada | Manual, compleja | CLI, mínima |
| **Paquetes** | ~60,000 | ~70,000 | ~13,000 | ~40,000 |
| **Comunidad** | Muy grande | Grande | Activa, técnica | Pequeña, técnica |
| **Servidor** | Excelente | Excelente | Muy bueno | Contenedores |
| **Escritorio** | Excelente | Muy bueno | Muy bueno | No |
| **Tamaño instalación** | 3-5 GB | 2-4 GB | 2-3 GB | ~150 MB |

### Criterios para elegir tu primera distribución

```
¿Cuál es tu caso de uso?

┌─ Principiante / Escritorio
│  └─ → Ubuntu, Linux Mint, Elementary OS
│
├─ Servidor / Cloud
│  ├─ Entorno corporativo (RHEL/CentOS, SUSE)
│  └─ Startup/moderno (Debian, Ubuntu, Arch)
│
├─ Desarrollo / Hacking
│  ├─ Maxima compatibilidad → Ubuntu, Debian
│  ├─ Cutting-edge → Fedora, Arch
│  └─ Pentesting → Kali Linux
│
├─ Rendimiento extremo
│  └─ → Arch, Gentoo (compilados)
│
├─ Minimalismo / IoT
│  └─ → Alpine, Busybox
│
└─ Seguridad extrema
   └─ → Tails, Qubes OS
```

:::tip
**Recomendación para este curso:** Ubuntu o Debian si es la primera vez. Instalación sencilla, comunidad enorme, compatibilidad máxima con ejemplos del curso.
:::

---

## 1.6 — Dónde vive Linux hoy

Linux no es solo un SO de escritorio. Es el kernel más usado del planeta.

### Servidores y la nube

```
Mercado de servidores (2024):

Linux ........................... 96.4%
Windows .......................... 2.6%
Otros ............................ 1.0%

Fuente: W3Techs, basado en el análisis de 10 millones+ servidores
```

**Por qué Linux domina en servidores:**
- ✅ Eficiencia: Bajo overhead de recursos
- ✅ Estabilidad: Uptimes de años sin reinicio
- ✅ Costo: Gratuito, sin licencias
- ✅ Flexibilidad: Personalizable para cada caso
- ✅ Seguridad: Código abierto, auditable

**Casos de uso:**

```
Web servers (Apache, Nginx)
├─ 96% de los top 1 millón de sitios
└─ Razón: Eficiencia, configurabilidad

Cloud (AWS, Azure, Google Cloud)
├─ EC2 instancias: Linux por defecto
├─ Kubernetes (orquestador de contenedores): Necesita Linux
└─ Serverless: CloudFront, Lambda ejecutan en Linux

Bases de datos (PostgreSQL, MySQL, MongoDB)
├─ Altamente optimizado en Linux
├─ Rendimiento crítico
└─ Herramientas nativas

API servers (Node.js, Python, Go)
├─ Lenguajes modernos asumen Linux
├─ Deployment: Directamente en Linux
└─ CI/CD (GitHub Actions, GitLab CI): Ejecutan en Linux
```

### Android: El Linux móvil más grande del mundo

```
Android .......................... 72% (2024)
iOS ............................. 28%
Otros ............................ <1%

Fuente: Statista, mercado global de smartphones
```

**Arquitectura de Android:**

```
┌────────────────────────────┐
│ Aplicaciones Android       │
│ (Escritas en Java/Kotlin)  │
├────────────────────────────┤
│ Android Runtime (ART)      │
│ Framework de Android       │
├────────────────────────────┤
│ KERNEL LINUX (modificado)  │
├────────────────────────────┤
│ Hardware (ARM, Snapdragon) │
└────────────────────────────┘
```

Android es Linux, pero altamente personalizado para móviles:
- Modificaciones para consumo de batería
- Sistema de permisos diferente
- Hardware drivers específicos
- init system específico

**Herencia UNIX:** Aunque Android modificó muchas cosas, sigue siendo POSIX-compatible en su núcleo.

### Sistemas embebidos e IoT

```
Dispositivos Linux en el mundo (2024): 15+ billones

Ejemplos:
├─ Routers (WiFi) → OpenWrt (Linux)
├─ Smart TVs → Linux (LG webOS, Samsung Tizen base)
├─ Cámaras IP → Linux
├─ Termostatos inteligentes → Linux
├─ Autos (infotainment) → Linux
├─ Drones → Linux
├─ Relojes inteligentes (no-Apple) → Linux
└─ Cualquier "smart device" → Probablemente Linux
```

**Razón:** Tamaño pequeño, eficiencia, bajo costo de licenciamiento.

### El escritorio Linux

```
Mercado de escritorio (2024):

Windows .......................... 73%
macOS ............................ 15%
Linux ............................ 3%
Otros ............................ 9%
```

Aunque 3% parece pequeño, representa ~250 millones de usuarios.

**Distribuciones de escritorio populares:**
- Ubuntu (GNOME)
- Fedora (GNOME)
- Linux Mint (Cinnamon)
- Elementary OS (Pantheon)
- Pop!_OS (Custom GNOME)
- Arch (flexible)

**Casos donde Linux es escritorio dominante:**
- Programadores/Developers (~40-60% usan Linux)
- Científicos/Researchers (datos, simulación)
- Administradores de sistemas
- Entornos académicos

**Crecimiento:**
- Valve lanzó SteamOS (Linux) en 2023 → Steam Deck
- Más juegos en Proton/Wine (compatibilidad Windows→Linux)
- Mejora radical en drivers gráficos

### WSL: Windows Subsystem for Linux

```
Windows (2016+) incluye capacidad de ejecutar Linux nativamente:

┌─────────────────────────────────┐
│ Windows 11                      │
├─────────────────────────────────┤
│ WSL (subsistema Linux)          │
│ ├─ Kernel Linux real            │
│ ├─ Ubuntu, Debian, Fedora       │
│ └─ Acceso a filesystem Windows  │
├─────────────────────────────────┤
│ Hardware                        │
└─────────────────────────────────┘
```

**Impacto:** Permite a desarrolladores Windows usar Linux sin dual-boot o VM.

### Superordenadores

```
Top 500 superordenadores (2024):

Linux ........................... 100% 🔥

Razón: Rendimiento, escalabilidad, control fino
```

Todos los superordenadores más potentes del mundo ejecutan Linux.

### La comunidad Linux

#### Instituciones

```
Linux Foundation
├─ Coordina desarrollo del kernel
├─ Mantiene estándares (LSB)
├─ Organiza conferencias (Open Source Summit)
└─ Educación

Free Software Foundation (FSF)
├─ Ideología de software libre
├─ Mantiene licencias GPL
└─ Activismo

GNOME, KDE, etc.
├─ Proyectos de desktop/middleware
└─ Comunidades específicas
```

#### Recursos comunitarios

| Recurso | Propósito | Ejemplo |
|---|---|---|
| **Wikis** | Documentación de referencia | ArchWiki, Gentoo Wiki |
| **Foros** | Soporte comunitario | Ubuntuforums, LinuxQuestions |
| **Listas de correo** | Desarrollo, discusión técnica | LKML, debian-devel |
| **Stack Overflow** | Q&A de problemas específicos | Tag `linux`, `bash` |
| **IRC/Discord** | Chat en tiempo real | #ubuntu, #archlinux |
| **Meetups** | Encuentros locales | LUGSS (Linux Users Group) |

#### Cómo pedir ayuda bien

```bash
❌ "No funciona nada ayuda!!"

✅ "Ubuntu 22.04 LTS, kernel 5.15.0-25
   Problema: SSH no conecta a servidor remoto
   Error exacto: Permission denied (publickey)
   Comando ejecutado: ssh -v user@host
   Salida:
   OpenSSH_8.2p1, OpenSSL 1.1.1 (output aquí)
   ...
   "
```

**Regla:** Sé específico. Incluye:
1. Versión del SO y kernel
2. Descripción exacta del problema
3. Comando que ejecutaste
4. Output completo (error)
5. Qué ya intentaste

---

## Anexos

### A. Cronología completa Linux/UNIX (1969-2024)

```timeline
1969-10    Bell Labs crea UNIX (Thompson, Ritchie)
1971       Versión 1 de UNIX
1978       Versión 7 de UNIX (base de muchos descendientes)

1980       UNIX wars begin (AT&T vs. Berkeley)
1983       Richard Stallman anuncia GNU project
1985       GNU Emacs liberado
1987       MINIX (Andrew Tanenbaum, propósito educativo)

1989       GPL v1 liberada

1991-08    Linus Torvalds: "Estoy haciendo un SO para 386-AT"
1992       Linux 0.12, primeras compilaciones exitosas
1994       Linux 1.0

1996       GPLv2 liberada
1998       "Halloween Documents" (Microsoft teme Open Source)
2000       Linux 2.4 (SMP, USB, memoria mejorada)

2003       GPL v2 aún vigente, Red Hat Enterprise Linux exitoso
2005       Git creado (Linus)

2007       Android basado en Linux anunciado
2008       Primera Android phone (HTC Dream)

2011       Linux 3.0, cambio de versionado

2015       systemd se vuelve estándar en Debian/Ubuntu
2016       WSL anunciado (Windows Subsystem for Linux)

2020       WSL2 con kernel Linux real
2021       Steam Deck anunciado (SteamOS, Linux-based)

2023       Steam Deck lanzada al mercado
           Linux 6.0
           ChatGPT acelera contenedores Linux/AI

2024       Linux >= 96% de servidores
           Estimado 3+ billones dispositivos Linux
```

### B. Estructura de repositorio Debian vs. Red Hat

<Tabs>
<TabItem value="debian" label="Debian/Ubuntu">

```
/
├─ bin, sbin         → Binarios esenciales (monolíticos)
├─ usr/
│  ├─ bin           → Programas de usuario
│  ├─ sbin          → Programas de admin
│  ├─ lib           → Bibliotecas compartidas
│  └─ local/        → Software compilado localmente
├─ etc/             → Archivos de configuración
├─ var/
│  ├─ log           → Logs
│  └─ cache/apt/    → Caché de paquetes
├─ home/            → Directorios de usuario
├─ boot/            → Kernel, initrd
└─ lib/             → Bibliotecas esenciales
```

**Gestor de paquetes:** APT
```bash
apt install firefox     # Instalar
apt remove firefox      # Desinstalar
apt search firefox      # Buscar
apt update             # Actualizar lista de paquetes
apt upgrade            # Actualizar paquetes
```

**Archivo de paquete:** `.deb` (Debian package)
```bash
dpkg -i paquete.deb    # Instalar directamente
dpkg -l                # Listar instalados
```

</TabItem>
<TabItem value="redhat" label="Red Hat/Fedora">

```
/
├─ bin, sbin         → Binarios esenciales
├─ usr/
│  ├─ bin           → Programas de usuario
│  ├─ sbin          → Programas de admin
│  ├─ lib64         → Bibliotecas 64-bit
│  └─ local/        → Software compilado localmente
├─ etc/             → Archivos de configuración
├─ var/
│  ├─ log           → Logs
│  └─ cache/yum/    → Caché de paquetes
├─ home/            → Directorios de usuario
├─ boot/            → Kernel, initrd
└─ lib64/           → Bibliotecas esenciales 64-bit
```

**Gestor de paquetes:** DNF (o YUM, antiguo)
```bash
dnf install firefox    # Instalar
dnf remove firefox     # Desinstalar
dnf search firefox     # Buscar
dnf update            # Actualizar todo
dnf install @group    # Instalar grupo de paquetes
```

**Archivo de paquete:** `.rpm` (Red Hat Package Manager)
```bash
rpm -i paquete.rpm     # Instalar
rpm -qa               # Listar instalados
rpm -q firefox        # Info de paquete
```

</TabItem>
</Tabs>

### C. Tabla de conversión: comandos entre distros

| Tarea | Debian/Ubuntu | Red Hat/Fedora | Arch | Alpine |
|---|---|---|---|---|
| Instalar paquete | `apt install pkg` | `dnf install pkg` | `pacman -S pkg` | `apk add pkg` |
| Actualizar | `apt update && apt upgrade` | `dnf update` | `pacman -Syu` | `apk update && apk upgrade` |
| Buscar paquete | `apt search keyword` | `dnf search keyword` | `pacman -Ss keyword` | `apk search keyword` |
| Información del paquete | `apt show pkg` | `dnf info pkg` | `pacman -Si pkg` | `apk info pkg` |
| Archivos de configuración | `/etc/apt/sources.list` | `/etc/yum.repos.d/` | `/etc/pacman.conf` | `/etc/apk/repositories` |

### D. Conceptos clave para revisión

**Que no debes olvidar:**

1. **Kernel vs. SO:** Linux es el kernel; GNU/Linux es el SO
2. **Modo kernel/usuario:** Protección mediante rings del CPU
3. **Syscalls:** La interfaz entre aplicaciones y kernel
4. **Filosofía UNIX:** Pequeños programas, componibles, texto plano
5. **GPL:** Copyleft fuerte; derivados deben ser GPL
6. **MIT/BSD:** Permisivos; sin restricción de derivados
7. **Distribuciones:** Empaquetadores curados; no hay "mejor"
8. **Linux hoy:** 96% de servidores, 72% móviles, 100% superordenadores

---

## Referencias y Bibliografía

### Documentación oficial y técnica

1. **Linux Kernel Documentation**  
   https://kernel.org/doc/html/latest/  
   Documentación oficial del kernel Linux, actualizada con cada versión.

2. **The Linux Programming Interface** — Michael Kerrisk (2010)  
   O'Reilly. Referencia exhaustiva sobre API POSIX en Linux.  
   https://man7.org/tlpi/

3. **Linux Standard Base (LSB)**  
   https://refspecs.linuxfoundation.org/lsb.shtml  
   Especificación de compatibilidad Linux.

4. **POSIX Specifications**  
   https://pubs.opengroup.org/onlinepubs/9699919799/  
   Estándar POSIX completo (abierto en línea).

5. **GNU C Library (glibc) Manual**  
   https://www.gnu.org/software/libc/manual/  
   Documentación de la biblioteca C estándar.

### Licencias y filosofía de software libre

6. **GNU General Public License v3**  
   https://www.gnu.org/licenses/gpl-3.0.html  
   Texto completo y guía de GPL.

7. **The Four Freedoms** — Richard Stallman  
   https://www.gnu.org/philosophy/free-sw.html  
   Definición original de software libre.

8. **Open Source Initiative: Approved Licenses**  
   https://opensource.org/licenses/  
   Lista completa de licencias aprobadas (MIT, Apache, etc.)

9. **Producing Open Source Software** — Karl Fogel  
   https://producingoss.com/  
   Guía práctica sobre modelos de negocio alrededor del software libre.

### Historia de UNIX y Linux

10. **A Brief History of UNIX** — Paul Vixie  
    https://www.paul.vixie.com/  
    Perspectiva histórica de un veterano de Internet.

11. **Just For Fun: The Story of an Accidental Revolutionary** — Linus Torvalds (2001)  
    Autobiografía de Linus; relato de cómo comenzó Linux.

12. **The UNIX Haters Handbook** (1994)  
    Crítica humorística de UNIX; perspectiva alternativa sobre su diseño.

13. **POSIX and UNIX Standards** — IEEE  
    https://standards.ieee.org/standard/1003_1-2017.html  
    Especificación técnica oficial (requiere pago).

### Distribuciones y casos de uso

14. **Debian Administrator's Handbook**  
    https://debian-handbook.info/  
    Referencia completa para administradores Debian.

15. **The Arch Way**  
    https://wiki.archlinux.org/title/Arch_Linux  
    Filosofía y documentación de Arch Linux.

16. **RedHat Enterprise Linux Documentation**  
    https://access.redhat.com/documentation/  
    Documentación oficial de RHEL.

17. **Alpine Linux Wiki**  
    https://wiki.alpinelinux.org/  
    Documentación de Alpine para sistemas embebidos.

### Comunidad y aprendizaje

18. **The Linux Foundation**  
    https://www.linuxfoundation.org/  
    Organización que coordina el desarrollo de Linux.

19. **Stack Overflow: Linux Tag**  
    https://stackoverflow.com/questions/tagged/linux  
    Preguntas y respuestas de comunidad sobre Linux.

20. **Linux Kernel Mailing List (LKML)**  
    https://lkml.org/  
    Discusiones técnicas sobre desarrollo del kernel.

### Artículos académicos

21. **The Evolution of the UNIX Time-sharing System** — Dennis Ritchie (1984)  
    Publicación histórica describiendo el diseño original de UNIX.

22. **Linux and the GNU System** — GNU Project  
    https://www.gnu.org/gnu/linux-and-gnu.html  
    Clarificación de la relación entre GNU y Linux.

### Comandos y herramientas referenciadas

- `man` pages (manual pages) — Documentación en línea  
  https://man7.org/ — Base de datos completa de man pages

- `pstree`, `strace`, `hexdump` — Herramientas de debugging  
  Ver módulo 15 (monitorización) para profundizar.

---

## Preguntas de autoevaluación

Para verificar que comprendiste este módulo:

1. ¿Cuál es la diferencia entre Linux y GNU/Linux?
2. ¿Por qué se creó el proyecto GNU? ¿Cuál era el problema?
3. Explica los tres anillos de protección del CPU (ring 0, 3) y por qué existen.
4. ¿Qué es una syscall? Pon un ejemplo.
5. ¿Cuáles son las cuatro libertades del software libre?
6. ¿Qué diferencia hay entre GPL y MIT?
7. Nombra tres distribuciones y sus casos de uso principales.
8. ¿Por qué el 96% de servidores ejecutan Linux?
9. ¿Qué incluye una "distribución"? ¿Es solo el kernel?
10. Enumera tres principios de la filosofía UNIX con ejemplos prácticos.

---

## Resumen del módulo

Este módulo te ha proporcionado:

✅ **Fundamentos técnicos:** Qué es un SO, el rol del kernel, protección de memoria  
✅ **Contexto histórico:** UNIX, GNU, Linux como movimiento  
✅ **Filosofía práctica:** Principios UNIX que guían el diseño  
✅ **Marco legal:** Licencias y modelos de negocio de software libre  
✅ **Ecosistema:** Distribuciones y cuándo usar cada una  
✅ **Relevancia actual:** Linux en servidores, móviles, IoT y el futuro  

**Próximo paso:** [Módulo 02 — Instalación y primer contacto](/instalacion-y-primer-contacto). Aplicaremos esta teoría instalando una distribución real.

---

**Última actualización:** 2024-06  
**Versión:** 1.0 (Completo)  
**Revisores:** Comunidad Linux  
**Estado:** ✅ Listo para enseñanza