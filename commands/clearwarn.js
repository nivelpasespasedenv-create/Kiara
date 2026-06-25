const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { clearWarns } = require('../utils/warnStorage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarn')
        .setDescription('Borra todas las advertencias de un usuario')
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Usuario al que borrar warns').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: '❌ Necesitas "Gestionar Servidor" para usar esto.', flags: 64 });
        }
        const target = interaction.options.getUser('usuario');
        clearWarns(interaction.guild.id, target.id);
        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('✅ Advertencias Borradas')
            .setDescription(`Se borraron todas las advertencias de **${target.username}**.`)
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
