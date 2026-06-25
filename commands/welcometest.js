const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');
const { resolveEmbedColor, colorLabel } = require('../utils/welcomeUtils');
const fs   = require('fs');
const path = require('path');
const config = require('../config');

const welcomeConfigPath = path.join(__dirname, '..', 'data', 'welcome-config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcometest')
        .setDescription('Prueba el mensaje de bienvenida en el canal configurado')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            const lang = await getLanguage(interaction.guildId);

            let welcomeConfig = {};
            if (fs.existsSync(welcomeConfigPath)) {
                try { welcomeConfig = JSON.parse(fs.readFileSync(welcomeConfigPath, 'utf8')); } catch {}
            }

            const cfg = welcomeConfig[interaction.guildId];

            if (!cfg || !cfg.channelId) {
                return await interaction.reply({
                    content: '❌ No hay canal configurado. Usa `/welcomeset` primero.',
                    flags: 64
                });
            }

            const targetChannel = interaction.guild.channels.cache.get(cfg.channelId) || interaction.channel;

            const rawMessage = cfg.message || '¡Bienvenido {user} a {server}! 🎉';
            const welcomeMessage = rawMessage
                .replace(/{user}/g,   interaction.user.toString())
                .replace(/{server}/g, interaction.guild.name);

            const embedColor = resolveEmbedColor(cfg, config.colors?.success || '#5865F2');

            const embed = new EmbedBuilder()
                .setTitle(`🎉 ¡Bienvenido a ${interaction.guild.name}! (Prueba)`)
                .setDescription(welcomeMessage)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setColor(embedColor)
                .addFields(
                    { name: '👤 ' + t('NEW_MEMBER', lang), value: interaction.user.tag, inline: true },
                    { name: t('JOINED_AT', lang), value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                    { name: '🔢 Miembro #', value: `${interaction.guild.memberCount}`, inline: true }
                )
                .setFooter({
                    text: `${interaction.guild.name} • Estado: ${cfg.enabled ? '✅ Activado' : '❌ Desactivado'} • Color: ${cfg.embedColor === 'random' ? '🎲 Aleatorio' : (cfg.embedColor || 'predeterminado')}`,
                    iconURL: interaction.guild.iconURL() || interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            if (cfg.imageUrl) embed.setImage(cfg.imageUrl);

            await targetChannel.send({
                content: `¡Hola ${interaction.user}! 👋 *(esto es una prueba)*`,
                embeds: [embed]
            });

            const statusNote = cfg.enabled ? '' : '\n⚠️ Las bienvenidas están **desactivadas**. Usa `/welcome activar` para activarlas.';
            await interaction.reply({
                content: `✅ Prueba enviada en ${targetChannel}. Color usado: ${colorLabel(cfg)}${statusNote}`,
                flags: 64
            });

        } catch (error) {
            console.error('Error en welcometest:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Hubo un error al enviar la prueba.', flags: 64 });
            }
        }
    },
};
