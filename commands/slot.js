const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const SIMBOLOS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slot')
        .setDescription('Juega a la tragamonedas'),
    async execute(interaction) {
        const spin = () => SIMBOLOS[Math.floor(Math.random() * SIMBOLOS.length)];
        const r1 = spin(), r2 = spin(), r3 = spin();
        const jackpot = r1 === r2 && r2 === r3;
        const dos = r1 === r2 || r2 === r3 || r1 === r3;
        let resultado = '❌ Sin suerte esta vez...';
        let color = '#e74c3c';
        if (jackpot) { resultado = '🎰 ¡¡JACKPOT!! ¡GANASTE TODO!'; color = '#f1c40f'; }
        else if (dos) { resultado = '🥈 ¡Dos iguales! ¡Cerca!'; color = '#95a5a6'; }
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🎰 Tragamonedas')
            .setDescription(`**[ ${r1} | ${r2} | ${r3} ]**\n\n${resultado}`)
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
