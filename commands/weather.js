const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Consulta el clima de cualquier ciudad')
        .addStringOption(opt =>
            opt.setName('ciudad')
                .setDescription('Nombre de la ciudad')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const ciudad = interaction.options.getString('ciudad');
        try {
            const res = await fetch(`https://wttr.in/${encodeURIComponent(ciudad)}?format=j1`);
            if (!res.ok) throw new Error('Ciudad no encontrada');
            const data = await res.json();
            const cc = data.current_condition[0];
            const area = data.nearest_area[0];
            const lugar = `${area.areaName[0].value}, ${area.country[0].value}`;
            const temp = cc.temp_C;
            const sensacion = cc.FeelsLikeC;
            const humedad = cc.humidity;
            const viento = cc.windspeedKmph;
            const desc = cc.weatherDesc[0].value;

            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle(`🌤️ Clima en ${lugar}`)
                .setDescription(`**${desc}**`)
                .addFields(
                    { name: '🌡️ Temperatura', value: `${temp}°C`, inline: true },
                    { name: '🤔 Sensación', value: `${sensacion}°C`, inline: true },
                    { name: '💧 Humedad', value: `${humedad}%`, inline: true },
                    { name: '💨 Viento', value: `${viento} km/h`, inline: true },
                )
                .setFooter({ text: 'Datos de wttr.in' })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('❌ No pude obtener el clima. Verifica el nombre de la ciudad.');
        }
    },
};
