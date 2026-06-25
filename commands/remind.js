const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Establece un recordatorio')
        .addStringOption(opt =>
            opt.setName('mensaje')
                .setDescription('¿De qué te recuerdo?')
                .setRequired(true))
        .addIntegerOption(opt =>
            opt.setName('minutos')
                .setDescription('En cuántos minutos (máx 1440 = 24h)')
                .setMinValue(1)
                .setMaxValue(1440)
                .setRequired(true)),
    async execute(interaction) {
        const mensaje = interaction.options.getString('mensaje');
        const minutos = interaction.options.getInteger('minutos');
        const ms = minutos * 60 * 1000;
        const cuando = new Date(Date.now() + ms);

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('⏰ Recordatorio Establecido')
            .setDescription(`Te recordaré: **${mensaje}**`)
            .addFields({ name: '🕐 Cuándo', value: `En ${minutos} minuto${minutos > 1 ? 's' : ''} (<t:${Math.floor(cuando.getTime() / 1000)}:R>)` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        setTimeout(async () => {
            try {
                const reminderEmbed = new EmbedBuilder()
                    .setColor('#f1c40f')
                    .setTitle('⏰ ¡Recordatorio!')
                    .setDescription(`${interaction.user}, ¡no olvides esto!\n\n**${mensaje}**`)
                    .setTimestamp();
                await interaction.followUp({ content: `<@${interaction.user.id}>`, embeds: [reminderEmbed] });
            } catch {}
        }, ms);
    },
};
