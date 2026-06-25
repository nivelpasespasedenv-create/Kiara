const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { translateText } = require('../utils/i18n');

const IDIOMAS = {
    es: 'Español', en: 'Inglés', fr: 'Francés', de: 'Alemán',
    it: 'Italiano', pt: 'Portugués', ja: 'Japonés', ko: 'Coreano',
    zh: 'Chino', ru: 'Ruso', ar: 'Árabe',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Traduce un texto a otro idioma')
        .addStringOption(opt =>
            opt.setName('texto')
                .setDescription('Texto a traducir')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('idioma')
                .setDescription('Idioma destino')
                .setRequired(true)
                .addChoices(
                    { name: '🇬🇧 Inglés', value: 'en' },
                    { name: '🇪🇸 Español', value: 'es' },
                    { name: '🇫🇷 Francés', value: 'fr' },
                    { name: '🇩🇪 Alemán', value: 'de' },
                    { name: '🇮🇹 Italiano', value: 'it' },
                    { name: '🇧🇷 Portugués', value: 'pt' },
                    { name: '🇯🇵 Japonés', value: 'ja' },
                    { name: '🇰🇷 Coreano', value: 'ko' },
                    { name: '🇨🇳 Chino', value: 'zh' },
                    { name: '🇷🇺 Ruso', value: 'ru' },
                    { name: '🇸🇦 Árabe', value: 'ar' },
                )),
    async execute(interaction) {
        await interaction.deferReply();
        const texto = interaction.options.getString('texto');
        const idioma = interaction.options.getString('idioma');
        try {
            const traduccion = await translateText(texto, idioma);
            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('🌐 Traducción')
                .addFields(
                    { name: '📝 Original', value: texto.length > 1000 ? texto.slice(0, 997) + '...' : texto },
                    { name: `🔤 ${IDIOMAS[idioma] || idioma}`, value: traduccion.length > 1000 ? traduccion.slice(0, 997) + '...' : traduccion },
                )
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ No pude traducir el texto.');
        }
    },
};
