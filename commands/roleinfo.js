const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleinfo')
        .setDescription('Muestra información detallada de un rol')
        .addRoleOption(opt =>
            opt.setName('rol').setDescription('Rol a consultar').setRequired(true)),
    async execute(interaction) {
        const rol = interaction.options.getRole('rol');
        const miembros = interaction.guild.members.cache.filter(m => m.roles.cache.has(rol.id)).size;
        const perms = rol.permissions.toArray().slice(0, 5).join(', ') || 'Ninguno';
        const embed = new EmbedBuilder()
            .setColor(rol.color || '#7289DA')
            .setTitle(`🎭 Rol: ${rol.name}`)
            .addFields(
                { name: '🆔 ID', value: rol.id, inline: true },
                { name: '🎨 Color', value: rol.hexColor, inline: true },
                { name: '👥 Miembros', value: `${miembros}`, inline: true },
                { name: '📊 Posición', value: `${rol.position}`, inline: true },
                { name: '💎 Mentionable', value: rol.mentionable ? 'Sí' : 'No', inline: true },
                { name: '📌 Separado', value: rol.hoist ? 'Sí' : 'No', inline: true },
                { name: '🔑 Permisos (primeros 5)', value: perms },
                { name: '📅 Creado', value: `<t:${Math.floor(rol.createdTimestamp / 1000)}:R>`, inline: true },
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
