const express = require('express');
const translate = require('google-translate-api-x');

const app = express();


app.use(express.static('public'));

app.use(express.json());

app.post('/translate', async (req, res) => {
    const { title, culture, dynasty } = req.body;

    try {
      
        const [translatedTitle, translatedCulture, translatedDynasty] = await Promise.all([
            translateText(title, 'es'),
            translateText(culture, 'es'),
            translateText(dynasty, 'es')
        ]);

        res.json({
            title: translatedTitle,
            culture: translatedCulture,
            dynasty: translatedDynasty
        });
    } catch (error) {
        console.error('Error during translation:', error);
        res.status(500).json({ error: 'Error during translation' });
    }
});

async function translateText(text, targetLang) {
    if (!text || text.trim() === '') {
        return 'Desconocido'; 
    }

    try {
        const result = await translate(text, { to: targetLang });
        console.log(`Translation successful for text "${text}": ${result.text}`);
        return result.text;
    } catch (err) {
        console.error(`Error translating text "${text}": ${err}`);
        return 'Translation failed';
    }
}


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
