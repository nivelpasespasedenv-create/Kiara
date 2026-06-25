const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    AutoModerationRuleEventType,
    AutoModerationRuleTriggerType,
    AutoModerationRuleKeywordPresetType,
    AutoModerationActionType,
} = require('discord.js');

const BOT_RULE_TAG = '[Sasha AutoMod]';

const CUSTOM_KEYWORDS = [
    'maldito', 'maldita', 'maldicion', 'hdp', 'hp', 'hpta',
    'tu madre', 'tu mae', 'a tu madre',
    'estupido', 'estupida', 'imbecil', 'inutil', 'retrasado', 'retrasada',
    'baboso', 'babosa', 'tarado', 'tarada', 'idiota',
    'vete al diablo', 'vete al carajo', 'muerete',
    'me vale', 'te odio',
    'puta', 'puto', 'mierda', 'cabrón', 'cabron', 'pendejo', 'pendeja',
    'chinga', 'chingada', 'verga', 'culero', 'culo', 'pinche',
    'zorra', 'perra', 'carajo', 'gonorrea', 'malparido',
    'hijueputa', 'huevon', 'cojones', 'joder', 'coño',
    'merda', 'caralho', 'porra', 'foda', 'buceta',
    'putain', 'merde', 'connard', 'salope',
    'cazzo', 'vaffanculo', 'stronzo', 'puttana',
    'scheisse', 'arschloch', 'wichser',
].filter(w => w.length <= 60);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automodsetup')
        .setDescription('Configura las reglas nativas de AutoMod de Discord en este servidor 🛡️')
        .addChannelOption(opt =>
            opt.setName('log')
                .setDescription('Canal donde se enviarán los avisos de AutoMod (opcional)')
                .setRequired(false))
        .addStringOption(opt =>
            opt.setName('accion')
                .setDescription('¿Qué quieres hacer?')
                .setRequired(false)
                .addChoices(
                    { name: '✅ Activar reglas', value: 'setup' },
                    { name: '❌ Eliminar reglas del bot', value: 'remove' },
                    { name: '📋 Ver reglas activas', value: 'list' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return await interaction.reply({
                content: '❌ Necesitas el permiso de **Gestionar Servidor** para usar este comando.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const accion = interaction.options.getString('accion') || 'setup';
        const logChannel = interaction.options.getChannel('log');
        const guild = interaction.guild;

        if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return await interaction.editReply({
                content: '❌ Necesito el permiso de **Gestionar Servidor** para crear reglas de AutoMod.'
            });
        }

        // ─── Listar reglas ────────────────────────────────────────────────────
        if (accion === 'list') {
            const rules = await guild.autoModerationRules.fetch();
            if (rules.size === 0) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('📋 Reglas de AutoMod')
                            .setDescription('No hay reglas de AutoMod activas en este servidor.')
                            .setColor('#95a5a6')
                    ]
                });
            }

            const fields = rules.map(r => ({
                name: r.name,
                value: `ID: \`${r.id}\` • ${r.enabled ? '✅ Activa' : '❌ Inactiva'}`,
                inline: false
            }));

            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`📋 Reglas de AutoMod (${rules.size})`)
                        .addFields(fields)
                        .setColor('#3498db')
                        .setTimestamp()
                ]
            });
        }

        // ─── Eliminar reglas del bot ──────────────────────────────────────────
        if (accion === 'remove') {
            const rules = await guild.autoModerationRules.fetch();
            const botRules = rules.filter(r => r.name.startsWith(BOT_RULE_TAG));

            if (botRules.size === 0) {
                return await interaction.editReply('ℹ️ No hay reglas creadas por Sasha en este servidor.');
            }

            let deleted = 0;
            for (const [, rule] of botRules) {
                await rule.delete().catch(() => {});
                deleted++;
            }

            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('🗑️ Reglas eliminadas')
                        .setDescription(`Se eliminaron **${deleted}** regla(s) de AutoMod creadas por Sasha.`)
                        .setColor('#e74c3c')
                        .setTimestamp()
                ]
            });
        }

        // ─── Crear/Actualizar reglas ──────────────────────────────────────────
        const existingRules = await guild.autoModerationRules.fetch();
        const botRules = existingRules.filter(r => r.name.startsWith(BOT_RULE_TAG));
        for (const [, rule] of botRules) {
            await rule.delete().catch(() => {});
        }

        const actions = [
            {
                type: AutoModerationActionType.BlockMessage,
                metadata: { customMessage: '🚨 Tu mensaje fue bloqueado por el AutoMod de Sasha.' }
            }
        ];

        if (logChannel) {
            actions.push({
                type: AutoModerationActionType.SendAlertMessage,
                metadata: { channel: logChannel }
            });
        }

        const created = [];
        const errors = [];

        // Regla 1: Filtros predefinidos de Discord (groserías, contenido sexual, insultos)
        try {
            await guild.autoModerationRules.create({
                name: `${BOT_RULE_TAG} Filtro General`,
                eventType: AutoModerationRuleEventType.MessageSend,
                triggerType: AutoModerationRuleTriggerType.KeywordPreset,
                triggerMetadata: {
                    presets: [
                        AutoModerationRuleKeywordPresetType.Profanity,
                        AutoModerationRuleKeywordPresetType.SexualContent,
                        AutoModerationRuleKeywordPresetType.Slurs,
                    ],
                    allowList: [],
                },
                actions,
                enabled: true,
                reason: 'Sasha AutoMod setup',
            });
            created.push('✅ Filtro General (groserías, contenido sexual e insultos de Discord)');
        } catch (e) {
            errors.push(`❌ Filtro General: ${e.message}`);
        }

        // Regla 2: Palabras clave en español y otros idiomas
        try {
            await guild.autoModerationRules.create({
                name: `${BOT_RULE_TAG} Palabras Personalizadas`,
                eventType: AutoModerationRuleEventType.MessageSend,
                triggerType: AutoModerationRuleTriggerType.Keyword,
                triggerMetadata: {
                    keywordFilter: CUSTOM_KEYWORDS,
                    regexPatterns: [],
                    allowList: [],
                },
                actions,
                enabled: true,
                reason: 'Sasha AutoMod setup',
            });
            created.push('✅ Palabras personalizadas (español, portugués, francés, etc.)');
        } catch (e) {
            errors.push(`❌ Palabras personalizadas: ${e.message}`);
        }

        // Regla 3: Anti spam de menciones
        try {
            await guild.autoModerationRules.create({
                name: `${BOT_RULE_TAG} Anti Spam Menciones`,
                eventType: AutoModerationRuleEventType.MessageSend,
                triggerType: AutoModerationRuleTriggerType.MentionSpam,
                triggerMetadata: { mentionTotalLimit: 6 },
                actions,
                enabled: true,
                reason: 'Sasha AutoMod setup',
            });
            created.push('✅ Anti spam de menciones (máx. 6 menciones por mensaje)');
        } catch (e) {
            errors.push(`❌ Anti menciones: ${e.message}`);
        }

        const embed = new EmbedBuilder()
            .setTitle('🛡️ AutoMod de Discord Configurado')
            .setColor(errors.length === 0 ? '#2ecc71' : '#f39c12')
            .setTimestamp()
            .setFooter({ text: 'Usa /automodsetup accion:Ver reglas para ver el estado', iconURL: interaction.client.user.displayAvatarURL() });

        if (created.length > 0) {
            embed.addFields({ name: '✅ Reglas creadas', value: created.join('\n'), inline: false });
        }
        if (errors.length > 0) {
            embed.addFields({ name: '⚠️ Errores', value: errors.join('\n'), inline: false });
        }
        if (logChannel) {
            embed.addFields({ name: '📢 Canal de avisos', value: `${logChannel}`, inline: false });
        }

        embed.setDescription(
            created.length > 0
                ? `Las reglas nativas de Discord están activas. Esto también contribuye a obtener la **insignia de AutoMod** en el perfil del bot. 🏅`
                : 'No se pudo crear ninguna regla. Verifica que el bot tenga permisos de **Gestionar Servidor**.'
        );

        await interaction.editReply({ embeds: [embed] });
    },
};
