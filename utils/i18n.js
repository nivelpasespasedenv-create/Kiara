const fs = require('fs');
const path = require('path');
const translations = require('../locales/translations.json');

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

const memCache = {};
const BATCH_SEP = ' ||| ';

async function translateText(text, targetLang) {
    if (!text || targetLang === 'es') return text;
    const key = `${targetLang}::${text}`;
    if (memCache[key]) return memCache[key];
    try {
        const { translate } = await import('@vitalets/google-translate-api');
        const result = await translate(text, { to: targetLang });
        memCache[key] = result.text;
        return result.text;
    } catch {
        return text;
    }
}

async function translateBatch(texts, targetLang) {
    if (!texts?.length || targetLang === 'es') return texts;
    const results = new Array(texts.length);
    const toTranslate = [];
    const indices = [];
    for (let i = 0; i < texts.length; i++) {
        const key = `${targetLang}::${texts[i]}`;
        if (memCache[key]) {
            results[i] = memCache[key];
        } else {
            toTranslate.push(texts[i]);
            indices.push(i);
        }
    }
    if (toTranslate.length === 0) return results;
    try {
        const { translate } = await import('@vitalets/google-translate-api');
        const joined = toTranslate.join(BATCH_SEP);
        const result = await translate(joined, { to: targetLang });
        const translated = result.text.split(BATCH_SEP);
        for (let j = 0; j < indices.length; j++) {
            const original = toTranslate[j];
            const translatedText = (translated[j] || original).trim();
            const key = `${targetLang}::${original}`;
            memCache[key] = translatedText;
            results[indices[j]] = translatedText;
        }
    } catch {
        for (let j = 0; j < indices.length; j++) {
            results[indices[j]] = toTranslate[j];
        }
    }
    return results;
}

async function getLanguage(guildId) {
    if (!guildId) return 'es';
    try {
        const settings = readSettings();
        return settings[guildId]?.language || 'es';
    } catch {
        return 'es';
    }
}

async function setLanguage(guildId, language) {
    try {
        const settings = readSettings();
        if (!settings[guildId]) settings[guildId] = {};
        settings[guildId].language = language;
        writeSettings(settings);
        return true;
    } catch {
        return false;
    }
}

function t(key, lang = 'es', variables = {}) {
    let text = translations['es']?.[key] || key;
    for (const [k, v] of Object.entries(variables)) {
        text = text.replace(`{${k}}`, v);
    }
    return text;
}

async function tAsync(key, lang = 'es', variables = {}) {
    let text = translations['es']?.[key] || key;
    for (const [k, v] of Object.entries(variables)) {
        text = text.replace(`{${k}}`, v);
    }
    if (lang === 'es') return text;
    return await translateText(text, lang);
}

module.exports = { getLanguage, setLanguage, t, tAsync, translateText, translateBatch };
