const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Muestra cuánto tiempo lleva activo el bot'),
    async execute(interaction) {
        const ms = interaction.client.uptime;
        const s = Math.floor(ms / 1000) % 60;
        const m = Math.floor(ms / 60000) % 60;
        const h = Math.floor(ms / 3600000) % 24;
        const d = Math.floor(ms / 86400000);
        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        parts.push(`${s}s`);
        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('⏱️ Tiempo Activo')
            .setDescription(`El bot lleva en línea: **${parts.join(' ')}**`)
            .addFields(
                { name: '📡 Ping', value: `${interaction.client.ws.ping}ms`, inline: true },
                { name: '🖥️ Servidores', value: `${interaction.client.guilds.cache.size}`, inline: true },
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
