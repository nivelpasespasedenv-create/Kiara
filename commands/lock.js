const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Bloquea un canal para que nadie pueda escribir')
        .addChannelOption(opt =>
            opt.setName('canal').setDescription('Canal a bloquear (por defecto el actual)').setRequired(false))
        .addStringOption(opt =>
            opt.setName('razon').setDescription('Razón del bloqueo').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: '❌ No tienes permisos para gestionar canales.', flags: 64 });
        }
        const canal = interaction.options.getChannel('canal') || interaction.channel;
        const razon = interaction.options.getString('razon') || 'Sin razón especificada';
        await canal.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🔒 Canal Bloqueado')
            .setDescription(`El canal ${canal} ha sido bloqueado.\n**Razón:** ${razon}`)
            .setTimestamp();
        await canal.send({ embeds: [embed] });
        if (canal.id !== interaction.channel.id) {
            await interaction.reply({ content: `✅ Canal ${canal} bloqueado.`, flags: 64 });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
};
