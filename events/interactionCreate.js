const { Events, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../utils/embeds');
const { getLanguage, translateText } = require('../utils/i18n');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        console.log(`🔍 INTERACCIÓN RECIBIDA - Tipo: ${interaction.type}`);
        console.log(`🔍 Usuario: ${interaction.user?.tag || 'Desconocido'}`);
        console.log(`🔍 Es comando slash: ${interaction.isChatInputCommand()}`);
        console.log(`🔍 Es botón: ${interaction.isButton()}`);
        
        // Inyectar idioma en TODAS las interacciones (comandos y botones)
        const interactionLang = await getLanguage(interaction.guildId).catch(() => 'es');
        interaction.lang = interactionLang;
        interaction.tr = async (text) => {
            if (!text || interactionLang === 'es') return text;
            return await translateText(text, interactionLang);
        };

        // Manejar interacciones de botones
        if (interaction.isButton()) {
            // Manejar botones de tema de tarjeta
            if (interaction.customId.startsWith('theme_')) {
                const parts = interaction.customId.split('_');
                const themeName = parts[1];
                const ownerId = parts[2];

                if (interaction.user.id !== ownerId) {
                    return interaction.reply({ content: '❌ Solo el dueño del comando puede cambiar su tema.', flags: 64 });
                }

                const { setUserTheme, getUserCardName, THEMES } = require('../utils/levelUpCard');
                setUserTheme(ownerId, themeName);

                const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                const themeKeys = Object.keys(THEMES);
                const row1 = new ActionRowBuilder().addComponents(
                    ...themeKeys.slice(0, 4).map(key =>
                        new ButtonBuilder()
                            .setCustomId(`theme_${key}_${ownerId}`)
                            .setLabel(THEMES[key].name)
                            .setStyle(key === themeName ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    )
                );
                const row2 = new ActionRowBuilder().addComponents(
                    ...themeKeys.slice(4).map(key =>
                        new ButtonBuilder()
                            .setCustomId(`theme_${key}_${ownerId}`)
                            .setLabel(THEMES[key].name)
                            .setStyle(key === themeName ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    )
                );

                const customName = getUserCardName(ownerId);
                const nameDisplay = customName ? `**${customName}**` : `*(sin nombre personalizado)*`;
                const updatedEmbed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('🎨 Personaliza tu tarjeta de nivel')
                    .setDescription(
                        `✅ Tema cambiado a **${THEMES[themeName].name}**\n\n` +
                        `🖊️ **Nombre en tarjeta:** ${nameDisplay}\n` +
                        `🎨 **Tema actual:** ${THEMES[themeName].name}\n\n` +
                        `Para cambiar el nombre usa:\n\`/nivel editcard nombre:TuNombre\``
                    )
                    .setTimestamp();

                return interaction.update({ embeds: [updatedEmbed], components: [row1, row2] });
            }

            // Manejar botones de ayuda
            if (interaction.customId.startsWith('help_')) {
                await this.handleHelpButtons(interaction);
                return;
            }
            
            // Manejar botones de roles
            if (interaction.customId.startsWith('role_')) {
                const roleId = interaction.customId.replace('role_', '');
                const role = interaction.guild.roles.cache.get(roleId);
                
                if (!role) {
                    const roleNotFoundEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle(await interaction.tr('❌ Rol No Encontrado'))
                        .setDescription(await interaction.tr('El rol configurado ya no existe en el servidor.'))
                        .setTimestamp();
                    
                    return await interaction.reply({ embeds: [roleNotFoundEmbed], flags: 64 });
                }

                // Verificar permisos del bot
                if (!interaction.guild.members.me.permissions.has('ManageRoles')) {
                    const noPermEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle(await interaction.tr('❌ Sin Permisos'))
                        .setDescription(await interaction.tr('No tengo permisos para gestionar roles.'))
                        .setTimestamp();
                    
                    return await interaction.reply({ embeds: [noPermEmbed], flags: 64 });
                }

                // Verificar jerarquía
                if (role.position >= interaction.guild.members.me.roles.highest.position) {
                    const hierarchyEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle(await interaction.tr('❌ Jerarquía Insuficiente'))
                        .setDescription(await interaction.tr('No puedo asignar este rol porque está por encima de mi posición.'))
                        .setTimestamp();
                    
                    return await interaction.reply({ embeds: [hierarchyEmbed], flags: 64 });
                }

                try {
                    const member = interaction.member;
                    
                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(role);
                        
                        const removedEmbed = new EmbedBuilder()
                            .setColor('#ff9500')
                            .setTitle(await interaction.tr('➖ Rol Removido'))
                            .setDescription(await interaction.tr(`Se te ha quitado el rol **${role.name}**`))
                            .setTimestamp();
                        
                        await interaction.reply({ embeds: [removedEmbed], flags: 64 });
                    } else {
                        await member.roles.add(role);
                        
                        const addedEmbed = new EmbedBuilder()
                            .setColor('#00ff00')
                            .setTitle(await interaction.tr('✅ Rol Asignado'))
                            .setDescription(await interaction.tr(`Se te ha asignado el rol **${role.name}**`))
                            .setTimestamp();
                        
                        await interaction.reply({ embeds: [addedEmbed], flags: 64 });
                    }
                } catch (error) {
                    console.error('Error asignando rol:', error);
                    
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle(await interaction.tr('❌ Error'))
                        .setDescription(await interaction.tr('No pude asignar el rol. Verifica los permisos.'))
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [errorEmbed], flags: 64 });
                }
                
                return;
            }
        }
        
        // Solo manejar comandos slash
        if (!interaction.isChatInputCommand()) {
            console.log(`⚠️ Interacción ignorada - No es comando slash`);
            return;
        }

        console.log(`📋 Comando recibido: /${interaction.commandName}`);
        const command = interaction.client.commands.get(interaction.commandName) || 
                        Array.from(interaction.client.commands.values()).find(cmd => 
                            cmd.alias === interaction.commandName || 
                            (Array.isArray(cmd.aliases) && cmd.aliases.includes(interaction.commandName)) ||
                            (cmd.data && cmd.data.name === interaction.commandName)
                        );

        if (!command) {
            console.error(`❌ No se encontró el comando: ${interaction.commandName}`);
            console.log(`📝 Comandos cargados en memoria:`, Array.from(interaction.client.commands.keys()));
            try {
                const notFoundMsg = await interaction.tr(`❌ El comando \`/${interaction.commandName}\` no está disponible o no se ha cargado correctamente.`);
                await interaction.reply({ content: notFoundMsg, flags: 64 });
            } catch (e) {}
            return;
        }

        try {
            console.log(`🚀 Ejecutando comando: ${interaction.commandName}`);

            await command.execute(interaction);
            
            // Log de uso del comando
            console.log(`📝 Comando completado: /${interaction.commandName} por ${interaction.user.tag} en ${interaction.guild?.name || 'DM'}`);
            
        } catch (error) {
            console.error(`❌ Error ejecutando el comando ${interaction.commandName}:`, error);

            const errMsg = await interaction.tr('Hubo un error al ejecutar este comando. Inténtalo de nuevo más tarde.');
            const errorEmbed = createErrorEmbed(errMsg);

            // Responder con error dependiendo del estado de la interacción
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ 
                        embeds: [errorEmbed], 
                        flags: 64 // Ephemeral flag
                    });
                } else {
                    await interaction.reply({ 
                        embeds: [errorEmbed], 
                        flags: 64 // Ephemeral flag
                    });
                }
            } catch (e) {
                console.error('Error enviando mensaje de error:', e);
            }
        }
    },

    async handleHelpButtons(interaction) {
        const { EmbedBuilder } = require('discord.js');
        const helpCommand = interaction.client.commands.get('ayuda');

        // Diferir inmediatamente para evitar expiración (Discord: 3s límite)
        await interaction.deferUpdate();

        const { translateBatch } = require('../utils/i18n');
        const lang = interaction.lang || 'es';
        const navButtons = await helpCommand.getNavButtons(lang, interaction.client);
        const buttonId = interaction.customId;

        if (buttonId === 'help_home') {
            const botName = interaction.client.user.username;
            const { translateBatch: tb } = require('../utils/i18n');
            const homeTexts = lang === 'es' ? [
                'Selecciona una categoría para explorar los comandos disponibles.',
                'YouTube, anime, IA, películas', 'Minecraft, Roblox', 'Abrazos, acciones, mood',
                'Trivia, dados, tragamonedas', 'Clima, traducir, info, recordatorios',
                'Ban, mute, warns, lock', 'NQN, buscar, robar emojis', '**104 comandos** disponibles',
                `${botName} • Selecciona una categoría`,
            ] : await tb([
                'Selecciona una categoría para explorar los comandos disponibles.',
                'YouTube, anime, IA, películas', 'Minecraft, Roblox', 'Abrazos, acciones, mood',
                'Trivia, dados, tragamonedas', 'Clima, traducir, info, recordatorios',
                'Ban, mute, warns, lock', 'NQN, buscar, robar emojis', '**104 comandos** disponibles',
                `${botName} • Selecciona una categoría`,
            ], lang);

            const titleHome = lang === 'es' ? `✨ Panel de Ayuda — ${botName}` : `✨ Help Panel — ${botName}`;
            const mainEmbed = new EmbedBuilder()
                .setTitle(titleHome)
                .setDescription(homeTexts[0])
                .setColor('#7289DA')
                .addFields(
                    { name: '🎬 Multimedia & IA', value: homeTexts[1], inline: true },
                    { name: '🎮 Gaming',           value: homeTexts[2], inline: true },
                    { name: '🎭 Social',            value: homeTexts[3], inline: true },
                    { name: '🎲 Juegos',            value: homeTexts[4], inline: true },
                    { name: '⚙️ Utilidades',        value: homeTexts[5], inline: true },
                    { name: '🛡️ Moderación',        value: homeTexts[6], inline: true },
                    { name: '✨ Emojis',            value: homeTexts[7], inline: true },
                    { name: '📊 Total',             value: homeTexts[8], inline: true },
                )
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setFooter({ text: homeTexts[9], iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.editReply({ embeds: [mainEmbed], components: navButtons });

        } else {
            const categoryMap = {
                'help_music': 'music', 'help_gaming': 'gaming',
                'help_social': 'social', 'help_utils': 'utils',
                'help_mod': 'mod', 'help_games': 'games', 'help_emojis': 'emojis'
            };
            const category = categoryMap[buttonId];
            if (category && helpCommand.createCategoryEmbed) {
                const categoryEmbed = await helpCommand.createCategoryEmbed(category, interaction);
                await interaction.editReply({ embeds: [categoryEmbed], components: navButtons });
            }
        }

        console.log(`🔘 Botón procesado: ${buttonId} por ${interaction.user.tag}`);
    }
};
