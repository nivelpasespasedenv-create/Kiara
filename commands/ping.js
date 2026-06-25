const { SlashCommandBuilder } = require('discord.js');
const { tAsync } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Responde con pong para probar si el bot funciona'),

    async execute(interaction) {
        const lang = interaction.lang || 'es';
        const msg = await tAsync('PING_MSG', lang, { ping: interaction.client.ws.ping });
        await interaction.reply(msg);
    },
};
