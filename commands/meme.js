const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchMeme } = require('../utils/api');
const { createErrorEmbed } = require('../utils/embeds');
const { tAsync } = require('../utils/i18n');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Obtén un meme divertido')
        .addStringOption(option =>
            option.setName('categoria')
                .setDescription('Categoría del meme')
                .setRequired(false)
                .addChoices(
                    { name: 'Aleatorio', value: 'random' },
                    { name: 'Programación', value: 'ProgrammerHumor' },
                    { name: 'Memes en español', value: 'SpanishMemes' },
                    { name: 'Dank Memes', value: 'dankmemes' }
                )),

    async execute(interaction) {
        try {
            await interaction.deferReply();
            const lang = interaction.lang || 'es';
            let categoria = interaction.options.getString('categoria');
            if (!categoria) categoria = lang === 'es' ? 'SpanishMemes' : 'random';

            const memeData = await fetchMeme(categoria);

            if (!memeData) {
                return await interaction.editReply({
                    embeds: [createErrorEmbed(await tAsync('MEME_ERROR', lang))]
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(await tAsync('MEME_TITLE', lang))
                .setDescription(memeData.title || 'Meme')
                .setImage(memeData.url)
                .setColor(config.colors.meme)
                .setFooter({
                    text: await tAsync('MEME_FOOTER', lang, { user: interaction.user.username, category: categoria }),
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            if (memeData.author) embed.addFields({ name: await interaction.tr('👤 Autor'), value: memeData.author, inline: true });
            if (memeData.ups) embed.addFields({ name: '👍 Upvotes', value: memeData.ups.toString(), inline: true });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('MEME ERROR:', error);
            try {
                await interaction.editReply({
                    embeds: [createErrorEmbed(await tAsync('MEME_ERROR', interaction.lang || 'es'))]
                });
            } catch (_) {}
        }
    },
};
