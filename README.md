# Bot de Discord para mensajes en Left 4 Dead 2

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
