const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojiinfo')
        .setDescription('Muestra información de un emoji personalizado')
        .addStringOption(opt =>
            opt.setName('nombre')
                .setDescription('Nombre del emoji (sin los dos puntos)')
                .setRequired(true)),
    async execute(interaction) {
        const nombre = interaction.options.getString('nombre').toLowerCase();
        const emoji = interaction.client.emojis.cache.find(e => e.name.toLowerCase() === nombre);
        if (!emoji) {
            return interaction.reply({ content: `❌ No encontré el emoji \`:${nombre}:\` en ningún servidor.`, flags: 64 });
        }
        const str = emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`;
        const embed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle(`${str} Emoji: ${emoji.name}`)
            .setThumbnail(emoji.imageURL({ size: 256 }))
            .addFields(
                { name: '🆔 ID', value: emoji.id, inline: true },
                { name: '✨ Animado', value: emoji.animated ? 'Sí' : 'No', inline: true },
                { name: '🏠 Servidor', value: emoji.guild?.name || 'Desconocido', inline: true },
                { name: '📅 Creado', value: `<t:${Math.floor(emoji.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '💬 Uso', value: `\`:${emoji.name}:\``, inline: true },
                { name: '🔗 URL', value: `[Ver imagen](${emoji.imageURL()})`, inline: true },
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
