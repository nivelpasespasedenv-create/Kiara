const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('confession')
        .setDescription('Envía una confesión anónima al canal configurado 🤫')
        .addStringOption(option => 
            option.setName('mensaje')
                .setDescription('Tu confesión (será totalmente anónima)')
                .setRequired(true)),

    async execute(interaction) {
        const message = interaction.options.getString('mensaje');
        
        // Buscamos un canal llamado 'confesiones' o similar
        const confessionChannel = interaction.guild.channels.cache.find(ch => 
            ch.name.toLowerCase().includes('confesion') || ch.name.toLowerCase().includes('confession')
        );

        if (!confessionChannel) {
            return interaction.reply({ 
                content: '❌ No se encontró un canal de confesiones. Crea uno que se llame "confesiones" para usar este comando.', 
                ephemeral: true 
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🤫 Nueva Confesión Anónima')
            .setDescription(`"${message}"`)
            .setColor(0x2B2D31)
            .setTimestamp()
            .setFooter({ text: 'Alguien ha confesado algo...' });

        try {
            await confessionChannel.send({ embeds: [embed] });
            await interaction.reply({ content: '✅ Tu confesión ha sido enviada de forma anónima.', ephemeral: true });
        } catch (error) {
            await interaction.reply({ content: '❌ Hubo un error al enviar la confesión.', ephemeral: true });
        }
    },
};
