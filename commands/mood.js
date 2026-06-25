const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOpenAI } = require('../utils/openai');


const moodConfig = {
    energetic: { color: '#FF4500', title: '🔥 Energía Pura', palette: ['#FF4500', '#FFD700', '#FF8C00'] },
    relaxed:   { color: '#87CEEB', title: '🍃 Calma Total',  palette: ['#87CEEB', '#E0FFFF', '#B0E0E6'] },
    melancholy:{ color: '#483D8B', title: '🌌 Introspección Profunda', palette: ['#483D8B', '#191970', '#6A5ACD'] },
    creative:  { color: '#DA70D6', title: '✨ Chispa Creativa', palette: ['#DA70D6', '#FF00FF', '#BA55D3'] },
    happy:     { color: '#FFD700', title: '🌈 Felicidad Radiante', palette: ['#FFD700', '#FFFACD', '#FAFAD2'] }
};

const fallbackDesc = {
    energetic:  { desc: '¡Estás imparable! Tu vibra es vibrante y llena de fuerza.', advice: 'Aprovecha este impulso para terminar ese proyecto pendiente.' },
    relaxed:    { desc: 'Paz y tranquilidad. Estás en sintonía con el momento.', advice: 'Es un buen momento para meditar o leer un libro.' },
    melancholy: { desc: 'Un momento para conectar con tus pensamientos más profundos.', advice: 'Escucha tu música favorita y deja fluir tus emociones.' },
    creative:   { desc: 'Tu mente está llena de ideas brillantes y colores.', advice: '¡Dibuja, escribe o crea algo nuevo ahora mismo!' },
    happy:      { desc: '¡Tu alegría es contagiosa! El mundo brilla un poco más contigo.', advice: 'Comparte esa sonrisa con alguien que lo necesite.' }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mood')
        .setDescription('Genera una paleta de colores y un estado de ánimo basado en tu energía actual')
        .addStringOption(option =>
            option.setName('energia')
                .setDescription('¿Cómo te sientes hoy?')
                .setRequired(true)
                .addChoices(
                    { name: '🔥 Enérgico', value: 'energetic' },
                    { name: '🍃 Relajado', value: 'relaxed' },
                    { name: '🌌 Melancólico', value: 'melancholy' },
                    { name: '✨ Creativo', value: 'creative' },
                    { name: '🌈 Feliz', value: 'happy' }
                )),

    async execute(interaction) {
        await interaction.deferReply();
        const energy = interaction.options.getString('energia');
        const userName = interaction.user.username;
        const cfg = moodConfig[energy];
        const fb = fallbackDesc[energy];

        let desc = fb.desc;
        let advice = fb.advice;

        try {
            const aiResult = await getOpenAI().chat.completions.create({
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: `El usuario "${userName}" dice que se siente "${energy}" hoy. Escribe una descripción poética y personalizada de su energía (1-2 oraciones) y un consejo breve y creativo (1 oración). Responde en formato: DESCRIPCION|||CONSEJO`
                }],
                max_tokens: 100,
                temperature: 1.1,
            });
            const parts = aiResult.choices[0].message.content.trim().split('|||');
            if (parts.length === 2) {
                desc = parts[0].trim();
                advice = parts[1].trim();
            }
        } catch { }

        const embed = new EmbedBuilder()
            .setTitle(cfg.title)
            .setDescription(`${desc}\n\n**🎨 Tu paleta del día:**\n${cfg.palette.join(' • ')}`)
            .setColor(cfg.color)
            .addFields({ name: '💡 Consejo del día', value: advice })
            .setThumbnail(`https://singlecolorimage.com/get/${cfg.color.replace('#', '')}/400x400`)
            .setFooter({ text: `Ánimo de ${userName} ✦` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
