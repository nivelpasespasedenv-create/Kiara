const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('math')
        .setDescription('Resuelve una operación matemática')
        .addStringOption(opt =>
            opt.setName('operacion')
                .setDescription('Operación a resolver (ej: 2+2, 10*5, 100/4, 2**10)')
                .setRequired(true)),
    async execute(interaction) {
        const operacion = interaction.options.getString('operacion');
        const safe = /^[\d\s\+\-\*\/\.\(\)\%\^]+$/.test(operacion.replace(/\*\*/g, ''));
        if (!safe) {
            return interaction.reply({ content: '❌ Solo se permiten operaciones numéricas básicas.', flags: 64 });
        }
        try {
            const resultado = Function(`"use strict"; return (${operacion})`)();
            if (!isFinite(resultado)) throw new Error('Resultado no válido');
            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('🧮 Calculadora')
                .addFields(
                    { name: 'Operación', value: `\`${operacion}\``, inline: true },
                    { name: 'Resultado', value: `\`${resultado}\``, inline: true },
                )
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ No pude resolver esa operación. Revisa la sintaxis.', flags: 64 });
        }
    },
};
