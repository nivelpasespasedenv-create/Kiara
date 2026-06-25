const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const express = require('express');

// Servidor web para mantener el bot activo
const app = express();
app.get("/", (req, res) => {
    res.status(200).send("Bot activo ✅");
});
app.get("/ping", (req, res) => {
    res.status(200).send("pong");
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Servidor web activo en el puerto ${PORT}`);
});

// Crear el cliente del bot con los intents necesarios
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildEmojisAndStickers,
    ],
    partials: ['Message', 'Channel', 'Reaction'],
});

// Colección para almacenar comandos
client.commands = new Collection();

// Cargar comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Comando cargado: ${command.data.name}`);
    } else {
        console.log(`⚠️ El comando en ${filePath} no tiene la estructura requerida.`);
    }
}

// Cargar eventos
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
        client.once(event.name, (...args) => {
            console.log(`🔥 Evento ejecutado (once): ${event.name}`);
            event.execute(...args);
        });
    } else {
        client.on(event.name, (...args) => {
            console.log(`🔥 Evento ejecutado: ${event.name}`);
            event.execute(...args);
        });
    }
    console.log(`✅ Evento cargado: ${event.name}`);
}

// Manejar errores no capturados
process.on('unhandledRejection', error => {
    console.error('Error no manejado:', error);
});

// Iniciar el bot
client.login(config.token);
