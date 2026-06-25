const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stealemoji')
        .setDescription('Añade un emoji de otro servidor a este servidor')
        .addStringOption(opt =>
            opt.setName('emoji')
                .setDescription('Emoji, ID o formato <:emoji:id>')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('nuevo_nombre')
                .setDescription('Nuevo nombre (opcional)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers),

    async execute(interaction) {

        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
            return interaction.reply({
                content: '❌ Necesitas permisos de "Gestionar Emojis".',
                flags: 64
            });
        }

        await interaction.deferReply();

        const input = interaction.options.getString('emoji');
        const nuevoNombreInput = interaction.options.getString('nuevo_nombre');

        let emoji = null;
        let emojiId = null;
        let emojiName = null;
        let isAnimated = false;

        // 🔥 Detectar formato <:name:id> o <a:name:id>
        const match = input.match(/^<a?:([\w_]+):(\d+)>$/);

        if (match) {
            emojiName = match[1];
            emojiId = match[2];
            isAnimated = input.startsWith('<a:');
        }

        // 🔥 Si es ID directo
        else if (/^\d+$/.test(input)) {
            emojiId = input;
        }

        // 🔥 Buscar en cache por nombre
        else {
            emoji = interaction.client.emojis.cache.find(e =>
                e.name.toLowerCase() === input.toLowerCase()
            );

            if (emoji) {
                emojiId = emoji.id;
                emojiName = emoji.name;
                isAnimated = emoji.animated;
            }
        }

        // 🔥 Fetch si no está en cache
        if (!emoji && emojiId) {
            try {
                emoji = await interaction.client.emojis.fetch(emojiId);
                emojiName = emoji.name;
                isAnimated = emoji.animated;
            } catch {}
        }

        if (!emojiId) {
            return interaction.editReply('❌ No pude identificar el emoji.');
        }

        const finalName = (nuevoNombreInput || emojiName || 'emoji')
            .replace(/[^a-zA-Z0-9_]/g, '_');

        try {

            // 🔥 URL correcta (GIF o PNG)
            const imageURL = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}?size=256`;

            const newEmoji = await interaction.guild.emojis.create({
                attachment: imageURL,
                name: finalName,
            });

            const emojiStr = newEmoji.animated
                ? `<a:${newEmoji.name}:${newEmoji.id}>`
                : `<:${newEmoji.name}:${newEmoji.id}>`;

            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ Emoji Añadido')
                .setDescription(`Emoji ${emojiStr} añadido correctamente.`)
                .setThumbnail(imageURL)
                .addFields(
                    { name: '📛 Nombre', value: newEmoji.name, inline: true },
                    { name: '🆔 ID', value: newEmoji.id, inline: true },
                    { name: '✨ Animado', value: newEmoji.animated ? 'Sí' : 'No', inline: true },
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (err) {

            let msg = err.message;

            if (msg.includes('Maximum number')) {
                msg = '❌ No hay espacio para más emojis en este servidor.';
            }

            if (msg.includes('Missing Permissions')) {
                msg = '❌ Me faltan permisos para añadir emojis.';
            }

            await interaction.editReply(`❌ Error: ${msg}`);
        }
    },
};
