const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create_role')
        .setDescription('Crea un nuevo rol en el servidor')
        .addStringOption(option => 
            option.setName('nombre')
                .setDescription('Nombre del nuevo rol')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('color')
                .setDescription('Color en hexadecimal (ej: #ff0000)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const name = interaction.options.getString('nombre');
        const color = interaction.options.getString('color') || '#99aab5';

        try {
            const role = await interaction.guild.roles.create({
                name: name,
                color: color,
                reason: `Creado por ${interaction.user.tag}`
            });

            const embed = new EmbedBuilder()
                .setTitle('✅ Rol Creado')
                .setDescription(`Se ha creado el rol **${role.name}** correctamente.`)
                .setColor(role.color)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ content: '❌ Hubo un error al crear el rol. Revisa mis permisos.', ephemeral: true });
        }
    },
};
