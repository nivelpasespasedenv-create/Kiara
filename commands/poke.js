const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poke')
        .setDescription('Toca a alguien con el dedo')
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Usuario a tocar').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('usuario');
        try {
            const res = await fetch('https://nekos.best/api/v2/poke');
            const data = await res.json();
            const gif = data.results[0].url;
            const embed = new EmbedBuilder()
                .setColor('#87ceeb')
                .setTitle('👉 ¡Poke!')
                .setDescription(`**${interaction.user.username}** le da un toque a **${target.username}** 👈`)
                .setImage(gif)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ No se pudo ejecutar la acción.');
        }
    },
};
