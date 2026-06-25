function parseEmojisInContent(content, client) {
    const emojiRegex = /:([a-zA-Z0-9_]+):/g;
    let newContent = content;
    let found = false;
    const matches = [];
    let match;

    while ((match = emojiRegex.exec(content)) !== null) {
        const before = content.slice(0, match.index);
        const lastLt = before.lastIndexOf('<');
        const lastGt = before.lastIndexOf('>');
        if (lastLt > lastGt) continue;
        matches.push({ full: match[0], name: match[1], index: match.index });
    }

    for (const m of matches.reverse()) {
        const emoji = client.emojis.cache.find(e => e.name.toLowerCase() === m.name.toLowerCase());
        if (emoji) {
            const emojiStr = emoji.animated
                ? `<a:${emoji.name}:${emoji.id}>`
                : `<:${emoji.name}:${emoji.id}>`;
            newContent = newContent.slice(0, m.index) + emojiStr + newContent.slice(m.index + m.full.length);
            found = true;
        }
    }

    return found ? newContent : null;
}

function hasEmojiPattern(content) {
    return /:([a-zA-Z0-9_]+):/.test(content);
}

module.exports = { parseEmojisInContent, hasEmojiPattern };
