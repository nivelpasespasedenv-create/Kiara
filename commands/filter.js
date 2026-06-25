const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const Jimp = require('jimp');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('filter')
        .setDescription('Aplica un filtro a una imagen o avatar')
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('El filtro a aplicar')
                .setRequired(true)
                .addChoices(
                    { name: 'Escala de grises', value: 'greyscale' },
                    { name: 'Invertir', value: 'invert' },
                    { name: 'Sepia', value: 'sepia' }
                ))
        .addUserOption(option => option.setName('usuario').setDescription('Usuario del que obtener el avatar'))
        .addStringOption(option => option.setName('url').setDescription('URL de la imagen')),

    async execute(interaction) {
        await interaction.deferReply();
        const type = interaction.options.getString('tipo');
        const user = interaction.options.getUser('usuario');
        const url = interaction.options.getString('url');

        let targetUrl = url;
        if (!targetUrl && user) targetUrl = user.displayAvatarURL({ extension: 'png', size: 512 });
        if (!targetUrl) targetUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 512 });

        try {
            const image = await Jimp.read(targetUrl);
            
            if (type === 'greyscale') image.greyscale();
            if (type === 'invert') image.invert();
            if (type === 'sepia') image.sepia();

            const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
            const attachment = new AttachmentBuilder(buffer, { name: 'filter.png' });

            const embed = new EmbedBuilder()
                .setTitle(`🖼️ Filtro Aplicado: ${type}`)
                .setImage('attachment://filter.png')
                .setColor(0x00AE86);

            await interaction.editReply({ embeds: [embed], files: [attachment] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Hubo un error al procesar la imagen. Asegúrate de que la URL sea válida.');
        }
    },
};
