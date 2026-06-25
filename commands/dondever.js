const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOpenAI } = require('../utils/openai');
const axios = require('axios');


const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

// Códigos de región por país
const regionCodes = {
    'España': 'ES',
    'México': 'MX',
    'Argentina': 'AR',
    'Colombia': 'CO',
    'Estados Unidos': 'US',
    'Chile': 'CL',
    'Perú': 'PE',
};

// Nombres bonitos para proveedores TMDB
const providerNames = {
    8: { name: 'Netflix', emoji: '🔴' },
    119: { name: 'Amazon Prime Video', emoji: '🔵' },
    337: { name: 'Disney+', emoji: '🏰' },
    384: { name: 'Max (HBO)', emoji: '🟣' },
    350: { name: 'Apple TV+', emoji: '🍎' },
    15: { name: 'Hulu', emoji: '🟢' },
    531: { name: 'Paramount+', emoji: '⭐' },
    283: { name: 'Crunchyroll', emoji: '🟠' },
    188: { name: 'YouTube Premium', emoji: '▶️' },
    149: { name: 'Movistar+', emoji: '🔷' },
    63: { name: 'Filmin', emoji: '🎞️' },
    39: { name: 'Claro Video', emoji: '🟡' },
    167: { name: 'Blim TV', emoji: '🔶' },
};

function getProviderInfo(id, name) {
    const known = providerNames[id];
    if (known) return `${known.emoji} ${known.name}`;
    return `📺 ${name}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dondever')
        .setDescription('🔍 Busca en tiempo real dónde ver una serie, peli o documental')
        .addStringOption(option =>
            option.setName('titulo')
                .setDescription('Nombre de la serie, película o documental')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('pais')
                .setDescription('Tu país (para disponibilidad regional)')
                .setRequired(false)
                .addChoices(
                    { name: '🇪🇸 España', value: 'España' },
                    { name: '🇲🇽 México', value: 'México' },
                    { name: '🇦🇷 Argentina', value: 'Argentina' },
                    { name: '🇨🇴 Colombia', value: 'Colombia' },
                    { name: '🇺🇸 Estados Unidos', value: 'Estados Unidos' },
                    { name: '🇨🇱 Chile', value: 'Chile' },
                    { name: '🇵🇪 Perú', value: 'Perú' },
                ))
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('¿Qué tipo de contenido es?')
                .setRequired(false)
                .addChoices(
                    { name: '🎬 Película', value: 'movie' },
                    { name: '📺 Serie / Documental', value: 'tv' },
                )),

    async execute(interaction) {
        await interaction.deferReply();

        const titulo = interaction.options.getString('titulo');
        const pais = interaction.options.getString('pais') || 'México';
        const tipoFiltro = interaction.options.getString('tipo') || null;
        const regionCode = regionCodes[pais] || 'MX';

        try {
            // Buscar en TMDB (películas y series)
            const searchTypes = tipoFiltro ? [tipoFiltro] : ['movie', 'tv'];
            let resultado = null;
            let tipoEncontrado = null;

            for (const tipo of searchTypes) {
                const searchRes = await axios.get(`${TMDB_BASE}/search/${tipo}`, {
                    params: { query: titulo, language: 'es-MX', page: 1 },
                    headers: { Authorization: `Bearer ${TMDB_KEY}` }
                });
                if (searchRes.data.results?.length > 0) {
                    resultado = searchRes.data.results[0];
                    tipoEncontrado = tipo;
                    break;
                }
            }

            if (!resultado) {
                return interaction.editReply(`❌ No encontré ningún resultado para **"${titulo}"**. Verifica el nombre e inténtalo de nuevo.`);
            }

            const id = resultado.id;
            const nombreTitulo = resultado.title || resultado.name || titulo;
            const poster = resultado.poster_path ? `https://image.tmdb.org/t/p/w500${resultado.poster_path}` : null;
            const overview = resultado.overview || 'Sin descripción disponible.';
            const score = resultado.vote_average ? `⭐ ${resultado.vote_average.toFixed(1)}/10` : 'N/A';
            const fecha = resultado.release_date || resultado.first_air_date || 'Desconocido';
            const tipoLabel = tipoEncontrado === 'movie' ? '🎬 Película' : '📺 Serie/Documental';

            // Obtener proveedores de streaming en tiempo real
            const watchRes = await axios.get(`${TMDB_BASE}/${tipoEncontrado}/${id}/watch/providers`, {
                headers: { Authorization: `Bearer ${TMDB_KEY}` }
            });

            const providersByRegion = watchRes.data.results || {};
            const regionData = providersByRegion[regionCode] || null;

            // Construir embed
            const embed = new EmbedBuilder()
                .setTitle(`🔍 ${nombreTitulo}`)
                .setColor('#2ecc71')
                .setDescription(`${tipoLabel} · 📅 ${fecha} · ${score}\n\n${overview.length > 300 ? overview.slice(0, 300) + '...' : overview}`)
                .setFooter({ text: `📡 Datos en tiempo real de TMDB · Región: ${pais}`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            if (poster) embed.setThumbnail(poster);

            if (!regionData) {
                embed.addFields({ name: `❌ Sin datos para ${pais}`, value: 'No hay información de streaming disponible para tu región en este momento. Prueba con otro país.', inline: false });
            } else {
                // Streaming (incluido en suscripción)
                if (regionData.flatrate?.length) {
                    const list = regionData.flatrate.map(p => getProviderInfo(p.provider_id, p.provider_name)).join('\n');
                    embed.addFields({ name: '✅ Disponible en streaming', value: list, inline: true });
                }

                // Alquiler
                if (regionData.rent?.length) {
                    const list = regionData.rent.map(p => getProviderInfo(p.provider_id, p.provider_name)).join('\n');
                    embed.addFields({ name: '🔄 Disponible para alquilar', value: list, inline: true });
                }

                // Compra
                if (regionData.buy?.length) {
                    const list = regionData.buy.map(p => getProviderInfo(p.provider_id, p.provider_name)).join('\n');
                    embed.addFields({ name: '🛒 Disponible para comprar', value: list, inline: true });
                }

                if (!regionData.flatrate && !regionData.rent && !regionData.buy) {
                    embed.addFields({ name: `❌ No disponible en ${pais}`, value: 'Este título no está disponible en ninguna plataforma de streaming en tu región actualmente.', inline: false });
                }

                // Link de JustWatch si TMDB lo proporciona
                if (regionData.link) {
                    embed.addFields({ name: '🔗 Ver todas las opciones', value: `[Ver en JustWatch](${regionData.link})`, inline: false });
                }
            }

            // Opinión de Sasha con IA
            try {
                const aiRes = await getOpenAI().chat.completions.create({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: 'Eres Sasha, experta en series y cine. Da un comentario MUY corto (1 oración máx) en español sobre este título, con un emoji. Solo el comentario, nada más.' },
                        { role: 'user', content: `"${nombreTitulo}" - ${overview.slice(0, 150)}` }
                    ],
                    max_tokens: 80
                });
                embed.addFields({ name: '💬 Sasha dice', value: aiRes.choices[0].message.content, inline: false });
            } catch (_) {}

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en /dondever:', error);
            await interaction.editReply('❌ Hubo un error al buscar la información. Verifica el título e inténtalo de nuevo.');
        }
    },
};
