---
title: "Módulo 11 — Redes en Linux"
sidebar_label: "11 · Redes"
description: TCP/IP aplicado, iproute2, DNS, NetworkManager, SSH a fondo, transferencias con rsync/curl, diagnóstico con tcpdump y firewalls con nftables/ufw/firewalld.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Módulo 11 — Redes en Linux

## Introducción

La red es el sistema nervioso de la infraestructura moderna. Un servidor sin red es un disco duro caro. Un administrador Linux que no entiende las redes está limitado a la máquina que tiene delante.

Este módulo va desde los fundamentos de TCP/IP que necesitas saber (no todo el modelo OSI de memoria, sino los conceptos que realmente usas al diagnosticar problemas) hasta las herramientas del día a día: configurar interfaces, entender el DNS, dominar SSH con túneles y claves, y levantar un firewall que proteja tus servicios.

Los scripts del [Módulo 10](/shell-scripting-bash) te permitirán automatizar muchas de las tareas que verás aquí. Los servicios del [Módulo 09](/procesos-servicios-y-systemd) incluyen servicios de red como `sshd`, `NetworkManager` y `systemd-resolved`. Los permisos del [Módulo 07](/usuarios-grupos-y-permisos) controlan qué usuarios pueden hacer qué en la red (el grupo `netdev`, los puertos < 1024 que requieren `CAP_NET_BIND_SERVICE`).

### Objetivos de aprendizaje

Al finalizar este módulo, serás capaz de:

- ✅ Explicar el modelo TCP/IP, CIDR, puertos y la diferencia TCP/UDP
- ✅ Configurar interfaces con `ip` (iproute2) y de forma persistente con NetworkManager
- ✅ Diagnosticar problemas de red por capas con `ping`, `traceroute`, `ss`, `tcpdump`
- ✅ Entender el flujo de resolución DNS y usar `dig` para diagnóstico
- ✅ Dominar SSH: claves, `ssh-agent`, `~/.ssh/config`, túneles, hardening del servidor
- ✅ Sincronizar archivos con `rsync` y hacer peticiones HTTP con `curl`
- ✅ Configurar un firewall básico con `ufw` y entender `nftables`
- ✅ Configurar NTP para sincronización horaria y WireGuard para VPN básica

---

## 11.1 — Fundamentos de redes para Linux

### El modelo TCP/IP en la práctica

No necesitas memorizar los 7 niveles del modelo OSI. Lo que sí necesitas es entender las 4 capas que funcionan en tu máquina:

```
┌──────────────────────────────────────────────────────────────┐
│           El modelo TCP/IP y las herramientas asociadas       │
├──────────────────┬───────────────────────────────────────────┤
│ Capa             │ Qué hace / Herramientas                    │
├──────────────────┼───────────────────────────────────────────┤
│ 4. Aplicación    │ HTTP, SSH, DNS, FTP, SMTP                  │
│                  │ curl, wget, ssh, dig, nc                   │
├──────────────────┼───────────────────────────────────────────┤
│ 3. Transporte    │ TCP (confiable, ordenado) / UDP (rápido)   │
│                  │ Puertos 0-65535; ss, netstat               │
├──────────────────┼───────────────────────────────────────────┤
│ 2. Red / IP      │ Enrutamiento, direcciones IP, ICMP         │
│                  │ ip route, ping, traceroute, tcpdump        │
├──────────────────┼───────────────────────────────────────────┤
│ 1. Enlace / Físico│ Ethernet, WiFi; direcciones MAC, ARP      │
│                  │ ip link, ip neigh, ethtool                 │
└──────────────────┴───────────────────────────────────────────┘

TCP vs. UDP:
  TCP: establece conexión (3-way handshake SYN→SYN-ACK→ACK),
       garantiza orden y entrega, tiene control de flujo.
       → HTTP/HTTPS, SSH, FTP, SMTP, bases de datos
  UDP: no hay conexión, no garantiza entrega ni orden, muy rápido.
       → DNS, NTP, streaming de vídeo, VoIP, juegos online, WireGuard
```

### Direcciones IP, máscaras y CIDR

```
Dirección IPv4: 32 bits divididos en 4 octetos
Ejemplo: 192.168.1.100/24

  Dirección: 192.168.1.100
  Máscara:   255.255.255.0   (/24 = 24 bits a 1 en la máscara)
  Red:       192.168.1.0
  Broadcast: 192.168.1.255
  Rango host:192.168.1.1 – 192.168.1.254  (254 hosts)

Notación CIDR (/prefijo):
  /8   = 255.0.0.0       → 16.7M hosts (ej: 10.0.0.0/8)
  /16  = 255.255.0.0     → 65.534 hosts (ej: 172.16.0.0/16)
  /24  = 255.255.255.0   → 254 hosts    (red doméstica típica)
  /25  = 255.255.255.128 → 126 hosts    (dividir una /24 en dos)
  /30  = 255.255.255.252 → 2 hosts      (enlaces punto a punto)
  /32  = host específico                (reglas de firewall)

Rangos privados (RFC 1918) — solo enrutables en LAN:
  10.0.0.0/8          → redes corporativas grandes
  172.16.0.0/12       → 172.16.x.x - 172.31.x.x
  192.168.0.0/16      → redes domésticas y pequeñas oficinas
  127.0.0.0/8         → loopback (127.0.0.1 = "esta máquina")
```

```bash
# IPv6 en la práctica (lo mínimo que necesitas saber)
ip -6 addr show           # Ver direcciones IPv6

# Tipos de IPv6:
# fe80::/10         → link-local (solo en el segmento local, como 169.254.x.x en v4)
# fc00::/7          → ULA (Unique Local Address, equivalente a privadas IPv4)
# 2000::/3          → globales (ruteables en Internet)
# ::1               → loopback (equivalente a 127.0.0.1)
```

### Puertos y servicios

```bash
# Puertos bien conocidos (< 1024, requieren root o CAP_NET_BIND_SERVICE)
# 22   SSH
# 25   SMTP
# 53   DNS (TCP y UDP)
# 80   HTTP
# 443  HTTPS
# 3306 MySQL/MariaDB
# 5432 PostgreSQL

# Puertos registrados: 1024-49151
# Puertos efímeros (clientes): 49152-65535

# Ver la base de datos de servicios
cat /etc/services | grep -E "^(ssh|http|https|ftp|smtp)\s"
getent services ssh         # Buscar un servicio por nombre
getent services 22          # Buscar por número de puerto
```

---

## 11.2 — Configuración con iproute2

El paquete `iproute2` contiene los comandos modernos de red en Linux. Los comandos clásicos (`ifconfig`, `netstat`, `route`, `arp`) están **obsoletos** y no vienen en instalaciones mínimas nuevas.

```
Equivalencias:
  ifconfig       → ip addr / ip link
  route -n       → ip route
  arp            → ip neigh
  netstat -tulnp → ss -tulnp
```

### `ip` — El comando central

```bash
# ── ip addr: ver y configurar direcciones IP ──────────────────────────────
ip addr show                 # Todas las interfaces
ip addr show eth0            # Solo eth0
ip a                         # Abreviado

# Añadir/quitar una IP (temporal, se pierde al reiniciar)
sudo ip addr add 192.168.1.50/24 dev eth0
sudo ip addr del 192.168.1.50/24 dev eth0

# ── ip link: ver y configurar interfaces de red ───────────────────────────
ip link show
ip link show eth0
ip -s link show eth0         # Con estadísticas (paquetes, errores)

sudo ip link set eth0 up     # Activar interfaz
sudo ip link set eth0 down   # Desactivar interfaz
sudo ip link set eth0 mtu 9000  # Cambiar MTU (jumbo frames en datacenter)

# ── ip route: tabla de enrutamiento ──────────────────────────────────────
ip route show                # Ver rutas
ip route show table all      # Todas las tablas de rutas
ip route get 8.8.8.8         # ¿Por qué ruta saldría un paquete a 8.8.8.8?
# 8.8.8.8 via 192.168.1.1 dev eth0 src 192.168.1.100

# Añadir/quitar rutas (temporal)
sudo ip route add 10.0.0.0/8 via 192.168.1.254
sudo ip route del 10.0.0.0/8
sudo ip route add default via 192.168.1.1    # Gateway por defecto
sudo ip route replace default via 10.0.0.1  # Cambiar gateway

# ── ip neigh: tabla ARP/NDP ───────────────────────────────────────────────
ip neigh show                # Ver caché ARP (vecinos)
ip neigh flush dev eth0      # Limpiar caché ARP de la interfaz
```

### `ss` — Sockets y puertos

```bash
# ss: Socket Statistics (sustituye a netstat)
ss -tulnp          # TCP+UDP Listening Numbers con Processes
# -t = TCP
# -u = UDP
# -l = solo los que escuchan (listening)
# -n = números en vez de nombres (más rápido)
# -p = mostrar el proceso que usa el socket

# Ejemplos de salida:
# Netid State  Recv-Q Send-Q  Local Address:Port   Peer Address:Port  Process
# tcp   LISTEN 0      128     0.0.0.0:22           0.0.0.0:*          users:(("sshd",pid=512))
# tcp   LISTEN 0      511     0.0.0.0:80           0.0.0.0:*          users:(("nginx",pid=513))

ss -tulnp | grep :80         # ¿Qué escucha en el puerto 80?
ss -tnp                      # Conexiones TCP establecidas con procesos
ss -s                        # Resumen estadístico de sockets
ss state established         # Solo conexiones establecidas
ss -o state established '( dport = :443 or sport = :443 )'  # Filtrar por puerto
```

### Configuración persistente con NetworkManager

NetworkManager es el gestor de red por defecto en la mayoría de distribuciones de escritorio y muchos servidores.

```bash
# nmcli: interfaz de línea de comandos
nmcli general status              # Estado general
nmcli connection show             # Ver todas las conexiones configuradas
nmcli connection show --active    # Solo las activas
nmcli device status               # Estado de interfaces físicas
nmcli device show eth0            # Detalles de una interfaz

# Conectar / desconectar
nmcli connection up "Mi-Red-WiFi"
nmcli connection down eth0

# WIFI desde terminal
nmcli device wifi list            # Listar redes visibles
nmcli device wifi connect "MiRed" password "mipassword"
nmcli device wifi connect "MiRed" --ask  # Pide la contraseña interactivo

# Crear una conexión estática (IP fija, sin DHCP)
nmcli connection add \
    type ethernet \
    ifname eth0 \
    con-name "red-fija" \
    ipv4.addresses "192.168.1.100/24" \
    ipv4.gateway "192.168.1.1" \
    ipv4.dns "8.8.8.8,8.8.4.4" \
    ipv4.method manual
nmcli connection up "red-fija"

# Volver a DHCP
nmcli connection modify "red-fija" ipv4.method auto ipv4.addresses "" ipv4.gateway ""
nmcli connection up "red-fija"

# nmtui: versión con interfaz TUI (menús de texto)
nmtui        # Abrir la interfaz de texto interactiva
```

### Netplan (Ubuntu Server 18.04+)

```yaml
# /etc/netplan/01-netcfg.yaml
network:
  version: 2
  renderer: networkd    # o: NetworkManager
  ethernets:
    eth0:
      dhcp4: true
    eth1:
      dhcp4: false
      addresses:
        - 192.168.10.5/24
      routes:
        - to: default
          via: 192.168.10.1
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1]
        search: [empresa.local]
```

```bash
sudo netplan apply           # Aplicar la configuración
sudo netplan try             # Aplicar con rollback automático si no confirmas
sudo netplan generate        # Generar archivos de configuración sin aplicar
```

---

## 11.3 — Resolución de nombres: DNS

### El flujo completo de resolución

Cuando escribes `curl https://google.com`, antes de que se envíe un solo byte al servidor, el sistema necesita saber la IP de `google.com`. Este proceso es la **resolución DNS**:

```
Tu aplicación
    │ getaddrinfo("google.com")
    ▼
nsswitch.conf  ← define el orden de búsqueda
    │
    ├─ 1. /etc/hosts  (respuesta inmediata, sin red)
    │
    ├─ 2. systemd-resolved / nscd  (caché local)
    │        │ Si no está en caché:
    │        ▼
    └─ 3. Servidor DNS configurado (/etc/resolv.conf)
               │ 8.8.8.8 (Google) / 1.1.1.1 (Cloudflare)
               │ o el DNS del router
               ▼
          Respuesta: google.com → 142.250.x.x
```

```bash
# Ver la configuración de resolución
cat /etc/nsswitch.conf | grep hosts
# hosts: files mdns4_minimal [NOTFOUND=return] dns myhostname
#   ↑ orden: archivos → mDNS → DNS → hostname local

cat /etc/resolv.conf          # Servidores DNS configurados
resolvectl status             # Estado de systemd-resolved (moderno)
resolvectl query google.com   # Resolver vía systemd-resolved

# /etc/hosts: resolución local (tiene prioridad sobre DNS)
cat /etc/hosts
# 127.0.0.1   localhost
# ::1         localhost
# 192.168.1.10  servidor.local  servidor
```

### `dig` — Diagnóstico DNS completo

```bash
# dig: la herramienta más potente para DNS
dig google.com                          # Consulta A (IPv4) básica
dig google.com A                        # Registro A explícito
dig google.com AAAA                     # IPv6
dig google.com MX                       # Servidores de correo
dig google.com TXT                      # Registros TXT (SPF, DKIM, verificaciones)
dig google.com NS                       # Name servers autoritativos
dig google.com SOA                      # Start of Authority
dig -x 8.8.8.8                          # DNS inverso (IP → nombre)
dig +short google.com                   # Solo la respuesta, sin cabeceras
dig +trace google.com                   # Trazar la resolución desde los root DNS
dig @8.8.8.8 google.com                 # Consultar un DNS específico
dig @1.1.1.1 google.com +short          # Cloudflare, solo la IP

# Diagnóstico de problemas:
# ¿Por qué mi servidor no resuelve nombres?
dig google.com                          # Si responde → DNS funciona
dig @127.0.0.1 google.com              # ¿Responde el DNS local?
dig @192.168.1.1 google.com            # ¿Responde el DNS del router?
dig @8.8.8.8 google.com               # ¿Funciona con DNS externo directo?

# Tipos de registro explicados:
# A     → nombre → IPv4
# AAAA  → nombre → IPv6
# CNAME → alias → nombre canónico (www.empresa.com → empresa.com)
# MX    → nombre → servidor de correo (con prioridad)
# TXT   → texto libre (SPF, DKIM, verificación de dominio)
# NS    → zona → name servers autoritativos
# PTR   → IP → nombre (DNS inverso, para validar si IP ↔ hostname coinciden)
# SOA   → información sobre la zona (TTL, contacto del administrador)
```

---

## 11.4 — Diagnóstico de red por capas

La metodología correcta para diagnosticar un problema de red es **ir de la capa inferior a la superior**. Muchos problemas se diagnostican mal porque se saltan pasos.

```
Metodología de diagnóstico en capas:

1. ¿Hay interfaz activa?     →  ip link show
2. ¿Tiene IP?                →  ip addr show
3. ¿El gateway responde?     →  ping <gateway>
4. ¿Hay ruta al destino?     →  ip route get <IP>
5. ¿El DNS resuelve?         →  dig google.com
6. ¿El servicio responde?    →  telnet / nc host puerto
7. ¿Qué hace exactamente?    →  tcpdump
```

```bash
# PASO 1-2: Verificar interfaz y dirección
ip link show                  # ¿UP? ¿estado UNKNOWN?
ip addr show                  # ¿Tiene IP asignada?

# PASO 3: Gateway
ip route show default         # Ver el gateway
ping -c3 $(ip route show default | awk '/default/ {print $3}')

# PASO 4-5: Conectividad básica
ping -c3 8.8.8.8              # ¿Hay conectividad IP? (sin DNS)
ping -c3 google.com           # ¿El DNS resuelve?

# PASO 6: Verificar servicio específico
nc -zv servidor.com 443       # ¿El puerto 443 responde?
nc -zv -w3 10.0.0.1 22        # Con timeout de 3 segundos
curl -v --max-time 5 https://google.com  # HTTP completo con verbose

# traceroute / tracepath / mtr
traceroute google.com          # Hop a hop hasta el destino
tracepath google.com           # Versión sin root, detecta MTU
mtr google.com                 # Combinación de ping + traceroute en tiempo real
mtr --report --report-cycles 10 google.com  # Informe de 10 ciclos
```

### `tcpdump` — Captura de tráfico

```bash
# tcpdump: capturar paquetes en tiempo real
# Requiere root o pertenencia al grupo 'pcap'

# Captura básica en la interfaz eth0
sudo tcpdump -i eth0

# Opciones esenciales:
# -i IFACE    interfaz (eth0, any para todas)
# -n          no resolver nombres (más rápido)
# -nn         no resolver nombres ni puertos
# -v          verbose (mostrar más detalles)
# -c N        capturar solo N paquetes
# -w file.pcap guardar a archivo (para Wireshark)
# -r file.pcap leer desde archivo

# Filtros (BPF: Berkeley Packet Filter):
sudo tcpdump -i eth0 -nn 'port 80'           # Solo tráfico HTTP
sudo tcpdump -i eth0 -nn 'port 80 or port 443'
sudo tcpdump -i eth0 -nn 'host 8.8.8.8'     # Solo este host
sudo tcpdump -i eth0 -nn 'src 192.168.1.100' # Solo desde esta IP
sudo tcpdump -i eth0 -nn 'dst port 22'       # Solo conexiones SSH entrantes
sudo tcpdump -i eth0 -nn 'icmp'              # Solo ICMP (ping)
sudo tcpdump -i eth0 -nn 'tcp[tcpflags] & tcp-syn != 0'  # Solo SYN (conexiones nuevas)

# Guardar para análisis posterior
sudo tcpdump -i eth0 -w /tmp/captura.pcap &
# Abrir en Wireshark (interfaz gráfica):
wireshark /tmp/captura.pcap

# Ver contenido de paquetes HTTP en texto plano
sudo tcpdump -i eth0 -A -nn 'port 80' | head -50

# Diagnóstico clásico con tcpdump:
# "Mi servidor no está recibiendo las peticiones"
sudo tcpdump -i eth0 -nn 'dst port 8080'
# Si ves paquetes → el problema está en la aplicación
# Si no ves nada → el problema está en la red/firewall antes del servidor
```

### `nmap` — Escaneo de puertos

:::warning **Solo en redes propias o con autorización explícita**
Escanear redes sin permiso es ilegal en muchos países y viola los términos de servicio. Úsalo en tus propias máquinas, entornos de prueba o CTF.
:::

```bash
# nmap: network mapper
sudo apt install nmap

# Escanear los puertos abiertos de una máquina
nmap 192.168.1.1                    # Puertos más comunes (top 1000)
nmap -p 22,80,443 192.168.1.1       # Puertos específicos
nmap -p 1-65535 192.168.1.1         # Todos los puertos
nmap -sV 192.168.1.1                # Detectar versión del servicio
nmap -O 192.168.1.1                 # Detectar OS (requiere root)
nmap -A 192.168.1.1                 # Agresivo: OS + versión + scripts
nmap -sn 192.168.1.0/24             # Ping scan: qué hosts están activos
nmap --script vuln 192.168.1.1      # Comprobar vulnerabilidades conocidas

# nc (netcat): la navaja suiza de redes
nc -l 9999                          # Escuchar en puerto 9999
nc servidor.com 9999                # Conectarse al puerto 9999
nc -zv servidor.com 22              # Verificar si puerto 22 está abierto
echo "GET / HTTP/1.0" | nc google.com 80  # Petición HTTP manual
```

---

## 11.5 — SSH a fondo

SSH (Secure Shell) es el protocolo fundamental de administración remota. Casi todo lo que hagas en servidores remotos pasará por SSH.

### El cliente SSH y `~/.ssh/config`

```bash
# Conexión básica
ssh usuario@servidor.com
ssh -p 2222 usuario@servidor.com    # Puerto no estándar
ssh -i ~/.ssh/clave_privada usuario@servidor.com   # Clave específica
ssh -v servidor.com                 # Verbose: diagnóstico de conexión
ssh -vvv servidor.com               # Muy verbose (debug completo)

# Ejecutar comando remoto sin shell interactiva
ssh usuario@servidor.com "df -h"
ssh usuario@servidor.com "sudo systemctl status nginx"

# ~/.ssh/config: el fichero que cambia tu vida
# Convierte: ssh -p 2222 -i ~/.ssh/servidor-prod -l deploy servidor-prod.empresa.com
# En:        ssh prod
cat ~/.ssh/config
```

```
# ~/.ssh/config

# Configuración global (afecta a todas las conexiones)
Host *
    ServerAliveInterval 60        # Ping cada 60s para no perder la sesión
    ServerAliveCountMax 3         # Desconectar tras 3 pings sin respuesta
    AddKeysToAgent yes            # Añadir claves al ssh-agent automáticamente
    IdentityFile ~/.ssh/id_ed25519

# Servidores con alias
Host prod
    HostName servidor-prod.empresa.com
    User deploy
    Port 2222
    IdentityFile ~/.ssh/id_ed25519_prod
    ForwardAgent no               # NO reenviar el agente (seguridad)

Host staging
    HostName 10.0.1.50
    User ubuntu
    ProxyJump bastion             # Saltar a través del bastion

Host bastion
    HostName bastion.empresa.com
    User admin
    Port 22

# Máquinas de un rango de red
Host 192.168.1.*
    User juan
    IdentityFile ~/.ssh/id_ed25519_local
    StrictHostKeyChecking no      # No verificar host (solo para LAN de confianza)
```

```bash
# Con esa configuración:
ssh prod          # Conecta a servidor-prod.empresa.com con deploy en puerto 2222
ssh staging       # Conecta a 10.0.1.50 saltando por bastion automáticamente
```

### Autenticación con claves

```bash
# Generar un par de claves (ed25519 es el estándar moderno)
ssh-keygen -t ed25519 -C "juan@empresa.com"
# -t ed25519: algoritmo Ed25519 (más seguro y rápido que RSA 2048)
# -C: comentario (útil para identificar la clave)
# Por defecto crea ~/.ssh/id_ed25519 (privada) y ~/.ssh/id_ed25519.pub (pública)

# RSA cuando se requiere compatibilidad con sistemas viejos
ssh-keygen -t rsa -b 4096 -C "juan@empresa.com"

# Copiar la clave pública al servidor (la forma fácil)
ssh-copy-id usuario@servidor.com
ssh-copy-id -i ~/.ssh/id_ed25519.pub usuario@servidor.com

# Lo que hace ssh-copy-id manualmente:
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys   # En el SERVIDOR
chmod 600 ~/.ssh/authorized_keys                       # Permisos correctos
chmod 700 ~/.ssh/                                      # Permisos del directorio

# Permisos de SSH: son CRÍTICOS. Si son incorrectos, SSH rechaza las claves:
chmod 700 ~/.ssh/
chmod 600 ~/.ssh/id_ed25519        # Clave privada: solo el dueño la lee
chmod 644 ~/.ssh/id_ed25519.pub    # Pública: puede ser legible
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/config
```

### `ssh-agent` — Gestión de contraseñas de claves

```bash
# Si tu clave privada tiene passphrase (recomendado), escribirla cada vez es tedioso
# ssh-agent la guarda en memoria descifrada para la sesión

# Iniciar el agente (normalmente ya está iniciado en el entorno de escritorio)
eval $(ssh-agent)

# Añadir una clave al agente
ssh-add ~/.ssh/id_ed25519            # Pide la passphrase una sola vez
ssh-add -l                           # Ver claves cargadas en el agente
ssh-add -d ~/.ssh/id_ed25519         # Quitar una clave del agente
ssh-add -D                           # Quitar TODAS las claves

# Con AddKeysToAgent yes en ~/.ssh/config, las claves se añaden automáticamente
# al primer uso sin necesidad de ssh-add manual
```

### Hardening del servidor SSH (`sshd_config`)

```bash
sudo nano /etc/ssh/sshd_config

# Las opciones más importantes para un servidor seguro:
```

```
# /etc/ssh/sshd_config

Port 22                          # Puerto (considera cambiarlo: reduce ruido en logs)
                                 # pero NO mejora la seguridad real (seguridad por oscuridad)

# Autenticación
PermitRootLogin no               # CRÍTICO: nunca permitir login directo como root
PasswordAuthentication no        # CRÍTICO: solo claves, sin contraseñas
PubkeyAuthentication yes         # Habilitar autenticación por clave
AuthorizedKeysFile .ssh/authorized_keys

# Restricciones adicionales
AllowUsers juan maria deploy      # Whitelist de usuarios (o AllowGroups ssh-users)
MaxAuthTries 3                    # Intentos antes de cerrar la conexión
LoginGraceTime 30                 # Segundos para autenticarse
MaxSessions 10                    # Sesiones simultáneas por conexión

# Keepalive
ClientAliveInterval 300           # Enviar keepalive cada 5 minutos
ClientAliveCountMax 2             # Desconectar tras 2 sin respuesta

# Funciones desactivadas (reducir superficie)
X11Forwarding no                  # No reenviar X11
AllowAgentForwarding no           # No reenviar el agente SSH (por defecto)
AllowTcpForwarding no             # No permitir túneles TCP (si no los necesitas)
PermitEmptyPasswords no           # Nunca permitir contraseñas vacías
Banner /etc/ssh/banner.txt        # Mostrar aviso legal antes del login
```

```bash
# Aplicar cambios
sudo sshd -t                      # Verificar sintaxis ANTES de reiniciar
sudo systemctl reload sshd        # Reload (no cierra sesiones activas)

# Ver intentos de acceso fallidos (del Módulo 09: journalctl)
sudo journalctl -u sshd -n 50 --no-pager | grep "Failed"
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn
```

### Túneles SSH

```bash
# LOCAL FORWARDING (-L): acceder a un servicio remoto como si fuera local
# Sintaxis: ssh -L puerto_local:host_destino:puerto_destino usuario@ssh_server

# Caso de uso: acceder a una base de datos MySQL en producción (que no está expuesta)
ssh -L 3307:localhost:3306 usuario@servidor-prod.com
# Ahora puedes conectarte a la BD remota desde tu PC:
mysql -h 127.0.0.1 -P 3307 -u root -p

# REMOTE FORWARDING (-R): exponer un puerto local en el servidor remoto
# Útil para dar acceso temporal a tu máquina local desde el servidor
ssh -R 8080:localhost:3000 usuario@servidor.com
# Ahora servidor:8080 → tu máquina:3000

# DYNAMIC FORWARDING (-D): proxy SOCKS5
# Todo el tráfico del proxy pasa por el servidor remoto (VPN pobre)
ssh -D 1080 usuario@servidor.com
# Configurar el navegador para usar SOCKS5 en 127.0.0.1:1080

# ProxyJump (-J): saltar a través de un bastión
ssh -J bastion.empresa.com servidor-interno.empresa.com
# Equivalente en ~/.ssh/config con ProxyJump

# Mantener túneles activos con autossh
sudo apt install autossh
autossh -M 20000 -f -N -L 3307:localhost:3306 usuario@servidor.com
# -M: puerto de monitorización; -f: background; -N: no ejecutar comandos
```

---

## 11.6 — Transferencia de archivos y descargas

### `rsync` — Sincronización eficiente

```bash
# rsync: solo transfiere los BLOQUES que cambiaron (no el archivo completo)
# Mucho más eficiente que scp para archivos grandes o sincronizaciones frecuentes

# Sintaxis: rsync [opciones] ORIGEN DESTINO
# ORIGEN o DESTINO pueden ser locales o remotos (usuario@host:ruta)

# Opciones esenciales:
# -a, --archive   = -rlptgoD (preserva permisos, tiempos, symlinks, etc.)
# -v, --verbose   mostrar los archivos transferidos
# -z, --compress  comprimir durante la transferencia (útil en conexiones lentas)
# -P              = --partial --progress (reanudar + barra de progreso)
# --delete        borrar en destino los archivos que ya no existen en origen
# -n, --dry-run   simular sin hacer nada (ver qué cambiaría)
# -e ssh          usar SSH como transporte (por defecto)

# Copiar local a remoto
rsync -avz /home/juan/ usuario@servidor:/backup/juan/

# Copiar remoto a local
rsync -avz usuario@servidor:/var/www/ /local/backup/www/

# Sincronización completa con borrado (espejo exacto)
rsync -avz --delete /origen/ /destino/
# CUIDADO: --delete borra en destino lo que no existe en origen
# Siempre hacer un --dry-run primero:
rsync -avzn --delete /origen/ /destino/

# Excluir archivos/directorios
rsync -avz --exclude="*.log" --exclude=".git/" /proyecto/ servidor:/deploy/
rsync -avz --exclude-from=".rsync-ignore" /proyecto/ servidor:/deploy/

# Backup incremental con hardlinks (muy eficiente en espacio):
rsync -av --link-dest=/backup/ultimo/ /home/ /backup/$(date +%Y%m%d)/
# Los archivos sin cambios son hardlinks al backup anterior (no duplicados)

# SSH con puerto no estándar
rsync -avz -e "ssh -p 2222" /datos/ usuario@servidor:/datos/
```

### `scp` y cuándo no usarlo

```bash
# scp: funciona pero está obsoleto para usos avanzados
scp archivo.txt usuario@servidor:/tmp/      # Copiar al servidor
scp usuario@servidor:/tmp/archivo.txt .     # Copiar del servidor
scp -r directorio/ usuario@servidor:/tmp/  # Recursivo
scp -P 2222 archivo.txt usuario@servidor:  # Puerto no estándar

# ¿Cuándo usar rsync en vez de scp?
# - Archivos grandes: rsync reanuda, scp empieza desde cero
# - Directorios: rsync es más eficiente (solo cambios)
# - Sincronización periódica: rsync con --delete es perfecto
# - Cuando quieres ver el progreso: rsync -P
# Usa scp solo para copias rápidas de archivos pequeños
```

### `curl` y `wget` — Descargas y peticiones HTTP

```bash
# curl: cliente HTTP/FTP/y-mucho-más (ideal para APIs y diagnóstico)
curl https://ejemplo.com                   # GET básico, output en stdout
curl -o archivo.zip https://url.com/a.zip  # Guardar con nombre
curl -O https://url.com/archivo.tar.gz     # Guardar con el nombre original
curl -L https://url.com/redirect           # Seguir redirecciones (importante)
curl -s https://url.com                    # Silencioso (sin barra de progreso)
curl -v https://url.com                    # Verbose: ver cabeceras y handshake
curl -I https://url.com                    # Solo cabeceras HTTP (HEAD request)

# Peticiones HTTP completas
curl -X POST https://api.com/datos \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"nombre":"Juan","valor":42}'

# Con autenticación
curl -u usuario:contraseña https://api.com/privado
curl -b "session=abc123" https://sitio.com  # Con cookie

# Diagnóstico de tiempo de respuesta
curl -w "\n\nTiempos:\n  DNS: %{time_namelookup}s\n  Connect: %{time_connect}s\n  TTFB: %{time_starttransfer}s\n  Total: %{time_total}s\n" \
     -o /dev/null -s https://google.com

# wget: más simple, ideal para descargas con reintentos
wget https://url.com/archivo.iso              # Descargar
wget -c https://url.com/archivo.iso           # Reanudar descarga interrumpida
wget -r -np https://sitio.com/docs/           # Descargar sitio web recursivo
wget --quiet --show-progress https://url.com  # Con barra de progreso
```

---

## 11.7 — Firewalls

### Netfilter: la base en el kernel

Netfilter es el framework de filtrado de paquetes **dentro del kernel Linux**. Los comandos (`iptables`, `nftables`, `ufw`, `firewalld`) son solo frontends que le dan instrucciones.

```
Viaje de un paquete por el kernel (simplificado):

Paquete entrante
       │
   PREROUTING  ← NAT de destino (DNAT)
       │
   ¿Para esta máquina?
   ┌───┴───┐
   │       │
INPUT   FORWARD  ← paquetes que se reenvían (router)
   │       │
   └───┬───┘
   OUTPUT ← paquetes generados localmente
       │
  POSTROUTING ← NAT de origen (SNAT/MASQUERADE)
       │
Paquete saliente
```

### `ufw` — El frontend amigable (Ubuntu/Debian)

`ufw` (Uncomplicated Firewall) es la forma recomendada de gestionar el firewall en Ubuntu y Debian para la mayoría de casos de uso.

```bash
# Estado y activación
sudo ufw status                    # Ver estado y reglas
sudo ufw status verbose            # Más detalle
sudo ufw status numbered           # Con números (para borrar por número)
sudo ufw enable                    # Activar el firewall
sudo ufw disable                   # Desactivar
sudo ufw reset                     # Borrar TODAS las reglas y desactivar

# Política por defecto (primero configurar, LUEGO activar)
sudo ufw default deny incoming     # Bloquear todo lo que entra (recomendado)
sudo ufw default allow outgoing    # Permitir todo lo que sale (normal)

# Permitir servicios
sudo ufw allow ssh                 # Puerto 22 TCP (usa el nombre del servicio)
sudo ufw allow 22/tcp              # Equivalente explícito
sudo ufw allow 80/tcp              # HTTP
sudo ufw allow 443/tcp             # HTTPS
sudo ufw allow 8080                # Puerto personalizado (TCP y UDP)
sudo ufw allow 53/udp              # DNS UDP

# Permitir desde una IP específica
sudo ufw allow from 192.168.1.0/24          # Toda la subred
sudo ufw allow from 10.0.0.5 to any port 22 # Solo esta IP al puerto SSH

# Denegar específicamente
sudo ufw deny from 203.0.113.100    # Bloquear una IP
sudo ufw deny 23/tcp                # Bloquear Telnet

# Eliminar reglas
sudo ufw delete allow 80/tcp
sudo ufw delete 3                   # Eliminar la regla número 3 (de 'status numbered')

# Perfiles de aplicación (paquetes registran sus puertos aquí)
sudo ufw app list
sudo ufw allow "Nginx Full"         # HTTP + HTTPS de nginx
sudo ufw allow "OpenSSH"

# Logging
sudo ufw logging on                  # Activar logging en /var/log/ufw.log
sudo ufw logging medium              # Nivel: low/medium/high/full
```

### `nftables` — El sucesor moderno de iptables

```bash
# Estado
sudo nft list ruleset               # Ver todas las reglas
sudo nft list tables                # Ver tablas
sudo systemctl status nftables

# Las reglas se guardan en /etc/nftables.conf
sudo nano /etc/nftables.conf
```

```
# /etc/nftables.conf — configuración básica de servidor

#!/usr/sbin/nft -f

flush ruleset

table inet filter {
    chain input {
        type filter hook input priority 0; policy drop;
        # Tráfico establecido: permitir (optimización)
        ct state established,related accept
        # Loopback: siempre permitir
        iif lo accept
        # ICMP (ping): permitir
        ip protocol icmp accept
        ip6 nexthdr icmpv6 accept
        # SSH
        tcp dport 22 accept
        # HTTP y HTTPS
        tcp dport { 80, 443 } accept
        # Log y drop del resto
        log prefix "nftables-drop: " flags all
    }

    chain forward {
        type filter hook forward priority 0; policy drop;
    }

    chain output {
        type filter hook output priority 0; policy accept;
    }
}
```

```bash
# Aplicar la configuración
sudo nft -f /etc/nftables.conf
sudo systemctl enable --now nftables

# Comandos nft útiles
sudo nft add rule inet filter input tcp dport 8080 accept   # Añadir regla
sudo nft delete rule inet filter input handle 4              # Borrar por handle
sudo nft list ruleset -a                                     # Ver con handles

# Leer reglas de iptables heredadas
sudo iptables -L -n -v --line-numbers    # Si el sistema usa iptables
```

### `firewalld` (Fedora/RHEL/CentOS)

```bash
# firewalld usa el concepto de ZONAS: conjuntos de reglas según el nivel de confianza
# Zonas comunes: public (default), trusted, home, internal, dmz, drop

sudo systemctl enable --now firewalld
firewall-cmd --state
firewall-cmd --get-active-zones      # Ver zonas activas y sus interfaces
firewall-cmd --list-all              # Ver configuración de la zona por defecto

# Permitir servicios permanentes (--permanent para que sobreviva reinicios)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=8080/tcp

# Aplicar cambios sin reiniciar
sudo firewall-cmd --reload

# Bloquear una IP
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="203.0.113.100" drop'
sudo firewall-cmd --reload

# Ver servicios disponibles
firewall-cmd --get-services | tr ' ' '\n' | sort | head -20
```

---

## 11.8 — Servicios de red del sistema

### Sincronización horaria: NTP

La hora exacta es crítica para logs, certificados TLS, bases de datos y seguridad.

```bash
# Ver el estado de la hora del sistema
timedatectl                          # Estado general (NTP sync, timezone)
timedatectl list-timezones           # Ver zonas horarias
sudo timedatectl set-timezone Europe/Madrid

# systemd-timesyncd (el cliente NTP ligero de systemd)
systemctl status systemd-timesyncd
cat /etc/systemd/timesyncd.conf
# [Time]
# NTP=0.pool.ntp.org 1.pool.ntp.org
# FallbackNTP=ntp.ubuntu.com

# chrony (más preciso, recomendado para servidores)
sudo apt install chrony
systemctl status chrony
chronyc tracking                    # Estado de sincronización
chronyc sources -v                  # Fuentes NTP y su calidad
sudo chronyc makestep               # Forzar sincronización inmediata

# Configuración de chrony
sudo nano /etc/chrony/chrony.conf
# pool pool.ntp.org iburst maxsources 4
# server 0.es.pool.ntp.org iburst
```

### WireGuard — VPN moderna

WireGuard es la VPN más sencilla y rápida disponible en Linux hoy. Está integrada en el kernel desde 5.6.

```bash
# Instalar
sudo apt install wireguard

# Generar par de claves para el servidor
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
chmod 600 /etc/wireguard/server_private.key

# Generar par de claves para el cliente
wg genkey | tee ~/wg_client_private.key | wg pubkey > ~/wg_client_public.key
```

```ini
# /etc/wireguard/wg0.conf — Configuración del servidor

[Interface]
Address = 10.10.0.1/24
ListenPort = 51820
PrivateKey = <CLAVE_PRIVADA_SERVIDOR>
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = <CLAVE_PUBLICA_CLIENTE>
AllowedIPs = 10.10.0.2/32
```

```bash
# Activar
sudo systemctl enable --now wg-quick@wg0
sudo wg show                         # Ver estado de la VPN
sudo wg show wg0 latest-handshakes  # Ver última conexión de los peers
```

---

## 11.9 — Problemas reales y soluciones

### Problema 1: "No hay internet pero el ping al gateway funciona"

```bash
# Síntoma: ping 192.168.1.1 ✓  pero  ping 8.8.8.8 ✗
# → El problema está en el router hacia internet o en el ISP

# Síntoma: ping 8.8.8.8 ✓  pero  ping google.com ✗
# → El problema es DNS
dig @8.8.8.8 google.com              # ¿El DNS externo responde?
cat /etc/resolv.conf                 # ¿Qué DNS está configurado?
resolvectl status                    # Estado de systemd-resolved
sudo systemctl restart systemd-resolved
# o cambiar el DNS temporalmente:
sudo resolvectl dns eth0 8.8.8.8
```

### Problema 2: "Permission denied (publickey)" en SSH

```bash
# Diagnóstico con verbose
ssh -vvv usuario@servidor 2>&1 | grep -E "Trying|Offering|Authenticating|denied"

# Causas más comunes:
# 1. Permisos incorrectos en ~/.ssh (el más frecuente)
ssh usuario@servidor "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"

# 2. La clave pública no está en authorized_keys
ssh-copy-id -i ~/.ssh/id_ed25519.pub usuario@servidor

# 3. El servidor tiene PasswordAuthentication no y PubkeyAuthentication no
# → Necesitas acceso por consola/VNC para arreglarlo

# 4. SELinux/AppArmor bloqueando SSH
# En el servidor:
sudo ausearch -m avc -c sshd 2>/dev/null | tail -5   # SELinux
sudo cat /var/log/auth.log | grep sshd | tail -10
```

### Problema 3: El firewall bloquea tráfico que debería pasar

```bash
# DIAGNÓSTICO: ¿Es el firewall?
# Temporalmente desactivar para verificar:
sudo ufw disable && curl -s http://localhost && sudo ufw enable

# ufw: ver qué regla está bloqueando
sudo ufw status verbose | grep DENY

# Ver los logs del firewall
grep "UFW BLOCK" /var/log/ufw.log | tail -20
# muestra qué IPs/puertos está bloqueando

# nftables: ver contador de paquetes descartados
sudo nft list ruleset -a | grep -A2 "drop"
sudo nft list ruleset | grep counter
```

---

## Anexos

### A. Puertos más usados — referencia rápida

| Puerto | Protocolo | Servicio |
|---|---|---|
| 22 | TCP | SSH |
| 25/587 | TCP | SMTP/Submission (email) |
| 53 | TCP+UDP | DNS |
| 80 | TCP | HTTP |
| 110/995 | TCP | POP3/POP3S |
| 143/993 | TCP | IMAP/IMAPS |
| 443 | TCP | HTTPS |
| 3306 | TCP | MySQL/MariaDB |
| 5432 | TCP | PostgreSQL |
| 6379 | TCP | Redis |
| 27017 | TCP | MongoDB |
| 51820 | UDP | WireGuard (por defecto) |

### B. Comandos de diagnóstico — orden de uso

```bash
# 1. Interfaz y dirección
ip link show && ip addr show
# 2. Gateway y ruta
ip route show && ping -c3 $(ip route | awk '/default/{print $3}')
# 3. DNS
dig +short google.com
# 4. Puerto específico
nc -zv host puerto
# 5. Tráfico real
sudo tcpdump -i eth0 -nn -c 20 'port 80'
```

### C. Referencias cruzadas entre módulos

```
◀ Módulo 07 — Usuarios y permisos
│  El grupo 'netdev' permite gestionar interfaces sin root
│  CAP_NET_BIND_SERVICE para escuchar en puertos < 1024 sin root

◀ Módulo 09 — Procesos y systemd
│  sshd, NetworkManager, systemd-resolved son servicios systemd
│  journalctl -u sshd para ver logs de autenticación

◀ Módulo 10 — Shell scripting
│  Scripts que comprueban conectividad (ping, nc -z) en loops
│  Variables de entorno para credenciales de SSH en automatizaciones

▶ Módulo 14 — Seguridad y hardening
│  → Hardening de sshd_config (PermitRootLogin, PasswordAuthentication)
│  → fail2ban para bloquear IPs con intentos fallidos de SSH
│  → Auditoría de puertos abiertos con nmap/ss

▶ Módulo 17 — Linux como servidor
│  → Todo lo de SSH, firewall y diagnóstico es base del servidor
│  → nginx, Apache, bases de datos: usan los puertos de este módulo
```

---

## Referencias y Bibliografía

1. **RFC 793 — TCP**, **RFC 768 — UDP**  
   https://www.rfc-editor.org/rfc/rfc793

2. **iproute2 documentation** — Linux Foundation  
   https://baturin.org/docs/iproute2/

3. **man pages: ip(8), ss(8), tcpdump(1), ssh(1), sshd_config(5)**  
   https://man7.org/linux/man-pages/

4. **SSH Hardening Guide** — Mozilla OpSec  
   https://infosec.mozilla.org/guidelines/openssh

5. **nftables wiki** — netfilter.org  
   https://wiki.nftables.org/

6. **ufw documentation** — Ubuntu  
   https://help.ubuntu.com/community/UFW

7. **WireGuard Quick Start**  
   https://www.wireguard.com/quickstart/

8. **dig manual** — BIND 9  
   https://bind9.readthedocs.io/en/latest/manpages.html

9. **ArchWiki — Network configuration**  
   https://wiki.archlinux.org/title/Network_configuration

10. **ArchWiki — SSH**  
    https://wiki.archlinux.org/title/OpenSSH

11. **The Linux Command Line** — William Shotts — Capítulo 16: Networking  
    https://linuxcommand.org/tlcl.php

12. **Unix and Linux System Administration Handbook** — Nemeth et al.  
    Capítulo 13: TCP/IP Networking; Capítulo 27: SSH.

13. **Computer Networks** — Andrew Tanenbaum, 5ª ed.  
    Referencia académica de redes.

14. **tcpdump documentation** — https://www.tcpdump.org/manpages/tcpdump.1.html

15. **Nmap Network Scanning** — Gordon Lyon  
    https://nmap.org/book/

---

## Preguntas de autoevaluación

1. ¿Cuál es la diferencia entre TCP y UDP? Da dos servicios que usen cada uno.
2. ¿Qué significa 192.168.1.0/25? ¿Cuántos hosts puede tener esa subred?
3. ¿Qué diferencia hay entre `ip addr show` e `ifconfig`? ¿Por qué se prefiere `ip`?
4. Explica el flujo completo de resolución DNS cuando abres `https://google.com`. ¿Qué archivos y demonios participan?
5. ¿Qué hace `dig +trace google.com`? ¿Para qué es útil?
6. ¿Por qué `PasswordAuthentication no` en sshd_config es una medida de seguridad crítica?
7. Explica la diferencia entre túnel SSH local (`-L`) y remoto (`-R`). Da un caso de uso de cada uno.
8. ¿Qué ventaja tiene `rsync` sobre `scp` para transferir un directorio de 10 GB que ya fue copiado la semana pasada?
9. Explica el concepto de "política por defecto" en ufw. ¿Por qué `default deny incoming` es el punto de partida correcto?
10. ¿Cuál es la diferencia entre activar una regla de ufw y hacerla permanente en firewalld?
11. ¿Por qué es importante `ssh-keygen -t ed25519` en vez de `rsa -b 2048`?
12. ¿Qué información útil da `tcpdump -i eth0 -nn 'dst port 80'` que no puede dar `ss`?

---

## Laboratorios prácticos

### Lab 11.1 — Diagnóstico completo por capas

```bash
# Seguir la metodología de las 7 capas para diagnosticar la conexión de tu máquina
echo "=== 1. Interfaz ==="
ip link show | grep -E "^[0-9]|state"

echo "=== 2. Dirección IP ==="
ip addr show | grep "inet "

echo "=== 3. Gateway ==="
GATEWAY=$(ip route show default | awk '/default/ {print $3}')
echo "Gateway: $GATEWAY"
ping -c3 -W2 "$GATEWAY" | tail -2

echo "=== 4. Conectividad Internet ==="
ping -c3 -W2 8.8.8.8 | tail -2

echo "=== 5. DNS ==="
dig +short google.com || echo "DNS no resuelve"

echo "=== 6. Servicio HTTPS ==="
curl -s -o /dev/null -w "HTTP: %{http_code} (%.2{time_total}s)\n" https://google.com
```

### Lab 11.2 — Claves SSH y configuración

```bash
# 1. Generar un par de claves Ed25519 de práctica
ssh-keygen -t ed25519 -C "lab-practica@$(hostname)" -f /tmp/lab_key -N ""

# 2. Ver la clave pública
cat /tmp/lab_key.pub

# 3. Crear una entrada en ~/.ssh/config para localhost
cat >> ~/.ssh/config <<'EOF'

Host lab-local
    HostName 127.0.0.1
    Port 22
    IdentityFile /tmp/lab_key
    User $USER
EOF

# 4. Añadir la clave al authorized_keys local
cat /tmp/lab_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 5. Conectar con el alias
ssh lab-local "echo 'SSH con clave funciona desde $(hostname)'"

# Limpiar
sed -i '/lab-local/,+5d' ~/.ssh/config
grep -v "$(cat /tmp/lab_key.pub | awk '{print $NF}')" ~/.ssh/authorized_keys > /tmp/ak_tmp
mv /tmp/ak_tmp ~/.ssh/authorized_keys
rm -f /tmp/lab_key /tmp/lab_key.pub
```

### Lab 11.3 — Firewall con ufw

```bash
# 1. Ver el estado actual
sudo ufw status verbose

# 2. Configurar política restrictiva y reglas básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp

# 3. Ver el resultado
sudo ufw status numbered

# 4. Probar: ¿el puerto 8080 está bloqueado?
nc -zv localhost 8080 2>&1 || echo "Puerto 8080: bloqueado (correcto)"

# 5. Permitir el 8080 temporalmente
sudo ufw allow 8080/tcp

# 6. Borrar la regla
sudo ufw delete allow 8080/tcp
```

### Lab 11.4 — tcpdump: capturar una petición HTTP

```bash
# 1. Capturar en background
sudo tcpdump -i lo -nn -A 'port 8080' -w /tmp/lab-capture.pcap &
TCPDUMP_PID=$!
sleep 1

# 2. Levantar un servidor HTTP simple
python3 -m http.server 8080 &
HTTP_PID=$!
sleep 1

# 3. Hacer una petición
curl -s http://localhost:8080 > /dev/null

# 4. Parar la captura
sleep 1
sudo kill $TCPDUMP_PID 2>/dev/null
kill $HTTP_PID 2>/dev/null

# 5. Analizar la captura
sudo tcpdump -r /tmp/lab-capture.pcap -nn -A 2>/dev/null | grep -E "GET|HTTP|Host:" | head -10
rm -f /tmp/lab-capture.pcap
```

---

## Resumen del módulo

✅ **TCP/IP:** capas, TCP vs UDP, CIDR, rangos privados, puertos conocidos  
✅ **iproute2:** `ip addr/link/route/neigh` sustituyendo a ifconfig/route; `ss -tulnp` sustituyendo a netstat  
✅ **Configuración persistente:** `nmcli` para NetworkManager; Netplan para Ubuntu Server  
✅ **DNS:** flujo de resolución, `/etc/hosts`, `nsswitch.conf`, `dig +trace` para diagnóstico  
✅ **Diagnóstico:** metodología por capas; `ping`, `traceroute`, `mtr`, `tcpdump` con filtros BPF  
✅ **SSH:** claves ed25519, `~/.ssh/config` con alias, `ssh-agent`, túneles L/R/D, hardening del servidor  
✅ **Transferencias:** `rsync -avz --delete` para sincronización, `curl` para APIs y diagnóstico HTTP  
✅ **Firewalls:** `ufw` para Ubuntu, `nftables` como estándar moderno, `firewalld` para RHEL  
✅ **Servicios de red:** `chrony` para NTP preciso, WireGuard para VPN sencilla  

**Próximo paso:** [Módulo 12 — Almacenamiento avanzado](/almacenamiento-avanzado). Con las bases de red de este módulo entenderás los sistemas de archivos en red (NFS, iSCSI). Aprenderás a gestionar el stack completo de almacenamiento: particiones, LVM, RAID, Btrfs y cifrado LUKS.

---

**Última actualización:** 2024-06  
**Versión:** 1.0  
**Estado:** ✅ Listo para enseñanza
