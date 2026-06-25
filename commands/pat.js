const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pat')
        .setDescription('Acaricia la cabeza de alguien')
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Usuario a acariciar').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('usuario');
        try {
            const res = await fetch('https://nekos.best/api/v2/pat');
            const data = await res.json();
            const gif = data.results[0].url;
            const embed = new EmbedBuilder()
                .setColor('#ffb347')
                .setTitle('🤚 ¡Pat Pat!')
                .setDescription(`**${interaction.user.username}** le da palmaditas en la cabeza a **${target.username}** 🥰`)
                .setImage(gif)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ No se pudo ejecutar la acción.');
        }
    },
};
