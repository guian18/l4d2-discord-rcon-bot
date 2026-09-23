# Investigación: bot de Discord para enviar mensajes a Left 4 Dead 2

## Conclusión

La opción más controlable para este repositorio es un bot propio de Discord que use **Source RCON** contra la dirección y el puerto del servidor L4D2. La implementación elegida combina `discord.js` actual con `rcon-srcds`, una biblioteca TypeScript que implementa el protocolo Source/Minecraft RCON y expone `authenticate()` y `execute()`.[1] [2]

No encontré un bot actual, mantenido y específico de L4D2 que ya ofreciera un comando seguro `/say`. Sí existe `americasectorcoop/L4D2-DISCORD-BOT`, que demuestra el recorrido Discord → RCON y contiene comandos SourceMod, pero usa `discord.js` 12 y `srcds-rcon` 2.2.1, una dependencia antigua. Se conserva como referencia, no como base de producción.[3]

## Cómo funciona la conexión

Source RCON es un protocolo TCP/IP para servidores dedicados Source. El servidor exige autenticación con la variable `rcon_password` antes de aceptar comandos. El puerto habitual es 27015, aunque cambia si el servidor se inicia con otra opción `-port`.[1]

El bot abre una conexión por operación, se autentica y ejecuta sólo una de estas acciones:

| Comando Discord | Comando enviado al servidor | Propósito |
| --- | --- | --- |
| `/say mensaje` | `say "mensaje"` | Publicar un mensaje en el chat del servidor. |
| `/status` | `status` | Consultar estado y jugadores del servidor. |

El texto de `/say` tiene longitud máxima configurable, y se escapan comillas, barras invertidas y saltos de línea. La salida se limita antes de enviarse a Discord para respetar el tamaño de los mensajes.

## Chat escrito dentro del juego hacia Discord

El camino inverso no se puede resolver con RCON. Para leer el chat que escriben los jugadores hay que ejecutar código dentro del servidor mediante SourceMod. Esto requiere que el operador controle los archivos del servidor y pueda instalar plugins y extensiones.

La opción más completa encontrada es [Source Chat Relay](https://github.com/maxijabase/scr-server) con [scr-client](https://github.com/maxijabase/scr-client). El plugin captura los mensajes del chat del juego y los envía a un relay WebSocket. El relay los enruta al canal Discord vinculado. El sistema también puede funcionar en sentido bidireccional, pero para reducir riesgos conviene crear un enlace sólo de salida para el tipo `chat` y desactivar los comandos remotos. Sus requisitos incluyen SourceMod 1.11+, `sm-ext-websocket`, `sm-ripext`, SteamWorks, Bun, SQLite persistente y una aplicación Discord con permisos de publicación.[10] [11]

La alternativa más pequeña es `sp-discordrelay`, que captura el chat con callbacks genéricos de SourceMod y lo publica mediante un webhook. El repositorio no menciona ni prueba L4D2 explícitamente, y su cadena de dependencias es antigua. Debe fijarse un commit, comprobar la compilación con la versión de SourceMod instalada y probar el chat real antes de utilizarlo.[12]

Ninguna de estas opciones sirve para servidores oficiales de Valve. En una instancia oficial no se puede instalar SourceMod, un plugin de captura o un relay autorizado. Por lo tanto, el chat de un servidor oficial no puede llegar a este bot; sólo puede usarse el chat o la voz del juego, Steam o Discord.

Para el repositorio actual no he integrado automáticamente este relay. El bot existente es un cliente RCON de salida y añadir un segundo cliente Discord o un servidor WebSocket completo sin disponer de un servidor comunitario de prueba podría duplicar sesiones, secretos y comandos. La integración segura requiere primero elegir entre desplegar `scr-server` como servicio separado o adaptar su protocolo al bot actual. En ambos casos se debe comprobar la licencia de los repositorios, proteger el WebSocket y probar el flujo juego → Discord con mensajes normales, UTF-8 y reconexión.

## Proyectos encontrados

| Proyecto | Tipo | Resultado de la revisión |
| --- | --- | --- |
| [ASC-DISCORD-BOT](https://github.com/americasectorcoop/L4D2-DISCORD-BOT) [3] | Bot Discord + `srcds-rcon` | Es el antecedente más directo para L4D2. No conviene desplegarlo sin modernizarlo porque usa dependencias legacy y permisos demasiado amplios. |
| [rcon-srcds](https://github.com/EnriqCG/rcon-srcds) [2] | Biblioteca TypeScript | Base recomendada. Es MIT, tiene tipos, no añade dependencias de ejecución y documenta `authenticate()`/`execute()` para Source RCON. No sustituye la autorización Discord, que debe diseñarse en la aplicación. |
| [srcds-discord-bot](https://github.com/Retr0-01/srcds-discord-bot) [4] | Bot Discord genérico para SRCDS | Tiene slash commands y manejo de salidas largas, pero está archivado, guarda contraseñas en SQLite y permite RCON libre. Sirve como referencia de interfaz, no como base segura. |
| [scr-server + scr-client](https://github.com/maxijabase/scr-server) [5] [6] | Relay Discord ↔ SourceMod por WebSocket | Alternativa interesante para chat bidireccional, eventos y operadores. Requiere SourceMod, extensiones, un relay y un proceso Bun. Su documentación menciona una limitación de salida de consola en L4D2. Es más complejo que el puente RCON mínimo. |
| [sp-discordrelay](https://github.com/log-ical/sp-discordrelay) [7] | Plugin SourceMod | Puede tratar un canal Discord como canal RCON, pero cada mensaje de ese canal se interpreta como comando. Un error de permisos equivaldría a entregar la consola completa; no es la opción recomendada para un `/say` restringido. |
| [gorcon/rcon](https://github.com/gorcon/rcon) [8] | Biblioteca Go | Alternativa técnicamente sólida para un equipo que ya opere Go. Requiere construir desde cero el bot Discord y sus controles. |
| [conqp/rcon](https://github.com/conqp/rcon) [9] | Biblioteca Python | Funcional, pero archivada. Sólo la elegiría si existe una obligación de usar Python y se acepta mantener un fork. |

## Decisión de diseño

Se descartó una consola RCON libre. RCON equivale a control administrativo remoto, y Discord añade otra capa de identidad que debe limitarse explícitamente. Este repositorio aplica dos controles opcionales y acumulables: un canal Discord dedicado y un rol Discord dedicado. Además, sólo permite las acciones implementadas por código.

Las credenciales se cargan desde variables de entorno. El archivo `.env` está ignorado por Git y sólo se incluye `.env.example`. El bot no guarda contraseñas en SQLite, no las imprime en logs y no incluye el token en el código.

## Seguridad de red

Source RCON no debe tratarse como un canal cifrado. La contraseña y los comandos deben viajar por una red privada, una VPN o un túnel protegido. El firewall del servidor debe permitir el puerto RCON únicamente desde el host del bot. También conviene rotar la contraseña si se sospecha exposición.

El bot aplica timeout para evitar operaciones colgadas. No reintenta automáticamente fallos de autenticación, porque los intentos repetidos pueden provocar bloqueos del origen en algunas implementaciones. Las respuestas extensas se recortan antes de Discord; el protocolo Source RCON también puede dividir respuestas en varios paquetes de hasta 4096 bytes.[1]

## Estado de la verificación

La investigación se contrastó con la especificación de Valve y con los README y metadatos de los repositorios citados. El código nuevo compila correctamente con `npm run build` y las dependencias se instalaron sin vulnerabilidades reportadas por `npm audit` en esta ejecución. La prueba de conexión real queda pendiente de los valores privados del servidor L4D2: dirección accesible, puerto, `rcon_password`, firewall y servidor Discord.

> Para validar el despliegue, empieza por `/status` en un servidor de staging y prueba `/say` sólo después de confirmar que el canal y el rol están restringidos.

## References

[1]: https://developer.valvesoftware.com/wiki/Source_RCON_Protocol "Valve Developer Community: Source RCON Protocol"
[2]: https://github.com/EnriqCG/rcon-srcds "EnriqCG/rcon-srcds: TypeScript Source RCON library"
[3]: https://github.com/americasectorcoop/L4D2-DISCORD-BOT "America Sector Coop: L4D2 Discord Bot"
[4]: https://github.com/Retr0-01/srcds-discord-bot "Retr0-01: Source Dedicated Server Discord Bot"
[5]: https://github.com/maxijabase/scr-server "maxijabase/scr-server: Source Chat Relay server"
[6]: https://github.com/maxijabase/scr-client "maxijabase/scr-client: Source Chat Relay SourceMod client"
[7]: https://github.com/log-ical/sp-discordrelay "log-ical/sp-discordrelay: Source Engine Discord relay"
[8]: https://github.com/gorcon/rcon "gorcon/rcon: Go Source RCON implementation"
[9]: https://github.com/conqp/rcon "conqp/rcon: Python RCON library"
[10]: https://github.com/maxijabase/scr-client "maxijabase/scr-client: Source Chat Relay SourceMod client"
[11]: https://github.com/maxijabase/scr-server "maxijabase/scr-server: Source Chat Relay server"
[12]: https://github.com/log-ical/sp-discordrelay "log-ical/sp-discordrelay: Source Engine Discord relay"
