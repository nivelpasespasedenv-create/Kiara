const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOpenAI } = require('../utils/openai');
const { fetchAnimeGif } = require('../utils/api');
const { createErrorEmbed } = require('../utils/embeds');
const { tAsync } = require('../utils/i18n');
const config = require('../config');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('abrazo')
        .setDescription('Dale un abrazo virtual a alguien')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario al que quieres abrazar')
                .setRequired(true)),

    async execute(interaction) {
        try {
            await interaction.deferReply();
            const lang = interaction.lang || 'es';
            const targetUser = interaction.options.getUser('usuario');
            const author = interaction.user;

            if (targetUser.id === interaction.client.user.id) {
                const belongsEmbed = new EmbedBuilder()
                    .setTitle('💕 ¡Soy de alguien!')
                    .setDescription(`Aww 🥺 lo siento, pero yo le pertenezco a <@766405066860527688>. ¡No puedes abrazarme! 💋`)
                    .setColor('#ff69b4')
                    .setTimestamp();
                return await interaction.editReply({ embeds: [belongsEmbed] });
            }

            if (targetUser.id === author.id) {
                const selfHugEmbed = new EmbedBuilder()
                    .setTitle(await tAsync('HUG_TITLE', lang))
                    .setDescription(await tAsync('SELF_HUG', lang, { author: author.username }))
                    .setColor(config.colors.anime)
                    .setTimestamp();
                return await interaction.editReply({ embeds: [selfHugEmbed] });
            }

            if (targetUser.id === '766405066860527688') {
                const novaEmbed = new EmbedBuilder()
                    .setTitle('💖 ¡Eso no puedes hacerlo!')
                    .setDescription(`¡Oye! 😤 <@${targetUser.id}> es **mi novia**, así que no puedes interactuar con ella así. ¡Busca a alguien más! 💋`)
                    .setColor('#ff69b4')
                    .setTimestamp();
                return await interaction.editReply({ embeds: [novaEmbed] });
            }

            const [gifUrl, aiDesc] = await Promise.all([
                fetchAnimeGif('hug'),
                getOpenAI().chat.completions.create({
                    model: 'gpt-4o',
                    messages: [{
                        role: 'user',
                        content: `Genera una descripción creativa y tierna (1 oración) de cómo "${author.username}" le da un abrazo a "${targetUser.username}". Varía el estilo: a veces poético, a veces gracioso, a veces kawaii. Sin emojis al inicio.`
                    }],
                    max_tokens: 60,
                    temperature: 1.1,
                }).then(r => r.choices[0].message.content.trim()).catch(() => null)
            ]);

            if (!gifUrl) {
                return await interaction.editReply({
                    embeds: [createErrorEmbed(await tAsync('IA_ERROR', lang))]
                });
            }

            const defaultDesc = await tAsync('HUG_MSG', lang, { author: author.username, target: targetUser.username });
            const description = aiDesc || defaultDesc;

            const embed = new EmbedBuilder()
                .setTitle(await tAsync('HUG_TITLE', lang))
                .setDescription(description)
                .setImage(gifUrl)
                .setColor(config.colors.anime)
                .setFooter({
                    text: await tAsync('HUG_FOOTER', lang),
                    iconURL: author.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al enviar abrazo:', error);
            try {
                if (interaction.deferred) {
                    await interaction.editReply({ content: await tAsync('IA_ERROR', interaction.lang || 'es'), ephemeral: true });
                } else {
                    await interaction.reply({ content: await tAsync('IA_ERROR', interaction.lang || 'es'), ephemeral: true });
                }
            } catch (e) {
                console.error('Error al enviar mensaje de error:', e);
            }
        }
    },
};
