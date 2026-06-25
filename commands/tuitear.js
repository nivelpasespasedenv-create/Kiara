const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');

const APIS = [
    (texto, username, displayName, avatarUrl) =>
        `https://some-random-api.com/canvas/misc/tweet?avatar=${encodeURIComponent(avatarUrl)}&username=${encodeURIComponent(username)}&displayname=${encodeURIComponent(displayName)}&comment=${encodeURIComponent(texto)}`,
    (texto, username, displayName, avatarUrl) =>
        `https://api.dagpi.xyz/image/tweet/?text=${encodeURIComponent(texto)}&username=${encodeURIComponent(username)}&full_name=${encodeURIComponent(displayName)}&image_url=${encodeURIComponent(avatarUrl)}`,
];

async function tryApis(texto, username, displayName, avatarUrl) {
    for (const buildUrl of APIS) {
        try {
            const url = buildUrl(texto, username, displayName, avatarUrl);
            const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
            if (!res.ok) continue;
            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('image')) continue;
            const buffer = Buffer.from(await res.arrayBuffer());
            if (buffer.length < 1000) continue;
            return buffer;
        } catch {
            continue;
        }
    }
    return null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tuitear')
        .setDescription('Genera una imagen de tweet con estilo Twitter/X')
        .addStringOption(option =>
            option.setName('mensaje')
                .setDescription('Contenido del tweet (máximo 280 caracteres)')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario que tuitea (por defecto tú)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('nombre')
                .setDescription('Nombre personalizado para la cuenta')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('arroba')
                .setDescription('@usuario personalizado')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const texto = interaction.options.getString('mensaje');
        const targetUser = interaction.options.getUser('usuario') || interaction.user;
        const nombreCustom = interaction.options.getString('nombre');
        const arrobaCustom = interaction.options.getString('arroba');

        if (texto.length > 280) {
            return interaction.editReply('❌ El tweet no puede superar los 280 caracteres.');
        }

        const displayName = nombreCustom || targetUser.displayName || targetUser.username;
        const username = (arrobaCustom || targetUser.username).replace('@', '');
        const avatarUrl = targetUser.displayAvatarURL({ extension: 'png', size: 256 });

        const buffer = await tryApis(texto, username, displayName, avatarUrl);

        if (buffer) {
            const attachment = new AttachmentBuilder(buffer, { name: 'tweet.png' });
            return interaction.editReply({ files: [attachment] });
        }

        // Fallback visual estilo X/Twitter
        const now = new Date();
        const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
        const likes = Math.floor(Math.random() * 9000) + 100;
        const rts = Math.floor(Math.random() * 2000) + 10;
        const views = Math.floor(Math.random() * 50000) + 1000;

        const embed = new EmbedBuilder()
            .setColor('#000000')
            .setAuthor({
                name: `${displayName}  ✓`,
                iconURL: avatarUrl,
            })
            .setDescription(
                `**@${username}**\n\n${texto}\n\n` +
                `🔁 ${rts.toLocaleString()}   ❤️ ${likes.toLocaleString()}   📊 ${views.toLocaleString()}`
            )
            .setImage('https://i.imgur.com/QhMeFJR.png')
            .setFooter({
                text: `${timeStr} · ${dateStr} · X (Twitter)`,
                iconURL: 'https://abs.twimg.com/icons/apple-touch-icon-192x192.png',
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
