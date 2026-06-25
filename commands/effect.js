const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const Jimp = require('jimp');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('effect')
        .setDescription('Aplica un efecto artístico a una imagen')
        .addStringOption(option =>
            option.setName('efecto')
                .setDescription('El efecto a aplicar')
                .setRequired(true)
                .addChoices(
                    { name: 'Borroso', value: 'blur' },
                    { name: 'Pixelado', value: 'pixelate' }
                ))
        .addUserOption(option => option.setName('usuario').setDescription('Usuario del que obtener el avatar'))
        .addStringOption(option => option.setName('url').setDescription('URL de la imagen')),

    async execute(interaction) {
        await interaction.deferReply();
        const effect = interaction.options.getString('efecto');
        const user = interaction.options.getUser('usuario');
        const url = interaction.options.getString('url');

        let targetUrl = url;
        if (!targetUrl && user) targetUrl = user.displayAvatarURL({ extension: 'png', size: 512 });
        if (!targetUrl) targetUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 512 });

        try {
            const image = await Jimp.read(targetUrl);
            
            if (effect === 'blur') image.blur(5);
            if (effect === 'pixelate') image.pixelate(10);

            const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
            const attachment = new AttachmentBuilder(buffer, { name: 'effect.png' });

            const embed = new EmbedBuilder()
                .setTitle(`✨ Efecto: ${effect}`)
                .setImage('attachment://effect.png')
                .setColor(0xFF00FF);

            await interaction.editReply({ embeds: [embed], files: [attachment] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Hubo un error al procesar la imagen.');
        }
    },
};
