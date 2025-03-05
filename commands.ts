import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Configuration bot interface
interface Config {
    emojiName: string;
    reactionThreshold: number;
    shitcoinerRoleName: string;
}

// Defines /config Discord command
const commands = [
    new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configura el bot (solo para roles superiores)')
        .addStringOption(option =>
            option.setName('setting')
                .setDescription('Qué quieres configurar')
                .setRequired(true)
                .addChoices(
                    { name: 'Emoji', value: 'emoji' },
                    { name: 'Umbral de reacciones', value: 'threshold' },
                    { name: 'Rol de castigo', value: 'role' }
                ))
        .addStringOption(option =>
            option.setName('value')
                .setDescription('Nuevo valor para la configuración')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .toJSON(),
];

// Register commands in Discord
export async function registerCommands(): Promise<void> {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
    try {
        console.log('Registering slash commands...');
        // Global registration (takes up to 1 hour to update)
        //await rest.put(Routes.applicationCommands('TU_APPLICATION_ID'), { body: commands });
        // Local server registration (inmediate update)
        if (process.env.BOT_ID && process.env.SERVER_ID) {
            await rest.put(Routes.applicationGuildCommands(process.env.BOT_ID, process.env.SERVER_ID), { body: commands });
        } else {
            console.error('Error trying to register commands: BOT_ID and SERVER_ID are required in .env file');
        }
        console.log('Commands registered successfully!');
    } catch (error) {
        console.error('Error trying to register commands:', error);
    }
    // Ejecute function when module is imported
    registerCommands();
}

// Function to handle /config command
export async function handleCommands(
    interaction: ChatInputCommandInteraction,
    getConfig: () => Config,
    updateConfig: (updates: Partial<Config>) => void
): Promise<void> {
    if (interaction.commandName === 'config') {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
            await interaction.reply({ content: 'No tienes permiso para usar este comando.', ephemeral: true });
            return;
        }

        const setting = interaction.options.getString('setting');
        const value = interaction.options.getString('value');

        if (!setting || !value) {
            await interaction.reply({ content: 'Faltan parámetros: setting y value son requeridos.', ephemeral: true });
            return;
        }

        const updates: Partial<Config> = {};
        switch (setting) {
            case 'emoji':
                updates.emojiName = value;
                await interaction.reply(`Emoji actualizado a: ${value}`);
                break;
            case 'threshold':
                const thresholdNum = parseInt(value);
                if (isNaN(thresholdNum) || thresholdNum < 1 || !Number.isInteger(thresholdNum)) {
                    await interaction.reply({ content: 'El umbral debe ser un número entero positivo.', ephemeral: true });
                    return;
                }
                updates.reactionThreshold = thresholdNum;
                await interaction.reply(`Umbral de reacciones actualizado a: ${thresholdNum}`);
                break;
            case 'role':
                updates.shitcoinerRoleName = value;
                await interaction.reply(`Rol de castigo actualizado a: ${value}`);
                break;
            default:
                await interaction.reply({ content: 'Configuración no válida. Usa: emoji, threshold o role.', ephemeral: true });
                return;
        }
        updateConfig(updates);
    }
}