const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs   = require('fs');
const path = require('path');
const config = require('../config');
const { resolveEmbedColor, colorLabel } = require('../utils/welcomeUtils');

const welcomeConfigPath = path.join(__dirname, '..', 'data', 'welcome-config.json');

function loadConfig() {
    if (!fs.existsSync(welcomeConfigPath)) return {};
    try { return JSON.parse(fs.readFileSync(welcomeConfigPath, 'utf8')); } catch { return {}; }
}

function saveConfig(data) {
    fs.mkdirSync(path.dirname(welcomeConfigPath), { recursive: true });
    fs.writeFileSync(welcomeConfigPath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Activa, desactiva o consulta el estado del sistema de bienvenidas')
        .addStringOption(opt =>
            opt.setName('accion')
                .setDescription('¿Qué deseas hacer?')
                .setRequired(true)
                .addChoices(
                    { name: '✅ Activar bienvenidas',   value: 'activar'   },
                    { name: '❌ Desactivar bienvenidas', value: 'desactivar' },
                    { name: '📋 Ver estado actual',      value: 'estado'    }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const accion = interaction.options.getString('accion');
        const welcomeConfig = loadConfig();
        const guildCfg = welcomeConfig[interaction.guildId] || {};

        if (accion === 'estado') {
            const enabled   = guildCfg.enabled ?? false;
            const channelId = guildCfg.channelId;
            const hasImage  = !!guildCfg.imageUrl;
            const channel   = channelId ? interaction.guild.channels.cache.get(channelId) : null;

            const { resolveEmbedColor: resColor, colorLabel: colLabel } = require('../utils/welcomeUtils');
            const stateColor = resColor(guildCfg, enabled ? '#2ecc71' : '#e74c3c');

            const embed = new EmbedBuilder()
                .setTitle('📋 Estado del Sistema de Bienvenidas')
                .setColor(stateColor)
                .addFields(
                    { name: '🔔 Estado',   value: enabled ? '✅ Activado' : '❌ Desactivado', inline: true },
                    { name: '📢 Canal',    value: channel ? `${channel}` : '❌ Sin configurar', inline: true },
                    { name: '🖼️ Imagen',   value: hasImage ? '✅ Configurada' : '❌ Sin imagen', inline: true },
                    { name: '🎨 Color',    value: colLabel(guildCfg), inline: false },
                    { name: '💬 Mensaje',  value: guildCfg.message ? `\`${guildCfg.message.slice(0, 80)}${guildCfg.message.length > 80 ? '...' : ''}\`` : '❌ Sin configurar', inline: false }
                )
                .setFooter({ text: 'Usa /welcomeset para canal, imagen y color • /welcomeconfig para el mensaje' })
                .setTimestamp();

            if (guildCfg.imageUrl) embed.setThumbnail(guildCfg.imageUrl);

            return await interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (accion === 'activar') {
            if (!guildCfg.channelId) {
                return await interaction.reply({
                    content: '⚠️ Primero debes configurar un canal con `/welcomeset`. Las bienvenidas no se han activado.',
                    flags: 64
                });
            }

            welcomeConfig[interaction.guildId] = { ...guildCfg, enabled: true };
            saveConfig(welcomeConfig);

            const channel = interaction.guild.channels.cache.get(guildCfg.channelId);
            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ Bienvenidas Activadas')
                .setDescription(`Los nuevos miembros recibirán bienvenida en ${channel || `<#${guildCfg.channelId}>`}.`)
                .setFooter({ text: 'Usa /welcometest para probar • /welcome desactivar para desactivar' })
                .setTimestamp();

            return await interaction.reply({ embeds: [embed] });
        }

        if (accion === 'desactivar') {
            welcomeConfig[interaction.guildId] = { ...guildCfg, enabled: false };
            saveConfig(welcomeConfig);

            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Bienvenidas Desactivadas')
                .setDescription('Los nuevos miembros ya **no** recibirán mensaje de bienvenida hasta que actives el sistema de nuevo.')
                .setFooter({ text: 'Usa /welcome activar para reactivarlas cuando quieras' })
                .setTimestamp();

            return await interaction.reply({ embeds: [embed] });
        }
    },
};
