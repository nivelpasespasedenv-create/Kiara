const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Silencia (aisla) a un miembro por un tiempo determinado')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Usuario a silenciar')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('tiempo')
                .setDescription('Tiempo en minutos')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('razon')
                .setDescription('Razón del silencio')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const user = interaction.options.getMember('usuario');
        const time = interaction.options.getInteger('tiempo');
        const reason = interaction.options.getString('razon') || 'No se especificó una razón.';

        if (!user) return interaction.reply({ content: '❌ No se pudo encontrar a ese usuario.', ephemeral: true });
        if (!user.moderatable) return interaction.reply({ content: '❌ No puedo silenciar a este usuario.', ephemeral: true });

        try {
            await user.timeout(time * 60 * 1000, reason);
            
            const embed = new EmbedBuilder()
                .setTitle('🔇 Usuario Silenciado')
                .setDescription(`**${user.user.tag}** ha sido silenciado por ${time} minutos.`)
                .addFields({ name: 'Razón', value: reason })
                .setColor(0x808080)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ content: '❌ Hubo un error al intentar silenciar al usuario.', ephemeral: true });
        }
    },
};
