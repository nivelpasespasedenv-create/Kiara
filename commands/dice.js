const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Lanza un dado')
        .addIntegerOption(opt =>
            opt.setName('caras')
                .setDescription('Número de caras del dado (por defecto 6)')
                .setMinValue(2)
                .setMaxValue(1000)
                .setRequired(false))
        .addIntegerOption(opt =>
            opt.setName('cantidad')
                .setDescription('Cuántos dados lanzar (máx 10)')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)),
    async execute(interaction) {
        const caras = interaction.options.getInteger('caras') || 6;
        const cantidad = interaction.options.getInteger('cantidad') || 1;
        const resultados = [];
        let total = 0;
        for (let i = 0; i < cantidad; i++) {
            const r = Math.floor(Math.random() * caras) + 1;
            resultados.push(r);
            total += r;
        }
        const embed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle(`🎲 Dado${cantidad > 1 ? 's' : ''} de ${caras} caras`)
            .setDescription(
                cantidad === 1
                    ? `Resultado: **${resultados[0]}**`
                    : `Resultados: **${resultados.join(' + ')}** = **${total}**`
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
