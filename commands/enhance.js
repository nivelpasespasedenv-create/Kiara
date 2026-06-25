const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const Jimp = require('jimp');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enhance')
        .setDescription('Mejora la calidad visual de una imagen')
        .addUserOption(option => option.setName('usuario').setDescription('Usuario del que obtener el avatar'))
        .addStringOption(option => option.setName('url').setDescription('URL de la imagen')),

    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getUser('usuario');
        const url = interaction.options.getString('url');

        let targetUrl = url;
        if (!targetUrl && user) targetUrl = user.displayAvatarURL({ extension: 'png', size: 1024 });
        if (!targetUrl) targetUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 1024 });

        try {
            const image = await Jimp.read(targetUrl);
            
            // Mejora básica: contraste y nitidez
            image.contrast(0.1).normalize();

            const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
            const attachment = new AttachmentBuilder(buffer, { name: 'enhance.png' });

            const embed = new EmbedBuilder()
                .setTitle('🔍 Mejora de Calidad')
                .setDescription('Se ha optimizado el contraste y normalizado los colores.')
                .setImage('attachment://enhance.png')
                .setColor(0x00FF00);

            await interaction.editReply({ embeds: [embed], files: [attachment] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Hubo un error al procesar la imagen.');
        }
    },
};
