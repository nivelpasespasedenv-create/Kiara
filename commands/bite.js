const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bite')
        .setDescription('Muerde a alguien')
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Usuario a morder').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('usuario');
        try {
            const res = await fetch('https://nekos.best/api/v2/bite');
            const data = await res.json();
            const gif = data.results[0].url;
            const embed = new EmbedBuilder()
                .setColor('#c0392b')
                .setTitle('😬 ¡Mordisco!')
                .setDescription(`**${interaction.user.username}** muerde a **${target.username}** 🦷`)
                .setImage(gif)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ No se pudo ejecutar la acción.');
        }
    },
};
