const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('md')
        .setDescription('Envía un mensaje privado a un usuario')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario al que enviar el mensaje privado')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mensaje')
                .setDescription('Mensaje a enviar al usuario')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('anonimo')
                .setDescription('Enviar mensaje anónimo (solo moderadores)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('usuario');
            const messageContent = interaction.options.getString('mensaje');
            const isAnonymous = interaction.options.getBoolean('anonimo') || false;

            // Verificar que no se esté intentando enviar mensaje a sí mismo
            if (targetUser.id === interaction.user.id) {
                const selfMessageEmbed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('<a:noveri:1491231468658360502> Error')
                    .setDescription('No puedes enviarte un mensaje privado a ti mismo.')
                    .setTimestamp();

                return await interaction.reply({ embeds: [selfMessageEmbed], ephemeral: true });
            }

            // Verificar que no se esté intentando enviar mensaje a un bot
            if (targetUser.bot) {
                const botMessageEmbed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('<a:noveri:1491231468658360502> Error')
                    .setDescription('No puedes enviar mensajes privados a otros bots.')
                    .setTimestamp();

                return await interaction.reply({ embeds: [botMessageEmbed], ephemeral: true });
            }

            // Verificar permisos para mensajes anónimos
            if (isAnonymous && !interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                const noPermissionEmbed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('<a:noveri:1491231468658360502> Sin permisos')
                    .setDescription('Solo los moderadores pueden enviar mensajes anónimos.')
                    .setTimestamp();

                return await interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
            }

            // Crear embed del mensaje privado
            const dmEmbed = new EmbedBuilder()
                .setColor('#4a90e2')
                .setTitle('📩 Mensaje privado')
                .setDescription(messageContent)
                .setTimestamp();

            // Configurar autor según si es anónimo o no
            if (isAnonymous) {
                dmEmbed.setAuthor({
                    name: `Mensaje anónimo desde ${interaction.guild.name}`,
                    iconURL: interaction.guild.iconURL() || undefined
                });
                dmEmbed.setFooter({
                    text: 'Mensaje anónimo • No responder a este mensaje',
                    iconURL: interaction.guild.iconURL() || undefined
                });
            } else {
                dmEmbed.setAuthor({
                    name: `${interaction.user.displayName} desde ${interaction.guild.name}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                });
                dmEmbed.setFooter({
                    text: `Enviado por ${interaction.user.username} • ${interaction.guild.name}`,
                    iconURL: interaction.guild.iconURL() || undefined
                });
            }

            // Añadir información adicional
            dmEmbed.addFields(
                {
                    name: '🏠 Servidor',
                    value: interaction.guild.name,
                    inline: true
                },
                {
                    name: '📅 Fecha',
                    value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                    inline: true
                }
            );

            try {
                // Intentar enviar el mensaje privado
                await targetUser.send({ embeds: [dmEmbed] });

                // Confirmar envío exitoso
                const successEmbed = new EmbedBuilder()
                    .setColor('#51cf66')
                    .setTitle('<a:verifi:1491230904415289426> Mensaje enviado')
                    .setDescription(`Tu mensaje privado fue enviado exitosamente a **${targetUser.displayName}**.`)
                    .addFields(
                        {
                            name: '<a:user:1491232642912485468> Destinatario',
                            value: `${targetUser.displayName} (${targetUser.username})`,
                            inline: true
                        },
                        {
                            name: '📝 Mensaje',
                            value: messageContent.length > 100 ? 
                                   `${messageContent.substring(0, 100)}...` : 
                                   messageContent,
                            inline: false
                        },
                        {
                            name: '<:privado:1491236768761123047> Privacidad',
                            value: isAnonymous ? '<:privado:1491236768761123047> Anónimo' : '<a:user:1491232642912485468> Identificado',
                            inline: true
                        }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [successEmbed], ephemeral: true });

                // Log del mensaje enviado
                console.log(`Mensaje privado enviado por ${interaction.user.username} a ${targetUser.username} en ${interaction.guild.name}${isAnonymous ? ' (anónimo)' : ''}`);

            } catch (dmError) {
                console.error('Error enviando mensaje privado:', dmError);

                // Manejar diferentes tipos de errores
                let errorMessage = 'No pude enviar el mensaje privado.';
                
                if (dmError.code === 50007) {
                    errorMessage = 'El usuario tiene los mensajes privados desactivados o no acepta mensajes de usuarios del servidor.';
                } else if (dmError.code === 50013) {
                    errorMessage = 'No tengo permisos para enviar mensajes a este usuario.';
                } else if (dmError.code === 40003) {
                    errorMessage = 'El usuario no está disponible para recibir mensajes.';
                }

                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('<a:noveri:1491231468658360502> Error al enviar mensaje')
                    .setDescription(errorMessage)
                    .addFields(
                        {
                            name: '<:staff:1491233454615167047> Posibles soluciones',
                            value: '• El usuario debe activar mensajes privados de miembros del servidor\n• El usuario debe aceptar solicitudes de amistad\n• Verificar que el usuario no tenga bloqueado al bot',
                            inline: false
                        },
                        {
                            name: '<a:user:1491232642912485468> Usuario objetivo',
                            value: `${targetUser.displayName} (${targetUser.username})`,
                            inline: true
                        }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

        } catch (error) {
            console.error('Error en comando md:', error);
            
            const generalErrorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('<a:noveri:1491231468658360502> Error del sistema')
                .setDescription('Ocurrió un error inesperado al procesar el comando.')
                .addFields({
                    name: '🔧 Acción sugerida',
                    value: 'Inténtalo de nuevo en unos momentos.',
                    inline: false
                })
                .setTimestamp();

            try {
                await interaction.reply({ embeds: [generalErrorEmbed], ephemeral: true });
            } catch (e) {
                console.error('Error enviando mensaje de error:', e);
            }
        }
    },
};
