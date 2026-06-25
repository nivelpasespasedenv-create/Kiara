const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cat')
        .setDescription('Muestra una imagen aleatoria de un gato 🐱'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const res = await fetch('https://api.thecatapi.com/v1/images/search');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle('🐱 ¡Gato aleatorio!')
                .setImage(data[0].url)
                .setFooter({ text: 'thecatapi.com' })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ No pude obtener una imagen de gato.');
        }
    },
};
