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
    const short = randomString();
    const long = req.body.longUrl;

    console.log(`\n\n\nkey to longurl : ${long} is ${short}`);

    shortToLong[short] = long;
    console.log(shortToLong);

    res.send({
        "shortKey": short
    });
})

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
