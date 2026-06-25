const OpenAI = require('openai');

let _client = null;

function getOpenAI() {
    if (!_client) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno.');
        }
        _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _client;
}

module.exports = { getOpenAI };
