const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOpenAI } = require('../utils/openai');


const fallbacksCara = [
    '¡Cara! El universo está de tu lado hoy. 🌟',
    '¡Cara! Parece que la suerte te sonríe. 😏',
    '¡Cara! Hoy es tu día, aprovéchalo. ✨'
];
const fallbacksCruz = [
    '¡Cruz! El destino tiene otros planes para ti. 😅',
    '¡Cruz! No todo sale como uno quiere, ¡sigue intentando! 🍀',
    '¡Cruz! La moneda ha hablado... esta vez no. 😬'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Lanza una moneda (cara o cruz)'),

    async execute(interaction) {
        await interaction.deferReply();
        const result = Math.random() < 0.5 ? 'Cara' : 'Cruz';

        let comment;
        try {
            const aiResult = await getOpenAI().chat.completions.create({
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: `Alguien lanzó una moneda y salió "${result}". Haz un comentario corto, gracioso y original sobre el resultado (1 oración máximo). Varía el tono cada vez: a veces dramático, a veces sarcástico, a veces alentador.`
                }],
                max_tokens: 50,
                temperature: 1.2,
            });
            comment = `🪙 **${result}!** ${aiResult.choices[0].message.content.trim()}`;
        } catch {
            const fallbacks = result === 'Cara' ? fallbacksCara : fallbacksCruz;
            comment = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }

        const embed = new EmbedBuilder()
            .setTitle('🪙 Lanzamiento de Moneda')
            .setDescription(comment)
            .setColor(result === 'Cara' ? '#f1c40f' : '#95a5a6')
            .setFooter({ text: `Resultado: ${result}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
