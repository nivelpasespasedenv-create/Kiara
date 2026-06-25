const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOpenAI } = require('../utils/openai');


const EXCLUDED_IDS = ['766405066860527688'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('almagemela')
        .setDescription('Descubre quién es tu alma gemela en el servidor 💞'),

    async execute(interaction) {
        await interaction.deferReply();

        await interaction.guild.members.fetch();

        const eligible = interaction.guild.members.cache.filter(member =>
            !member.user.bot &&
            member.id !== interaction.user.id &&
            !EXCLUDED_IDS.includes(member.id)
        );

        if (eligible.size === 0) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('💞 Alma Gemela')
                        .setDescription('No hay nadie más en el servidor con quien hacer la búsqueda. 😢')
                        .setColor('#ff69b4')
                        .setTimestamp()
                ]
            });
        }

        const randomMember = eligible.random();
        const author = interaction.user.username;
        const matched = randomMember.user.username;

        let revelation;
        try {
            const aiResult = await getOpenAI().chat.completions.create({
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: `Eres un oráculo romántico y dramático. Revela de forma creativa y poética (2-3 oraciones) que "${author}" y "${matched}" son almas gemelas. Varía el estilo: a veces místico, a veces tierno, a veces gracioso. Menciona sus nombres.`
                }],
                max_tokens: 80,
                temperature: 1.1,
            });
            revelation = aiResult.choices[0].message.content.trim();
        } catch {
            revelation = `✨ Las estrellas han hablado, **${author}**...\n\n¡Tu alma gemela es <@${randomMember.id}>! 💘\n\n> *El universo los unió por una razón especial.* 🌌`;
        }

        const embed = new EmbedBuilder()
            .setTitle('💞 ¡Encontraste tu Alma Gemela!')
            .setDescription(revelation.replace(matched, `<@${randomMember.id}>`))
            .setThumbnail(randomMember.user.displayAvatarURL({ dynamic: true }))
            .setColor('#ff69b4')
            .setFooter({ text: 'Sasha Soul System ✦', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
