const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tickle')
        .setDescription('Hazle cosquillas a alguien')
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Usuario a hacerle cosquillas').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('usuario');
        try {
            const res = await fetch('https://nekos.best/api/v2/tickle');
            const data = await res.json();
            const gif = data.results[0].url;
            const embed = new EmbedBuilder()
                .setColor('#fd79a8')
                .setTitle('🤣 ¡Cosquillas!')
                .setDescription(`**${interaction.user.username}** le hace cosquillas a **${target.username}** 😂`)
                .setImage(gif)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ No se pudo ejecutar la acción.');
        }
    },
};
