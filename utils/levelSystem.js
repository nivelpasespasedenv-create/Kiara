const fs = require('fs');
const path = require('path');

const LEVELS_FILE = path.join(__dirname, '../data/levels.json');
const CONFIG_FILE = path.join(__dirname, '../data/level_config.json');

function readJSON(file) {
    try {
        if (!fs.existsSync(file)) fs.writeFileSync(file, '{}', 'utf8');
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        return {};
    }
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function xpForLevel(level) {
    return 5 * (level * level) + 50 * level + 100;
}

function getTotalXPForLevel(level) {
    let total = 0;
    for (let i = 0; i < level; i++) total += xpForLevel(i);
    return total;
}

function getLevelFromXP(xp) {
    let level = 0;
    while (xp >= getTotalXPForLevel(level + 1)) level++;
    return level;
}

function getXPProgress(xp) {
    const level = getLevelFromXP(xp);
    const currentLevelXP = getTotalXPForLevel(level);
    const nextLevelXP = getTotalXPForLevel(level + 1);
    return {
        level,
        current: xp - currentLevelXP,
        needed: nextLevelXP - currentLevelXP,
        percentage: Math.floor(((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100),
    };
}

async function addXP(guildId, userId, amount) {
    const now = Date.now();
    const data = readJSON(LEVELS_FILE);

    if (!data[guildId]) data[guildId] = {};

    const user = data[guildId][userId];

    if (!user) {
        data[guildId][userId] = { xp: amount, level: 0, last_msg: now };
        writeJSON(LEVELS_FILE, data);
        return { leveled: false, newLevel: 0 };
    }

    if (now - user.last_msg < 15000) return null;

    const newXP = user.xp + amount;
    const oldLevel = user.level;
    const newLevel = getLevelFromXP(newXP);
    const leveled = newLevel > oldLevel;

    data[guildId][userId] = { xp: newXP, level: newLevel, last_msg: now };
    writeJSON(LEVELS_FILE, data);

    return { leveled, newLevel, oldLevel };
}

async function getUserRank(guildId, userId) {
    const data = readJSON(LEVELS_FILE);
    const guildData = data[guildId] || {};
    const user = guildData[userId];

    if (!user) return null;

    const { xp, level } = user;
    const rank = Object.values(guildData).filter(u => u.xp > xp).length + 1;
    const progress = getXPProgress(xp);

    return { xp, level, rank, ...progress };
}

async function getLeaderboard(guildId, limit = 10) {
    const data = readJSON(LEVELS_FILE);
    const guildData = data[guildId] || {};

    return Object.entries(guildData)
        .map(([user_id, val]) => ({ user_id, xp: val.xp, level: val.level }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, limit);
}

async function getLevelChannel(guildId) {
    try {
        const config = readJSON(CONFIG_FILE);
        const entry = config[guildId];
        if (!entry || !entry.enabled) return null;
        return entry.channel_id;
    } catch {
        return null;
    }
}

async function setLevelChannel(guildId, channelId) {
    const config = readJSON(CONFIG_FILE);
    config[guildId] = { channel_id: channelId, enabled: true };
    writeJSON(CONFIG_FILE, config);
}

module.exports = { addXP, getUserRank, getLeaderboard, getXPProgress, xpForLevel, getLevelFromXP, getLevelChannel, setLevelChannel };
