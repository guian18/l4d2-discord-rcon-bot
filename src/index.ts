import {
  ChatInputCommandInteraction,
  Client,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder
} from 'discord.js';
import { config } from './config.js';
import { getStatus, sendSay } from './rcon.js';

const commands = [
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Envía un mensaje al chat del servidor L4D2')
    .addStringOption((option) =>
      option
        .setName('mensaje')
        .setDescription('Texto que verá el servidor')
        .setRequired(true)
        .setMaxLength(config.maxMessageLength)
    ),
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Consulta el estado del servidor L4D2')
].map((command) => command.toJSON());

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function isAuthorized(interaction: ChatInputCommandInteraction): boolean {
  if (!interaction.inGuild()) return false;
  if (config.discordChannelId && interaction.channelId !== config.discordChannelId) return false;
  if (config.discordAdminRoleId) {
    const member = interaction.member;
    const roles = member && 'roles' in member ? member.roles : undefined;
    const hasRole = Array.isArray(roles)
      ? roles.includes(config.discordAdminRoleId)
      : Boolean(roles?.cache.has(config.discordAdminRoleId));
    if (!hasRole) {
      return false;
    }
  }
  return true;
}

function clipForDiscord(value: string): string {
  const normalized = value.replace(/```/g, "'''" ).trim() || '(sin salida)';
  return normalized.length > 1900 ? `${normalized.slice(0, 1900)}\n… (salida recortada)` : normalized;
}

async function handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!isAuthorized(interaction)) {
    await interaction.reply({ content: 'No tienes permiso para usar este bot en este canal.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: interaction.commandName === 'status' });

  try {
    if (interaction.commandName === 'say') {
      const message = interaction.options.getString('mensaje', true).trim();
      if (!message) {
        await interaction.editReply('El mensaje no puede estar vacío.');
        return;
      }
      await sendSay(message);
      await interaction.editReply(`Mensaje enviado a **${config.rconHost}:${config.rconPort}**.`);
      return;
    }

    if (interaction.commandName === 'status') {
      const output = await getStatus();
      await interaction.editReply(`\`\`\`text\n${clipForDiscord(output)}\n\`\`\``);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'error desconocido';
    console.error(`[${interaction.commandName}] ${detail}`);
    await interaction.editReply('No se pudo completar la operación RCON. Revisa los logs del bot y la conectividad del servidor.');
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  const rest = new REST({ version: '10' }).setToken(config.discordToken);
  const route = config.discordGuildId
    ? Routes.applicationGuildCommands(readyClient.user.id, config.discordGuildId)
    : Routes.applicationCommands(readyClient.user.id);
  await rest.put(route, { body: commands });
  console.log(`Bot conectado como ${readyClient.user.tag}. Comandos registrados ${config.discordGuildId ? 'en el servidor configurado' : 'globalmente'}.`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) await handleCommand(interaction);
});

client.on(Events.Error, (error) => console.error('Error de Discord:', error));

await client.login(config.discordToken);
