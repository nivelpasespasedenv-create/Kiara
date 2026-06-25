const axios = require('axios');
const config = require('../config');

// Función para obtener memes
async function fetchMeme(category = 'random') {
    try {
        let url;
        
        // Mapeo de subreddits por idioma/categoría
        const subredditMap = {
            'SpanishMemes': 'SpanishMemes',
            'ProgrammerHumor': 'ProgrammerHumor',
            'dankmemes': 'dankmemes',
            'random': 'memes' // Mejor que 'random' para asegurar contenido
        };

        const targetSubreddit = subredditMap[category] || category;
        url = `https://meme-api.com/gimme/${targetSubreddit}`;

        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Discord-Bot-Memes/1.0'
            }
        });

        if (response.data && response.data.url) {
            return {
                title: response.data.title || 'Meme divertido',
                url: response.data.url,
                author: response.data.author || null,
                ups: response.data.ups || null,
                subreddit: response.data.subreddit || null
            };
        }

        return null;
    } catch (error) {
        console.error('Error fetching meme:', error.message);
        
        // Intentar con API de respaldo
        try {
            const backupResponse = await axios.get('https://api.imgflip.com/get_memes', {
                timeout: 10000
            });
            
            if (backupResponse.data.success && backupResponse.data.data.memes.length > 0) {
                const randomMeme = backupResponse.data.data.memes[Math.floor(Math.random() * backupResponse.data.data.memes.length)];
                return {
                    title: randomMeme.name,
                    url: randomMeme.url,
                    author: null,
                    ups: null
                };
            }
        } catch (backupError) {
            console.error('Backup meme API also failed:', backupError.message);
        }
        
        return null;
    }
}

// Función para obtener GIFs de anime
async function fetchAnimeGif(type) {
    try {
        const response = await axios.get(`https://api.waifu.pics/sfw/${type}`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Discord-Bot-Anime/1.0'
            }
        });

        if (response.data && response.data.url) {
            return response.data.url;
        }

        return null;
    } catch (error) {
        console.error(`Error fetching anime GIF (${type}):`, error.message);
        
        // Intentar con API alternativa
        try {
            const alternativeTypes = {
                'hug': 'hug',
                'smile': 'smile',
                'wave': 'wave',
                'sleepy': 'sleepy',
                'happy': 'happy',
                'cry': 'cry',
                'think': 'think',
                'nom': 'nom'
            };

            if (alternativeTypes[type]) {
                const altResponse = await axios.get(`https://api.waifu.im/search/?included_tags=${type}`, {
                    timeout: 10000
                });

                if (altResponse.data && altResponse.data.images && altResponse.data.images.length > 0) {
                    return altResponse.data.images[0].url;
                }
            }
        } catch (altError) {
            console.error('Alternative anime API also failed:', altError.message);
        }

        return null;
    }
}

// Función para obtener imágenes de anime (no GIFs)
async function fetchAnimeImage(type) {
    try {
        const response = await axios.get(`https://api.waifu.pics/sfw/${type}`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Discord-Bot-Anime/1.0'
            }
        });

        if (response.data && response.data.url) {
            return response.data.url;
        }

        return null;
    } catch (error) {
        console.error(`Error fetching anime image (${type}):`, error.message);
        
        // URL de respaldo
        const fallbackImages = {
            waifu: 'https://cdn.waifu.im/3582.jpg',
        };

        return fallbackImages[type] || null;
    }
}

// Función para verificar si una URL es válida
async function validateImageUrl(url) {
    try {
        const response = await axios.head(url, { timeout: 5000 });
        return response.status === 200 && response.headers['content-type']?.startsWith('image/');
    } catch (error) {
        return false;
    }
}

module.exports = {
    fetchMeme,
    fetchAnimeGif,
    fetchAnimeImage,
    validateImageUrl
};
