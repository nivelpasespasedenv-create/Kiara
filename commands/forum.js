const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forum')
        .setDescription('Gestión de foros y etiquetas')
        .addSubcommand(subcommand =>
            subcommand
                .setName('post')
                .setDescription('Crea una publicación en un foro con etiquetas')
                .addChannelOption(option => option.setName('foro').setDescription('Canal de foro').addChannelTypes(ChannelType.GuildForum).setRequired(true))
                .addStringOption(option => option.setName('titulo').setDescription('Título del post').setRequired(true))
                .addStringOption(option => option.setName('contenido').setDescription('Contenido del post').setRequired(true))
                .addStringOption(option => option.setName('etiquetas').setDescription('Nombres de etiquetas separadas por coma (opcional)')))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageThreads),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'post') {
            const forum = interaction.options.getChannel('foro');
            const title = interaction.options.getString('titulo');
            const content = interaction.options.getString('contenido');
            const tagsInput = interaction.options.getString('etiquetas');

            const appliedTags = [];
            if (tagsInput) {
                const tagNames = tagsInput.split(',').map(t => t.trim().toLowerCase());
                const availableTags = forum.availableTags;
                
                for (const name of tagNames) {
                    const foundTag = availableTags.find(t => t.name.toLowerCase() === name);
                    if (foundTag) appliedTags.push(foundTag.id);
                }
            }

            try {
                const post = await forum.threads.create({
                    name: title,
                    message: { content: content },
                    appliedTags: appliedTags,
                });

                const embed = new EmbedBuilder()
                    .setTitle('🏛️ Publicación en Foro')
                    .setDescription(`Se ha creado el post: ${post.thread}`)
                    .setColor('#FEE75C')
                    .addFields({ name: 'Etiquetas aplicadas', value: appliedTags.length > 0 ? appliedTags.length.toString() : 'Ninguna' });

                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: 'Hubo un error al crear la publicación. Asegúrate de que el bot tenga permisos y las etiquetas sean válidas.', ephemeral: true });
            }
        }
    },
};
