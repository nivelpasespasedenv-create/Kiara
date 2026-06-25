const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Crea una encuesta con opciones')
        .addStringOption(option =>
            option.setName('pregunta')
                .setDescription('La pregunta de la encuesta')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('opcion1')
                .setDescription('Primera opción')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('opcion2')
                .setDescription('Segunda opción')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('opcion3')
                .setDescription('Tercera opción (opcional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('opcion4')
                .setDescription('Cuarta opción (opcional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('opcion5')
                .setDescription('Quinta opción (opcional)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            const lang = await getLanguage(interaction.guildId);
            const question = interaction.options.getString('pregunta');
            const options = [
                interaction.options.getString('opcion1'),
                interaction.options.getString('opcion2'),
                interaction.options.getString('opcion3'),
                interaction.options.getString('opcion4'),
                interaction.options.getString('opcion5')
            ].filter(option => option !== null);

            const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
            const description = options.map((option, index) => `${emojis[index]} ${option}`).join('\n');

            const embed = new EmbedBuilder()
                .setColor('#ffdd44')
                .setTitle(t('POLL_TITLE', lang))
                .setDescription(`**${question}**\n\n${description}`)
                .setFooter({ text: t('POLL_FOOTER', lang, { user: interaction.user.username }) })
                .setTimestamp();

            const message = await interaction.reply({ embeds: [embed], fetchReply: true });

            for (let i = 0; i < options.length; i++) {
                await message.react(emojis[i]);
            }

        } catch (error) {
            console.error('Error en comando poll:', error);
            const lang = await getLanguage(interaction.guildId);
            await interaction.reply({ content: t('IA_ERROR', lang), ephemeral: true });
        }
    },
};