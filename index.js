const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const app = new express();

const PORT = 2005;
const client = new Client();

app.use(express.json());
app.use(cors());

app.get('/', (req, res)=>{
    res.sendFile('index.html' , {'root':'.'});
})

/*
path : [POST] /shortenUrl
input : body
    * longurl - string
output :
    * shortkey - string
*/
app.post('/shortenUrl', async (req, res)=>{
    const long = typeof req.body?.longUrl === 'string' ? req.body.longUrl.trim() : '';

    if (!isValidUrl(long)) {
        return res.status(400).send({
            "error": "Please provide a valid URL."
        });
    }

    const short = randomString();

    try {
        await client.query(
            'INSERT INTO urls (short_key, long_url) VALUES ($1, $2)',
            [short, long]
        );

        res.send({
            "shortKey": short
        });
    } catch (error) {
        console.error('Unable to save URL:', error.message);
        res.status(500).send({
            "error": "Unable to shorten URL."
        });
    }
})

function isValidUrl(value) {
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol);
    } catch (error) {
        return false;
    }
}

/* 
path : [GET] /:shortKey 
input : http label
    * shortKey - string
output : redirect
    * longUrl - string
*/

app.get('/:shortKey', async (req, res)=>{
    const short = req.params.shortKey;
    try {
        const result = await client.query(
            'SELECT long_url FROM urls WHERE short_key = $1',
            [short]
        );

        if (result.rows.length === 0) {
            return res.status(404).send({
                "error": "Short URL not found."
            });
        }

        res.redirect(result.rows[0].long_url);
    } catch (error) {
        console.error('Unable to find URL:', error.message);
        res.status(500).send({
            "error": "Unable to find short URL."
        });
    }
})

function randomString() {
    return Math.random().toString(36).substring(2, 8);
}

async function startServer() {
    await client.connect();
    await client.query(`
        CREATE TABLE IF NOT EXISTS urls (
            short_key TEXT PRIMARY KEY,
            long_url TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    app.listen(PORT, ()=>{
        console.log(`Server is running at ${PORT}`);
    });
}

startServer().catch((error) => {
    console.error('Unable to start server:', error.message);
    process.exit(1);
});
