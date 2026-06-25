const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOpenAI } = require('../utils/openai');
const axios = require('axios');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('buscanime')
        .setDescription('🎌 Busca información de un anime con IA')
        .addStringOption(option =>
            option.setName('nombre')
                .setDescription('Nombre del anime que quieres buscar')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const query = interaction.options.getString('nombre');

        try {
            // Buscar anime en la API de Jikan (MyAnimeList)
            const response = await axios.get(`https://api.jikan.moe/v4/anime`, {
                params: { q: query, limit: 1, sfw: true }
            });

            const results = response.data.data;
            if (!results || results.length === 0) {
                return interaction.editReply(`❌ No encontré ningún anime con el nombre **${query}**. Intenta con otro título.`);
            }

            const anime = results[0];
            const title = anime.title || 'Sin título';
            const titleEn = anime.title_english || title;
            const synopsisRaw = anime.synopsis || 'Sin sinopsis disponible.';
            const score = anime.score ? `⭐ ${anime.score}/10` : 'Sin puntuación';
            const episodes = anime.episodes ? `${anime.episodes} eps` : 'En emisión';
            const image = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
            const url = anime.url || '';
            const year = anime.year || anime.aired?.prop?.from?.year || 'Desconocido';
            const studio = anime.studios?.[0]?.name || 'Desconocido';

            // Traducir valores al español
            const statusMap = { 'Finished Airing': 'Finalizado', 'Currently Airing': 'En emisión', 'Not yet aired': 'Próximamente' };
            const typeMap = { 'TV': 'Serie TV', 'Movie': 'Película', 'OVA': 'OVA', 'ONA': 'ONA', 'Special': 'Especial', 'Music': 'Música' };
            const genreMap = { 'Action': 'Acción', 'Adventure': 'Aventura', 'Comedy': 'Comedia', 'Drama': 'Drama', 'Fantasy': 'Fantasía', 'Horror': 'Terror', 'Mystery': 'Misterio', 'Romance': 'Romance', 'Sci-Fi': 'Ciencia Ficción', 'Slice of Life': 'Vida Cotidiana', 'Sports': 'Deportes', 'Supernatural': 'Sobrenatural', 'Thriller': 'Suspenso', 'Psychological': 'Psicológico', 'Mecha': 'Mecha', 'Music': 'Música', 'School': 'Escolar', 'Military': 'Militar', 'Historical': 'Histórico', 'Isekai': 'Isekai', 'Ecchi': 'Ecchi', 'Harem': 'Harem', 'Magic': 'Magia', 'Demons': 'Demonios', 'Vampire': 'Vampiros', 'Martial Arts': 'Artes Marciales', 'Super Power': 'Superpoderes', 'Space': 'Espacio', 'Game': 'Juegos', 'Shounen': 'Shōnen', 'Shoujo': 'Shōjo', 'Seinen': 'Seinen', 'Josei': 'Josei' };

            const status = statusMap[anime.status] || anime.status || 'Desconocido';
            const type = typeMap[anime.type] || anime.type || 'Desconocido';
            const genres = anime.genres?.map(g => genreMap[g.name] || g.name).join(', ') || 'Sin géneros';

            // Usar IA para traducir sinopsis al español y generar opinión
            let synopsis = synopsisRaw;
            let aiComment = '¡Parece un anime interesante! Échale un vistazo. 🎌';
            try {
                const aiResponse = await getOpenAI().chat.completions.create({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: 'Eres Sasha, experta en anime. Tienes dos tareas: 1) Traducir la sinopsis al español de forma natural (máx 350 caracteres). 2) Dar una opinión corta y emocionante (máx 2 oraciones) en español sobre si vale la pena verlo y para quién. Responde en formato JSON exacto: {"sinopsis": "...", "opinion": "..."}. Usa emojis en la opinión.'
                        },
                        {
                            role: 'user',
                            content: `Anime: ${title}\nGéneros: ${genres}\nSinopsis original: ${synopsisRaw.slice(0, 500)}\nPuntuación: ${score}`
                        }
                    ],
                    max_tokens: 400,
                    response_format: { type: 'json_object' }
                });

                const parsed = JSON.parse(aiResponse.choices[0].message.content);
                if (parsed.sinopsis) synopsis = parsed.sinopsis;
                if (parsed.opinion) aiComment = parsed.opinion;
            } catch (aiError) {
                console.error('Error con IA en buscanime:', aiError.message);
            }

            const embed = new EmbedBuilder()
                .setTitle(`🎌 ${title}`)
                .setURL(url)
                .setColor('#e74c3c')
                .addFields(
                    { name: '📺 Título en inglés', value: titleEn, inline: true },
                    { name: '🎬 Tipo', value: type, inline: true },
                    { name: '📅 Año', value: String(year), inline: true },
                    { name: '🎞️ Episodios', value: episodes, inline: true },
                    { name: '📊 Estado', value: status, inline: true },
                    { name: '⭐ Puntuación', value: score, inline: true },
                    { name: '🏢 Estudio', value: studio, inline: true },
                    { name: '🏷️ Géneros', value: genres, inline: false },
                    { name: '📖 Sinopsis', value: synopsis.length > 400 ? synopsis.slice(0, 400) + '...' : synopsis, inline: false },
                    { name: '🤖 Opinión de Sasha', value: aiComment, inline: false }
                )
                .setFooter({ text: 'Datos de MyAnimeList · Opinión generada por IA', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            if (image) embed.setImage(image);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en /buscanime:', error);
            await interaction.editReply('❌ Hubo un error al buscar el anime. Inténtalo de nuevo en un momento.');
        }
    },
};
