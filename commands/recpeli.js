const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOpenAI } = require('../utils/openai');


const platformEmojis = {
    'Netflix': '🔴',
    'Amazon Prime': '🔵',
    'Amazon Prime Video': '🔵',
    'Disney+': '🏰',
    'HBO Max': '🟣',
    'Max': '🟣',
    'Apple TV+': '🍎',
    'Hulu': '🟢',
    'Paramount+': '⭐',
    'Crunchyroll': '🟠',
    'YouTube Premium': '▶️',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recpeli')
        .setDescription('🎬 Sasha te recomienda películas o series de streaming según lo que describes')
        .addStringOption(option =>
            option.setName('descripcion')
                .setDescription('¿Qué quieres ver? Ej: "terror psicológico", "comedia romántica para reír"')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('¿Película o serie?')
                .setRequired(false)
                .addChoices(
                    { name: '🎬 Película', value: 'película' },
                    { name: '📺 Serie', value: 'serie' },
                    { name: '🎬📺 Ambas', value: 'ambas' }
                )),

    async execute(interaction) {
        await interaction.deferReply();

        const descripcion = interaction.options.getString('descripcion');
        const tipo = interaction.options.getString('tipo') || 'ambas';

        try {
            const aiResponse = await getOpenAI().chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `Eres Sasha, una experta en cine y series con mucha personalidad y entusiasmo. 
El usuario te describe qué tipo de contenido quiere ver. Tú debes elegir exactamente 3 ${tipo === 'película' ? 'películas' : tipo === 'serie' ? 'series' : 'películas o series'} disponibles en plataformas de streaming (Netflix, Amazon Prime Video, Disney+, Max/HBO, Apple TV+, etc.) que encajen PERFECTAMENTE.

Responde SOLO con JSON en este formato exacto:
{
  "contenido": [
    {
      "titulo": "Título en español o título original",
      "tipo": "Película o Serie",
      "año": "2023",
      "genero": "Terror, Suspenso",
      "plataforma": "Netflix",
      "duracion": "1h 45min (si es película) o 3 temporadas (si es serie)",
      "puntuacion": "8.2/10",
      "sinopsis": "Sinopsis breve en español (máx 200 caracteres, sin spoilers)",
      "razon": "Por qué este contenido encaja perfectamente con lo que pidió (1 oración en español con emoji)"
    }
  ],
  "mensaje": "Mensaje personal de Sasha al usuario (2-3 oraciones en español, con emojis, cálida y emocionada)"
}`
                    },
                    {
                        role: 'user',
                        content: `El usuario busca: "${descripcion}"`
                    }
                ],
                max_tokens: 800,
                response_format: { type: 'json_object' }
            });

            const data = JSON.parse(aiResponse.choices[0].message.content);
            const contenido = data.contenido || [];
            const mensajeSasha = data.mensaje || '¡Aquí van mis recomendaciones! 🎬';

            if (!contenido.length) {
                return interaction.editReply('❌ No pude generar recomendaciones. Intenta describir mejor qué quieres ver.');
            }

            const medals = ['🥇', '🥈', '🥉'];
            const colors = { 'película': '#e50914', 'serie': '#0073e6', 'ambas': '#9b59b6' };

            const embed = new EmbedBuilder()
                .setTitle('🎬 Recomendaciones de Sasha')
                .setDescription(`**Buscas:** "${descripcion}"\n\n${mensajeSasha}`)
                .setColor(colors[tipo] || '#9b59b6')
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setFooter({ text: 'Recomendado por Sasha con IA', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            contenido.forEach((item, i) => {
                const platformKey = Object.keys(platformEmojis).find(k => item.plataforma?.includes(k));
                const platformEmoji = platformKey ? platformEmojis[platformKey] : '📺';
                const tipoEmoji = item.tipo === 'Película' ? '🎬' : '📺';

                embed.addFields({
                    name: `${medals[i]} ${item.titulo} (${item.año})`,
                    value: [
                        `${item.razon}`,
                        `${tipoEmoji} **${item.tipo}** · ${platformEmoji} **${item.plataforma}**`,
                        `🎭 ${item.genero} · ⏱️ ${item.duracion} · ⭐ ${item.puntuacion}`,
                        `📖 ${item.sinopsis}`
                    ].join('\n'),
                    inline: false
                });
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en /recpeli:', error);
            await interaction.editReply('❌ Hubo un error al generar las recomendaciones. Intenta de nuevo.');
        }
    },
};
