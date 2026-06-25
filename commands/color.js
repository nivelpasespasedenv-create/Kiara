const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('color')
        .setDescription('Muestra información de un color en hexadecimal')
        .addStringOption(opt =>
            opt.setName('hex')
                .setDescription('Código de color hexadecimal (ej: #ff6b6b o ff6b6b)')
                .setRequired(true)),
    async execute(interaction) {
        let hex = interaction.options.getString('hex').replace('#', '').toUpperCase();
        if (!/^[0-9A-F]{6}$/.test(hex)) {
            return interaction.reply({ content: '❌ Formato inválido. Usa un color hexadecimal como `#ff6b6b`', flags: 64 });
        }
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const embed = new EmbedBuilder()
            .setColor(`#${hex}`)
            .setTitle(`🎨 Color #${hex}`)
            .setThumbnail(`https://singlecolorimage.com/get/${hex}/100x100`)
            .addFields(
                { name: 'HEX', value: `\`#${hex}\``, inline: true },
                { name: 'RGB', value: `\`rgb(${r}, ${g}, ${b})\``, inline: true },
                { name: 'Rojo', value: `${r}`, inline: true },
                { name: 'Verde', value: `${g}`, inline: true },
                { name: 'Azul', value: `${b}`, inline: true },
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
