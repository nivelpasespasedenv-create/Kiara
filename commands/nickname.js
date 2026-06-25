const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nickname')
        .setDescription('Cambia el apodo de un usuario')
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Usuario').setRequired(true))
        .addStringOption(opt =>
            opt.setName('apodo')
                .setDescription('Nuevo apodo (dejar vacío para quitar el apodo)')
                .setMaxLength(32)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
            return interaction.reply({ content: '❌ No tienes permisos para gestionar apodos.', flags: 64 });
        }
        const target = interaction.options.getMember('usuario');
        const apodo = interaction.options.getString('apodo') || null;
        try {
            await target.setNickname(apodo);
            const embed = new EmbedBuilder()
                .setColor('#7289DA')
                .setTitle('✏️ Apodo Actualizado')
                .setDescription(
                    apodo
                        ? `El apodo de **${target.user.username}** se cambió a **${apodo}**.`
                        : `Se eliminó el apodo de **${target.user.username}**.`
                )
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ No pude cambiar el apodo. Verifica la jerarquía de roles.', flags: 64 });
        }
    },
};
