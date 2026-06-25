const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { getUserRank, getLeaderboard, setLevelChannel } = require('../utils/levelSystem');
const { generateRankCard, getUserTheme, setUserTheme, getUserCardName, setUserCardName, THEMES } = require('../utils/levelUpCard');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nivel')
        .setDescription('Sistema de niveles y XP del servidor')
        .addSubcommand(sub => sub
            .setName('rank')
            .setDescription('Ver tu nivel y XP en el servidor')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(false)))
        .addSubcommand(sub => sub
            .setName('top')
            .setDescription('Top 10 usuarios con más XP en el servidor'))
        .addSubcommand(sub => sub
            .setName('setcanal')
            .setDescription('Configurar el canal de anuncios de subida de nivel')
            .addChannelOption(o => o.setName('canal').setDescription('Canal de anuncios').setRequired(true)))
        .addSubcommand(sub => sub
            .setName('editcard')
            .setDescription('Personalizar tu tarjeta de nivel (tema y nombre)')
            .addStringOption(o => o
                .setName('nombre')
                .setDescription('Nombre personalizado que aparecerá en tu tarjeta (máx. 20 caracteres)')
                .setRequired(false)
                .setMaxLength(20))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        try {

        if (sub === 'rank') {
            await interaction.deferReply();
            const target = interaction.options.getUser('usuario') || interaction.user;
            const data = await getUserRank(interaction.guildId, target.id);

            if (!data) {
                return interaction.editReply(`<a:noveri:1491231468658360502> ${target.username} aún no tiene XP en este servidor. ¡Empieza a chatear!`);
            }

            const themeName = getUserTheme(target.id);
            const customName = getUserCardName(target.id);

            try {
                const cardBuffer = await generateRankCard(target, data, themeName, customName);
                const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank.png' });
                const embed = new EmbedBuilder()
                    .setColor('#7289DA')
                    .setImage('attachment://rank.png')
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed], files: [attachment] });
            } catch {
                return interaction.editReply(`📊 **${target.username}** — Nivel ${data.level} | Rango #${data.rank} | ${data.xp} XP`);
            }
        }

        if (sub === 'top') {
            await interaction.deferReply();
            const rows = await getLeaderboard(interaction.guildId, 10);

            if (!rows.length) {
                return interaction.editReply('<a:user:1491232642912485468> Nadie tiene XP en este servidor todavía. ¡Sean los primeros en chatear!');
            }

            const lines = await Promise.all(rows.map(async (row, i) => {
                let member;
                try { member = await interaction.guild.members.fetch(row.user_id); } catch { member = null; }
                const name = member?.displayName || member?.user?.username || `<@${row.user_id}>`;
                const medal = MEDALS[i] || `**${i + 1}.**`;
                return `${medal} **${name}** — Lv. ${row.level} · ${row.xp} XP`;
            }));

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('<a:premio:1491232032553046126> Tabla de Clasificación')
                .setDescription(lines.join('\n'))
                .setThumbnail(interaction.guild.iconURL())
                .setFooter({ text: 'Top 10 usuarios por XP en este servidor' })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        if (sub === 'setcanal') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '<a:noveri:1491231468658360502> Necesitas permisos de Administrar Servidor.', flags: 64 });
            }
            await interaction.deferReply({ flags: 64 });
            const channel = interaction.options.getChannel('canal');
            await setLevelChannel(interaction.guildId, channel.id);

            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('<:staff:1491233454615167047> Canal de Niveles Configurado')
                .setDescription(`<a:verifi:1491230904415289426> Las subidas de nivel se anunciarán en ${channel}.`)
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        if (sub === 'editcard') {
            await interaction.deferReply({ flags: 64 });
            const userId = interaction.user.id;

            // Guardar nombre si fue proporcionado
            const nombreInput = interaction.options.getString('nombre');
            if (nombreInput !== null) {
                setUserCardName(userId, nombreInput);
            }

            const currentTheme = getUserTheme(userId);
            const customName = getUserCardName(userId);

            // Generar previews de todos los temas
            const userData = await getUserRank(interaction.guildId, userId);
            const sampleData = userData || { level: 5, xp: 1250, rank: 1, percentage: 62, current: 450, needed: 725 };

            const files = [];
            const themeKeys = Object.keys(THEMES);

            for (const key of themeKeys) {
                try {
                    const buf = await generateRankCard(interaction.user, sampleData, key, customName);
                    files.push(new AttachmentBuilder(buf, { name: `preview_${key}.png` }));
                } catch {}
            }

            // 2 filas de botones (máx 5 por fila)
            const row1 = new ActionRowBuilder().addComponents(
                ...themeKeys.slice(0, 4).map(key =>
                    new ButtonBuilder()
                        .setCustomId(`theme_${key}_${userId}`)
                        .setLabel(THEMES[key].name)
                        .setStyle(key === currentTheme ? ButtonStyle.Primary : ButtonStyle.Secondary)
                )
            );
            const row2 = new ActionRowBuilder().addComponents(
                ...themeKeys.slice(4).map(key =>
                    new ButtonBuilder()
                        .setCustomId(`theme_${key}_${userId}`)
                        .setLabel(THEMES[key].name)
                        .setStyle(key === currentTheme ? ButtonStyle.Primary : ButtonStyle.Secondary)
                )
            );

            const nameDisplay = customName ? `**${customName}**` : `*(sin nombre personalizado)*`;
            const embed = new EmbedBuilder()
                .setColor('#7289DA')
                .setTitle('🎨 Personaliza tu tarjeta de nivel')
                .setDescription(
                    `Elige un tema haciendo clic en los botones de abajo.\n\n` +
                    `🖊️ **Nombre en tarjeta:** ${nameDisplay}\n` +
                    `🎨 **Tema actual:** ${THEMES[currentTheme].name}\n\n` +
                    `Para cambiar el nombre usa:\n\`/nivel editcard nombre:TuNombre\`\n\n` +
                    `Así se verán los ${themeKeys.length} temas con tu perfil:`
                )
                .setTimestamp();

            return interaction.editReply({ embeds: [embed], files, components: [row1, row2] });
        }

        } catch (error) {
            console.error('Error en comando /nivel:', error);
            const msg = '<a:noveri:1491231468658360502> Ocurrió un error al acceder a los datos de niveles. Inténtalo de nuevo.';
            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({ content: msg });
            }
            return interaction.reply({ content: msg, flags: 64 });
        }
    },
};
