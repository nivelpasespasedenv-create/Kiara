const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const welcomeConfigPath = path.join(__dirname, '..', 'data', 'welcome-config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcomeconfig')
        .setDescription('Edita el mensaje de bienvenidas')
        .addStringOption(option =>
            option.setName('texto')
                .setDescription('Escribe el nuevo mensaje aquí (Usa {user} y {server})')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const lang = await getLanguage(interaction.guildId);
            const newMessage = interaction.options.getString('texto');

            if (!newMessage) {
                return await interaction.reply({ content: '❌ Por favor proporciona un mensaje válido.', flags: 64 });
            }

            let welcomeConfig = {};
            if (fs.existsSync(welcomeConfigPath)) {
                try {
                    const data = fs.readFileSync(welcomeConfigPath, 'utf8');
                    welcomeConfig = JSON.parse(data);
                } catch (e) {
                    console.error('Error parseando JSON de bienvenidas:', e);
                }
            }

            if (!welcomeConfig[interaction.guildId]) {
                welcomeConfig[interaction.guildId] = {
                    enabled: true,
                    channelId: null,
                    message: newMessage
                };
            } else {
                welcomeConfig[interaction.guildId].message = newMessage;
            }

            if (!fs.existsSync(path.dirname(welcomeConfigPath))) {
                fs.mkdirSync(path.dirname(welcomeConfigPath), { recursive: true });
            }
            fs.writeFileSync(welcomeConfigPath, JSON.stringify(welcomeConfig, null, 2));

            const preview = newMessage
                .replace(/{user}/g, interaction.user.toString())
                .replace(/{server}/g, interaction.guild.name);

            const embed = new EmbedBuilder()
                .setColor(config.colors?.success || '#00ff00')
                .setTitle('✅ Mensaje de Bienvenida Actualizado')
                .setDescription(`Ahora el bot dirá:\n\n${preview}`)
                .addFields({ name: '📝 Texto original', value: `\`\`\`${newMessage}\`\`\`` })
                .setFooter({ text: 'Variables: {user} = Mencionar usuario, {server} = Nombre del servidor' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en welcomeconfig edit:', error);
            // Asegurarse de que el error no sea por intentar responder dos veces
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Hubo un error al guardar el mensaje.', flags: 64 });
            }
        }
    },
};
