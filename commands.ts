import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Configuration bot interface
interface Config {
    emojiName: string;
    reactionThreshold: number;
    shitcoinerRoleName: string;
    requiredRoleName: string;
}

// Defines /config Discord command
const commands = [
    new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configura el bot (solo para roles superiores)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcommand =>
            subcommand
                .setName('emoji')
                .setDescription('¿Con que emoji quieres castigar?')
                .addStringOption(option =>
                    option
                        .setName('value')
                        .setDescription('El nuevo emoji')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('threshold')
                .setDescription('¿Cuántas reacciones necesitas para castigar?')
                .addIntegerOption(option =>
                    option
                        .setName('value')
                        .setDescription('El nuevo umbral')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('shit_role')
                .setDescription('¿Qué rol quieres darle a los castigados?')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Selecciona el rol de castigo')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('required_role')
                .setDescription('¿Que rol es requerido para castigar?')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Selecciona el rol requerido')
                        .setRequired(true)))
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
        const roleValue = interaction.options.getRole('role_value');

        if (!setting) {
            await interaction.reply({ content: 'Falta el parámetro setting.', ephemeral: true });
            return;
        }

        const updates: Partial<Config> = {};
        switch (setting) {
            case 'emoji':
                if (!value) {
                    await interaction.reply({ content: 'Falta el valor para emoji.', ephemeral: true });
                    return;
                }
                updates.emojiName = value;
                await interaction.reply(`Emoji actualizado a: ${value}`);
                break;
            case 'threshold':
                if (!value) {
                    await interaction.reply({ content: 'Falta el valor para threshold.', ephemeral: true });
                    return;
                }
                const thresholdNum = parseInt(value);
                if (isNaN(thresholdNum) || thresholdNum < 1 || !Number.isInteger(thresholdNum)) {
                    await interaction.reply({ content: 'El umbral debe ser un número entero positivo.', ephemeral: true });
                    return;
                }
                updates.reactionThreshold = thresholdNum;
                await interaction.reply(`Umbral de reacciones actualizado a: ${thresholdNum}`);
                break;
            case 'role':
                if (!roleValue) {
                    await interaction.reply({ content: 'Falta seleccionar un rol para role.', ephemeral: true });
                    return;
                }
                updates.shitcoinerRoleName = roleValue.name;
                await interaction.reply(`Rol de castigo actualizado a: ${roleValue.name}`);
                break;
            case 'required_role':
                if (!roleValue) {
                    await interaction.reply({ content: 'Falta seleccionar un rol para required_role.', ephemeral: true });
                    return;
                }
                updates.requiredRoleName = roleValue.name;
                await interaction.reply(`Rol requerido actualizado a: ${roleValue.name}`);
                break;
            default:
                await interaction.reply({ content: 'Configuración no válida. Usa: emoji, threshold, role o required_role.', ephemeral: true });
                return;
        }
        updateConfig(updates);
    }
}