const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wave')
        .setDescription('Saluda con la mano')
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('A quién saludar').setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('usuario');
        try {
            const res = await fetch('https://nekos.best/api/v2/wave');
            const data = await res.json();
            const gif = data.results[0].url;
            const desc = target
                ? `**${interaction.user.username}** saluda a **${target.username}** 👋`
                : `**${interaction.user.username}** saluda a todos 👋`;
            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('👋 ¡Hola!')
                .setDescription(desc)
                .setImage(gif)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ No se pudo ejecutar la acción.');
        }
    },
};
