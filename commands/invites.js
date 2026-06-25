const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('Muestra las invitaciones activas del servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: '❌ Necesitas "Gestionar Servidor" para ver las invitaciones.', flags: 64 });
        }
        await interaction.deferReply();
        const invites = await interaction.guild.invites.fetch();
        if (invites.size === 0) {
            return interaction.editReply('ℹ️ No hay invitaciones activas en este servidor.');
        }
        const sorted = [...invites.values()].sort((a, b) => b.uses - a.uses).slice(0, 10);
        const list = sorted.map((inv, i) =>
            `**${i + 1}.** [${inv.code}](${inv.url}) — **${inv.uses}** usos — por **${inv.inviter?.username || 'Desconocido'}** — expira: ${inv.expiresAt ? `<t:${Math.floor(inv.expiresAt.getTime() / 1000)}:R>` : 'Nunca'}`
        ).join('\n');
        const embed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle(`📨 Invitaciones de ${interaction.guild.name}`)
            .setDescription(list)
            .setFooter({ text: `Total: ${invites.size} invitación(es) • Top 10 por usos` })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};
