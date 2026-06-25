const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reaction')
        .setDescription('Reacciona a un mensaje con emoji o envía reacción')
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('Emoji para reaccionar (ej: 😂, ❤️, 🔥)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mensaje_id')
                .setDescription('ID del mensaje al que reaccionar (opcional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('mensaje_texto')
                .setDescription('Texto personalizado si no reaccionas a mensaje específico')
                .setRequired(false)),

    async execute(interaction) {
        try {
            const emoji = interaction.options.getString('emoji');
            const messageId = interaction.options.getString('mensaje_id');
            const customText = interaction.options.getString('mensaje_texto');
            const author = interaction.user;

            // Si se proporciona un ID de mensaje, reaccionar al mensaje
            if (messageId) {
                try {
                    const targetMessage = await interaction.channel.messages.fetch(messageId);
                    await targetMessage.react(emoji);
                    
                    const successEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('✅ Reacción Añadida')
                        .setDescription(`Reaccioné con ${emoji} al mensaje de ${targetMessage.author.username}`)
                        .setFooter({ text: `Reacción por ${author.username}` })
                        .setTimestamp();

                    return await interaction.reply({ embeds: [successEmbed], ephemeral: true });
                } catch (error) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Error')
                        .setDescription('No pude encontrar ese mensaje o reaccionar a él. Verifica que el ID sea correcto y que el mensaje esté en este canal.')
                        .setTimestamp();

                    return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }

            // Si no hay ID de mensaje, enviar como embed con reacción
            const reactionText = customText || `${author.username} reacciona con ${emoji}`;

            const embed = new EmbedBuilder()
                .setColor('#ff6b9d')
                .setTitle(`${emoji} Reacción`)
                .setDescription(reactionText)
                .setFooter({ 
                    text: `Reacción de ${author.username}`,
                    iconURL: author.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en comando reaction:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('No pude procesar tu reacción. Verifica que el emoji sea válido.')
                .setTimestamp();

            try {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            } catch (e) {
                console.error('Error enviando mensaje de error:', e);
            }
        }
    },
};