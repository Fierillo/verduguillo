// Polyfill for ReadableStream
const { ReadableStream } = require('web-streams-polyfill');
global.ReadableStream = ReadableStream; // Asignar al entorno global

const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');
require('dotenv').config();

// Create a simple server to keep the bot alive
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Verduguillo is alive!');
}).listen(3000);

// Configure Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// Variables
const emojiName = '💩';
const reactionThreshold = 3;
const shitcoinerRoleName = 'shitcoiner';

// If user reach the threshold, give them the shitcoiner role
async function getPunishment(member, shitcoinerRole, targetUser, channel) {
  // First, check if the member exists
  if (!member) {
    console.log(`User ${targetUser.tag} not found in the server, maybe he left`);
    return;
  }

  // Second, check if the role "shitcoiner" exists
  if (!shitcoinerRole) {
    console.log(`El rol "${shitcoinerRoleName}" no existe en el servidor`);
    return;
  }

  // Third, attempt the punishment if the user doesn't have the role
  if (!member.roles.cache.has(shitcoinerRole.id)) {
    try {
      await member.roles.add(shitcoinerRole);
      await channel.send(`El usuario ${targetUser.tag} fue castigado por acumulación de caquitas 💩`);
      console.log(`Usuario ${targetUser.tag} castigado exitosamente`);
    } catch (error) {
      console.error(`Error al castigar al usuario ${targetUser.tag}:`, error);
    }
  } else {
    console.log(`El usuario ${targetUser.tag} ya estaba castigado`);
  }
}

// Starting message
client.on('ready', async () => {
  console.log(`Bot ${client.user?.tag} ready in server ${client.guilds.cache.size}`);
});

// Evento: Nueva reacción en un mensaje
client.on('messageReactionAdd', async (reaction) => {
  console.log('Nueva reacción detectada, analizando...');

  // Obtener datos completos si es un objeto parcial
  if (reaction.partial) await reaction.fetch();
  if (reaction.message.partial) await reaction.message.fetch();

  // Ignorar reacciones de bots
  if (!reaction.message.author || reaction.message.author.bot) return;

  // Verificar si la reacción es el emoji 💩
  if (reaction.emoji.name === emojiName) {
    console.log(`Caca detectada para el usuario: ${reaction.message.author.tag}`);

    // Contar las reacciones
    const reactionCount = reaction.count || 0;

    // Aplicar castigo si se supera el umbral
    if (reactionCount >= reactionThreshold) {
      const guild = reaction.message.guild;
      if (!guild) return;

      const targetUser = reaction.message.author;
      const member = guild.members.cache.get(targetUser.id);
      const shitcoinerRole = guild.roles.cache.find((role) => role.name === shitcoinerRoleName);
      const channel = reaction.message.channel;

      await getPunishment(member, shitcoinerRole, targetUser, channel);
    }
  }
});

// Iniciar el bot con el token de Discord
client.login(process.env.DISCORD_TOKEN);