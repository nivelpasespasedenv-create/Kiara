const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'warns.json');

function ensureFile() {
    const dir = path.dirname(FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '{}');
}

function readAll() {
    ensureFile();
    try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; }
}

function writeAll(data) {
    ensureFile();
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function getWarns(guildId, userId) {
    const all = readAll();
    return all[`${guildId}_${userId}`] || [];
}

function addWarn(guildId, userId, razon, porId) {
    const all = readAll();
    const key = `${guildId}_${userId}`;
    if (!all[key]) all[key] = [];
    all[key].push({ razon, por: porId, fecha: Date.now() });
    writeAll(all);
    return all[key];
}

function clearWarns(guildId, userId) {
    const all = readAll();
    delete all[`${guildId}_${userId}`];
    writeAll(all);
}

module.exports = { getWarns, addWarn, clearWarns };
