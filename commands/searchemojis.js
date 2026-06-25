const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('searchemojis')
        .setDescription('Busca y muestra emojis disponibles en todos los servidores del bot')
        .addStringOption(option =>
            option.setName('nombre')
                .setDescription('Nombre del emoji a buscar (opcional)')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('animados')
                .setDescription('Mostrar solo emojis animados')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const searchName = interaction.options.getString('nombre')?.toLowerCase() || '';
        const onlyAnimated = interaction.options.getBoolean('animados') || false;

        // Fetch emojis dinamicamente de cada servidor para no depender del cache
        const allEmojis = [];
        const guilds = [...interaction.client.guilds.cache.values()];

        await Promise.all(guilds.map(async guild => {
            try {
                const fetched = await guild.emojis.fetch();
                fetched.forEach(e => allEmojis.push(e));
            } catch {
                // Si no se puede acceder a un servidor, se omite
            }
        }));

        // Filtrar según opciones
        let emojis = allEmojis;
        if (onlyAnimated) emojis = emojis.filter(e => e.animated);
        if (searchName) emojis = emojis.filter(e => e.name.toLowerCase().includes(searchName));

        // Eliminar duplicados por ID
        const seen = new Set();
        emojis = emojis.filter(e => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
        });

        if (emojis.length === 0) {
            const noResult = new EmbedBuilder()
                .setColor('#ff9500')
                .setTitle('🔍 Sin resultados')
                .setDescription(searchName
                    ? `No encontré emojis con el nombre **${searchName}**.`
                    : 'No hay emojis disponibles.')
                .setTimestamp();
            return interaction.editReply({ embeds: [noResult] });
        }

        const pageSize = 20;
        const pages = [];

        for (let i = 0; i < emojis.length; i += pageSize) {
            pages.push(emojis.slice(i, i + pageSize));
        }

        let currentPage = 0;

        function buildEmbed(page) {
            const slice = pages[page];
            const emojiList = slice.map(e => {
                const str = e.animated ? `<a:${e.name}:${e.id}>` : `<:${e.name}:${e.id}>`;
                return `${str} \`:${e.name}:\``;
            }).join('\n');

            return new EmbedBuilder()
                .setColor('#7289DA')
                .setTitle(searchName ? `🔍 Resultados para "${searchName}"` : '✨ Emojis Disponibles')
                .setDescription(
                    `Total: **${emojis.length}** emojis\n\n${emojiList}\n\n` +
                    `> Escribe \`:nombre_emoji:\` en cualquier mensaje para usarlo automáticamente.`
                )
                .setFooter({ text: `Página ${page + 1} / ${pages.length} • Bot en ${interaction.client.guilds.cache.size} servidores` })
                .setTimestamp();
        }

        function buildButtons(page) {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('emoji_prev')
                    .setLabel('◀ Anterior')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('emoji_next')
                    .setLabel('Siguiente ▶')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === pages.length - 1),
            );
        }

        const msg = await interaction.editReply({
            embeds: [buildEmbed(currentPage)],
            components: pages.length > 1 ? [buildButtons(currentPage)] : [],
        });

        if (pages.length <= 1) return;

        const collector = msg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async btn => {
            if (btn.user.id !== interaction.user.id) {
                return btn.reply({ content: '❌ Solo quien usó el comando puede navegar.', flags: 64 });
            }
            if (btn.customId === 'emoji_prev') currentPage = Math.max(0, currentPage - 1);
            if (btn.customId === 'emoji_next') currentPage = Math.min(pages.length - 1, currentPage + 1);
            await btn.update({
                embeds: [buildEmbed(currentPage)],
                components: [buildButtons(currentPage)],
            });
        });

        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => {});
        });
    },
};
