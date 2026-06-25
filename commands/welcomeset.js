const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs   = require('fs');
const path = require('path');
const config = require('../config');
const { PALETTE, resolveEmbedColor, colorLabel } = require('../utils/welcomeUtils');

const welcomeConfigPath = path.join(__dirname, '..', 'data', 'welcome-config.json');

function loadConfig() {
    if (!fs.existsSync(welcomeConfigPath)) return {};
    try { return JSON.parse(fs.readFileSync(welcomeConfigPath, 'utf8')); } catch { return {}; }
}
function saveConfig(data) {
    fs.mkdirSync(path.dirname(welcomeConfigPath), { recursive: true });
    fs.writeFileSync(welcomeConfigPath, JSON.stringify(data, null, 2));
}

// Armar las choices de la paleta dinámicamente
const colorChoices = PALETTE.map(c => ({ name: c.name, value: c.value }));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcomeset')
        .setDescription('Configura el canal, imagen y color del mensaje de bienvenida')
        .addChannelOption(opt =>
            opt.setName('canal')
                .setDescription('Canal donde se enviarán las bienvenidas')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('color')
                .setDescription('Color del embed de bienvenida')
                .setRequired(false)
                .addChoices(...colorChoices))
        .addAttachmentOption(opt =>
            opt.setName('imagen')
                .setDescription('Imagen de fondo para la bienvenida (desde galería o archivos)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const channel    = interaction.options.getChannel('canal');
            const colorValue = interaction.options.getString('color');
            const attachment = interaction.options.getAttachment('imagen');

            if (!channel || channel.type !== 0) {
                return await interaction.reply({ content: '❌ Selecciona un canal de texto válido.', flags: 64 });
            }

            if (attachment) {
                const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
                if (!validTypes.includes(attachment.contentType?.toLowerCase())) {
                    return await interaction.reply({
                        content: '❌ El archivo debe ser una imagen (PNG, JPG, GIF o WEBP).',
                        flags: 64
                    });
                }
            }

            const welcomeConfig = loadConfig();
            const existing      = welcomeConfig[interaction.guildId] || {};

            welcomeConfig[interaction.guildId] = {
                enabled:    existing.enabled ?? false,
                channelId:  channel.id,
                message:    existing.message || '¡Bienvenido {user} a {server}! 🎉',
                imageUrl:   attachment ? attachment.url : (existing.imageUrl || null),
                embedColor: colorValue ?? (existing.embedColor || null),
            };

            saveConfig(welcomeConfig);

            const savedCfg   = welcomeConfig[interaction.guildId];
            const previewColor = resolveEmbedColor(savedCfg);

            const embed = new EmbedBuilder()
                .setColor(previewColor)
                .setTitle('✅ Configuración de Bienvenida Guardada')
                .addFields(
                    { name: '📢 Canal',   value: `${channel}`, inline: true },
                    { name: '🔔 Estado',  value: savedCfg.enabled ? '✅ Activado' : '❌ Desactivado', inline: true },
                    { name: '🎨 Color',   value: colorLabel(savedCfg), inline: false },
                    { name: '🖼️ Imagen',  value: attachment ? '✅ Imagen nueva guardada' : (existing.imageUrl ? '🔄 Se mantiene la anterior' : '❌ Sin imagen'), inline: true }
                )
                .setFooter({ text: 'Usa /welcome activar para activar • /welcometest para probar' })
                .setTimestamp();

            if (attachment) embed.setImage(attachment.url);

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en welcomeset:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Hubo un error al guardar la configuración.', flags: 64 });
            }
        }
    },
};
