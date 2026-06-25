const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bonk')
        .setDescription('Golpea a alguien con un bate')
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Usuario a golpear').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('usuario');
        try {
            const res = await fetch('https://nekos.best/api/v2/punch');
            const data = await res.json();
            const gif = data.results[0].url;
            const embed = new EmbedBuilder()
                .setColor('#e67e22')
                .setTitle('🏏 ¡BONK!')
                .setDescription(`**${interaction.user.username}** le da un BONK a **${target.username}** 💥`)
                .setImage(gif)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ No se pudo ejecutar la acción.');
        }
    },
};
