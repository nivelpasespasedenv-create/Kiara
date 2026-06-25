const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');

GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts/Minecraft.otf'), 'Minecraft');

const THEMES_FILE = path.join(__dirname, '../data/card_themes.json');

const THEMES = {
    galaxia: {
        name: '🌌 Galaxia',
        bg: ['#0f0c29', '#1a1040', '#24243e'],
        border: ['#A855F7', '#7B2FBE', '#A855F7'],
        sidebar: ['#A855F7', '#7B2FBE'],
        bar: ['#A855F7', '#C084FC'],
        barBg: '#2a1a4a',
        accent: '#A855F7',
        ring: '#A855F7',
        levelColor: ['#A855F7', '#C084FC', '#7B2FBE'],
        titleColor: ['#C084FC', '#A855F7'],
    },
    fuego: {
        name: '🔥 Fuego',
        bg: ['#1a0500', '#2d0a00', '#1a0800'],
        border: ['#FF4500', '#FF8C00', '#FF4500'],
        sidebar: ['#FF4500', '#FF8C00'],
        bar: ['#FF4500', '#FF8C00'],
        barBg: '#3a1000',
        accent: '#FF4500',
        ring: '#FF6B35',
        levelColor: ['#FF4500', '#FF8C00', '#FFD700'],
        titleColor: ['#FF8C00', '#FF4500'],
    },
    oceano: {
        name: '🌊 Océano',
        bg: ['#001a2d', '#002d3d', '#001a2d'],
        border: ['#00B4D8', '#0077B6', '#00B4D8'],
        sidebar: ['#00B4D8', '#0077B6'],
        bar: ['#00B4D8', '#48CAE4'],
        barBg: '#001a3a',
        accent: '#00B4D8',
        ring: '#00B4D8',
        levelColor: ['#00B4D8', '#48CAE4', '#0077B6'],
        titleColor: ['#48CAE4', '#00B4D8'],
    },
    rosa: {
        name: '🌸 Rosa',
        bg: ['#1a0010', '#2d0020', '#1a0018'],
        border: ['#FF69B4', '#FF1493', '#FF69B4'],
        sidebar: ['#FF69B4', '#FF1493'],
        bar: ['#FF69B4', '#FFB6C1'],
        barBg: '#3a0020',
        accent: '#FF69B4',
        ring: '#FF69B4',
        levelColor: ['#FF69B4', '#FFB6C1', '#FF1493'],
        titleColor: ['#FFB6C1', '#FF69B4'],
    },
    naturaleza: {
        name: '🌿 Naturaleza',
        bg: ['#001a00', '#002d0a', '#001a05'],
        border: ['#22C55E', '#16A34A', '#22C55E'],
        sidebar: ['#22C55E', '#16A34A'],
        bar: ['#22C55E', '#86EFAC'],
        barBg: '#001a00',
        accent: '#22C55E',
        ring: '#22C55E',
        levelColor: ['#22C55E', '#86EFAC', '#16A34A'],
        titleColor: ['#86EFAC', '#22C55E'],
    },
    dorado: {
        name: '⭐ Dorado',
        bg: ['#1a1200', '#2d2000', '#1a1800'],
        border: ['#FFD700', '#FFA500', '#FFD700'],
        sidebar: ['#FFD700', '#FFA500'],
        bar: ['#FFD700', '#FFF176'],
        barBg: '#2a1a00',
        accent: '#FFD700',
        ring: '#FFD700',
        levelColor: ['#FFD700', '#FFF176', '#FFA500'],
        titleColor: ['#FFF176', '#FFD700'],
    },
    medianoche: {
        name: '🌙 Medianoche',
        bg: ['#050510', '#0a0a20', '#050515'],
        border: ['#4A4AFF', '#2222CC', '#4A4AFF'],
        sidebar: ['#4A4AFF', '#2222CC'],
        bar: ['#4A4AFF', '#8888FF'],
        barBg: '#0a0a2a',
        accent: '#4A4AFF',
        ring: '#6666FF',
        levelColor: ['#6666FF', '#8888FF', '#4A4AFF'],
        titleColor: ['#8888FF', '#6666FF'],
    },
    hielo: {
        name: '❄️ Hielo',
        bg: ['#001a2a', '#002233', '#001520'],
        border: ['#A8DADC', '#457B9D', '#A8DADC'],
        sidebar: ['#A8DADC', '#457B9D'],
        bar: ['#A8DADC', '#E8F4F8'],
        barBg: '#001520',
        accent: '#A8DADC',
        ring: '#A8DADC',
        levelColor: ['#A8DADC', '#E8F4F8', '#457B9D'],
        titleColor: ['#E8F4F8', '#A8DADC'],
    },
};

function readData() {
    try {
        if (!fs.existsSync(THEMES_FILE)) fs.writeFileSync(THEMES_FILE, '{}', 'utf8');
        const raw = JSON.parse(fs.readFileSync(THEMES_FILE, 'utf8'));
        const migrated = {};
        for (const [k, v] of Object.entries(raw)) {
            if (typeof v === 'string') {
                migrated[k] = { theme: v, name: null };
            } else {
                migrated[k] = v;
            }
        }
        return migrated;
    } catch { return {}; }
}

function writeData(data) {
    fs.writeFileSync(THEMES_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getUserTheme(userId) {
    const data = readData();
    const entry = data[userId];
    if (!entry) return 'galaxia';
    const t = entry.theme || 'galaxia';
    return THEMES[t] ? t : 'galaxia';
}

function setUserTheme(userId, themeName) {
    const data = readData();
    if (!data[userId]) data[userId] = { theme: 'galaxia', name: null };
    data[userId].theme = themeName;
    writeData(data);
}

function getUserCardName(userId) {
    const data = readData();
    return data[userId]?.name || null;
}

function setUserCardName(userId, name) {
    const data = readData();
    if (!data[userId]) data[userId] = { theme: 'galaxia', name: null };
    data[userId].name = name ? name.slice(0, 20) : null;
    writeData(data);
}

function fetchImageBuffer(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

async function drawAvatar(ctx, user, x, y, size, ringColor) {
    try {
        const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
        const buf = await fetchImageBuffer(avatarUrl);
        const img = await loadImage(buf);
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2 + 3, 0, Math.PI * 2);
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 3;
        ctx.stroke();
    } catch {}
}

async function generateRankCard(user, data, themeName, customName) {
    const theme = THEMES[themeName] || THEMES.galaxia;
    const displayName = (customName || user.displayName || user.username || 'Usuario').slice(0, 20);
    const W = 700;
    const H = 210;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, theme.bg[0]);
    bg.addColorStop(0.5, theme.bg[1]);
    bg.addColorStop(1, theme.bg[2]);
    ctx.fillStyle = bg;
    roundRect(ctx, 0, 0, W, H, 20);
    ctx.fill();

    const border = ctx.createLinearGradient(0, 0, W, 0);
    border.addColorStop(0, theme.border[0]);
    border.addColorStop(0.5, theme.border[1]);
    border.addColorStop(1, theme.border[2]);
    ctx.strokeStyle = border;
    ctx.lineWidth = 3;
    roundRect(ctx, 1.5, 1.5, W - 3, H - 3, 19);
    ctx.stroke();

    const side = ctx.createLinearGradient(0, 0, 0, H);
    side.addColorStop(0, theme.sidebar[0]);
    side.addColorStop(1, theme.sidebar[1]);
    ctx.fillStyle = side;
    roundRect(ctx, 10, 10, 5, H - 20, 3);
    ctx.fill();

    const avatarSize = 110;
    const avatarX = 35;
    const avatarY = H / 2 - avatarSize / 2 - 10;
    await drawAvatar(ctx, user, avatarX, avatarY, avatarSize, theme.ring);

    const textX = avatarX + avatarSize + 22;

    const rankText = `# ${data.rank}`;
    ctx.font = 'bold 15px Minecraft';
    const rankW = ctx.measureText(rankText).width + 20;
    roundRect(ctx, W - rankW - 18, 16, rankW, 28, 8);
    const rankBg = ctx.createLinearGradient(W - rankW - 18, 0, W - 18, 0);
    rankBg.addColorStop(0, theme.sidebar[0]);
    rankBg.addColorStop(1, theme.sidebar[1]);
    ctx.fillStyle = rankBg;
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(rankText, W - rankW - 8, 35);

    ctx.font = 'bold 22px Minecraft';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(displayName, textX, 55);

    ctx.font = 'bold 48px Minecraft';
    const lvlGrad = ctx.createLinearGradient(textX, 60, textX + 180, 120);
    lvlGrad.addColorStop(0, theme.levelColor[0]);
    lvlGrad.addColorStop(0.5, theme.levelColor[1]);
    lvlGrad.addColorStop(1, theme.levelColor[2]);
    ctx.fillStyle = lvlGrad;
    ctx.fillText(`LVL ${data.level}`, textX, 120);

    ctx.font = '13px Minecraft';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText(`${data.xp} XP total`, textX, 145);

    const barX = textX;
    const barY = 158;
    const barW = W - textX - 25;
    const barH = 16;

    ctx.fillStyle = theme.barBg;
    roundRect(ctx, barX, barY, barW, barH, 8);
    ctx.fill();

    const fill = Math.max(0, Math.min(barW * (data.percentage / 100), barW));
    if (fill > 0) {
        const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        barGrad.addColorStop(0, theme.bar[0]);
        barGrad.addColorStop(1, theme.bar[1]);
        ctx.fillStyle = barGrad;
        roundRect(ctx, barX, barY, fill, barH, 8);
        ctx.fill();
    }

    ctx.font = '11px Minecraft';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText(`${data.current} / ${data.needed} XP`, barX, barY - 4);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`${data.percentage}%`, barX + barW, barY - 4);
    ctx.textAlign = 'left';

    ctx.font = '10px Minecraft';
    ctx.fillStyle = theme.accent + '88';
    ctx.textAlign = 'right';
    ctx.fillText(theme.name, W - 18, H - 10);
    ctx.textAlign = 'left';

    return canvas.toBuffer('image/png');
}

async function generateLevelUpCard(user, newLevel, xp, percentage, themeName, customName) {
    const theme = THEMES[themeName] || THEMES.galaxia;
    const displayName = (customName || user.username || 'Usuario').slice(0, 20);
    const W = 700;
    const H = 220;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, theme.bg[0]);
    bg.addColorStop(0.5, theme.bg[1]);
    bg.addColorStop(1, theme.bg[2]);
    ctx.fillStyle = bg;
    roundRect(ctx, 0, 0, W, H, 20);
    ctx.fill();

    const border = ctx.createLinearGradient(0, 0, W, 0);
    border.addColorStop(0, theme.border[0]);
    border.addColorStop(0.5, theme.border[1]);
    border.addColorStop(1, theme.border[2]);
    ctx.strokeStyle = border;
    ctx.lineWidth = 3;
    roundRect(ctx, 1.5, 1.5, W - 3, H - 3, 19);
    ctx.stroke();

    const side = ctx.createLinearGradient(0, 0, 0, H);
    side.addColorStop(0, theme.sidebar[0]);
    side.addColorStop(1, theme.sidebar[1]);
    ctx.fillStyle = side;
    roundRect(ctx, 10, 10, 5, H - 20, 3);
    ctx.fill();

    const avatarSize = 120;
    const avatarX = 35;
    const avatarY = H / 2 - avatarSize / 2;
    await drawAvatar(ctx, user, avatarX, avatarY, avatarSize, theme.ring);

    const textX = avatarX + avatarSize + 22;

    ctx.font = 'bold 22px Minecraft';
    const titleGrad = ctx.createLinearGradient(textX, 0, textX + 300, 0);
    titleGrad.addColorStop(0, theme.titleColor[0]);
    titleGrad.addColorStop(1, theme.titleColor[1]);
    ctx.fillStyle = titleGrad;
    ctx.fillText('¡SUBISTE DE NIVEL!', textX, 62);

    ctx.font = 'bold 18px Minecraft';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(displayName, textX, 90);

    ctx.font = 'bold 52px Minecraft';
    const lvlGrad = ctx.createLinearGradient(textX, 95, textX + 160, 160);
    lvlGrad.addColorStop(0, theme.levelColor[0]);
    lvlGrad.addColorStop(0.5, theme.levelColor[1]);
    lvlGrad.addColorStop(1, theme.levelColor[2]);
    ctx.fillStyle = lvlGrad;
    ctx.fillText(`LVL ${newLevel}`, textX, 152);

    ctx.font = '13px Minecraft';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText(`${xp} XP total`, textX, 173);

    const barX = textX;
    const barY = 186;
    const barW = W - textX - 25;
    const barH = 14;

    ctx.fillStyle = theme.barBg;
    roundRect(ctx, barX, barY, barW, barH, 7);
    ctx.fill();

    const fill = Math.max(0, Math.min(barW * (percentage / 100), barW));
    if (fill > 0) {
        const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        barGrad.addColorStop(0, theme.bar[0]);
        barGrad.addColorStop(1, theme.bar[1]);
        ctx.fillStyle = barGrad;
        roundRect(ctx, barX, barY, fill, barH, 7);
        ctx.fill();
    }

    ctx.font = '11px Minecraft';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText(`${percentage}%`, barX + barW, barY - 3);
    ctx.textAlign = 'left';

    ctx.font = '10px Minecraft';
    ctx.fillStyle = theme.accent + '88';
    ctx.textAlign = 'right';
    ctx.fillText(theme.name, W - 18, H - 8);
    ctx.textAlign = 'left';

    return canvas.toBuffer('image/png');
}

module.exports = { generateLevelUpCard, generateRankCard, getUserTheme, setUserTheme, getUserCardName, setUserCardName, THEMES };
