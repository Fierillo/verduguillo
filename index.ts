import { Client, GatewayIntentBits, GuildMember, Role, TextChannel, User } from 'discord.js';
import { config } from 'dotenv';
import { handleCommands, registerCommands } from './commands';

// Load environment variables from .env file
config();

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
// Default variable values
let emojiName = '💩'; 
let reactionThreshold = 1; 
let shitcoinerRoleName = 'shitcoiner';
const requiredRoleName = 'normie'; 

// Defines punishment function
async function getPunishment(member: GuildMember, shitcoinerRole: Role, targetUser: User, channel: TextChannel) {
    // execute punishment, only if the user doesn't have the shitcoiner role
    if (!member.roles.cache.has(shitcoinerRole.id)) {
        try {
            await member.roles.add(shitcoinerRole);
            await channel.send(`El usuario ${targetUser.tag} fue castigado por acumulación de caquitas 💩`);
            console.log(`user ${targetUser.tag} was punished successfully`);
        } catch (error) {
            console.error(`error trying to punish user ${targetUser.tag}`, error);
        }
    } else {
        console.log(`user ${targetUser.tag} already was punished!`);
    }
}

// Starting bot event, also register commands
client.on('ready', async () => {
    console.log(`${client.user?.tag} is alive!`);
});

client.on('messageReactionAdd', async (reaction, user) => {
    // fetch the reaction and message if they are partial
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    
    // check if bot is in a server already
    if (!reaction.message.guild) return console.log(`Bot is not in a server yet`);
    const guild = reaction.message.guild;
    
    // check if shitcoiner role exists in the server
    const shitcoinerRole = guild.roles.cache.find(role => role.name === shitcoinerRoleName);
    if (!shitcoinerRole) {
        return console.log(`"${shitcoinerRoleName}" role doesn't exist in the server "${guild}"`);
    }
    // check if required role exists in the server
    const requiredRole = guild.roles.cache.find(role => role.name === requiredRoleName);
    if (!requiredRole) {
        return console.log(`"${requiredRoleName}" role doesn't exist in the server "${guild}"`);
    }
    // ignore bot reactions
    if (!reaction.message.author || reaction.message.author.bot) return;

    // check if user has the required role
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    if (!member.roles.cache.has(requiredRole.id)) {
        return console.log(`user "${member.user.tag}" in server "${guild}" doesn't have the required role "${requiredRoleName}"`);
    };

    // check if the reaction fits the required emoji
    if (!(reaction.emoji.name === emojiName)) return;

    // give total users that reacted to the message
    const users = await reaction.users.fetch();
    
    // filter users that have the required role
    const validReactors = await Promise.all(
        users.map(async (reactUser) => {
            if (reactUser.bot) return false;
            if (!member) return false;
            return member.roles.cache.has(requiredRole.id);
        })
    );
    
    // count valid reactions
    const validReactionCount = validReactors.filter(Boolean).length;
    console.log(`valid "${emojiName}" detected for user "${reaction.message.author.tag}" in server "${guild}"\nvalid count: ${validReactionCount}/${reactionThreshold}`);

    // if the reaction count is equal or greater than the threshold, punish the user
    if (validReactionCount >= reactionThreshold) {
        const targetUser = reaction.message.author;
        const channel = reaction.message.channel;
        if (member) {
            await getPunishment(member, shitcoinerRole, targetUser, channel as TextChannel);
        }
    }
});

// Command slash configuration
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    await handleCommands(interaction, () => ({
        emojiName,
        reactionThreshold,
        shitcoinerRoleName
    }), (updates) => {
        if (updates.emojiName !== undefined) emojiName = updates.emojiName;
        if (updates.reactionThreshold !== undefined) reactionThreshold = updates.reactionThreshold;
        if (updates.shitcoinerRoleName !== undefined) shitcoinerRoleName = updates.shitcoinerRoleName;
        console.log('Configuración actualizada:', { emojiName, reactionThreshold, shitcoinerRoleName });
    });
});