const { ActivityType } = require('discord.js');

const PRESENCE_CYCLE = ['idle', 'dnd'];

class StatusManager {
    constructor(client) {
        this.client = client;
        this.statusInterval = null;
        this.presenceInterval = null;
        this.currentStatusIndex = 0;
        this.currentPresenceIndex = 0;
        this.statusMessages = [];
    }

    /**
     * Inicializar el sistema de estado dinámico
     */
    initialize() {
        this.updateStatusMessages();
        this.startStatusRotation();
        this.startPresenceRotation();
        console.log('✅ Sistema de estado dinámico iniciado');
    }

    /**
     * Actualizar los mensajes de estado basados en la actividad del servidor
     */
    updateStatusMessages() {
        const guildCount = this.client.guilds.cache.size;
        const userCount = this.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const channelCount = this.client.channels.cache.size;

        this.statusMessages = [
            {
                name: `${guildCount} servidor${guildCount !== 1 ? 'es' : ''}`,
                type: ActivityType.Watching
            },
            {
                name: `${userCount} usuario${userCount !== 1 ? 's' : ''}`,
                type: ActivityType.Listening
            },
            {
                name: `memes y anime`,
                type: ActivityType.Playing
            },
            {
                name: `/ayuda para comandos`,
                type: ActivityType.Playing
            },
            {
                name: `${channelCount} canal${channelCount !== 1 ? 'es' : ''}`,
                type: ActivityType.Watching
            },
            {
                name: `abrazos virtuales`,
                type: ActivityType.Playing
            }
        ];

        console.log(`📊 Estados actualizados: ${guildCount} servidores, ${userCount} usuarios`);
    }

    /**
     * Iniciar la rotación automática de estados
     */
    startStatusRotation() {
        // Actualizar inmediatamente
        this.setNextStatus();

        // Configurar intervalo de rotación cada 30 segundos
        this.statusInterval = setInterval(() => {
            this.setNextStatus();
        }, 30000);
    }

    /**
     * Establecer el siguiente estado en la rotación
     */
    setNextStatus() {
        if (this.statusMessages.length === 0) {
            this.updateStatusMessages();
        }

        const activity = this.statusMessages[this.currentStatusIndex];
        const status = PRESENCE_CYCLE[this.currentPresenceIndex];

        this.client.user.setPresence({
            activities: [{ name: activity.name, type: activity.type }],
            status,
        });

        console.log(`🔄 Estado: ${status} | ${this.getActivityTypeName(activity.type)} ${activity.name}`);

        this.currentStatusIndex = (this.currentStatusIndex + 1) % this.statusMessages.length;
    }

    startPresenceRotation() {
        // Alternar entre ausente y no molestar cada 3 minutos
        this.presenceInterval = setInterval(() => {
            this.currentPresenceIndex = (this.currentPresenceIndex + 1) % PRESENCE_CYCLE.length;
            const activity = this.statusMessages[this.currentStatusIndex] || this.statusMessages[0];
            const status = PRESENCE_CYCLE[this.currentPresenceIndex];

            this.client.user.setPresence({
                activities: activity ? [{ name: activity.name, type: activity.type }] : [],
                status,
            });

            console.log(`🎭 Presencia cambiada: ${status}`);
        }, 3 * 60 * 1000);
    }

    /**
     * Actualizar estadísticas cuando se une o abandona un servidor
     */
    onGuildUpdate() {
        console.log('🔄 Actualizando estados por cambio en servidores...');
        this.updateStatusMessages();
    }

    /**
     * Detener la rotación de estados
     */
    stop() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
        if (this.presenceInterval) {
            clearInterval(this.presenceInterval);
            this.presenceInterval = null;
        }
        console.log('⏹️ Sistema de estado dinámico detenido');
    }

    /**
     * Obtener nombre legible del tipo de actividad
     */
    getActivityTypeName(type) {
        switch (type) {
            case ActivityType.Playing: return 'Jugando';
            case ActivityType.Streaming: return 'Transmitiendo';
            case ActivityType.Listening: return 'Escuchando';
            case ActivityType.Watching: return 'Viendo';
            case ActivityType.Competing: return 'Compitiendo';
            default: return 'Desconocido';
        }
    }

    /**
     * Establecer un estado personalizado temporalmente
     * @param {string} message - Mensaje del estado
     * @param {ActivityType} type - Tipo de actividad
     * @param {number} duration - Duración en milisegundos (opcional)
     */
    setCustomStatus(message, type = ActivityType.Playing, duration = null) {
        this.client.user.setActivity(message, { type });
        console.log(`🎯 Estado personalizado: ${this.getActivityTypeName(type)} ${message}`);

        if (duration) {
            setTimeout(() => {
                this.setNextStatus();
            }, duration);
        }
    }

    /**
     * Obtener estadísticas actuales del bot
     */
    getStats() {
        const guildCount = this.client.guilds.cache.size;
        const userCount = this.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const channelCount = this.client.channels.cache.size;
        
        return {
            guilds: guildCount,
            users: userCount,
            channels: channelCount,
            uptime: process.uptime()
        };
    }
}

module.exports = StatusManager;