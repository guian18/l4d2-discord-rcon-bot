# Bot de Discord para mensajes en Left 4 Dead 2

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/guian18/l4d2-discord-rcon-bot)

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/github)

Bot pequeño de Discord que envía mensajes al chat de un servidor dedicado de **Left 4 Dead 2** mediante **Source RCON**. La implementación usa `discord.js` 14 y `rcon-srcds` 2.1.1. El bot expone dos comandos slash:

- `/say mensaje`: envía `say "mensaje"` al servidor.
- `/status`: consulta `status` y devuelve la respuesta de RCON de forma efímera.

El proyecto no acepta texto RCON arbitrario desde Discord. Esta decisión reduce el impacto de una cuenta o canal comprometido.

## Requisitos

Se necesita Node.js 20 o posterior, un bot creado en el [Discord Developer Portal](https://discord.com/developers/applications) y un servidor L4D2 con una contraseña RCON no vacía. Source RCON usa TCP; el puerto predeterminado es 27015, pero debe coincidir con el puerto configurado en el servidor.

El proceso del bot debe poder alcanzar `RCON_HOST`. Lo recomendable es ejecutar el bot en la misma máquina o red privada que el servidor. No publiques RCON directamente en Internet: el protocolo no proporciona cifrado para la contraseña ni para los comandos.

## Importante: servidores oficiales de Valve

Este bot **no puede enviar mensajes a servidores oficiales de Valve**. Una dirección como `155.133.244.69:27069` sólo identifica una instancia de juego; no proporciona permisos administrativos ni una contraseña RCON.

Los servidores oficiales de Valve no están bajo el control del jugador y normalmente no exponen un `rcon_password` para usuarios externos. Por eso no es posible usar `/say`, `/status` ni comandos RCON contra ellos, aunque se conozcan la dirección y el puerto. Intentar acceder sin autorización no sería un uso permitido del bot.

El proyecto está destinado a servidores dedicados privados o comunitarios administrados por el usuario. Para esos servidores, el administrador debe configurar `rcon_password`, confirmar el puerto RCON, permitir la conexión desde el host del bot y entregar las credenciales de forma segura. Para hablar con un amigo en un servidor oficial deben utilizarse el chat o la voz de Left 4 Dead 2, Steam o Discord.

## Chat del juego hacia Discord

La función actual del bot sólo envía mensajes desde Discord hacia el servidor mediante RCON. Para que los mensajes escritos **dentro del juego** lleguen a un canal de Discord hace falta instalar un plugin en el servidor de juego; RCON por sí solo no recibe eventos de chat.

La alternativa más completa encontrada es [Source Chat Relay](https://github.com/maxijabase/scr-server) junto con su plugin [scr-client](https://github.com/maxijabase/scr-client). `scr-client` captura el chat de SourceMod y lo envía por WebSocket al relay, mientras `scr-server` lo entrega al canal de Discord enlazado. Requiere acceso administrativo al servidor, SourceMod 1.11+, extensiones WebSocket y REST in Pawn, un proceso Bun del relay y una aplicación de Discord separada o una integración específica. Su documentación menciona L4D2 para una limitación de salida de comandos, pero no garantiza que el relay de chat haya sido probado en L4D2; debe validarse en un servidor comunitario de prueba.

Otra alternativa es [sp-discordrelay](https://github.com/log-ical/sp-discordrelay), un plugin SourceMod que publica el chat mediante un webhook de Discord. No documenta compatibilidad específica con L4D2 y depende de extensiones antiguas, por lo que debe considerarse experimental. Para un relay únicamente de salida hay que habilitar el envío servidor → Discord y mantener deshabilitado el sentido Discord → servidor y cualquier canal RCON.

**Esto no funciona en un servidor oficial de Valve.** No puedes instalar `scr-client`, SourceMod ni otro plugin en una instancia oficial, y el bot no puede leer su chat. Esta función sólo es viable en un servidor privado o comunitario cuyo administrador controle los archivos y la configuración.

## Configuración de Left 4 Dead 2

En la configuración del servidor establece una contraseña fuerte, por ejemplo:

```cfg
rcon_password "cambia-esta-contraseña-por-un-secreto-largo"
```

Reinicia o recarga la configuración del servidor y confirma que el firewall permite el puerto RCON únicamente desde la IP del host del bot. Si el servidor se inició con `-port`, usa ese puerto en `RCON_PORT`.

## Configuración de Discord

Crea el bot en Discord y genera una URL de instalación con los scopes `bot` y `applications.commands`. Como permisos de bot, basta con ver el canal, enviar mensajes y usar comandos de aplicación. El código no necesita `Message Content Intent` porque sólo recibe slash commands.

Copia el ejemplo de variables:

```bash
cp .env.example .env
```

Completa como mínimo `DISCORD_TOKEN`, `RCON_HOST`, `RCON_PORT` y `RCON_PASSWORD`. Para proteger el bot, configura también `DISCORD_GUILD_ID`, `DISCORD_CHANNEL_ID` y `DISCORD_ADMIN_ROLE_ID`. Si se define un canal, las órdenes fuera de él se rechazan. Si se define un rol, sólo los miembros con ese rol pueden ejecutar los comandos.

## Ejecutar

```bash
npm install
npm run build
npm start
```

Durante el desarrollo puede usarse:

```bash
npm run dev
```

Con `DISCORD_GUILD_ID`, los comandos se registran inmediatamente en ese servidor de Discord. Sin esa variable se registran globalmente, y Discord puede tardar en propagarlos.

## Despliegue con hosting

El repositorio incluye un [`Dockerfile`](Dockerfile) y un [`render.yaml`](render.yaml) para ejecutar el bot como un proceso trabajador persistente. Puedes iniciar el despliegue con uno de estos botones:

- **Render:** el botón carga el Blueprint y crea un trabajador Docker. En un repositorio privado tendrás que instalar o autorizar la [aplicación de GitHub de Render](https://github.com/apps/render) para ese repositorio.
- **Railway:** el botón abre el flujo oficial para conectar GitHub y seleccionar este repositorio. Railway detecta el `Dockerfile` y permite iniciar el despliegue desde el proyecto conectado.

Después de crear el servicio, completa las variables privadas `DISCORD_TOKEN`, `RCON_HOST` y `RCON_PASSWORD`. Configura también `RCON_PORT`, `DISCORD_GUILD_ID`, `DISCORD_CHANNEL_ID` y `DISCORD_ADMIN_ROLE_ID` cuando corresponda. No introduzcas secretos en `render.yaml`, en `README.md` ni en los logs.

El bot necesita una conexión de red saliente hacia Discord y una conexión TCP desde el hosting hacia `RCON_HOST:RCON_PORT`. Si el servidor L4D2 está en una red doméstica o detrás de un firewall, el hosting externo normalmente no podrá alcanzar RCON sin una VPN, túnel privado o regla de red específica. No abras RCON a todo Internet.

Este proyecto es un worker sin página web ni puerto HTTP. Si el proveedor ofrece planes que duermen o suspenden procesos, no son adecuados para un bot de Discord que debe permanecer conectado; selecciona un servicio trabajador siempre activo según las condiciones y el precio vigentes del proveedor.

## Comprobación inicial

1. Ejecuta el bot y confirma en la consola que los comandos se registraron.
2. En el canal autorizado, ejecuta `/status`.
3. Si responde con la información del servidor, prueba `/say Prueba de conexión desde Discord`.
4. Revisa que la contraseña no aparezca en logs y que un usuario sin el rol configurado reciba un rechazo.

El repositorio no incluye credenciales ni puede validar una conexión real sin acceso al servidor L4D2 del operador. La compilación TypeScript se verifica con `npm run build`.

## Estructura

`src/config.ts` valida las variables de entorno. `src/rcon.ts` abre una conexión autenticada por operación, aplica timeout y construye únicamente `say` o `status`. `src/index.ts` registra los comandos slash y aplica la restricción de guild, canal y rol.

## Investigación y límites de compatibilidad

Consulta [`docs/investigacion.md`](docs/investigacion.md) para la comparación de proyectos existentes. El bot L4D2 específico más directo encontrado, `americasectorcoop/L4D2-DISCORD-BOT`, usa dependencias antiguas. Por eso este repositorio implementa la misma ruta Discord → Source RCON con dependencias actuales y controles más estrechos, en vez de desplegar ese código sin revisar.

La compatibilidad de transporte está basada en el protocolo Source RCON que usa SRCDS. Debe hacerse una prueba en un servidor de staging L4D2 antes de producción, especialmente para comprobar firewall, puerto, contraseña y respuesta de `status`.

## Licencia

Este repositorio contiene código nuevo del proyecto. La biblioteca `rcon-srcds` se usa como dependencia MIT. Revisa las licencias de cualquier plugin o proyecto alternativo antes de incorporarlo.
