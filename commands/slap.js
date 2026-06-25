const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slap')
        .setDescription('Abofetea a alguien')
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Usuario a abofetear').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('usuario');
        try {
            const res = await fetch('https://nekos.best/api/v2/slap');
            const data = await res.json();
            const gif = data.results[0].url;
            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('👋 ¡Bofetada!')
                .setDescription(`**${interaction.user.username}** le dio una bofetada a **${target.username}**!`)
                .setImage(gif)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ No se pudo ejecutar la acción.');
        }
    },
};
