import { Client, GatewayIntentBits, GuildMember, Role, TextChannel, User } from 'discord.js';
import { config } from 'dotenv';
import http from 'http';

// Load environment variables from .env file
config();

/*// Create a simple HTTP server
http.createServer((req, res) => {
    console.log(`Solicitud recibida: ${req.url} desde ${req.headers['user-agent']}`);
    if (req.url === '/keep-alive') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Verduguillo is alive!');
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
}).listen(3000);
  
// Autoping every 4 minutes to keep the server alive in Glitch
setInterval(async () => {
try {
    const response = await fetch('https://verduguillo.glitch.me/keep-alive');
    if (response.ok) {
    console.log('Autoping exitoso');
    } else {
    console.log('Autoping falló:', response.status);
    }
} catch (error) {
    console.error('Error en autoping:', error);
}
}, 240000); // 4 minutes*/

// Define main variables
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions
    ]
});
// Load Discord token
client.login(process.env.DISCORD_TOKEN);
const emojiName = '💩'; 
const reactionThreshold = 1; 
const shitcoinerRoleName = 'shitcoiner'; 

// Defines punishment function
async function getPunishment(member: GuildMember, shitcoinerRole: Role, targetUser: User, channel: TextChannel) {
    // Checks if the member exists
    if (!member) {
        console.log(`Miembro no encontrado para el usuario: ${targetUser.tag}`);
        return;
    }
    // Checks if the shitcoiner role exists
    if (!shitcoinerRole) {
        console.log(`"${shitcoinerRoleName}" role doesn't exist in the server`);
        return;
    }
    // Execute punishment, only if the user doesn't have the shitcoiner role
    if (!member.roles.cache.has(shitcoinerRole.id)) {
        try {
            await member.roles.add(shitcoinerRole);
            await channel.send(`El usuario ${targetUser.tag} fue castigado por acumulacion de caquitas 💩`);
            console.log(`User ${targetUser.tag} was punished successfully`);
        } catch (error) {
            console.error(`Error trying to punish user ${targetUser.tag}`, error);
        }
    } else {
        console.log(`User ${targetUser.tag} already was punished!`);
    }
}

// Starting message, load old messages in the cache
client.on('ready', async () => {
    console.log(`${client.user?.tag} is alive!`);
});

client.on('messageReactionAdd', async (reaction) => {
    console.log(`New reaction detected, analyzing...`);
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    // Ignore bot reactions
    if (!reaction.message.author || reaction.message.author.bot) return;

    // Verify if the reaction is :poop:
    if (reaction.emoji.name === emojiName) {
        console.log(`Shit detected for user: ${reaction.message.author.tag}`);
        // Get the reaction count
        const reactionCount = reaction.count;

        // If message has more than threshold reactions, punish the author
        if (reactionCount ?? 0 >= reactionThreshold) {
            const guild = reaction.message.guild;
            if (!guild) return;
            
            const targetUser = reaction.message.author; // Message author
            const member = guild.members.cache.get(targetUser.id);
            const shitcoinerRole = guild.roles.cache.find(role => role.name === shitcoinerRoleName);
            const channel = reaction.message.channel;
            
            await getPunishment(member as GuildMember, shitcoinerRole!, targetUser, channel as TextChannel);
        }
    }
});