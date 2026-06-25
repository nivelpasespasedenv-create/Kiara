const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('membercount')
        .setDescription('Muestra el contador de miembros del servidor'),
    async execute(interaction) {
        const guild = interaction.guild;
        await guild.members.fetch();
        const total = guild.memberCount;
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        const humanos = total - bots;
        const embed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle(`👥 Miembros de ${guild.name}`)
            .addFields(
                { name: '👤 Humanos', value: `${humanos}`, inline: true },
                { name: '🤖 Bots', value: `${bots}`, inline: true },
                { name: '📊 Total', value: `${total}`, inline: true },
            )
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
