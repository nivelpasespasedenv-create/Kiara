// ─── Paleta de colores para bienvenidas ───────────────────────────────────────

const PALETTE = [
    { name: '🔵 Blurple (Discord)',  value: '#5865F2', emoji: '🔵' },
    { name: '🟢 Verde esmeralda',    value: '#2ECC71', emoji: '🟢' },
    { name: '🔴 Rojo coral',         value: '#E74C3C', emoji: '🔴' },
    { name: '🟣 Morado',             value: '#9B59B6', emoji: '🟣' },
    { name: '🟡 Dorado',             value: '#F1C40F', emoji: '🟡' },
    { name: '🩷 Rosa',               value: '#FF69B4', emoji: '🩷' },
    { name: '🟠 Naranja',            value: '#E67E22', emoji: '🟠' },
    { name: '🌊 Turquesa',           value: '#1ABC9C', emoji: '🌊' },
    { name: '⚡ Cian eléctrico',     value: '#00D4FF', emoji: '⚡' },
    { name: '💜 Lavanda',            value: '#A29BFE', emoji: '💜' },
    { name: '🌸 Rosa palo',          value: '#FFB6C1', emoji: '🌸' },
    { name: '🍀 Verde lima',         value: '#A8E063', emoji: '🍀' },
    { name: '🌑 Azul marino oscuro', value: '#2C3E50', emoji: '🌑' },
    { name: '🤍 Blanco nieve',       value: '#F0F0F0', emoji: '🤍' },
    { name: '🎲 Aleatorio',          value: 'random',  emoji: '🎲' },
];

/** Devuelve el color hex que se usará en el embed.
 *  Si el config tiene 'random', genera un hex aleatorio cada vez.
 *  Si no hay color configurado usa el fallback. */
function resolveEmbedColor(cfg, fallback = '#5865F2') {
    const stored = cfg?.embedColor;
    if (!stored)        return fallback;
    if (stored === 'random') return `#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')}`;
    return stored;
}

/** Etiqueta legible para mostrar el color guardado */
function colorLabel(cfg) {
    if (!cfg?.embedColor) return '❌ Sin configurar (usa el predeterminado)';
    if (cfg.embedColor === 'random') return '🎲 Aleatorio (cambia en cada bienvenida)';
    const found = PALETTE.find(p => p.value === cfg.embedColor);
    return found ? `${found.emoji} ${found.name.split(' ').slice(1).join(' ')} \`${cfg.embedColor}\`` : `\`${cfg.embedColor}\``;
}

module.exports = { PALETTE, resolveEmbedColor, colorLabel };
