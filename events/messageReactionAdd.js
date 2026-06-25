const { Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../data/starboard_config.json');
const MESSAGES_FILE = path.join(__dirname, '../data/starboard_messages.json');

function readJSON(file) {
    try {
        if (!fs.existsSync(file)) fs.writeFileSync(file, '{}', 'utf8');
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch { return {}; }
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    name: Events.MessageReactionAdd,
    once: false,
    async execute(reaction, user) {
        if (user.bot) return;
        if (reaction.emoji.name !== '⭐') return;

        if (reaction.partial) {
            try { await reaction.fetch(); } catch { return; }
        }
        if (reaction.message.partial) {
            try { await reaction.message.fetch(); } catch { return; }
        }

        const message = reaction.message;
        const guild = message.guild;
        if (!guild) return;

        const config = readJSON(CONFIG_FILE);
        const entry = config[guild.id];
        if (!entry) return;

        const { channel_id: sbChannelId, min_stars: minStars } = entry;
        if (message.channelId === sbChannelId) return;

        const starCount = reaction.count;
        if (starCount < minStars) return;

        const sbChannel = guild.channels.cache.get(sbChannelId);
        if (!sbChannel) return;

        const messages = readJSON(MESSAGES_FILE);
        const key = `${guild.id}::${message.id}`;
        const existing = messages[key];

        const starText = `⭐ **${starCount}** | <#${message.channelId}>`;

        if (existing?.starboard_msg_id) {
            try {
                const sbMsg = await sbChannel.messages.fetch(existing.starboard_msg_id);
                await sbMsg.edit({ content: starText });
                messages[key].star_count = starCount;
                writeJSON(MESSAGES_FILE, messages);
            } catch {}
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
            .setDescription(message.content || '*[Sin texto]*')
            .addFields({ name: '🔗 Ir al mensaje', value: `[Click aquí](${message.url})` })
            .setTimestamp(message.createdAt);

        const img = message.attachments.find(a => a.contentType?.startsWith('image/'));
        if (img) embed.setImage(img.url);

        try {
            const sbMsg = await sbChannel.send({ content: starText, embeds: [embed] });
            messages[key] = { starboard_msg_id: sbMsg.id, star_count: starCount };
            writeJSON(MESSAGES_FILE, messages);
        } catch (e) {
            console.error('Error publicando en starboard:', e.message);
        }
    },
};
