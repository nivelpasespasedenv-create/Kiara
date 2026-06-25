const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOpenAI } = require('../utils/openai');


const fallbackResponses = [
    'Las estrellas no mienten... sí.',
    'Las sombras del destino dicen que no.',
    'El universo guarda silencio ante esa pregunta.',
    'Todo apunta a que sí, pero el destino es caprichoso.',
    'Mis visiones son confusas... intenta de nuevo.',
    'Sin duda alguna.',
    'No cuentes con ello.',
    'El tiempo lo dirá, mortal.'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Pregunta algo a la bola mágica de cristal')
        .addStringOption(option =>
            option.setName('pregunta')
                .setDescription('Tu pregunta para el destino')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const question = interaction.options.getString('pregunta');

        let oracleResponse;
        try {
            const aiResult = await getOpenAI().chat.completions.create({
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: `Eres una bola mágica de cristal mística y misteriosa. Responde a esta pregunta de forma enigmática, poética y breve (máximo 2 oraciones). A veces sé positiva, a veces negativa, a veces ambigua. Pregunta: "${question}"`
                }],
                max_tokens: 60,
                temperature: 1.2,
            });
            oracleResponse = aiResult.choices[0].message.content.trim();
        } catch {
            oracleResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        }

        const embed = new EmbedBuilder()
            .setTitle('🔮 La Bola Mágica')
            .setColor('#4B0082')
            .addFields(
                { name: '❓ Tu Pregunta', value: question },
                { name: '✨ El Oráculo Responde', value: oracleResponse }
            )
            .setThumbnail('https://i.imgur.com/vHqY7R7.png')
            .setFooter({ text: 'El destino está escrito ✦' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
