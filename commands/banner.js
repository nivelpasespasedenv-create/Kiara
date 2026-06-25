const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banner')
        .setDescription('Muestra el banner de un usuario o su color de perfil')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('El usuario del que quieres ver el banner')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('usuario') || interaction.user;

        const user = await interaction.client.users.fetch(targetUser.id, { force: true });

        const bannerUrl = user.bannerURL({ size: 4096, dynamic: true });

        if (bannerUrl) {
            const embed = new EmbedBuilder()
                .setTitle(`🖼️ Banner de ${user.username}`)
                .setImage(bannerUrl)
                .setColor(user.accentColor || '#ff69b4')
                .setFooter({ text: `ID: ${user.id}` })
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        }

        const accentColor = user.accentColor;

        if (accentColor) {
            const hex = `#${accentColor.toString(16).padStart(6, '0')}`;

            const embed = new EmbedBuilder()
                .setTitle(`🎨 Color de perfil de ${user.username}`)
                .setDescription(`Este usuario no tiene banner con Nitro, pero su color de perfil es:\n\n**${hex}**`)
                .setColor(accentColor)
                .setFooter({ text: `ID: ${user.id}` })
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🖼️ Banner de ${user.username}`)
            .setDescription('Este usuario no tiene banner ni color de perfil configurado.')
            .setColor('#2b2d31')
            .setFooter({ text: `ID: ${user.id}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
