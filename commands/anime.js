const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchAnimeGif, fetchAnimeImage } = require('../utils/api');
const { createErrorEmbed } = require('../utils/embeds');
const { tAsync } = require('../utils/i18n');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anime')
        .setDescription('Obtén imágenes o GIFs de anime')
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Tipo de contenido anime')
                .setRequired(true)
                .addChoices(
                    { name: '🖼️ Imagen Waifu', value: 'waifu' },
                    { name: '😊 Sonrisa', value: 'smile' },
                    { name: '👋 Saludo', value: 'wave' },
                    { name: '😴 Dormir', value: 'sleepy' },
                    { name: '🎉 Celebrar', value: 'happy' },
                    { name: '😢 Llorar', value: 'cry' },
                    { name: '🤔 Pensar', value: 'think' },
                    { name: '😋 Comer', value: 'nom' }
                ))
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Menciona a un usuario (opcional)')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();
        const lang = interaction.lang || 'es';

        try {
            const tipo = interaction.options.getString('tipo');
            const author = interaction.user;

            const gifTypes = ['smile', 'wave', 'sleepy', 'happy', 'cry', 'think', 'nom'];
            const imageUrl = gifTypes.includes(tipo)
                ? await fetchAnimeGif(tipo)
                : await fetchAnimeImage(tipo);

            if (!imageUrl) {
                return await interaction.editReply({
                    embeds: [createErrorEmbed(await tAsync('IA_ERROR', lang))]
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(await tAsync('ANIME_TITLE', lang))
                .setDescription(`**${author.username}** ${tipo}...`)
                .setImage(imageUrl)
                .setColor(config.colors.anime)
                .setFooter({
                    text: await tAsync('ANIME_FOOTER', lang, { user: author.username }),
                    iconURL: author.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al obtener contenido de anime:', error);
            await interaction.editReply({
                embeds: [createErrorEmbed(await tAsync('IA_ERROR', lang))]
            });
        }
    },
};
