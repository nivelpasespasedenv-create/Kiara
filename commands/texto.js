const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

// ─── Registro de fuentes ───────────────────────────────────────────────────────
GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts/Minecraft.otf'), 'MCFont');
GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts/Terraria.ttf'),  'TFont');
GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts/GeometryDash.ttf'), 'GDFont');
GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts/AmongUs.ttf'),   'AUFont');

// ─── Definición de estilos ─────────────────────────────────────────────────────
const STYLES = {
    minecraft: {
        label: '⛏️ Minecraft',
        font: 'MCFont',
        weight: 'normal',
        bg: '#1D1D1D',
        text: '#55FF55',
        shadow: '#1A5C1A',
        shadowBlur: 0,
        shadowOX: 3, shadowOY: 3,
        outline: null,
        border: 'minecraft',
        tag: '§ Minecraft §',
        tagColor: '#AAAAAA',
    },
    roblox: {
        label: '🎮 Roblox',
        font: 'AUFont',
        weight: 'bold',
        bg: '#FFFFFF',
        text: '#E62020',
        shadow: null,
        outline: '#000000',
        outlineWidth: 6,
        border: 'roblox',
        tag: '⬡ ROBLOX',
        tagColor: '#CC0000',
    },
    geometrydash: {
        label: '🟡 Geometry Dash',
        font: 'GDFont',
        weight: 'bold',
        bg: '#0D1B2A',
        bgGradient: ['#0D1B2A', '#1A3550'],
        text: '#FFD700',
        glow: '#FF8C00',
        glowBlur: 18,
        shadow: null,
        outline: '#8B4500',
        outlineWidth: 3,
        border: 'gd',
        tag: '▶ GEOMETRY DASH',
        tagColor: '#FFA500',
    },
    terraria: {
        label: '🌿 Terraria',
        font: 'TFont',
        weight: 'normal',
        bg: '#1C0F00',
        text: '#A0E040',
        shadow: '#3a5c1a',
        shadowBlur: 0,
        shadowOX: 2, shadowOY: 2,
        outline: null,
        border: 'pixel',
        tag: '✦ TERRARIA',
        tagColor: '#A0E040',
    },
    amongus: {
        label: '🚀 Among Us',
        font: 'AUFont',
        weight: 'bold',
        bg: '#050A14',
        text: '#4FC3F7',
        glow: '#0088CC',
        glowBlur: 20,
        shadow: null,
        outline: '#002244',
        outlineWidth: 4,
        border: 'space',
        tag: '◈ AMONG US',
        tagColor: '#29B6F6',
        stars: true,
    },
    fortnite: {
        label: '⚡ Fortnite',
        font: 'GDFont',
        weight: '900',
        bg: '#0B0B2A',
        bgGradient: ['#0B0B2A', '#1a0060'],
        text: '#00D4FF',
        glow: '#0055AA',
        glowBlur: 22,
        shadow: null,
        outline: '#00FFFF',
        outlineWidth: 2,
        border: 'gd',
        tag: '⚡ FORTNITE',
        tagColor: '#00D4FF',
    },
};

// ─── Dibuja un borde tipo Minecraft (pixel art) ────────────────────────────────
function drawMinecraftBorder(ctx, w, h) {
    const size = 6;
    const colors = ['#6B6B6B', '#4A4A4A', '#888888'];
    for (let i = 0; i < size; i++) {
        const alpha = 1 - i * 0.12;
        ctx.fillStyle = colors[i % colors.length] + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fillRect(i, i, w - i * 2, h - i * 2);
    }
    ctx.clearRect(size, size, w - size * 2, h - size * 2);
}

// ─── Dibuja estrellas para Among Us ───────────────────────────────────────────
function drawStars(ctx, w, h, count = 60) {
    for (let i = 0; i < count; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = Math.random() * 1.5 + 0.5;
        const alpha = Math.random() * 0.7 + 0.3;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ─── Dibuja borde tipo Roblox (rectángulo con sombra) ─────────────────────────
function drawRobloxBorder(ctx, w, h) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(6, 6, w - 6, h - 6);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w - 6, h - 6);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 8, h - 8);
}

// ─── Dibuja borde futurista (Geometry Dash / Fortnite) ───────────────────────
function drawGDBorder(ctx, w, h, color = '#FFD700') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    const r = 12;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.stroke();
    // Líneas decorativas en esquinas
    const lineLen = 20;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, lineLen); ctx.lineTo(0, 0); ctx.lineTo(lineLen, 0);
    ctx.moveTo(w - lineLen, 0); ctx.lineTo(w, 0); ctx.lineTo(w, lineLen);
    ctx.moveTo(0, h - lineLen); ctx.lineTo(0, h); ctx.lineTo(lineLen, h);
    ctx.moveTo(w - lineLen, h); ctx.lineTo(w, h); ctx.lineTo(w, h - lineLen);
    ctx.stroke();
}

// ─── Dibuja borde pixel (Terraria) ───────────────────────────────────────────
function drawPixelBorder(ctx, w, h, color = '#A0E040') {
    const px = 4;
    ctx.fillStyle = color;
    for (let x = 0; x < w; x += px) {
        ctx.fillRect(x, 0, px - 1, px);
        ctx.fillRect(x, h - px, px - 1, px);
    }
    for (let y = px; y < h - px; y += px) {
        ctx.fillRect(0, y, px, px - 1);
        ctx.fillRect(w - px, y, px, px - 1);
    }
}

// ─── Borde de espacio (Among Us) ─────────────────────────────────────────────
function drawSpaceBorder(ctx, w, h) {
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#1565C0');
    gradient.addColorStop(0.5, '#29B6F6');
    gradient.addColorStop(1, '#1565C0');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.strokeStyle = 'rgba(41,182,246,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 6, w - 12, h - 12);
}

// ─── Genera la imagen principal ───────────────────────────────────────────────
function generateImage(text, styleName) {
    const style = STYLES[styleName];

    const paddingX = 40;
    const paddingY = 30;
    const tagHeight = 28;
    const fontSize = text.length > 18 ? 42 : text.length > 12 ? 52 : 64;

    // Medir ancho del texto
    const measureCanvas = createCanvas(1, 1);
    const mCtx = measureCanvas.getContext('2d');
    mCtx.font = `${style.weight} ${fontSize}px ${style.font}`;
    const textWidth = mCtx.measureText(text).width;

    const canvasW = Math.max(360, Math.min(900, textWidth + paddingX * 2 + 20));
    const canvasH = fontSize + paddingY * 2 + tagHeight + 10;

    const canvas = createCanvas(canvasW, canvasH);
    const ctx = canvas.getContext('2d');

    // ── Fondo ──────────────────────────────────────────────────────────────
    if (style.bgGradient) {
        const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
        grad.addColorStop(0, style.bgGradient[0]);
        grad.addColorStop(1, style.bgGradient[1]);
        ctx.fillStyle = grad;
    } else if (style.border === 'roblox') {
        // Roblox pinta su propio fondo
        ctx.fillStyle = style.bg;
    } else {
        ctx.fillStyle = style.bg;
    }

    // Fondo con esquinas redondeadas si no es Minecraft/Terraria
    if (style.border === 'gd' || style.border === 'space') {
        const r = 12;
        ctx.beginPath();
        ctx.moveTo(r, 0); ctx.lineTo(canvasW - r, 0);
        ctx.quadraticCurveTo(canvasW, 0, canvasW, r);
        ctx.lineTo(canvasW, canvasH - r);
        ctx.quadraticCurveTo(canvasW, canvasH, canvasW - r, canvasH);
        ctx.lineTo(r, canvasH);
        ctx.quadraticCurveTo(0, canvasH, 0, canvasH - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fill();
    } else {
        ctx.fillRect(0, 0, canvasW, canvasH);
    }

    // ── Estrellas (Among Us) ───────────────────────────────────────────────
    if (style.stars) {
        Math.seedrandom = () => {};
        drawStars(ctx, canvasW, canvasH);
    }

    // ── Bordes ────────────────────────────────────────────────────────────
    if (style.border === 'minecraft') drawMinecraftBorder(ctx, canvasW, canvasH);
    if (style.border === 'roblox')    drawRobloxBorder(ctx, canvasW, canvasH);
    if (style.border === 'gd')        drawGDBorder(ctx, canvasW, canvasH, style.text);
    if (style.border === 'pixel')     drawPixelBorder(ctx, canvasW, canvasH, style.text);
    if (style.border === 'space')     drawSpaceBorder(ctx, canvasW, canvasH);

    // ── Etiqueta de juego (arriba) ─────────────────────────────────────────
    ctx.font = `bold 13px AUFont`;
    ctx.fillStyle = style.tagColor || style.text;
    ctx.textAlign = 'center';
    ctx.fillText(style.tag, canvasW / 2, 18);

    // Línea separadora
    ctx.strokeStyle = (style.tagColor || style.text) + '55';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingX, 24); ctx.lineTo(canvasW - paddingX, 24);
    ctx.stroke();

    const textY = tagHeight + paddingY + fontSize - 10;
    ctx.font = `${style.weight} ${fontSize}px ${style.font}`;
    ctx.textAlign = 'center';

    // ── Sombra de texto ────────────────────────────────────────────────────
    if (style.glow) {
        ctx.shadowColor = style.glow;
        ctx.shadowBlur = style.glowBlur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    } else if (style.shadow) {
        ctx.shadowColor = style.shadow;
        ctx.shadowBlur = style.shadowBlur || 0;
        ctx.shadowOffsetX = style.shadowOX || 3;
        ctx.shadowOffsetY = style.shadowOY || 3;
    }

    // ── Contorno de texto ──────────────────────────────────────────────────
    if (style.outline) {
        ctx.strokeStyle = style.outline;
        ctx.lineWidth = style.outlineWidth || 4;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, canvasW / 2, textY);
    }

    // ── Texto principal ────────────────────────────────────────────────────
    ctx.fillStyle = style.text;
    ctx.fillText(text, canvasW / 2, textY);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    return canvas.toBuffer('image/png');
}

// ─── Comando ──────────────────────────────────────────────────────────────────
module.exports = {
    data: new SlashCommandBuilder()
        .setName('texto')
        .setDescription('Genera una imagen con tu texto en el estilo de tu videojuego favorito 🎮')
        .addStringOption(opt =>
            opt.setName('texto')
                .setDescription('El texto que quieres convertir (máx. 30 caracteres)')
                .setRequired(true)
                .setMaxLength(30))
        .addStringOption(opt =>
            opt.setName('estilo')
                .setDescription('El estilo de videojuego')
                .setRequired(true)
                .addChoices(
                    { name: '⛏️  Minecraft',      value: 'minecraft' },
                    { name: '🎮  Roblox',          value: 'roblox' },
                    { name: '🟡  Geometry Dash',   value: 'geometrydash' },
                    { name: '🌿  Terraria',         value: 'terraria' },
                    { name: '🚀  Among Us',         value: 'amongus' },
                    { name: '⚡  Fortnite',          value: 'fortnite' },
                )),

    async execute(interaction) {
        await interaction.deferReply();

        const inputText = interaction.options.getString('texto');
        const styleName  = interaction.options.getString('estilo');
        const style      = STYLES[styleName];

        let imageBuffer;
        try {
            imageBuffer = generateImage(inputText, styleName);
        } catch (err) {
            console.error('Error generando imagen de texto:', err);
            return await interaction.editReply({
                content: '❌ Ocurrió un error al generar la imagen. Intenta con un texto más corto.'
            });
        }

        const attachment = new AttachmentBuilder(imageBuffer, { name: `texto_${styleName}.png` });

        await interaction.editReply({
            content: `${style.label} • \`${inputText}\` — pedido por **${interaction.user.username}**`,
            files: [attachment],
        });
    },
};
