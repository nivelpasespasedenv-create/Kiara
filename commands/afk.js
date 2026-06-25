const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const afkUsers = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Activa o desactiva tu estado AFK')
        .addStringOption(opt =>
            opt.setName('razon')
                .setDescription('Motivo de tu ausencia')
                .setRequired(false)),

    afkUsers,

    async execute(interaction) {
        const userId = interaction.user.id;
        if (afkUsers.has(userId)) {
            afkUsers.delete(userId);
            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('👋 ¡Bienvenido de vuelta!')
                .setDescription('Tu estado AFK ha sido desactivado.')
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }
        const razon = interaction.options.getString('razon') || 'AFK';
        afkUsers.set(userId, { razon, desde: Date.now() });
        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('💤 Estado AFK Activado')
            .setDescription(`Ahora estás AFK: **${razon}**\nSe notificará a quien te mencione.`)
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
