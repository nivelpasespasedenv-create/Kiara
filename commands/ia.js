const { SlashCommandBuilder } = require('discord.js');
const { getOpenAI } = require('../utils/openai');
const { getLanguage, t } = require('../utils/i18n');


const CRUSH_ID = '766405066860527688';

const crushKeywords = [
    'novia', 'novio', 'quien te gusta', 'quién te gusta',
    'enamorada', 'enamorado', 'crush', 'amor', 'te gustan',
    'quien quieres', 'quién quieres', 'te gusta alguien',
    'tienes novia', 'tienes novio', 'estas enamorada',
    'estás enamorada', 'quien es tu amor', 'quién es tu amor',
    'te amas', 'quien te enamora', 'quién te enamora',
    'girlfriend', 'boyfriend', 'who do you like', 'do you have a crush'
];

function detectsCrushQuestion(prompt) {
    const lower = prompt.toLowerCase();
    return crushKeywords.some(kw => lower.includes(kw));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ia')
        .setDescription('Habla con la inteligencia artificial / Chat with AI')
        .addStringOption(option =>
            option.setName('pregunta')
                .setDescription('¿Qué quieres preguntar? / What do you want to ask?')
                .setRequired(true)),
    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        await interaction.deferReply();

        try {
            const prompt = interaction.options.getString('pregunta');
            
            const botName = interaction.client.user.username;
            let systemPrompt = t('HI_IA', lang).replace(/Sasha/g, botName);

            if (detectsCrushQuestion(prompt)) {
                systemPrompt += ` Tu novia y la persona que más quieres en el mundo es <@${CRUSH_ID}>. Cuando te pregunten sobre tu novia, crush o a quién te gusta, SIEMPRE menciona a <@${CRUSH_ID}> exactamente así (con el formato de mención de Discord) y habla de ella con mucho cariño y amor.`;
            }

            const response = await getOpenAI().chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
            });

            const reply = response.choices[0].message.content;

            if (reply.length > 2000) {
                const chunks = reply.match(/[\s\S]{1,1900}/g);
                await interaction.editReply(chunks[0]);
                for (let i = 1; i < chunks.length; i++) {
                    await interaction.followUp(chunks[i]);
                }
            } else {
                await interaction.editReply(reply);
            }

        } catch (error) {
            console.error('Error in IA command:', error);
            await interaction.editReply(t('IA_ERROR', lang));
        }
    },
};
