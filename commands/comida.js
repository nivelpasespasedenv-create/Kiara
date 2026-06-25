const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getOpenAI } = require('../utils/openai');


// ─── TheMealDB API (gratis, sin API key) ──────────────────────────────────────
async function fetchMeal(query) {
    try {
        const url = query
            ? `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
            : `https://www.themealdb.com/api/json/v1/1/random.php`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.meals || data.meals.length === 0) return null;
        return data.meals[Math.floor(Math.random() * data.meals.length)];
    } catch {
        return null;
    }
}

// ─── Corazones estilo Minecraft ───────────────────────────────────────────────
function renderHearts(filled, total = 10) {
    let bar = '';
    for (let i = 0; i < total; i++) {
        bar += i < filled ? '❤️' : '🖤';
    }
    return bar;
}

// ─── IA: descripción + corazones de saciedad ──────────────────────────────────
async function analyzeFood(foodName, username) {
    try {
        const res = await getOpenAI().chat.completions.create({
            model: 'gpt-4o',
            messages: [{
                role: 'user',
                content: `Eres Sasha, un bot kawaii y glotón. El usuario "${username}" busca "${foodName}".
Responde en este formato exacto (sin texto extra):
CORAZONES: [número del 1 al 10]
DESCRIPCION: [descripción apetitosa y divertida de 1-2 oraciones]
HAMBRE: [frase corta y graciosa sobre cuánta hambre te da esta comida]`
            }],
            max_tokens: 120,
            temperature: 1.0,
        });

        const text = res.choices[0].message.content.trim();
        const heartsMatch = text.match(/CORAZONES:\s*(\d+)/);
        const descMatch = text.match(/DESCRIPCION:\s*(.+)/);
        const hambreMatch = text.match(/HAMBRE:\s*(.+)/);

        return {
            corazones: Math.min(10, Math.max(1, parseInt(heartsMatch?.[1]) || 7)),
            descripcion: descMatch?.[1]?.trim() || '¡Una delicia increíble!',
            hambre: hambreMatch?.[1]?.trim() || '¡Me muero de hambre!',
        };
    } catch {
        return {
            corazones: Math.floor(Math.random() * 5) + 5,
            descripcion: '¡Una delicia que no puedes perderte!',
            hambre: '¡Mi estómago ya está gritando! 🍽️',
        };
    }
}

async function generateEatReaction(foodName, username) {
    try {
        const res = await getOpenAI().chat.completions.create({
            model: 'gpt-4o',
            messages: [{
                role: 'user',
                content: `Eres Sasha, un bot kawaii y dramático. "${username}" acaba de comer "${foodName}". Genera una reacción exagerada, graciosa y apetitosa de 1-2 oraciones sobre cómo sabe. Varía: a veces deliciosa, a veces sorprendente.`
            }],
            max_tokens: 80,
            temperature: 1.1,
        });
        return res.choices[0].message.content.trim();
    } catch {
        return `¡${username} se lo comió todo de un bocado! ¡Estaba delicioso! 😋`;
    }
}

// ─── Comando ──────────────────────────────────────────────────────────────────
module.exports = {
    data: new SlashCommandBuilder()
        .setName('comida')
        .setDescription('Busca una comida con foto, descripción de IA y corazones de saciedad 🍽️')
        .addStringOption(opt =>
            opt.setName('buscar')
                .setDescription('Nombre de la comida que quieres buscar (opcional)')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const query = interaction.options.getString('buscar') || null;
        const username = interaction.user.username;

        const meal = await fetchMeal(query);

        if (!meal) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('😢 No encontré esa comida')
                        .setDescription(`No encontré **${query}** en mi recetario. Intenta con otro nombre o deja el campo vacío para una sorpresa. 🍽️`)
                        .setColor('#ff6b6b')
                ]
            });
        }

        const [analysis] = await Promise.all([
            analyzeFood(meal.strMeal, username)
        ]);

        let currentHearts = analysis.corazones;

        const buildEmbed = (hearts, footerText) => new EmbedBuilder()
            .setTitle(`🍽️ ${meal.strMeal}`)
            .setDescription(`${analysis.descripcion}\n\n*"${analysis.hambre}"*`)
            .setImage(meal.strMealThumb)
            .setColor('#ff6b35')
            .addFields(
                {
                    name: '❤️ Saciedad',
                    value: `${renderHearts(hearts, 10)}\n**${hearts}/10 corazones**`,
                    inline: false
                },
                {
                    name: '🌍 Origen',
                    value: meal.strArea || 'Desconocido',
                    inline: true
                },
                {
                    name: '🏷️ Categoría',
                    value: meal.strCategory || 'Variada',
                    inline: true
                }
            )
            .setFooter({ text: footerText, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        const buildButtons = (eaten) => new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('food_eat')
                .setLabel('🍽️ ¡Comer!')
                .setStyle(ButtonStyle.Success)
                .setDisabled(eaten),
            new ButtonBuilder()
                .setCustomId('food_new')
                .setLabel('🔄 Otra sugerencia')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('food_stop')
                .setLabel('✅ Listo')
                .setStyle(ButtonStyle.Secondary)
        );

        const reply = await interaction.editReply({
            embeds: [buildEmbed(currentHearts, `Pedido por ${username}`)],
            components: [buildButtons(false)]
        });

        // ─── Collector de botones ──────────────────────────────────────────────
        const collector = reply.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 90_000
        });

        let eaten = false;
        let currentMeal = meal;
        let currentAnalysis = analysis;

        collector.on('collect', async i => {
            await i.deferUpdate();

            if (i.customId === 'food_eat' && !eaten) {
                eaten = true;
                const reaction = await generateEatReaction(currentMeal.strMeal, username);
                const fullHearts = Math.min(10, currentAnalysis.corazones + 2);

                await interaction.editReply({
                    embeds: [
                        buildEmbed(fullHearts, `¡${username} se lo comió todo!`)
                            .setDescription(`${reaction}\n\n*"${currentAnalysis.hambre}"*`)
                    ],
                    components: [buildButtons(true)]
                });

            } else if (i.customId === 'food_new') {
                eaten = false;
                const newMeal = await fetchMeal(null);
                if (!newMeal) return;

                currentMeal = newMeal;
                currentAnalysis = await analyzeFood(newMeal.strMeal, username);
                currentHearts = currentAnalysis.corazones;

                await interaction.editReply({
                    embeds: [buildEmbed(currentHearts, `Nueva sugerencia para ${username}`)],
                    components: [buildButtons(false)]
                });

            } else if (i.customId === 'food_stop') {
                collector.stop('done');
            }
        });

        collector.on('end', async (_, reason) => {
            try {
                await interaction.editReply({ components: [] });
            } catch { }
        });
    },
};
