const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cry')
        .setDescription('Llora un poco, está bien')
        .addStringOption(opt =>
            opt.setName('razon').setDescription('¿Por qué lloras?').setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();
        const razon = interaction.options.getString('razon');
        try {
            const res = await fetch('https://nekos.best/api/v2/cry');
            const data = await res.json();
            const gif = data.results[0].url;
            const desc = razon
                ? `**${interaction.user.username}** llora porque: *${razon}* 😢`
                : `**${interaction.user.username}** está llorando 😢`;
            const embed = new EmbedBuilder()
                .setColor('#6495ed')
                .setTitle('😭 ¡Llanto!')
                .setDescription(desc)
                .setImage(gif)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ No se pudo ejecutar la acción.');
        }
    },
};
