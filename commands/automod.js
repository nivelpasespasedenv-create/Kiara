const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { setAutomod, isAutomodEnabled } = require('../utils/automod');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Activa o desactiva el filtro automático de groserías')
        .addStringOption(option =>
            option.setName('accion')
                .setDescription('¿Qué quieres hacer?')
                .setRequired(true)
                .addChoices(
                    { name: '✅ Activar', value: 'on' },
                    { name: '❌ Desactivar', value: 'off' },
                    { name: '📊 Ver estado', value: 'status' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: '❌ Necesitas el permiso de **Gestionar Mensajes** para usar este comando.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const accion = interaction.options.getString('accion');
        const guildId = interaction.guildId;

        if (accion === 'status') {
            const enabled = await isAutomodEnabled(guildId);
            const embed = new EmbedBuilder()
                .setTitle('🛡️ Estado del AutoMod')
                .setDescription(enabled
                    ? '✅ El filtro automático de groserías está **activado**.\nLos mensajes con lenguaje inapropiado en cualquier idioma serán eliminados automáticamente.'
                    : '❌ El filtro automático de groserías está **desactivado**.\nUsa `/automod activar` para proteger el servidor.')
                .setColor(enabled ? '#2ecc71' : '#e74c3c')
                .setFooter({ text: 'AutoMod • Sasha' })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        const enable = accion === 'on';
        const success = await setAutomod(guildId, enable);

        if (!success) {
            return await interaction.editReply({ content: '❌ Hubo un error al guardar la configuración. Inténtalo de nuevo.' });
        }

        const embed = new EmbedBuilder()
            .setTitle(enable ? '✅ AutoMod Activado' : '❌ AutoMod Desactivado')
            .setDescription(enable
                ? '🛡️ El filtro de groserías está ahora **activo**.\n\n• Detecta lenguaje inapropiado en **cualquier idioma**\n• Elimina los mensajes automáticamente\n• Envía un aviso personalizado con IA al infractor'
                : '⚠️ El filtro de groserías está ahora **desactivado**.\nLos mensajes con lenguaje inapropiado **no** serán eliminados hasta que lo reactives.')
            .setColor(enable ? '#2ecc71' : '#e74c3c')
            .setFooter({ text: `Cambiado por ${interaction.user.username} • AutoMod Sasha` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
