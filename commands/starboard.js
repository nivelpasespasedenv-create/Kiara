const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../data/starboard_config.json');

function readConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, '{}', 'utf8');
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch { return {}; }
}

function writeConfig(data) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('starboard')
        .setDescription('Configura el tablero de mensajes destacados con ⭐')
        .addSubcommand(sub => sub
            .setName('setup')
            .setDescription('Activa el starboard en un canal')
            .addChannelOption(o => o.setName('canal').setDescription('Canal del starboard').setRequired(true))
            .addIntegerOption(o => o.setName('estrellas').setDescription('Mínimo de ⭐ para aparecer (defecto: 3)').setMinValue(1).setMaxValue(20)))
        .addSubcommand(sub => sub
            .setName('desactivar')
            .setDescription('Desactiva el starboard'))
        .addSubcommand(sub => sub
            .setName('info')
            .setDescription('Ver la configuración actual del starboard'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: await interaction.tr('❌ Necesitas permisos de Administrar Servidor.'), flags: 64 });
        }

        await interaction.deferReply({ flags: 64 });
        const sub = interaction.options.getSubcommand();
        const config = readConfig();

        if (sub === 'setup') {
            const channel = interaction.options.getChannel('canal');
            const minStars = interaction.options.getInteger('estrellas') || 3;

            config[interaction.guildId] = { channel_id: channel.id, min_stars: minStars };
            writeConfig(config);

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(await interaction.tr('⭐ Starboard Activado'))
                .setDescription(await interaction.tr(`Los mensajes con **${minStars}+ ⭐** aparecerán en ${channel}.`))
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        if (sub === 'desactivar') {
            delete config[interaction.guildId];
            writeConfig(config);
            return interaction.editReply(await interaction.tr('✅ Starboard desactivado.'));
        }

        if (sub === 'info') {
            const entry = config[interaction.guildId];
            if (!entry) {
                return interaction.editReply(await interaction.tr('❌ El starboard no está configurado. Usa `/starboard setup`.'));
            }
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(await interaction.tr('⭐ Configuración del Starboard'))
                .addFields(
                    { name: await interaction.tr('📌 Canal'), value: `<#${entry.channel_id}>`, inline: true },
                    { name: await interaction.tr('⭐ Mínimo'), value: `${entry.min_stars} estrellas`, inline: true },
                )
                .setTimestamp();
            return interaction.editReply({ embeds: [embed] });
        }
    },
};
