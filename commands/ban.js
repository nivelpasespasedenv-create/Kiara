const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banea a un usuario del servidor')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a banear')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Razón del baneo')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('dias')
                .setDescription('Días de mensajes a eliminar (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        const targetUser = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razon') || t('NO_REASON', lang);
        const deleteMessageDays = interaction.options.getInteger('dias') || 0;

        // Verificar permisos del usuario que ejecuta el comando
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return await interaction.reply({ content: t('NO_PERMISSIONS', lang), ephemeral: true });
        }

        // Verificar permisos del bot
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return await interaction.reply({ content: t('BOT_NO_PERMISSIONS', lang), ephemeral: true });
        }

        // No puedes banearte a ti mismo
        if (targetUser.id === interaction.user.id) {
            return await interaction.reply({ content: t('KILL_SELF', lang), ephemeral: true });
        }

        // No puedes banear al bot
        if (targetUser.id === interaction.client.user.id) {
            return await interaction.reply({ content: t('KILL_BOT', lang), ephemeral: true });
        }

        try {
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            
            // Verificar jerarquía de roles
            if (member) {
                if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                    return await interaction.reply({ content: t('HIERARCHY_ERROR', lang), ephemeral: true });
                }

                if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                    return await interaction.reply({ content: t('BOT_HIERARCHY_ERROR', lang), ephemeral: true });
                }
            }

            // Ejecutar el baneo
            await interaction.guild.members.ban(targetUser, {
                reason: `${reason} | Moderador: ${interaction.user.username}`,
                deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60
            });

            const successEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔨 ' + t('BAN_TITLE', lang))
                .setDescription(t('BAN_SUCCESS', lang, { user: targetUser.username }))
                .addFields(
                    { name: t('REASON', lang), value: reason, inline: false },
                    { name: t('MODERATOR', lang), value: interaction.user.username, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error ejecutando baneo:', error);
            await interaction.reply({ content: t('IA_ERROR', lang), ephemeral: true });
        }
    },
};