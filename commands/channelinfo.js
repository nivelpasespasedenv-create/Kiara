const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

const TIPOS = {
    [ChannelType.GuildText]: '💬 Texto',
    [ChannelType.GuildVoice]: '🔊 Voz',
    [ChannelType.GuildCategory]: '📁 Categoría',
    [ChannelType.GuildAnnouncement]: '📢 Anuncios',
    [ChannelType.GuildStageVoice]: '🎙️ Escenario',
    [ChannelType.GuildForum]: '💬 Foro',
    [ChannelType.GuildThread]: '🧵 Hilo',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channelinfo')
        .setDescription('Muestra información de un canal')
        .addChannelOption(opt =>
            opt.setName('canal').setDescription('Canal a consultar (por defecto el actual)').setRequired(false)),
    async execute(interaction) {
        const canal = interaction.options.getChannel('canal') || interaction.channel;
        const tipo = TIPOS[canal.type] || 'Desconocido';
        const embed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle(`📋 Canal: #${canal.name}`)
            .addFields(
                { name: '🆔 ID', value: canal.id, inline: true },
                { name: '📌 Tipo', value: tipo, inline: true },
                { name: '🗂️ Categoría', value: canal.parent?.name || 'Sin categoría', inline: true },
                { name: '📅 Creado', value: `<t:${Math.floor(canal.createdTimestamp / 1000)}:R>`, inline: true },
            );
        if (canal.topic) embed.addFields({ name: '📝 Tema', value: canal.topic });
        if (canal.rateLimitPerUser) embed.addFields({ name: '🐌 Slowmode', value: `${canal.rateLimitPerUser}s`, inline: true });
        embed.setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
