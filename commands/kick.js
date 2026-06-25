const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulsa a un miembro del servidor')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Usuario a expulsar')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('razon')
                .setDescription('Razón de la expulsión')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const user = interaction.options.getMember('usuario');
        const reason = interaction.options.getString('razon') || 'No se especificó una razón.';

        if (!user) return interaction.reply({ content: '❌ No se pudo encontrar a ese usuario.', ephemeral: true });
        if (!user.kickable) return interaction.reply({ content: '❌ No puedo expulsar a este usuario. Puede que tenga un rol superior al mío.', ephemeral: true });

        try {
            await user.kick(reason);
            
            const embed = new EmbedBuilder()
                .setTitle('👞 Usuario Expulsado')
                .setDescription(`**${user.user.tag}** ha sido expulsado.`)
                .addFields({ name: 'Razón', value: reason })
                .setColor(0xffa500)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ content: '❌ Hubo un error al intentar expulsar al usuario.', ephemeral: true });
        }
    },
};
