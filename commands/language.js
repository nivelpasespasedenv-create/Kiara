const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { setLanguage, translateText } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('language')
        .setDescription('Cambia el idioma del bot / Change the bot language')
        .addStringOption(option =>
            option.setName('idioma')
                .setDescription('Selecciona el idioma / Select the language')
                .setRequired(true)
                .addChoices(
                    { name: '🇪🇸 Español', value: 'es' },
                    { name: '🇺🇸 English', value: 'en' },
                    { name: '🇫🇷 Français', value: 'fr' },
                    { name: '🇧🇷 Português', value: 'pt' },
                    { name: '🇩🇪 Deutsch', value: 'de' },
                    { name: '🇮🇹 Italiano', value: 'it' },
                    { name: '🇯🇵 日本語', value: 'ja' },
                    { name: '🇰🇷 한국어', value: 'ko' },
                    { name: '🇨🇳 中文', value: 'zh-CN' },
                    { name: '🇷🇺 Русский', value: 'ru' },
                    { name: '🇸🇦 العربية', value: 'ar' },
                    { name: '🇳🇱 Nederlands', value: 'nl' },
                    { name: '🇵🇱 Polski', value: 'pl' },
                    { name: '🇹🇷 Türkçe', value: 'tr' },
                    { name: '🇻🇳 Tiếng Việt', value: 'vi' },
                    { name: '🇮🇳 हिन्दी', value: 'hi' },
                    { name: '🇹🇭 ภาษาไทย', value: 'th' },
                    { name: '🇸🇪 Svenska', value: 'sv' },
                    { name: '🇮🇩 Bahasa Indonesia', value: 'id' },
                    { name: '🇵🇭 Filipino', value: 'tl' },
                    { name: '🇬🇷 Ελληνικά', value: 'el' },
                    { name: '🇺🇦 Українська', value: 'uk' },
                    { name: '🇨🇿 Čeština', value: 'cs' },
                    { name: '🇷🇴 Română', value: 'ro' },
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: 'Necesitas permisos de Administrador para usar este comando / You need Administrator permissions to use this command.',
                flags: 64
            });
        }

        await interaction.deferReply({ flags: 64 });

        const lang = interaction.options.getString('idioma');

        const langNames = {
            es: 'Español 🇪🇸', en: 'English 🇺🇸', fr: 'Français 🇫🇷', pt: 'Português 🇧🇷',
            de: 'Deutsch 🇩🇪', it: 'Italiano 🇮🇹', ja: '日本語 🇯🇵', ko: '한국어 🇰🇷',
            'zh-CN': '中文 🇨🇳', ru: 'Русский 🇷🇺', ar: 'العربية 🇸🇦', nl: 'Nederlands 🇳🇱',
            pl: 'Polski 🇵🇱', tr: 'Türkçe 🇹🇷', vi: 'Tiếng Việt 🇻🇳', hi: 'हिन्दी 🇮🇳',
            th: 'ภาษาไทย 🇹🇭', sv: 'Svenska 🇸🇪', id: 'Bahasa Indonesia 🇮🇩', tl: 'Filipino 🇵🇭',
            el: 'Ελληνικά 🇬🇷', uk: 'Українська 🇺🇦', cs: 'Čeština 🇨🇿', ro: 'Română 🇷🇴',
        };

        const success = await setLanguage(interaction.guildId, lang);

        if (!success) {
            return await interaction.editReply('❌ Error al cambiar el idioma / Error changing language');
        }

        const langName = langNames[lang] || lang;

        // Mensaje de confirmación traducido automáticamente
        let confirmMsg = `✅ ¡Idioma del bot cambiado a **${langName}**! A partir de ahora responderé en ese idioma automáticamente gracias a Google Translate.`;
        if (lang !== 'es') {
            try {
                confirmMsg = await translateText(confirmMsg, lang);
            } catch (_) {}
        }

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle(lang !== 'es' ? await translateText('✅ Idioma cambiado', lang).catch(() => '✅ Idioma cambiado') : '✅ Idioma cambiado')
            .setDescription(confirmMsg)
            .setFooter({ text: 'Traducción automática por Google Translate', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.editReply({ embeds: [embed] });
    },
};
