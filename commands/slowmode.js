const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Establece el modo lento en un canal')
        .addIntegerOption(opt =>
            opt.setName('segundos')
                .setDescription('Segundos de espera entre mensajes (0 para desactivar, máx 21600)')
                .setMinValue(0)
                .setMaxValue(21600)
                .setRequired(true))
        .addChannelOption(opt =>
            opt.setName('canal')
                .setDescription('Canal (por defecto el actual)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: '❌ No tienes permisos para gestionar canales.', flags: 64 });
        }
        const canal = interaction.options.getChannel('canal') || interaction.channel;
        const segundos = interaction.options.getInteger('segundos');
        await canal.setRateLimitPerUser(segundos);
        const embed = new EmbedBuilder()
            .setColor(segundos === 0 ? '#2ecc71' : '#f39c12')
            .setTitle('🐌 Modo Lento')
            .setDescription(
                segundos === 0
                    ? `✅ Modo lento desactivado en ${canal}.`
                    : `⏱️ Modo lento de **${segundos} segundos** activado en ${canal}.`
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
