const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { getOpenAI } = require('../utils/openai');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

// ─── Fuentes (serif del sistema + las ya registradas) ─────────────────────────
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',      'QuoteItalic');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', 'QuoteBold');


// ─── IA: transforma la frase en quote filosófico ──────────────────────────────
async function philosophize(text, author) {
    try {
        const res = await getOpenAI().chat.completions.create({
            model: 'gpt-4o',
            messages: [{
                role: 'user',
                content: `Eres un filósofo elegante llamado Sasha. Transforma esta frase en una cita filosófica profunda y poética. Mantén la esencia del mensaje pero hazla sonar como si viniera de un gran pensador. Máximo 2 oraciones cortas. NO agregues comillas ni guiones al inicio o final. Solo el texto de la cita.

Frase original: "${text}"
Autor que la dijo: ${author}`,
            }],
            max_tokens: 100,
            temperature: 0.9,
        });
        return res.choices[0].message.content.trim();
    } catch {
        return text;
    }
}

// ─── Dividir texto en líneas que quepan en el ancho ──────────────────────────
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';

    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    return lines;
}

// ─── Generar imagen estilo "Make it a Quote" ──────────────────────────────────
function generateQuoteImage(quoteText, authorName, avatarUrl) {
    const W         = 820;
    const PADDING   = 60;
    const MAX_W     = W - PADDING * 2;
    const FONT_SIZE = quoteText.length > 120 ? 28 : quoteText.length > 70 ? 32 : 38;
    const LINE_H    = FONT_SIZE * 1.55;

    // Medir líneas para saber la altura del canvas
    const measureCanvas = createCanvas(W, 100);
    const mCtx = measureCanvas.getContext('2d');
    mCtx.font = `italic ${FONT_SIZE}px QuoteItalic`;
    const lines = wrapText(mCtx, quoteText, MAX_W);

    const H = Math.max(360,
        PADDING * 2          // arriba y abajo
        + 80                 // espacio para las comillas grandes
        + lines.length * LINE_H
        + 30                 // separador
        + 60                 // autor
        + 40                 // pie
    );

    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');

    // ── Fondo negro con gradiente sutil ───────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a0a0a');
    bg.addColorStop(1, '#111111');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── Viñeta lateral izquierda (toque cinematográfico) ──────────────────
    const vignette = ctx.createLinearGradient(0, 0, W * 0.35, 0);
    vignette.addColorStop(0, 'rgba(255,255,255,0.03)');
    vignette.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // ── Línea decorativa izquierda ────────────────────────────────────────
    const lineGrad = ctx.createLinearGradient(0, H * 0.2, 0, H * 0.8);
    lineGrad.addColorStop(0,   'rgba(255,255,255,0)');
    lineGrad.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    lineGrad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(PADDING - 20, H * 0.15, 2, H * 0.7);

    // ── Comillas decorativas grandes ──────────────────────────────────────
    ctx.font      = `italic 130px QuoteItalic`;
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.textAlign = 'left';
    ctx.fillText('\u201C', PADDING - 10, PADDING + 100);

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.textAlign = 'right';
    ctx.fillText('\u201D', W - PADDING + 30, H - 80);

    // ── Texto de la cita ──────────────────────────────────────────────────
    const textStartY = PADDING + 90;
    ctx.font      = `italic ${FONT_SIZE}px QuoteItalic`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';

    lines.forEach((line, i) => {
        // Sombra suave para profundidad
        ctx.shadowColor  = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur   = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        ctx.fillText(line, PADDING, textStartY + i * LINE_H);
    });

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;

    // ── Línea separadora ──────────────────────────────────────────────────
    const separatorY = textStartY + lines.length * LINE_H + 22;
    const sepGrad = ctx.createLinearGradient(PADDING, 0, PADDING + 180, 0);
    sepGrad.addColorStop(0,   'rgba(255,255,255,0.6)');
    sepGrad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = sepGrad;
    ctx.fillRect(PADDING, separatorY, 180, 1.5);

    // ── Autor ─────────────────────────────────────────────────────────────
    const authorY = separatorY + 34;
    ctx.font      = `bold 18px QuoteBold`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'left';
    ctx.fillText(`— ${authorName}`, PADDING, authorY);

    // ── Marca de agua "Sasha" abajo a la derecha ──────────────────────────
    ctx.font      = `14px QuoteBold`;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.textAlign = 'right';
    ctx.fillText('Sasha Bot', W - PADDING, H - 22);

    return canvas.toBuffer('image/png');
}

// ─── Comando ──────────────────────────────────────────────────────────────────
module.exports = {
    data: new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Convierte tu frase en una cita filosófica con imagen negra estilo "Make it a Quote" 🖤')
        .addStringOption(opt =>
            opt.setName('frase')
                .setDescription('Tu frase o pensamiento (máx. 200 caracteres)')
                .setRequired(true)
                .setMaxLength(200))
        .addUserOption(opt =>
            opt.setName('autor')
                .setDescription('Usuario como autor de la cita (opcional, por defecto tú)')
                .setRequired(false))
        .addBooleanOption(opt =>
            opt.setName('ia')
                .setDescription('¿Quieres que la IA transforme tu frase en estilo filosófico? (por defecto: sí)')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const rawText   = interaction.options.getString('frase');
        const authorUser = interaction.options.getUser('autor') || interaction.user;
        const useAI     = interaction.options.getBoolean('ia') ?? true;

        const authorName = authorUser.displayName || authorUser.username;

        let quoteText = rawText;
        if (useAI) {
            quoteText = await philosophize(rawText, authorName);
        }

        let imageBuffer;
        try {
            imageBuffer = generateQuoteImage(quoteText, authorName);
        } catch (err) {
            console.error('Error generando quote:', err);
            return await interaction.editReply({ content: '❌ Hubo un error al generar la imagen.' });
        }

        const attachment = new AttachmentBuilder(imageBuffer, { name: 'quote.png' });

        const aiNote = useAI && quoteText !== rawText
            ? `\n*Frase original: "${rawText}"*`
            : '';

        await interaction.editReply({
            content: `🖤 **Quote generado** para **${interaction.user.username}**${aiNote}`,
            files: [attachment],
        });
    },
};
