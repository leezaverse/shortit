const express = require('express');
const app = new express();

const PORT = 2005;

app.use(express.json());

let shortToLong = {};

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
app.post('/shortenUrl', (req, res)=>{
    const long = typeof req.body?.longUrl === 'string' ? req.body.longUrl.trim() : '';

    if (!isValidUrl(long)) {
        return res.status(400).send({
            "error": "Please provide a valid URL."
        });
    }

    const short = randomString();

    console.log(`\n\n\nkey to longurl : ${long} is ${short}`);

    shortToLong[short] = long;
    console.log(shortToLong);

    res.send({
        "shortKey": short
    });
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

app.get('/:shortKey', (req, res)=>{
    const short = req.params.shortKey;
    const longUrl = shortToLong[short];
    console.log(`Redirecting for request for ${short} to ${longUrl}`);

    res.redirect(longUrl);
})

function randomString() {
    return Math.random().toString(36).substring(2, 8);
}

app.listen(PORT, ()=>{
    console.log(`Server is running at ${PORT}`);
})
