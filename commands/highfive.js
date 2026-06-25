const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('highfive')
        .setDescription('¡Choca esos cinco!')
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Con quién chocar').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('usuario');
        try {
            const res = await fetch('https://nekos.best/api/v2/highfive');
            const data = await res.json();
            const gif = data.results[0].url;
            const embed = new EmbedBuilder()
                .setColor('#f1c40f')
                .setTitle('🙌 ¡High Five!')
                .setDescription(`**${interaction.user.username}** choca los cinco con **${target.username}** ✋`)
                .setImage(gif)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ No se pudo ejecutar la acción.');
        }
    },
};
