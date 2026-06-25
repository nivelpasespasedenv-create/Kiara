const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Desbloquea un canal para que todos puedan escribir')
        .addChannelOption(opt =>
            opt.setName('canal').setDescription('Canal a desbloquear (por defecto el actual)').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: '❌ No tienes permisos para gestionar canales.', flags: 64 });
        }
        const canal = interaction.options.getChannel('canal') || interaction.channel;
        await canal.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('🔓 Canal Desbloqueado')
            .setDescription(`El canal ${canal} ha sido desbloqueado.`)
            .setTimestamp();
        await canal.send({ embeds: [embed] });
        if (canal.id !== interaction.channel.id) {
            await interaction.reply({ content: `✅ Canal ${canal} desbloqueado.`, flags: 64 });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
};
