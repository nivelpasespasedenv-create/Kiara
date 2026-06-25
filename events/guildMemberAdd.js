const { Events, EmbedBuilder } = require('discord.js');
const config = require('../config');
const { getLanguage, t } = require('../utils/i18n');
const { resolveEmbedColor } = require('../utils/welcomeUtils');
const fs   = require('fs');
const path = require('path');

const welcomeConfigPath = path.join(__dirname, '..', 'data', 'welcome-config.json');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            const guildId = member.guild.id;
            const lang    = await getLanguage(guildId);

            let welcomeConfig = {};
            if (fs.existsSync(welcomeConfigPath)) {
                try { welcomeConfig = JSON.parse(fs.readFileSync(welcomeConfigPath, 'utf8')); } catch {}
            }

            const cfg = welcomeConfig[guildId];

            // Por defecto desactivado si no está configurado
            if (!cfg || cfg.enabled !== true || !cfg.channelId) return;

            const channel = member.guild.channels.cache.get(cfg.channelId);
            if (!channel) return;
            if (!channel.permissionsFor(member.guild.members.me)?.has(['SendMessages', 'EmbedLinks'])) return;

            const rawMessage = cfg.message || '¡Bienvenido {user} a {server}! 🎉';
            const welcomeMessage = rawMessage
                .replace(/{user}/g,   `<@${member.id}>`)
                .replace(/{server}/g, member.guild.name);

            const embedColor = resolveEmbedColor(cfg, member.user.bot ? '#7289da' : (config.colors?.success || '#5865F2'));

            const embed = new EmbedBuilder()
                .setTitle(`🎉 ¡Bienvenido a ${member.guild.name}!`)
                .setDescription(welcomeMessage)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setColor(embedColor)
                .addFields(
                    { name: member.user.bot ? '🤖 Bot' : '👤 ' + t('NEW_MEMBER', lang), value: member.user.tag, inline: true },
                    { name: t('JOINED_AT', lang), value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                    { name: '🔢 Miembro #', value: `${member.guild.memberCount}`, inline: true }
                )
                .setFooter({
                    text: member.guild.name,
                    iconURL: member.guild.iconURL() || member.client.user.displayAvatarURL()
                })
                .setTimestamp();

            if (cfg.imageUrl) embed.setImage(cfg.imageUrl);

            await channel.send({ content: `¡Hola ${member}! 👋`, embeds: [embed] });

        } catch (error) {
            console.error('Error en guildMemberAdd:', error);
        }
    },
};
