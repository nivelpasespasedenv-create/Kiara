const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('silenciar')
        .setDescription('Silencia a un usuario en canales de texto')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a silenciar')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duracion')
                .setDescription('Duración del silencio (ej: 10m, 1h, 1d)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Razón del silencio')
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal específico (opcional, por defecto todos)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            const lang = await getLanguage(interaction.guildId);
            const targetUser = interaction.options.getUser('usuario');
            const duration = interaction.options.getString('duracion') || '10m';
            const reason = interaction.options.getString('razon') || t('NO_REASON', lang);
            const member = interaction.guild.members.cache.get(targetUser.id);

            if (!member) return await interaction.reply({ content: t('USER_NOT_FOUND', lang), ephemeral: true });

            if (targetUser.id === interaction.user.id) return await interaction.reply({ content: t('KILL_SELF', lang), ephemeral: true });

            // ... (lógica de tiempo simplificada para brevedad)
            let durationMs = 600000; // 10m por defecto

            await member.timeout(durationMs, reason);

            const successEmbed = new EmbedBuilder()
                .setColor('#51cf66')
                .setTitle('🔇 ' + t('MUTE_TITLE', lang))
                .setDescription(t('MUTE_SUCCESS', lang, { user: targetUser.username }))
                .addFields(
                    { name: t('REASON', lang), value: reason, inline: false },
                    { name: t('MODERATOR', lang), value: interaction.user.username, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error en comando silenciar:', error);
            await interaction.reply({ content: t('IA_ERROR', lang), ephemeral: true });
        }
    },
};