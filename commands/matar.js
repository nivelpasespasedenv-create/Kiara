const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOpenAI } = require('../utils/openai');
const { tAsync } = require('../utils/i18n');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('matar')
        .setDescription('Elimina a un usuario de manera divertida')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a eliminar')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const lang = interaction.lang || 'es';
        const target = interaction.options.getUser('usuario');
        const killer = interaction.user;

        if (target.id === killer.id) {
            const selfEmbed = new EmbedBuilder()
                .setColor('#ff9500')
                .setTitle('⚠️ ' + await tAsync('Autolesión Detectada', lang))
                .setDescription(await tAsync('KILL_SELF', lang))
                .setTimestamp();
            return await interaction.editReply({ embeds: [selfEmbed] });
        }

        if (target.id === interaction.client.user.id) {
            const belongsEmbed = new EmbedBuilder()
                .setTitle('💕 ¡Soy de alguien!')
                .setDescription(`Aww 🥺 lo siento, pero yo le pertenezco a <@766405066860527688>. ¡No puedes hacerme eso! 💋`)
                .setColor('#ff69b4')
                .setTimestamp();
            return await interaction.editReply({ embeds: [belongsEmbed] });
        }

        if (target.bot) {
            const botEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🤖 ' + await tAsync('Protección Anti-Bot', lang))
                .setDescription(await tAsync('KILL_BOT', lang))
                .setTimestamp();
            return await interaction.editReply({ embeds: [botEmbed] });
        }

        if (target.id === '766405066860527688') {
            const novaEmbed = new EmbedBuilder()
                .setTitle('💖 ¡Eso no puedes hacerlo!')
                .setDescription(`¡Oye! 😤 <@${target.id}> es **mi novia**, así que no puedes hacerle eso. ¡Busca a alguien más! 💋`)
                .setColor('#ff69b4')
                .setTimestamp();
            return await interaction.editReply({ embeds: [novaEmbed] });
        }

        let killMessage;
        try {
            const aiResult = await getOpenAI().chat.completions.create({
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: `Genera un mensaje divertido y creativo (1-2 oraciones) de cómo "${killer.username}" elimina a "${target.username}" de forma completamente absurda y graciosa. Varía el método cada vez: con magia, con comida, con un chiste malo, dramáticamente, etc. Es un juego, que sea gracioso.`
                }],
                max_tokens: 70,
                temperature: 1.2,
            });
            killMessage = aiResult.choices[0].message.content.trim();
        } catch {
            const fallbacks = [
                await tAsync('KILL_MSG_1', lang, { killer: killer.username, victim: target.username }),
                await tAsync('KILL_MSG_2', lang, { killer: killer.username, victim: target.username }),
            ];
            killMessage = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }

        const embed = new EmbedBuilder()
            .setColor('#8b0000')
            .setTitle(await tAsync('KILL_TITLE', lang))
            .setDescription(killMessage)
            .setThumbnail(target.displayAvatarURL())
            .setFooter({ text: await tAsync('KILL_FOOTER', lang) })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
