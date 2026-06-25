const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getWarns } = require('../utils/warnStorage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Ver advertencias de un usuario')
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Usuario a consultar').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: '❌ No tienes permisos de moderación.', flags: 64 });
        }
        const target = interaction.options.getUser('usuario');
        const warns = getWarns(interaction.guild.id, target.id);
        if (warns.length === 0) {
            return interaction.reply({ content: `✅ **${target.username}** no tiene advertencias.`, flags: 64 });
        }
        const list = warns.map((w, i) =>
            `**${i + 1}.** ${w.razon} — <t:${Math.floor(w.fecha / 1000)}:R>`
        ).join('\n');
        const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle(`⚠️ Advertencias de ${target.username}`)
            .setDescription(list)
            .setThumbnail(target.displayAvatarURL())
            .setFooter({ text: `Total: ${warns.length} advertencia(s)` })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
