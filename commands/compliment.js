const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const CUMPLIDOS = [
    'Eres increíblemente talentoso/a 🌟',
    'Tu presencia ilumina el servidor ✨',
    'Eres una persona muy especial 💖',
    'Tienes una sonrisa que contagia alegría 😊',
    'El mundo es mejor con personas como tú 🌍',
    'Eres más fuerte de lo que crees 💪',
    'Tu creatividad no tiene límites 🎨',
    'Tienes un corazón de oro 💛',
    'Eres una inspiración para todos 🌠',
    'Cada día que hablas con alguien, les alegras el día ☀️',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('compliment')
        .setDescription('Envía un cumplido a alguien')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Usuario a cumplimentar')
                .setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getUser('usuario') || interaction.user;
        const cumplido = CUMPLIDOS[Math.floor(Math.random() * CUMPLIDOS.length)];
        const embed = new EmbedBuilder()
            .setColor('#ff69b4')
            .setTitle('💝 Cumplido')
            .setDescription(`**${interaction.user.username}** dice a **${target.username}**:\n\n${cumplido}`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
