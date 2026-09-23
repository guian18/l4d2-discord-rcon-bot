import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable obligatoria ${name}`);
  return value;
}

function positiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} debe ser un entero positivo`);
  }
  return value;
}

export const config = {
  discordToken: required('DISCORD_TOKEN'),
  discordGuildId: process.env.DISCORD_GUILD_ID?.trim() || undefined,
  discordChannelId: process.env.DISCORD_CHANNEL_ID?.trim() || undefined,
  discordAdminRoleId: process.env.DISCORD_ADMIN_ROLE_ID?.trim() || undefined,
  rconHost: required('RCON_HOST'),
  rconPort: positiveInt('RCON_PORT', 27015),
  rconPassword: required('RCON_PASSWORD'),
  maxMessageLength: positiveInt('MAX_MESSAGE_LENGTH', 180),
  rconTimeoutMs: positiveInt('RCON_TIMEOUT_MS', 3000)
};

if (!config.discordChannelId && !config.discordAdminRoleId) {
  console.warn('Advertencia: no hay DISCORD_CHANNEL_ID ni DISCORD_ADMIN_ROLE_ID; el bot quedará accesible a todos los miembros con acceso a los comandos.');
}
