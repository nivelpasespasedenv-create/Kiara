const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('choose')
        .setDescription('Elige entre varias opciones separadas por comas')
        .addStringOption(opt =>
            opt.setName('opciones')
                .setDescription('Opciones separadas por comas. Ej: pizza, sushi, tacos')
                .setRequired(true)),
    async execute(interaction) {
        const input = interaction.options.getString('opciones');
        const opciones = input.split(',').map(o => o.trim()).filter(Boolean);
        if (opciones.length < 2) {
            return interaction.reply({ content: '❌ Necesitas al menos 2 opciones separadas por comas.', flags: 64 });
        }
        const elegida = opciones[Math.floor(Math.random() * opciones.length)];
        const embed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle('🎯 Decisión Tomada')
            .setDescription(`Entre: *${opciones.join(', ')}*\n\nElegí: **${elegida}** ✅`)
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
