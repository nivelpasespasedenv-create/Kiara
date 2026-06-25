const { EmbedBuilder } = require('discord.js');
const { getOpenAI } = require('./openai');
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../data/guild_settings.json');

function readSettings() {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) fs.writeFileSync(SETTINGS_FILE, '{}', 'utf8');
        return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    } catch { return {}; }
}

function writeSettings(data) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

const LOCAL_WORDS = [
    'maldito', 'maldita', 'maldicion', 'maldición',
    'tu madre', 'tu mae', 'tu mami', 'tu mamá', 'tu mama',
    'a tu madre', 'a tu mae',
    'chupame', 'chúpame',
    'me vale', 'me vale madres', 'me vale verga',
    'vete a la mierda', 'vete al diablo', 'vete al carajo',
    'estupido', 'estúpido', 'estupida', 'estúpida',
    'eres un maldito', 'eres una maldita',
    'baboso', 'babosa', 'animal', 'bestia',
    'asco', 'asqueroso', 'asquerosa',
    'pedazo de', 'maldito sea', 'maldita sea',
    'hdp', 'hp', 'hpta', 'hija de', 'hijo de',
    'que te jodan', 'que te den', 'que te follen',
    'te odio', 'muérete', 'muerete', 'ojala te mueras',
    'inútil', 'inutl', 'inutil',
    'retrasado', 'retrasada', 'mongolo', 'mongola',
    'imbécil', 'imbecil', 'tarado', 'tarada',
    'lameculos', 'culoseco',
    'puto', 'puta', 'putas', 'putos',
    'mierda', 'mierdas',
    'coño', 'cono', 'joder', 'hostia',
    'gilipollas', 'gilipolla',
    'cabrón', 'cabron', 'cabrona',
    'pendejo', 'pendeja', 'pendejos',
    'chinga', 'chingada', 'chingado', 'chingas',
    'verga', 'vergón', 'vergona',
    'culero', 'culera', 'culo',
    'pinche', 'pinches',
    'mamón', 'mamon', 'mamona',
    'zorra', 'zorras', 'zorron',
    'perra', 'perras',
    'carajo', 'caracho',
    'gonorrea', 'gonore',
    'malparido', 'malparida',
    'hijueputa', 'jueputa', 'juepucha',
    'huevón', 'huevon', 'huevona',
    'mamahuevo', 'mamaguevo',
    'cojonudo', 'cojones',
    'puñeta', 'puñetas',
    'follar', 'folla',
    'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick',
    'cock', 'pussy', 'motherfucker', 'nigger', 'nigga', 'faggot',
    'whore', 'slut', 'bullshit', 'stfu', 'fag', 'dumbass', 'jackass',
    'dipshit', 'wanker', 'twat', 'bollocks', 'piss off',
    'merda', 'caralho', 'porra', 'foda', 'fodasse', 'viado', 'buceta',
    'babaca', 'filho da puta', 'filha da puta',
    'merde', 'putain', 'connard', 'salope', 'enculé', 'bordel', 'nique',
    'cazzo', 'vaffanculo', 'stronzo', 'minchia', 'puttana', 'coglione',
    'scheiße', 'scheisse', 'arschloch', 'wichser', 'fick',
];

function normalize(text) {
    return text
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[@4]/g, 'a')
        .replace(/[3]/g, 'e')
        .replace(/[1!|]/g, 'i')
        .replace(/[0]/g, 'o')
        .replace(/[$5]/g, 's')
        .replace(/[7]/g, 't')
        .replace(/[+]/g, 't')
        .replace(/\*/g, '')
        .replace(/[^\w\s]/g, ' ');
}

function localFilter(text) {
    const norm = normalize(text);
    return LOCAL_WORDS.some(word => {
        const normWord = normalize(word);
        if (normWord.includes(' ')) return norm.includes(normWord);
        const regex = new RegExp(`\\b${normWord}\\b`, 'i');
        return regex.test(norm);
    });
}

async function isAutomodEnabled(guildId) {
    try {
        const settings = readSettings();
        if (!settings[guildId]) return true;
        return settings[guildId].automod_enabled !== false;
    } catch {
        return true;
    }
}

async function setAutomod(guildId, enabled) {
    try {
        const settings = readSettings();
        if (!settings[guildId]) settings[guildId] = {};
        settings[guildId].automod_enabled = enabled;
        writeSettings(settings);
        return true;
    } catch {
        return false;
    }
}

async function checkProfanity(text) {
    if (localFilter(text)) return true;
    try {
        const response = await getOpenAI().moderations.create({ input: text });
        return response.results[0].flagged;
    } catch {
        return false;
    }
}

const fallbackWarnings = [
    'Por favor cuida el lenguaje en este servidor. 🙏',
    'Este tipo de palabras no están permitidas aquí. 💛',
    'Todos merecemos un ambiente respetuoso. Por favor, modera tu lenguaje. 🌸',
    'Recuerda mantener un tono amable con todos los miembros. ✨',
];

async function generateWarning(username) {
    try {
        const response = await getOpenAI().chat.completions.create({
            model: 'gpt-4o',
            messages: [{
                role: 'user',
                content: `Eres Sasha, un bot de moderación amigable pero firme. "${username}" usó lenguaje inapropiado. Genera un aviso corto y creativo (1-2 oraciones) pidiéndole que cuide su lenguaje. Varía el tono: a veces formal, a veces tierno, a veces directo. Sin insultos ni agresividad.`
            }],
            max_tokens: 60,
            temperature: 1.1,
        });
        return response.choices[0].message.content.trim();
    } catch {
        return fallbackWarnings[Math.floor(Math.random() * fallbackWarnings.length)];
    }
}

async function handleAutoMod(message) {
    if (!message.guild) return false;
    if (message.author.bot) return false;
    if (!message.content?.trim()) return false;

    const enabled = await isAutomodEnabled(message.guild.id);
    if (!enabled) return false;

    const flagged = await checkProfanity(message.content);
    if (!flagged) return false;

    try { await message.delete(); } catch { return false; }

    const warningText = await generateWarning(message.author.username);

    const embed = new EmbedBuilder()
        .setTitle('🚨 Mensaje eliminado')
        .setDescription(`<@${message.author.id}> ${warningText}`)
        .setColor('#ff4757')
        .setFooter({ text: 'AutoMod • Sasha' })
        .setTimestamp();

    try {
        const sent = await message.channel.send({ embeds: [embed] });
        setTimeout(() => sent.delete().catch(() => {}), 8000);
    } catch (e) {
        console.error('Error enviando aviso de automod:', e);
    }

    return true;
}

module.exports = { handleAutoMod, isAutomodEnabled, setAutomod };
