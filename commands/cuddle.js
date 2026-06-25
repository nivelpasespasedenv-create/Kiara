const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cuddle')
        .setDescription('Acurrúcate con alguien')
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Usuario con quien acurrucarse').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('usuario');
        try {
            const res = await fetch('https://nekos.best/api/v2/cuddle');
            const data = await res.json();
            const gif = data.results[0].url;
            const embed = new EmbedBuilder()
                .setColor('#ff69b4')
                .setTitle('🥰 ¡Cuddle!')
                .setDescription(`**${interaction.user.username}** se acurruca con **${target.username}** 💕`)
                .setImage(gif)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ No se pudo ejecutar la acción.');
        }
    },
};
