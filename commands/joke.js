const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const CHISTES = [
    '¿Por qué los programadores confunden Halloween con Navidad? Porque Oct 31 = Dec 25.',
    '¿Cómo se llama un perro sin patas? No importa cómo lo llames, no va a venir.',
    '¿Qué le dijo el mar al barco? Nada.',
    '¿Cómo se llama el campeón de buceo de Japón? Tokofondo.',
    '¿Por qué el libro de matemáticas se quejó? Porque tenía demasiados problemas.',
    '¿Qué hace una abeja en el gimnasio? ¡Zum-ba!',
    '¿Cómo se llama el cinturón de herramientas? Toolbelt Armstrong.',
    '¿Qué le dice un jardinero a otro? Que tengas un buen ramo.',
    '¿Por qué la escoba está feliz? Porque ya pasó lo peor.',
    '¿Cómo se llama un dinosaurio con un vocabulario extenso? El Thesaurus.',
    '¿Qué dijo el 0 al 8? ¡Bonito cinturón!',
    '¿Qué hace una vaca en terremoto? ¡Leche agitada!',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joke')
        .setDescription('Cuéntame un chiste'),
    async execute(interaction) {
        const chiste = CHISTES[Math.floor(Math.random() * CHISTES.length)];
        const embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle('😂 Chiste del día')
            .setDescription(chiste)
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
