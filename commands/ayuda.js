const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getOpenAI } = require('../utils/openai');
const { translateBatch } = require('../utils/i18n');


async function generateWelcomeMessage(botName, userName, lang) {
    try {
        const langLabel = lang === 'es' ? 'español' : lang === 'en' ? 'English' : lang === 'fr' ? 'français' : 'português';
        const prompt = lang === 'es'
            ? `Eres ${botName}, un bot de Discord kawaii, animado y con mucha personalidad. Genera un saludo corto y creativo (máximo 2 oraciones) para el panel de ayuda dirigido a ${userName}. Varía el tono: a veces travieso, a veces tierno, a veces emocionado. No repitas siempre lo mismo. Sin emojis al inicio, ponlos dentro o al final.`
            : `You are ${botName}, a kawaii and lively Discord bot with lots of personality. Generate a short creative greeting (max 2 sentences) for the help panel addressed to ${userName}. Vary the tone: sometimes playful, sometimes sweet, sometimes excited. Respond in ${langLabel}.`;

        const response = await getOpenAI().chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 80,
            temperature: 1.1,
        });

        return response.choices[0].message.content.trim();
    } catch {
        return null;
    }
}

const NAV_LABELS = ['Multimedia & IA', 'Gaming', 'Social', 'Juegos', 'Utilidades', 'Moderación', 'Emojis', 'Inicio'];

// Nombres de emojis a buscar por categoría (en orden de preferencia)
const CATEGORY_EMOJI_SEARCH = {
    music:  ['youtube', 'yt', 'anime', 'robot', 'ia', 'ai', 'multimedia', 'pelicula', 'movie'],
    gaming: ['gaming', 'game', 'minecraft', 'roblox', 'controller', 'joystick', 'gamer'],
    social: ['hug', 'abrazo', 'love', 'heart', 'uwu', 'cute', 'social', 'beso', 'kiss'],
    games:  ['dice', 'dado', 'slot', 'trivia', 'star', 'juego', 'game2', 'lucky'],
    utils:  ['tools', 'settings', 'config', 'gear', 'wrench', 'utility', 'info'],
    mod:    ['mod', 'shield', 'hammer', 'ban', 'moderacion', 'gavel', 'police'],
    emojis: ['sparkle', 'nqn', 'emoji', 'star2', 'glitter', 'shine', 'pepe'],
    home:   ['home', 'house', 'casa', 'inicio'],
};

function findEmoji(client, nameList) {
    if (!client) return null;
    for (const name of nameList) {
        const found = client.emojis.cache.find(e => e.name.toLowerCase().includes(name.toLowerCase()));
        if (found) return { id: found.id, name: found.name, animated: found.animated };
    }
    return null;
}

const FALLBACK_EMOJI = {
    music:  '🎬',
    gaming: '🎮',
    social: '🎭',
    games:  '🎲',
    utils:  '⚙️',
    mod:    '🛡️',
    emojis: '✨',
    home:   '🏠',
};

function makeButton(customId, label, style, client, categoryKey) {
    const btn = new ButtonBuilder().setCustomId(customId).setStyle(style);
    const customEmoji = findEmoji(client, CATEGORY_EMOJI_SEARCH[categoryKey] || []);
    if (customEmoji) {
        btn.setEmoji(customEmoji).setLabel(label);
    } else {
        const fallback = FALLBACK_EMOJI[categoryKey];
        btn.setEmoji(fallback).setLabel(label);
    }
    return btn;
}

async function getNavButtons(lang, client) {
    const labels = lang === 'es' ? NAV_LABELS : await translateBatch(NAV_LABELS, lang);
    const row1 = new ActionRowBuilder().addComponents(
        makeButton('help_music',  labels[0], ButtonStyle.Primary,   client, 'music'),
        makeButton('help_gaming', labels[1], ButtonStyle.Primary,   client, 'gaming'),
        makeButton('help_social', labels[2], ButtonStyle.Primary,   client, 'social'),
        makeButton('help_games',  labels[3], ButtonStyle.Primary,   client, 'games'),
    );
    const row2 = new ActionRowBuilder().addComponents(
        makeButton('help_utils',  labels[4], ButtonStyle.Secondary, client, 'utils'),
        makeButton('help_mod',    labels[5], ButtonStyle.Secondary, client, 'mod'),
        makeButton('help_emojis', labels[6], ButtonStyle.Secondary, client, 'emojis'),
        makeButton('help_home',   labels[7], ButtonStyle.Success,   client, 'home'),
    );

    return [row1, row2];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ayuda')
        .setDescription('Muestra todos los comandos disponibles del bot'),
    async execute(interaction) {
        await interaction.deferReply();
        const lang = interaction.lang || 'es';

        const botName = interaction.client.user.username;
        const userName = interaction.user.username;

        const staticFallbacks = [
            `¡Hola, ${userName}! Usa los botones de abajo para explorar todo lo que puedo hacer. ✨`,
            `Hey ${userName}, aquí tienes todo lo que necesitas saber sobre mis comandos. 💫`,
            `¡Bienvenid@ al panel de ayuda, ${userName}! Navega por las categorías con los botones. 🌸`,
        ];
        const fallback = staticFallbacks[Math.floor(Math.random() * staticFallbacks.length)];

        const [aiGreeting, navButtons] = await Promise.all([
            generateWelcomeMessage(botName, userName, lang),
            getNavButtons(lang, interaction.client),
        ]);

        const description = aiGreeting || fallback;
        const titleText = lang === 'es' ? `✨ Panel de Ayuda — ${botName}` : `✨ Help Panel — ${botName}`;
        const policyText = `\n\n-# 📜 [Políticas y Privacidad](https://v0-soledadbot-website.vercel.app/)`;

        const mainEmbed = new EmbedBuilder()
            .setTitle(titleText)
            .setDescription(description + policyText)
            .setColor('#7289DA')
            .addFields(
                { name: '🎬 Multimedia & IA', value: 'YouTube, anime, IA, películas', inline: true },
                { name: '🎮 Gaming', value: 'Minecraft, Roblox', inline: true },
                { name: '🎭 Social', value: 'Abrazos, acciones, mood', inline: true },
                { name: '🎲 Juegos', value: 'Trivia, dados, tragamonedas', inline: true },
                { name: '⚙️ Utilidades', value: 'Clima, traducir, info, recordatorios', inline: true },
                { name: '🛡️ Moderación', value: 'Ban, mute, warns, lock', inline: true },
                { name: '✨ Emojis', value: 'NQN, buscar, robar emojis', inline: true },
                { name: '📊 Total', value: '**104 comandos** disponibles', inline: true },
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: `${botName} • Selecciona una categoría`, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [mainEmbed], components: navButtons });
    },

    async createCategoryEmbed(category, interaction) {
        const lang = interaction.lang || 'es';

        const categories = {
            music: {
                title: '🎬 Multimedia & IA',
                color: '#ff0000',
                fields: [
                    ['🔍 /yt', 'Buscar videos en YouTube'],
                    ['🤣 /meme', 'Obtén memes divertidos'],
                    ['🎌 /buscanime', 'Busca información de anime'],
                    ['🎌 /recanime', 'Recomendaciones de anime con IA'],
                    ['🎬 /recpeli', 'Recomendaciones de películas con IA'],
                    ['📺 /dondever', 'Dónde ver series y películas'],
                    ['🤖 /ia', 'Chat con inteligencia artificial'],
                    ['🌐 /translate', 'Traduce texto a otro idioma'],
                    ['🖼️ /effect', 'Aplica efectos a imágenes'],
                    ['✨ /enhance', 'Mejora la calidad de imágenes'],
                    ['🖌️ /filter', 'Aplica filtros a imágenes'],
                ]
            },
            gaming: {
                title: '🎮 Gaming',
                color: '#00ff00',
                fields: [
                    ['⛏️ /minecraft', 'Info de servidores de Minecraft'],
                    ['🟦 /roblox', 'Perfiles y juegos de Roblox'],
                ]
            },
            social: {
                title: '🎭 Comandos Sociales',
                color: '#ff69b4',
                fields: [
                    ['🤗 /abrazo', 'Dale un abrazo a alguien'],
                    ['😘 /beso', 'Dale un beso a alguien'],
                    ['👋 /slap', 'Abofetea a alguien'],
                    ['🤚 /pat', 'Acaricia la cabeza de alguien'],
                    ['🥰 /cuddle', 'Acurrúcate con alguien'],
                    ['👉 /poke', 'Toca a alguien con el dedo'],
                    ['🎶 /dance', 'Baila solo o con alguien'],
                    ['😭 /cry', 'Llora un poco'],
                    ['👋 /wave', 'Saluda con la mano'],
                    ['🏏 /bonk', 'Golpea a alguien con un bate'],
                    ['🙌 /highfive', 'Choca los cinco con alguien'],
                    ['😬 /bite', 'Muerde a alguien'],
                    ['🤣 /tickle', 'Hazle cosquillas a alguien'],
                    ['👊 /punch', 'Lanza un puñetazo'],
                    ['💝 /compliment', 'Envía un cumplido'],
                    ['💤 /afk', 'Activa/desactiva tu estado AFK'],
                    ['🌸 /anime', 'Imágenes y GIFs de anime'],
                    ['🎭 /reaction', 'Reacciona con un GIF de anime'],
                    ['🌈 /mood', 'Tu paleta de colores del día'],
                    ['🔮 /8ball', 'Pregunta a la bola mágica'],
                    ['💀 /matar', 'Elimina a alguien de forma divertida'],
                    ['💕 /lovemeter', 'Mide el amor entre dos usuarios'],
                    ['💞 /almagemela', 'Descubre tu alma gemela'],
                    ['💌 /confession', 'Envía una confesión anónima'],
                    ['🐦 /tuitear', 'Simula un tweet'],
                ]
            },
            games: {
                title: '🎲 Juegos & Diversión',
                color: '#9b59b6',
                fields: [
                    ['✂️ /rps', 'Piedra, papel o tijera'],
                    ['🎲 /dice', 'Lanza dados personalizados'],
                    ['🎰 /slot', 'Juega a la tragamonedas'],
                    ['🧠 /trivia', 'Responde preguntas de trivia'],
                    ['🧮 /math', 'Resuelve operaciones matemáticas'],
                    ['🎯 /choose', 'Elige entre varias opciones'],
                    ['🪙 /coinflip', 'Lanza una moneda al aire'],
                    ['😂 /joke', 'Un chiste aleatorio'],
                    ['🧠 /fact', 'Dato curioso aleatorio'],
                    ['🐶 /dog', 'Imagen aleatoria de un perro'],
                    ['🐱 /cat', 'Imagen aleatoria de un gato'],
                    ['📊 /poll', 'Crea encuestas interactivas'],
                ]
            },
            utils: {
                title: '⚙️ Utilidades',
                color: '#0099ff',
                fields: [
                    ['🌤️ /weather', 'Clima de cualquier ciudad'],
                    ['🎨 /color', 'Info de un color hexadecimal'],
                    ['⏰ /remind', 'Establece un recordatorio'],
                    ['⏱️ /uptime', 'Tiempo activo del bot'],
                    ['👥 /membercount', 'Contador de miembros del servidor'],
                    ['🌐 /language', 'Cambia el idioma del bot'],
                    ['🖼️ /avatar', 'Avatar de un usuario'],
                    ['🖼️ /banner', 'Banner de un usuario'],
                    ['👤 /userinfo', 'Información de un usuario'],
                    ['🏰 /serverinfo', 'Información del servidor'],
                    ['ℹ️ /info', 'Uso detallado de cada comando'],
                    ['📊 /stats', 'Estadísticas del bot'],
                    ['🏓 /ping', 'Latencia del bot'],
                    ['🎭 /roleinfo', 'Información de un rol'],
                    ['📋 /channelinfo', 'Información de un canal'],
                    ['📨 /invites', 'Invitaciones del servidor'],
                    ['🧵 /thread', 'Gestión de hilos'],
                    ['🏛️ /forum', 'Crear posts en foros'],
                    ['⭐ /nivel rank', 'Tu nivel y XP en el servidor'],
                    ['🏆 /nivel top', 'Top 10 usuarios con más XP'],
                    ['📈 /nivel setcanal', 'Canal de anuncios de nivel'],
                ]
            },
            mod: {
                title: '🛡️ Moderación',
                color: '#ffa500',
                fields: [
                    ['🔨 /ban', 'Banea a un usuario'],
                    ['👢 /kick', 'Expulsa a un usuario'],
                    ['🔕 /mute', 'Mutea temporalmente'],
                    ['🔇 /silenciar', 'Silencia en canales de voz'],
                    ['⚠️ /warn', 'Advierte a un usuario'],
                    ['📋 /warnings', 'Ver advertencias de un usuario'],
                    ['🗑️ /clearwarn', 'Borrar advertencias'],
                    ['🐌 /slowmode', 'Modo lento en canal'],
                    ['✏️ /nickname', 'Cambiar apodo de un usuario'],
                    ['🔒 /lock', 'Bloquea un canal'],
                    ['🔓 /unlock', 'Desbloquea un canal'],
                    ['🧹 /clear', 'Borrar mensajes del canal'],
                    ['📩 /md', 'Mensaje privado a un usuario'],
                    ['📨 /send', 'Envía mensajes con emojis Nitro'],
                    ['🎭 /msgrol', 'Botón de rol en mensaje'],
                    ['🎊 /create_role', 'Crea un nuevo rol'],
                    ['➕ /add_role', 'Asigna un rol a un usuario'],
                    ['👋 /welcomeset', 'Configura bienvenidas'],
                    ['📝 /welcomeconfig', 'Personaliza el mensaje'],
                    ['⭐ /starboard', 'Tablero de mensajes destacados'],
                    ['⚠️ Permisos', 'Requieren permisos de moderador'],
                ]
            },
            emojis: {
                title: '✨ Sistema de Emojis (NQN)',
                color: '#f1c40f',
                fields: [
                    ['🤖 NQN Automático', 'Escribe :emoji: en cualquier mensaje y el bot lo enviará como tú con el emoji real'],
                    ['🔍 /searchemojis', 'Busca emojis en todos los servidores del bot'],
                    ['📥 /stealemoji', 'Añade un emoji de otro servidor a este'],
                    ['ℹ️ /emojiinfo', 'Ver info detallada de un emoji'],
                    ['📨 /send', 'Envía mensajes usando emojis :nombre:'],
                    ['💡 Cómo usar NQN', 'El bot necesita permiso de "Gestionar Webhooks" y "Gestionar Mensajes" en el canal'],
                ]
            }
        };

        const cfg = categories[category];
        if (!cfg) return null;

        const allTexts = [cfg.title, 'Usa "🏠 Inicio" para volver al menú principal'];
        const fieldValues = cfg.fields.map(f => f[1]);
        allTexts.push(...fieldValues);

        const translated = lang === 'es' ? allTexts : await translateBatch(allTexts, lang);

        const translatedTitle = translated[0];
        const translatedFooter = translated[1];
        const translatedValues = translated.slice(2);

        const fields = cfg.fields.map((f, i) => ({
            name: f[0],
            value: translatedValues[i] || f[1],
            inline: true
        }));

        return new EmbedBuilder()
            .setTitle(translatedTitle)
            .setColor(cfg.color)
            .addFields(fields)
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: translatedFooter, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();
    },

    getNavButtons,
};
