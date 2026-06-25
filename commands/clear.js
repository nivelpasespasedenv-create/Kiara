const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Elimina una cantidad específica de mensajes')
        .addIntegerOption(option =>
            option.setName('cantidad')
                .setDescription('Número de mensajes a eliminar (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(0), // Solo para admin/mod

    async execute(interaction) {
        const amount = interaction.options.getInteger('cantidad');

        if (!interaction.member.permissions.has('ManageMessages')) {
            return interaction.reply({ content: '❌ No tienes permisos para gestionar mensajes.', flags: 64 });
        }

        try {
            // Discord requiere que difiramos la respuesta si bulkDelete tarda o si queremos responder después
            // Pero como bulkDelete es rápido para < 100 mensajes, podemos intentar hacerlo directamente.
            // El problema suele ser que bulkDelete(amount) borra 'amount' mensajes ADEMÁS del comando si no se maneja bien.
            // En Slash Commands, la interacción no es un "mensaje" físico en el chat de la misma forma, 
            // pero bulkDelete filtra mensajes de más de 14 días.

            const deleted = await interaction.channel.bulkDelete(amount, true);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setDescription(`✅ Se han eliminado **${deleted.size}** mensajes correctamente.`)
                .setFooter({ text: 'Nota: Mensajes con más de 14 días no pueden ser eliminados en masa.' });

            await interaction.reply({ embeds: [embed], flags: 64 });
            
        } catch (error) {
            console.error('Error en clear:', error);
            if (error.code === 50034) {
                return await interaction.reply({ content: '❌ No puedo eliminar mensajes con más de 14 días de antigüedad.', flags: 64 });
            }
            await interaction.reply({ content: '❌ Hubo un error al intentar eliminar los mensajes. Verifica que tengo permisos de "Gestionar Mensajes".', flags: 64 });
        }
    },
};
