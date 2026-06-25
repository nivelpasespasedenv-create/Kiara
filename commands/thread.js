const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('thread')
        .setDescription('Gestión de hilos (threads)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Crea un nuevo hilo')
                .addStringOption(option => option.setName('nombre').setDescription('Nombre del hilo').setRequired(true))
                .addChannelOption(option => option.setName('canal').setDescription('Canal donde crear el hilo').addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('archive')
                .setDescription('Archiva el hilo actual'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageThreads),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const name = interaction.options.getString('nombre');
            const channel = interaction.options.getChannel('canal') || interaction.channel;

            if (!channel.threads) {
                return interaction.reply({ content: 'Este canal no soporta hilos.', ephemeral: true });
            }

            const thread = await channel.threads.create({
                name: name,
                autoArchiveDuration: 60,
                reason: `Hilo creado por ${interaction.user.tag}`,
            });

            const embed = new EmbedBuilder()
                .setTitle('🧵 Hilo Creado')
                .setDescription(`Se ha creado el hilo: ${thread}`)
                .setColor('#5865F2')
                .setFooter({ text: `Solicitado por ${interaction.user.tag}` });

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'archive') {
            if (!interaction.channel.isThread()) {
                return interaction.reply({ content: 'Este comando solo puede usarse dentro de un hilo.', ephemeral: true });
            }

            await interaction.channel.setArchived(true);
            return interaction.reply({ content: 'Hilo archivado.', ephemeral: true });
        }
    },
};
