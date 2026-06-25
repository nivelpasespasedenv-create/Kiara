const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addWarn } = require('../utils/warnStorage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Advierte a un usuario')
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Usuario a advertir').setRequired(true))
        .addStringOption(opt =>
            opt.setName('razon').setDescription('Razón de la advertencia').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: '❌ No tienes permisos de moderación.', flags: 64 });
        }
        const target = interaction.options.getUser('usuario');
        const razon = interaction.options.getString('razon');
        if (target.id === interaction.user.id) {
            return interaction.reply({ content: '❌ No puedes advertirte a ti mismo.', flags: 64 });
        }
        const warns = addWarn(interaction.guild.id, target.id, razon, interaction.user.id);
        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('⚠️ Advertencia Emitida')
            .addFields(
                { name: '👤 Usuario', value: `${target.tag}`, inline: true },
                { name: '📝 Razón', value: razon, inline: true },
                { name: '🔢 Total warns', value: `${warns.length}`, inline: true },
                { name: '👮 Moderador', value: interaction.user.tag, inline: true },
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        try {
            await target.send(`⚠️ Has recibido una advertencia en **${interaction.guild.name}**: ${razon}`);
        } catch {}
    },
};
