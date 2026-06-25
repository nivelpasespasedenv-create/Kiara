const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lovemeter')
        .setDescription('Mide el amor entre dos personas con un estilo único 💖')
        .addUserOption(option => 
            option.setName('usuario1')
                .setDescription('Primer usuario')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('usuario2')
                .setDescription('Segundo usuario')
                .setRequired(false)),

    async execute(interaction) {
        const u1 = interaction.options.getUser('usuario1');
        const u2 = interaction.options.getUser('usuario2') || interaction.user;
        
        // Algoritmo "único": suma de IDs + fecha para que sea consistente por día pero "aleatorio"
        const seed = parseInt(u1.id.slice(-4)) + parseInt(u2.id.slice(-4)) + new Date().getDate();
        const lovePercent = (seed * 13) % 101;
        
        let heartIcon = '💔';
        let message = 'Tal vez en otra vida...';
        let color = 0xFF0000;

        if (lovePercent > 20) { heartIcon = '📉'; message = 'Hay algo de chispa, pero muy poca.'; color = 0xFFA500; }
        if (lovePercent > 50) { heartIcon = '⚖️'; message = 'Podría funcionar con esfuerzo.'; color = 0xFFFF00; }
        if (lovePercent > 75) { heartIcon = '💖'; message = '¡Hay una conexión real aquí!'; color = 0xFF69B4; }
        if (lovePercent > 90) { heartIcon = '🔥'; message = '¡ESTÁN DESTINADOS! ¡Boda a la vista!'; color = 0xFF0000; }

        const barLength = 10;
        const progress = Math.round((lovePercent / 100) * barLength);
        const emptyProgress = barLength - progress;
        const progressBar = '❤️'.repeat(progress) + '🖤'.repeat(emptyProgress);

        const embed = new EmbedBuilder()
            .setTitle(`${heartIcon} Calculadora de Amor ${heartIcon}`)
            .setDescription(`Analizando la compatibilidad entre **${u1.username}** y **${u2.username}**...\n\n**Resultado:** ${lovePercent}%\n${progressBar}\n\n> ${message}`)
            .setColor(color)
            .setTimestamp()
            .setFooter({ text: 'Sasha Love System', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });
    },
};
