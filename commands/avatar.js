const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Muestra el avatar de un usuario')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('El usuario del que quieres ver el avatar')
                .setRequired(false)),
    
    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        const user = interaction.options.getUser('usuario') || interaction.user;
        
        const embed = new EmbedBuilder()
            .setTitle(t('AVATAR_TITLE', lang, { user: user.username }))
            .setImage(user.displayAvatarURL({ size: 1024 }))
            .setColor('#ff6b9d');
        
        await interaction.reply({ embeds: [embed] });
    }
};