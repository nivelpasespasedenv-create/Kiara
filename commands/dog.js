const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dog')
        .setDescription('Muestra una imagen aleatoria de un perro 🐶'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const res = await fetch('https://dog.ceo/api/breeds/image/random');
            const data = await res.json();
            const embed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle('🐶 ¡Perro aleatorio!')
                .setImage(data.message)
                .setFooter({ text: 'dog.ceo API' })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ No pude obtener una imagen de perro.');
        }
    },
};
