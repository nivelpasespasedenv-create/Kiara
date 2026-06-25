const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add_role')
        .setDescription('Añade un rol a un miembro')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Usuario al que añadir el rol')
                .setRequired(true))
        .addRoleOption(option => 
            option.setName('rol')
                .setDescription('Rol a añadir')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const user = interaction.options.getMember('usuario');
        const role = interaction.options.getRole('rol');

        try {
            if (user.roles.cache.has(role.id)) {
                return interaction.reply({ content: '❌ El usuario ya tiene ese rol.', ephemeral: true });
            }

            await user.roles.add(role);
            
            const embed = new EmbedBuilder()
                .setTitle('✅ Rol Añadido')
                .setDescription(`Se ha añadido el rol **${role.name}** a **${user.user.username}**.`)
                .setColor(role.color)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ content: '❌ No pude añadir el rol. Asegúrate de que mi rol esté por encima del que intentas dar.', ephemeral: true });
        }
    },
};
