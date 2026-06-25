const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Explicación detallada de cómo usar cada comando')
        .addStringOption(option =>
            option.setName('comando')
                .setDescription('Comando del que quieres información detallada')
                .setRequired(true)
                .addChoices(
                    { name: '🤗 abrazo', value: 'abrazo' },
                    { name: '💞 almagemela', value: 'almagemela' },
                    { name: '🌸 anime', value: 'anime' },
                    { name: '🖼️ avatar', value: 'avatar' },
                    { name: '🔨 ban', value: 'ban' },
                    { name: '🖼️ banner', value: 'banner' },
                    { name: '😘 beso', value: 'beso' },
                    { name: '🎌 buscanime', value: 'buscanime' },
                    { name: '🧹 clear', value: 'clear' },
                    { name: '💌 confession', value: 'confession' },
                    { name: '📺 dondever', value: 'dondever' },
                    { name: '🤖 ia', value: 'ia' },
                    { name: '👢 kick', value: 'kick' },
                    { name: '💕 lovemeter', value: 'lovemeter' },
                    { name: '💀 matar', value: 'matar' },
                    { name: '🤣 meme', value: 'meme' },
                    { name: '⛏️ minecraft', value: 'minecraft' },
                    { name: '📊 poll', value: 'poll' },
                    { name: '🎬 recpeli', value: 'recpeli' },
                    { name: '🎌 recanime', value: 'recanime' },
                    { name: '🟦 roblox', value: 'roblox' },
                    { name: '📊 stats', value: 'stats' },
                    { name: '🐦 tuitear', value: 'tuitear' },
                    { name: '👤 userinfo', value: 'userinfo' },
                    { name: '👋 welcomeset', value: 'welcomeset' }
                )),

    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        const comando = interaction.options.getString('comando');

        const es = lang === 'es';

        const infoData = {
            abrazo: {
                emoji: '🤗',
                usage: '/abrazo usuario:@usuario',
                desc: es ? 'Dale un abrazo virtual a alguien del servidor. El bot responderá con un GIF de anime.' : 'Give someone a virtual hug. The bot will reply with an anime GIF.',
                example: '/abrazo usuario:@Sasha'
            },
            almagemela: {
                emoji: '💞',
                usage: '/almagemela',
                desc: es ? 'Descubre quién es tu alma gemela en el servidor. El bot elige a un miembro al azar.' : 'Find out who your soulmate is in the server. The bot picks a random member.',
                example: '/almagemela'
            },
            anime: {
                emoji: '🌸',
                usage: '/anime [tipo]',
                desc: es ? 'Obtén imágenes o GIFs de anime. Puedes especificar un tipo (kiss, hug, waifu, etc.).' : 'Get anime images or GIFs. You can specify a type (kiss, hug, waifu, etc.).',
                example: '/anime tipo:waifu'
            },
            avatar: {
                emoji: '🖼️',
                usage: '/avatar [usuario:@usuario]',
                desc: es ? 'Muestra el avatar de un usuario en alta resolución. Si no mencionas a nadie, muestra el tuyo.' : 'Shows a user\'s avatar in high resolution. If no one is mentioned, shows yours.',
                example: '/avatar usuario:@Sasha'
            },
            ban: {
                emoji: '🔨',
                usage: '/ban usuario:@usuario [razón]',
                desc: es ? 'Banea a un usuario del servidor permanentemente. Requiere permiso de banear miembros.' : 'Permanently bans a user from the server. Requires ban members permission.',
                example: '/ban usuario:@usuario razón:Romper las reglas'
            },
            banner: {
                emoji: '🖼️',
                usage: '/banner [usuario:@usuario]',
                desc: es ? 'Muestra el banner de un usuario. Si no tiene Nitro, muestra su color de perfil con el código hex. Si no mencionas a nadie, muestra el tuyo.' : 'Shows a user\'s banner. If they don\'t have Nitro, shows their profile color with the hex code.',
                example: '/banner usuario:@Sasha'
            },
            beso: {
                emoji: '😘',
                usage: '/beso usuario:@usuario',
                desc: es ? 'Dale un beso virtual a alguien del servidor. El bot responderá con un GIF de anime.' : 'Give someone a virtual kiss. The bot will reply with an anime GIF.',
                example: '/beso usuario:@Sasha'
            },
            buscanime: {
                emoji: '🎌',
                usage: '/buscanime nombre:<anime>',
                desc: es ? 'Busca información detallada sobre un anime: sinopsis, episodios, puntuación, etc.' : 'Search for detailed info about an anime: synopsis, episodes, score, etc.',
                example: '/buscanime nombre:Naruto'
            },
            clear: {
                emoji: '🧹',
                usage: '/clear cantidad:<número>',
                desc: es ? 'Borra una cantidad de mensajes del canal actual (máximo 100). Requiere permiso de gestionar mensajes.' : 'Deletes a number of messages from the current channel (max 100). Requires manage messages permission.',
                example: '/clear cantidad:20'
            },
            coinflip: {
                emoji: '🪙',
                usage: '/coinflip',
                desc: es ? 'Lanza una moneda al aire. El resultado será cara o cruz de forma aleatoria.' : 'Flip a coin. The result will be heads or tails randomly.',
                example: '/coinflip'
            },
            confession: {
                emoji: '💌',
                usage: '/confession mensaje:<texto>',
                desc: es ? 'Envía una confesión anónima al canal. Tu nombre no aparecerá en el mensaje.' : 'Send an anonymous confession to the channel. Your name won\'t appear in the message.',
                example: '/confession mensaje:Me gusta alguien del servidor'
            },
            dondever: {
                emoji: '📺',
                usage: '/dondever titulo:<título>',
                desc: es ? 'Busca en qué plataformas de streaming está disponible una serie o película.' : 'Find which streaming platforms a series or movie is available on.',
                example: '/dondever titulo:Breaking Bad'
            },
            ia: {
                emoji: '🤖',
                usage: '/ia pregunta:<texto>',
                desc: es ? 'Chatea con la inteligencia artificial integrada. Puedes hacer preguntas, pedir consejos o tener una conversación.' : 'Chat with the integrated AI. You can ask questions, request advice, or have a conversation.',
                example: '/ia pregunta:¿Cuál es el sentido de la vida?'
            },
            kick: {
                emoji: '👢',
                usage: '/kick usuario:@usuario [razón]',
                desc: es ? 'Expulsa a un usuario del servidor. El usuario podrá volver con una nueva invitación. Requiere permiso de expulsar miembros.' : 'Kicks a user from the server. The user can rejoin with a new invite. Requires kick members permission.',
                example: '/kick usuario:@usuario razón:Comportamiento inapropiado'
            },
            lovemeter: {
                emoji: '💕',
                usage: '/lovemeter usuario1:@usuario [usuario2:@usuario]',
                desc: es ? 'Calcula el porcentaje de compatibilidad amorosa entre dos usuarios. Si no pones el segundo usuario, te compara contigo mismo.' : 'Calculates the love compatibility percentage between two users.',
                example: '/lovemeter usuario1:@Sasha usuario2:@usuario'
            },
            matar: {
                emoji: '💀',
                usage: '/matar usuario:@usuario',
                desc: es ? 'Elimina a un usuario de forma divertida con mensajes creativos. Solo es un juego.' : 'Eliminates a user in a fun way with creative messages. It\'s just a game.',
                example: '/matar usuario:@usuario'
            },
            meme: {
                emoji: '🤣',
                usage: '/meme',
                desc: es ? 'Obtén un meme aleatorio de internet. El bot traerá uno diferente cada vez.' : 'Get a random meme from the internet. The bot will bring a different one each time.',
                example: '/meme'
            },
            minecraft: {
                emoji: '⛏️',
                usage: '/minecraft servidor:<ip>',
                desc: es ? 'Muestra información de un servidor de Minecraft: jugadores conectados, versión, descripción, etc.' : 'Shows info about a Minecraft server: connected players, version, description, etc.',
                example: '/minecraft servidor:play.hypixel.net'
            },
            ping: {
                emoji: '🏓',
                usage: '/ping',
                desc: es ? 'Muestra la latencia actual del bot y el estado de la conexión con Discord.' : 'Shows the bot\'s current latency and connection status with Discord.',
                example: '/ping'
            },
            poll: {
                emoji: '📊',
                usage: '/poll pregunta:<texto>',
                desc: es ? 'Crea una encuesta interactiva con opciones de votación en el canal.' : 'Creates an interactive poll with voting options in the channel.',
                example: '/poll pregunta:¿Cuál es tu color favorito?'
            },
            recanime: {
                emoji: '🎌',
                usage: '/recanime [genero:<género>]',
                desc: es ? 'Recibe recomendaciones de anime generadas por IA. Puedes especificar un género.' : 'Get AI-generated anime recommendations. You can specify a genre.',
                example: '/recanime genero:acción'
            },
            recpeli: {
                emoji: '🎬',
                usage: '/recpeli [genero:<género>]',
                desc: es ? 'Recibe recomendaciones de películas y series generadas por IA. Puedes especificar un género.' : 'Get AI-generated movie and series recommendations. You can specify a genre.',
                example: '/recpeli genero:terror'
            },
            roblox: {
                emoji: '🟦',
                usage: '/roblox usuario:<nombre>',
                desc: es ? 'Muestra el perfil de un usuario de Roblox: amigos, seguidores, grupos y más.' : 'Shows a Roblox user\'s profile: friends, followers, groups, and more.',
                example: '/roblox usuario:Builderman'
            },
            serverinfo: {
                emoji: '🏰',
                usage: '/serverinfo',
                desc: es ? 'Muestra información detallada del servidor: nombre, miembros, canales, roles, fecha de creación y más.' : 'Shows detailed server information: name, members, channels, roles, creation date, and more.',
                example: '/serverinfo'
            },
            stats: {
                emoji: '📊',
                usage: '/stats',
                desc: es ? 'Muestra las estadísticas del bot: servidores donde está activo, usuarios totales, comandos disponibles y tiempo en línea.' : 'Shows the bot\'s stats: active servers, total users, available commands, and uptime.',
                example: '/stats'
            },
            tuitear: {
                emoji: '🐦',
                usage: '/tuitear texto:<texto>',
                desc: es ? 'Simula un tweet con tu nombre de usuario y una imagen estilo Twitter.' : 'Simulates a tweet with your username and a Twitter-style image.',
                example: '/tuitear texto:¡Este bot es increíble!'
            },
            userinfo: {
                emoji: '👤',
                usage: '/userinfo [usuario:@usuario]',
                desc: es ? 'Muestra información detallada de un usuario: fecha de registro, fecha de entrada al server, roles y más. Si no mencionas a nadie, muestra la tuya.' : 'Shows detailed user info: registration date, server join date, roles, and more.',
                example: '/userinfo usuario:@Sasha'
            },
            welcomeset: {
                emoji: '👋',
                usage: '/welcomeset canal:#canal',
                desc: es ? 'Configura el canal donde el bot enviará mensajes de bienvenida cuando alguien nuevo entre al servidor.' : 'Sets the channel where the bot will send welcome messages when someone new joins.',
                example: '/welcomeset canal:#bienvenidas'
            },
        };

        const data = infoData[comando];

        if (!data) {
            return await interaction.reply({
                content: es ? `❌ No tengo información detallada sobre **/${comando}** aún.` : `❌ I don't have detailed info about **/${comando}** yet.`,
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`${data.emoji} Comando: /${comando}`)
            .setColor('#7289DA')
            .addFields(
                {
                    name: es ? '📋 Cómo usarlo' : '📋 How to use it',
                    value: `\`${data.usage}\``,
                    inline: false
                },
                {
                    name: es ? '📖 Descripción' : '📖 Description',
                    value: data.desc,
                    inline: false
                },
                {
                    name: es ? '💡 Ejemplo' : '💡 Example',
                    value: `\`${data.example}\``,
                    inline: false
                }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: es ? 'Usa /ayuda para ver todos los comandos' : 'Use /ayuda to see all commands', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
