const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOpenAI } = require('../utils/openai');
const axios = require('axios');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('recanime')
        .setDescription('🎌 Sasha te recomienda animes según lo que describes')
        .addStringOption(option =>
            option.setName('descripcion')
                .setDescription('¿Qué tipo de anime buscas? Ej: "algo de acción épica" o "romántico para llorar"')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const descripcion = interaction.options.getString('descripcion');

        try {
            // Paso 1: Pedir a la IA que elija 3 animes que encajen con la descripción
            const aiPick = await getOpenAI().chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `Eres Sasha, una experta en anime con personalidad divertida y cálida. 
El usuario te describe qué tipo de anime quiere ver. Tú debes elegir exactamente 3 animes que encajen PERFECTAMENTE con su descripción.
Responde SOLO con JSON en este formato exacto:
{
  "animes": [
    { "titulo": "Nombre exacto del anime en inglés o japonés", "razon": "Por qué este anime encaja con lo que pidió (1 oración en español con emoji)" },
    { "titulo": "...", "razon": "..." },
    { "titulo": "...", "razon": "..." }
  ],
  "mensaje": "Mensaje personal de Sasha al usuario explicando por qué eligió estos animes (2-3 oraciones en español, con emojis, cálido y emocionado)"
}`
                    },
                    {
                        role: 'user',
                        content: `El usuario busca: "${descripcion}"`
                    }
                ],
                max_tokens: 500,
                response_format: { type: 'json_object' }
            });

            const picked = JSON.parse(aiPick.choices[0].message.content);
            const animeList = picked.animes || [];
            const mensajeSasha = picked.mensaje || '¡Aquí van mis recomendaciones! 🎌';

            if (!animeList.length) {
                return interaction.editReply('❌ No pude generar recomendaciones. Intenta describir mejor qué tipo de anime buscas.');
            }

            // Paso 2: Buscar cada anime en Jikan para obtener datos reales
            const animeDetails = [];
            for (const item of animeList) {
                try {
                    const res = await axios.get(`https://api.jikan.moe/v4/anime`, {
                        params: { q: item.titulo, limit: 1, sfw: true }
                    });
                    const data = res.data.data?.[0];
                    if (data) {
                        animeDetails.push({
                            title: data.title,
                            score: data.score ? `⭐ ${data.score}/10` : 'N/A',
                            episodes: data.episodes ? `${data.episodes} eps` : 'En emisión',
                            image: data.images?.jpg?.image_url,
                            url: data.url,
                            razon: item.razon
                        });
                    } else {
                        animeDetails.push({ title: item.titulo, score: 'N/A', episodes: 'N/A', image: null, url: null, razon: item.razon });
                    }
                    // Pequeña pausa para no saturar la API
                    await new Promise(r => setTimeout(r, 400));
                } catch {
                    animeDetails.push({ title: item.titulo, score: 'N/A', episodes: 'N/A', image: null, url: null, razon: item.razon });
                }
            }

            // Paso 3: Construir el embed de recomendaciones
            const embed = new EmbedBuilder()
                .setTitle('🎌 Recomendaciones de Sasha')
                .setDescription(`**Tu búsqueda:** "${descripcion}"\n\n${mensajeSasha}`)
                .setColor('#e74c3c')
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setFooter({ text: 'Recomendado por Sasha con IA · Datos de MyAnimeList', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            const medals = ['🥇', '🥈', '🥉'];
            animeDetails.forEach((anime, i) => {
                const name = anime.url ? `[${anime.title}](${anime.url})` : anime.title;
                embed.addFields({
                    name: `${medals[i]} ${anime.title}`,
                    value: `${anime.razon}\n📊 ${anime.score} · 🎞️ ${anime.episodes}`,
                    inline: false
                });
            });

            // Si el primer anime tiene imagen, usarla como miniatura del embed
            if (animeDetails[0]?.image) {
                embed.setImage(animeDetails[0].image);
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en /recanime:', error);
            await interaction.editReply('❌ Hubo un error al generar las recomendaciones. Intenta de nuevo.');
        }
    },
};
