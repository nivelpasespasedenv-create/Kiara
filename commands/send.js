const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { parseEmojisInContent } = require('../utils/emojiParser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('send')
        .setDescription('Envía un mensaje personalizado a un canal')
        .addStringOption(option =>
            option.setName('mensaje')
                .setDescription('El mensaje a enviar')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal donde enviar el mensaje (opcional)')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('embed')
                .setDescription('Enviar como embed (opcional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('titulo')
                .setDescription('Título del embed (solo si embed está activado)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Color del embed en hexadecimal (ej: #ff0000)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('imagen')
                .setDescription('URL de la imagen para el embed')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const message = interaction.options.getString('mensaje');
        const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
        const useEmbed = interaction.options.getBoolean('embed') || false;
        const embedTitle = interaction.options.getString('titulo');
        const embedColor = interaction.options.getString('color');
        const embedImage = interaction.options.getString('imagen');

        // Verificar permisos del usuario
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            const noPermEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Sin Permisos')
                .setDescription('Necesitas permisos de "Gestionar Mensajes" para usar este comando.')
                .setTimestamp();

            return await interaction.reply({ embeds: [noPermEmbed], flags: 64 });
        }

        // Verificar permisos del bot en el canal objetivo
        const permissions = targetChannel.permissionsFor(interaction.guild.members.me);
        if (!permissions.has('SendMessages')) {
            const botNoPermEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Bot Sin Permisos')
                .setDescription(`No tengo permisos para enviar mensajes en ${targetChannel.toString()}`)
                .setTimestamp();

            return await interaction.reply({ embeds: [botNoPermEmbed], flags: 64 });
        }

        if (useEmbed && !permissions.has('EmbedLinks')) {
            const embedPermEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Sin Permisos de Embed')
                .setDescription(`No tengo permisos para enviar embeds en ${targetChannel.toString()}`)
                .setTimestamp();

            return await interaction.reply({ embeds: [embedPermEmbed], flags: 64 });
        }

        try {
            await interaction.deferReply({ flags: 64 });

            // Parsear emojis personalizados en el mensaje
            const parsedMessage = parseEmojisInContent(message, interaction.client) || message;

            let messageContent = {};

            if (useEmbed) {
                // Procesar color del embed
                let embedColorValue = '#0099ff'; // Color por defecto
                if (embedColor) {
                    const colorRegex = /^#[0-9A-F]{6}$/i;
                    if (colorRegex.test(embedColor)) {
                        embedColorValue = embedColor;
                    }
                }

                const embed = new EmbedBuilder()
                    .setColor(embedColorValue)
                    .setDescription(parsedMessage)
                    .setFooter({ 
                        text: `Enviado por ${interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                    })
                    .setTimestamp();

                if (embedTitle) {
                    embed.setTitle(embedTitle);
                }

                if (embedImage) {
                    try {
                        // Verificar que sea una URL válida de imagen (básico)
                        new URL(embedImage);
                        embed.setImage(embedImage);
                    } catch (e) {
                        console.error('URL de imagen inválida en /send:', embedImage);
                    }
                }

                messageContent = { embeds: [embed] };
            } else {
                messageContent = { content: parsedMessage };
            }

            // Enviar el mensaje al canal objetivo
            await targetChannel.send(messageContent);

            // Confirmar el envío
            const confirmEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Mensaje Enviado')
                .setDescription(`Mensaje enviado exitosamente en ${targetChannel.toString()}`)
                .addFields(
                    { name: '📝 Contenido', value: message.length > 100 ? message.substring(0, 100) + '...' : message, inline: false },
                    { name: '📍 Canal', value: targetChannel.toString(), inline: true },
                    { name: '🎨 Formato', value: useEmbed ? 'Embed' : 'Texto plano', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [confirmEmbed] });

            // Log del mensaje enviado
            console.log(`Mensaje enviado por ${interaction.user.username} en ${targetChannel.name}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);

        } catch (error) {
            console.error('Error enviando mensaje:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('No pude enviar el mensaje. Verifica los permisos del bot.')
                .addFields(
                    { name: '🔍 Detalles del error', value: error.message || 'Error desconocido', inline: false }
                )
                .setTimestamp();

            // Usar editReply si ya se hizo defer, o followUp si hay error en defer
            try {
                await interaction.editReply({ embeds: [errorEmbed] });
            } catch (editError) {
                // Si editReply falla, intentar followUp
                try {
                    await interaction.followUp({ embeds: [errorEmbed], flags: 64 });
                } catch (followUpError) {
                    console.error('Error enviando mensaje de error:', followUpError);
                }
            }
        }
    },
};