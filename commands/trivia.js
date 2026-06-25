const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const PREGUNTAS = [
    { p: '¿Cuántos planetas tiene nuestro sistema solar?', r: '8', ops: ['6', '7', '8', '9'] },
    { p: '¿Cuál es el océano más grande del mundo?', r: 'Pacífico', ops: ['Atlántico', 'Pacífico', 'Índico', 'Ártico'] },
    { p: '¿En qué año llegó el hombre a la Luna?', r: '1969', ops: ['1965', '1967', '1969', '1972'] },
    { p: '¿Cuál es el elemento más abundante en el universo?', r: 'Hidrógeno', ops: ['Oxígeno', 'Helio', 'Hidrógeno', 'Carbono'] },
    { p: '¿Cuántos lados tiene un hexágono?', r: '6', ops: ['5', '6', '7', '8'] },
    { p: '¿Cuál es el país más grande del mundo?', r: 'Rusia', ops: ['China', 'Canadá', 'Estados Unidos', 'Rusia'] },
    { p: '¿Cuántos colores tiene el arcoíris?', r: '7', ops: ['5', '6', '7', '8'] },
    { p: '¿A qué temperatura hierve el agua (°C)?', r: '100', ops: ['90', '95', '100', '110'] },
    { p: '¿Cuántos huesos tiene el cuerpo humano adulto?', r: '206', ops: ['196', '206', '216', '226'] },
    { p: '¿Cuál es el idioma más hablado del mundo?', r: 'Mandarín', ops: ['Inglés', 'Español', 'Mandarín', 'Hindi'] },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Responde una pregunta de trivia'),
    async execute(interaction) {
        const q = PREGUNTAS[Math.floor(Math.random() * PREGUNTAS.length)];
        const shuffled = [...q.ops].sort(() => Math.random() - 0.5);
        const row = new ActionRowBuilder().addComponents(
            shuffled.map(op =>
                new ButtonBuilder()
                    .setCustomId(`trivia_${op}`)
                    .setLabel(op)
                    .setStyle(ButtonStyle.Primary)
            )
        );
        const embed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle('🧠 Trivia')
            .setDescription(`**${q.p}**`)
            .setFooter({ text: 'Tienes 15 segundos para responder' })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], components: [row] });
        const msg = await interaction.fetchReply();
        const collector = msg.createMessageComponentCollector({ time: 15000 });
        collector.on('collect', async btn => {
            if (btn.user.id !== interaction.user.id) {
                return btn.reply({ content: '❌ Esta trivia no es tuya.', flags: 64 });
            }
            const correct = btn.customId === `trivia_${q.r}`;
            const result = new EmbedBuilder()
                .setColor(correct ? '#2ecc71' : '#e74c3c')
                .setTitle(correct ? '✅ ¡Correcto!' : '❌ Incorrecto')
                .setDescription(`**${q.p}**\n\nRespuesta correcta: **${q.r}**`)
                .setTimestamp();
            await btn.update({ embeds: [result], components: [] });
            collector.stop();
        });
        collector.on('end', (_, reason) => {
            if (reason === 'time') {
                const timeout = new EmbedBuilder()
                    .setColor('#95a5a6')
                    .setTitle('⏰ Tiempo agotado')
                    .setDescription(`**${q.p}**\n\nRespuesta correcta: **${q.r}**`)
                    .setTimestamp();
                interaction.editReply({ embeds: [timeout], components: [] }).catch(() => {});
            }
        });
    },
};
