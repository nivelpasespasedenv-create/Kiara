const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Juega Piedra, Papel o Tijera contra el bot')
        .addStringOption(opt =>
            opt.setName('eleccion')
                .setDescription('Tu elección')
                .setRequired(true)
                .addChoices(
                    { name: '🪨 Piedra', value: 'piedra' },
                    { name: '📄 Papel', value: 'papel' },
                    { name: '✂️ Tijera', value: 'tijera' },
                )),
    async execute(interaction) {
        const choices = ['piedra', 'papel', 'tijera'];
        const emojis = { piedra: '🪨', papel: '📄', tijera: '✂️' };
        const user = interaction.options.getString('eleccion');
        const bot = choices[Math.floor(Math.random() * 3)];

        let result = '';
        let color = '#95a5a6';
        if (user === bot) { result = '¡Empate! 🤝'; color = '#f1c40f'; }
        else if (
            (user === 'piedra' && bot === 'tijera') ||
            (user === 'papel' && bot === 'piedra') ||
            (user === 'tijera' && bot === 'papel')
        ) { result = '¡Ganaste! 🎉'; color = '#2ecc71'; }
        else { result = '¡Perdiste! 😢'; color = '#e74c3c'; }

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🎮 Piedra, Papel o Tijera')
            .addFields(
                { name: 'Tu elección', value: `${emojis[user]} ${user}`, inline: true },
                { name: 'Mi elección', value: `${emojis[bot]} ${bot}`, inline: true },
                { name: 'Resultado', value: result, inline: false },
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
