const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const DATOS = [
    'Los pulpos tienen tres corazones y sangre azul.',
    'La miel nunca se echa a perder. Se encontró miel comestible en tumbas egipcias de 3000 años.',
    'Un grupo de flamencos se llama "flamboyance".',
    'Los delfines duermen con un ojo abierto.',
    'La Gran Muralla China no se puede ver desde el espacio a simple vista.',
    'Los canguros no pueden caminar hacia atrás.',
    'El corazón de un camarón está en su cabeza.',
    'Las hormigas pueden levantar hasta 50 veces su propio peso.',
    'Un caracol puede dormir hasta 3 años.',
    'El ADN humano es 60% idéntico al de un plátano.',
    'Los pingüinos se proponen matrimonio con una piedra especial.',
    'El cerebro humano genera suficiente electricidad para encender una bombilla.',
    'Las vacas producen más leche cuando escuchan música suave.',
    'Los tiburones tienen existido más tiempo que los árboles en la Tierra.',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fact')
        .setDescription('Muestra un dato curioso aleatorio'),
    async execute(interaction) {
        const dato = DATOS[Math.floor(Math.random() * DATOS.length)];
        const embed = new EmbedBuilder()
            .setColor('#1abc9c')
            .setTitle('🧠 Dato Curioso')
            .setDescription(dato)
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
