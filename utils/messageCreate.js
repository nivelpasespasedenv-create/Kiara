const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { getLanguage } = require('../utils/i18n');
const { handleAutoMod } = require('../utils/automod');
const { parseEmojisInContent, hasEmojiPattern } = require('../utils/emojiParser');
const { addXP, getLevelChannel, getXPProgress } = require('../utils/levelSystem');
const { generateLevelUpCard } = require('../utils/levelUpCard');

const webhookCache = new Map();

async function getOrCreateWebhook(channel) {
    if (webhookCache.has(channel.id)) {
        return webhookCache.get(channel.id);
    }
    try {
        const webhooks = await channel.fetchWebhooks();
        let wh = webhooks.find(w => w.owner?.id === channel.client.user.id && w.name === 'NQN Emoji');
        if (!wh) {
            wh = await channel.createWebhook({ name: 'NQN Emoji', reason: 'Sistema NQN de emojis' });
        }
        webhookCache.set(channel.id, wh);
        return wh;
    } catch {
        return null;
    }
}

async function buildFakeInteraction(message, optionsMap = {}) {
    const state = { ref: null, done: false };
    state.ref = await message.reply({ content: '⌛ Procesando...' });

    return {
        user: message.author,
        member: message.member,
        guild: message.guild,
        channel: message.channel,
        guildId: message.guildId,
        client: message.client,
        deferred: true,
        replied: false,
        options: {
            getString: (key) => optionsMap[key] ?? null,
            getUser: (key) => optionsMap[key] ?? null,
            getBoolean: (key) => optionsMap[key] ?? null,
            getInteger: (key) => optionsMap[key] ?? null,
            getChannel: (key) => optionsMap[key] ?? null,
            getRole: (key) => optionsMap[key] ?? null,
            getMember: (key) => optionsMap[key] ?? null,
        },
        deferReply: async () => {},
        reply: async (data) => {
            if (state.done) return;
            state.done = true;
            return state.ref.edit(data);
        },
        editReply: async (data) => {
            if (state.done) return;
            state.done = true;
            return state.ref.edit(data);
        },
        followUp: async (data) => {
            return message.channel.send(data);
        },
    };
}

module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(message) {
        if (message.author.bot) return;
        if (message.webhookId) return;

        const wasDeleted = await handleAutoMod(message);
        if (wasDeleted) return;

        const content = message.content.trim();

        // === SISTEMA AFK ===
        try {
            const afkCmd = message.client.commands.get('afk');
            if (afkCmd && afkCmd.afkUsers) {
                const afkUsers = afkCmd.afkUsers;
                // Si el autor era AFK, quitarle el estado
                if (afkUsers.has(message.author.id)) {
                    const afkData = afkUsers.get(message.author.id);
                    afkUsers.delete(message.author.id);
                    const elapsed = Math.floor((Date.now() - afkData.desde) / 60000);
                    const msg = await message.channel.send(`👋 <@${message.author.id}> ¡Bienvenido de vuelta! Estuviste AFK por **${elapsed} minuto${elapsed !== 1 ? 's' : ''}**.`);
                    setTimeout(() => msg.delete().catch(() => {}), 8000);
                }
                // Si menciona a alguien AFK, notificar
                for (const [userId, data] of afkUsers) {
                    if (message.mentions.users.has(userId)) {
                        const elapsed = Math.floor((Date.now() - data.desde) / 60000);
                        const notif = await message.channel.send(
                            `💤 <@${userId}> está AFK: **${data.razon}** (hace ${elapsed} min)`
                        );
                        setTimeout(() => notif.delete().catch(() => {}), 8000);
                    }
                }
            }
        } catch {}

        // === SISTEMA XP/NIVELES ===
        if (message.guild && !content.startsWith('/')) {
            try {
                const xpGain = Math.floor(Math.random() * 11) + 15;
                const result = await addXP(message.guildId, message.author.id, xpGain);
                if (result && result.leveled) {
                    const lvlChannelId = await getLevelChannel(message.guildId);
                    const target = lvlChannelId ? message.guild.channels.cache.get(lvlChannelId) : message.channel;
                    if (target) {
                        try {
                            const userData = await require('../utils/levelSystem').getUserRank(message.guildId, message.author.id);
                            const pct = userData ? userData.percentage : 0;
                            const totalXP = userData ? userData.xp : 0;
                            const cardBuffer = await generateLevelUpCard(message.author, result.newLevel, totalXP, pct);
                            const attachment = new AttachmentBuilder(cardBuffer, { name: 'levelup.png' });
                            const lvlEmbed = new EmbedBuilder()
                                .setColor('#FFD700')
                                .setDescription(`🎉 ¡Felicidades <@${message.author.id}>! Ahora eres **Nivel ${result.newLevel}** ⭐`)
                                .setImage('attachment://levelup.png')
                                .setTimestamp();
                            target.send({ embeds: [lvlEmbed], files: [attachment] }).catch(() => {});
                        } catch {
                            const lvlEmbed = new EmbedBuilder()
                                .setColor('#FFD700')
                                .setTitle('🎉 ¡Subiste de nivel!')
                                .setDescription(`¡Felicidades <@${message.author.id}>! Ahora eres **Nivel ${result.newLevel}** ⭐`)
                                .setThumbnail(message.author.displayAvatarURL())
                                .setTimestamp();
                            target.send({ embeds: [lvlEmbed] }).catch(() => {});
                        }
                    }
                }
            } catch {}
        }

        // === LÓGICA NQN: detectar :emoji_name: y reenviar como el usuario ===
        if (hasEmojiPattern(content) && message.guild) {
            const parsed = parseEmojisInContent(content, message.client);
            if (parsed) {
                try {
                    const channel = message.channel;
                    const perms = channel.permissionsFor(message.guild.members.me);
                    if (perms.has('ManageWebhooks') && perms.has('ManageMessages')) {
                        const webhook = await getOrCreateWebhook(channel);
                        if (webhook) {
                            await message.delete().catch(() => {});
                            await webhook.send({
                                content: parsed,
                                username: message.member?.displayName || message.author.username,
                                avatarURL: message.author.displayAvatarURL({ dynamic: true }),
                                allowedMentions: { parse: ['users', 'roles'] },
                            });
                            return;
                        }
                    }
                } catch (err) {
                    console.error('Error NQN:', err);
                }
            }
        }

        // === MENCIÓN DIRECTA AL BOT ===
        const botMention = `<@${message.client.user.id}>`;
        const botMentionAlt = `<@!${message.client.user.id}>`;
        const isDirectMention = content.startsWith(botMention) || content.startsWith(botMentionAlt);

        if (isDirectMention) {
            const afterMention = content
                .replace(botMention, '')
                .replace(botMentionAlt, '')
                .trim();

            const parts = afterMention.split(/\s+/);
            const commandName = parts[0]?.toLowerCase();
            const args = parts.slice(1).join(' ');

            if (!commandName) {
                const botName = message.client.user.username;
                const lang = await getLanguage(message.guildId).catch(() => 'es');
                const embed = new EmbedBuilder()
                    .setColor('#7289DA')
                    .setTitle(`👋 ¡Hola! Soy ${botName}`)
                    .setDescription('Puedes mencionarme junto a un comando para usarlo directamente.\nEjemplos:\n`@Sasha meme` · `@Sasha ia <pregunta>` · `@Sasha anime` · `@Sasha ping`')
                    .addFields(
                        { name: '🤖 IA', value: '`@Sasha ia <pregunta>`', inline: true },
                        { name: '😂 Meme', value: '`@Sasha meme`', inline: true },
                        { name: '🌸 Anime', value: '`@Sasha anime`', inline: true },
                        { name: '🏓 Ping', value: '`@Sasha ping`', inline: true },
                        { name: '💖 Abrazo', value: '`@Sasha abrazo @usuario`', inline: true },
                        { name: '✉️ Invitar', value: '`@Sasha invite`', inline: true },
                        { name: '📋 Todos', value: '`/ayuda`', inline: true }
                    )
                    .setThumbnail(message.client.user.displayAvatarURL())
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            // === @Sasha invite ===
            if (commandName === 'invite') {
                const lang = await getLanguage(message.guildId).catch(() => 'es');
                const { translateBatch } = require('../utils/i18n');
                const clientId = message.client.user.id;
                const inviteURL = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
                const websiteURL = 'https://v0-soledadbot-website.vercel.app/';
                const totalUsers = message.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);

                const botName = message.client.user.username;
                const rawTexts = [
                    `✨ ¡Invita a ${botName} a tu servidor!`,
                    '**El bot de Discord definitivo para tu servidor.**\nPotencia tu comunidad con funciones increíbles.\n\n🎬 Multimedia & IA · 🎮 Gaming · 🎭 Social\n🎲 Juegos · ⚙️ Utilidades · 🛡️ Moderación · ✨ Emojis\n\n**100 comandos** listos para usar en tu servidor.',
                    '🌐 Sitio web',
                    '📊 Servidores',
                    `${message.client.guilds.cache.size}+ servidores`,
                    '👥 Usuarios',
                    `${totalUsers}+ usuarios`,
                    `${botName} • Hecho con ❤️`,
                    `🌸 Invitar a ${botName}`,
                    '🌐 Sitio web',
                ];

                const texts = lang === 'es' ? rawTexts : await translateBatch(rawTexts, lang);

                const inviteEmbed = new EmbedBuilder()
                    .setColor('#D40237')
                    .setAuthor({ name: botName, iconURL: message.client.user.displayAvatarURL() })
                    .setTitle(texts[0])
                    .setDescription(texts[1])
                    .setThumbnail(message.client.user.displayAvatarURL({ size: 256 }))
                    .addFields(
                        { name: texts[2], value: `[soledadbot.vercel.app](${websiteURL})`, inline: true },
                        { name: texts[3], value: texts[4], inline: true },
                        { name: texts[5], value: texts[6], inline: true },
                    )
                    .setImage('https://v0-soledadbot-website.vercel.app/og-image.png')
                    .setFooter({ text: texts[7], iconURL: message.client.user.displayAvatarURL() })
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel(texts[8])
                        .setStyle(ButtonStyle.Link)
                        .setURL(inviteURL),
                    new ButtonBuilder()
                        .setLabel(texts[9])
                        .setStyle(ButtonStyle.Link)
                        .setURL(websiteURL),
                );

                return message.reply({ embeds: [inviteEmbed], components: [row] });
            }

            const command = message.client.commands.get(commandName);
            if (!command) {
                return message.reply(`❌ No conozco el comando **${commandName}**. Usa \`/ayuda\` para ver todos mis comandos.`);
            }

            const optionsMap = {};
            if (commandName === 'ia' || commandName === 'ai') {
                optionsMap['pregunta'] = args || '¡Hola!';
            } else if (commandName === 'anime') {
                if (args) optionsMap['tipo'] = args;
            } else if (commandName === 'abrazo' || commandName === 'beso') {
                const mentionedUser = message.mentions.users.filter(u => u.id !== message.client.user.id).first();
                if (mentionedUser) optionsMap['usuario'] = mentionedUser;
            } else if (commandName === 'avatar') {
                const mentionedUser = message.mentions.users.filter(u => u.id !== message.client.user.id).first();
                if (mentionedUser) optionsMap['usuario'] = mentionedUser;
            } else if (commandName === 'lovemeter') {
                const users = message.mentions.users.filter(u => u.id !== message.client.user.id);
                const usersArr = [...users.values()];
                if (usersArr[0]) optionsMap['usuario1'] = usersArr[0];
                if (usersArr[1]) optionsMap['usuario2'] = usersArr[1];
            } else if (commandName === 'confession') {
                optionsMap['mensaje'] = args;
            } else if (commandName === 'yt') {
                optionsMap['busqueda'] = args;
            } else if (commandName === 'poll') {
                optionsMap['pregunta'] = args;
            } else if (commandName === 'tuitear') {
                optionsMap['texto'] = args;
            }

            try {
                const fakeInteraction = await buildFakeInteraction(message, optionsMap);
                await command.execute(fakeInteraction);
            } catch (error) {
                console.error(`Error ejecutando ${commandName} via mención:`, error);
                message.reply(`❌ Hubo un error al ejecutar **/${commandName}**. Intenta usarlo con \`/${commandName}\` directamente.`).catch(() => {});
            }

            return;
        }

        // === SUGERIR SLASH COMMAND si alguien escribe sin prefijo ===
        const words = content.toLowerCase().split(/\s+/);
        const possibleCommandName = words[0];
        const command = message.client.commands.get(possibleCommandName);

        if (command && !content.startsWith('/')) {
            try {
                const lang = await getLanguage(message.guildId).catch(() => 'es');
                if (message.deletable) await message.delete().catch(() => {});

                const hint = lang === 'en'
                    ? `👋 <@${message.author.id}> Use **\`/${possibleCommandName}\`** or mention me: \`@${message.client.user.username} ${possibleCommandName}\` ✨`
                    : `👋 <@${message.author.id}> Usa **\`/${possibleCommandName}\`** o mencioname: \`@${message.client.user.username} ${possibleCommandName}\` ✨`;

                const infoMsg = await message.channel.send({ content: hint });
                setTimeout(() => infoMsg.delete().catch(() => {}), 10000);
            } catch (error) {
                console.error('Error detectando comando sin prefijo:', error);
            }
        }
    },
};
