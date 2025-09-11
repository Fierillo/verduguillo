import { Client, GatewayIntentBits, GuildMember, Role, TextChannel, User } from 'discord.js';
import { config } from 'dotenv';
import { handleCommands, registerCommands } from './commands';

config();

const discordClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions
    ]
});

discordClient.login(process.env.DISCORD_TOKEN);

let punishmentEmoji: any = process.env.EMOJI; 
let punishmentReactionThreshold = Number(process.env.SHIT_THRESHOLD); 
let punishmentRoleName = process.env.SHIT_ROLE;
let voterRoleName = process.env.REQUIRED_ROLE; 
let forgivenessEmoji = process.env.FORGIVENESS_EMOJI;
let forgivenessReactionThreshold = Number(process.env.FORGIVENESS_THRESHOLD);

async function applyPunishment(targetMember: GuildMember, punishmentRole: Role, targetUser: User, messageChannel: TextChannel, reaction: any) {  // Agrega 'reaction' como parámetro
    if (!targetMember.roles.cache.has(punishmentRole.id)) {
        try {
            await targetMember.roles.add(punishmentRole);
            await messageChannel.send(`El usuario ${targetUser.tag} fue castigado por acumulación de caquitas 💩`);
            console.log(`user ${targetUser.tag} was punished successfully`);
            
            await reaction.users.remove(targetUser);
            
            await reaction.message.react(`:caca2:1135681119233257663`);
            console.log(`Added 👍 reaction to the message`);
        } catch (error) {
            console.error(`error trying to punish user ${targetUser.tag}`, error);
        }
    } else {
        console.log(`user ${targetUser.tag} already was punished!`);
    }
}

async function applyForgiveness(targetMember: GuildMember, punishmentRole: Role, targetUser: User, messageChannel: TextChannel) {
    if (targetMember.roles.cache.has(punishmentRole.id)) {
        try {
            await targetMember.roles.remove(punishmentRole);
            await messageChannel.send(`TABULA RASA! El usuario ${targetUser.tag} fue perdonado por acumulación de corazones ❤️`);
            console.log(`user ${targetUser.tag} was forgiven successfully`);
        } catch (error) {
            console.error(`error trying to forgive user ${targetUser.tag}`, error);
        }
    } else {
        console.log(`user ${targetUser.tag} was not punished, no need to forgive!`);
    }
}

discordClient.on('ready', async () => {
    console.log(`${discordClient.user?.tag} is alive!`);
    //registerCommands();
});

discordClient.on('messageReactionAdd', async (reaction, reactingUser) => {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    if (!reaction.message.guild) return console.log(`Bot is not in a server yet`);
    const server = reaction.message.guild;

    const punishmentRole = server.roles.cache.find(role => role.name === punishmentRoleName);
    if (!punishmentRole) {
        return console.log(`"${punishmentRoleName}" role doesn't exist in the server "${server}"`);
    }

    const voterRole = server.roles.cache.find(role => role.name === voterRoleName);
    if (!voterRole) {
        return console.log(`"${voterRoleName}" role doesn't exist in the server "${server}"`);
    }

    if (!reaction.message.author || reaction.message.author.bot) return;

    const reactingMember = await server.members.fetch(reactingUser.id).catch(() => null);
    if (!reactingMember) return;
    if (!reactingMember.roles.cache.has(voterRole.id)) {
        return console.log(`user "${reactingMember.user.tag}" in server "${server}" doesn't have the required role "${voterRoleName}"`);
    }

    const targetUser = reaction.message.author;
    const targetMember = await server.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) return;

    const messageChannel = reaction.message.channel as TextChannel;

    if (reaction.emoji.name === punishmentEmoji) {
        const allReactors = await reaction.users.fetch();
        const validPunishmentReactors = await Promise.all(
            allReactors.map(async (reactor) => {
                if (reactor.bot) return false;
                const reactorMember = await server.members.fetch(reactor.id).catch(() => null);
                if (!reactorMember) return false;
                return reactorMember.roles.cache.has(voterRole.id);
            })
        );
        const validPunishmentCount = validPunishmentReactors.filter(Boolean).length;
        console.log(`valid "${punishmentEmoji}" detected for user "${targetUser.tag}" in server "${server}"\nvalid count: ${validPunishmentCount}/${punishmentReactionThreshold}`);

        if (validPunishmentCount >= punishmentReactionThreshold) {
            await applyPunishment(targetMember, punishmentRole, targetUser, messageChannel, reaction);
        }
    } else if (reaction.emoji.name === forgivenessEmoji) {
        if (!targetMember.roles.cache.has(punishmentRole.id)) {
        console.log(`user ${targetUser.tag} is not punished, ignoring forgiveness reaction`);
        return;
        }
        const allReactors = await reaction.users.fetch();
        const validForgivenessReactors = await Promise.all(
            allReactors.map(async (reactor) => {
                if (reactor.bot) return false;
                const reactorMember = await server.members.fetch(reactor.id).catch(() => null);
                if (!reactorMember) return false;
                return reactorMember.roles.cache.has(voterRole.id);
            })
        );
        const validForgivenessCount = validForgivenessReactors.filter(Boolean).length;
        console.log(`valid "${forgivenessEmoji}" detected for user "${targetUser.tag}" in server "${server}"\nvalid count: ${validForgivenessCount}/${forgivenessReactionThreshold}`);

        if (validForgivenessCount >= forgivenessReactionThreshold) {
            await applyForgiveness(targetMember, punishmentRole, targetUser, messageChannel);
        }
    }
});

/*discordClient.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    await handleCommands(interaction, () => ({
        emojiName: punishmentEmoji,
        reactionThreshold: punishmentReactionThreshold,
        shitcoinerRoleName: punishmentRoleName,
        requiredRoleName: voterRoleName
    }), (updates) => {
        if (updates.emojiName !== undefined) punishmentEmoji = updates.emojiName;
        if (updates.reactionThreshold !== undefined) punishmentReactionThreshold = updates.reactionThreshold;
        if (updates.shitcoinerRoleName !== undefined) punishmentRoleName = updates.shitcoinerRoleName;
        if (updates.requiredRoleName !== undefined) voterRoleName = updates.requiredRoleName;
        console.log('Configuración actualizada:', { punishmentEmoji, punishmentReactionThreshold, punishmentRoleName });
    });
});*/