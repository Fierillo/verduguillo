import { ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';

// Configuration bot interface
interface Config {
    emojiName: string;
    reactionThreshold: number;
    shitcoinerRoleName: string;
}

// Function to handle slash commands
export async function handleCommands(
    interaction: ChatInputCommandInteraction,
    config: Config,
    updateConfig: (updates: Partial<Config>) => void
): Promise<void> {
    if (interaction.commandName === 'config') {
        // Check if the user has the "Manage roles" permissions
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
                if (isNaN(thresholdNum) || thresholdNum < 1) {
                    await interaction.reply({ content: 'El umbral debe ser un número positivo.', ephemeral: true });
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