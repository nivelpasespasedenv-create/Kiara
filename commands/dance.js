const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dance')
        .setDescription('¡Muéstrale al mundo tus mejores pasos!')
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Invitar a alguien a bailar (opcional)').setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('usuario');
        try {
            const res = await fetch('https://nekos.best/api/v2/dance');
            const data = await res.json();
            const gif = data.results[0].url;
            const desc = target
                ? `**${interaction.user.username}** baila con **${target.username}** 🕺💃`
                : `**${interaction.user.username}** está bailando 🕺`;
            const embed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle('🎶 ¡A bailar!')
                .setDescription(desc)
                .setImage(gif)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ No se pudo ejecutar la acción.');
        }
    },
};
