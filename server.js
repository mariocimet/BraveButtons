let fs = require('fs')
let express = require('express')
let https = require('https')
let moment = require('moment')
let bodyParser = require('body-parser')
let app = express()
let jsonBodyParser = bodyParser.json()

function log(logString) {
    console.log(moment().toString() + " - " + logString)
}

app.post('/', jsonBodyParser, (req, res) => {
    log('got a request')
    res.status(200).send()
})

let httpsOptions = {
    key: fs.readFileSync(`/etc/letsencrypt/live/chatbot.brave.coop/privkey.pem`),
    cert: fs.readFileSync(`/etc/letsencrypt/live/chatbot.brave.coop/fullchain.pem`)
}

https.createServer(httpsOptions, app).listen(443)
log('brave server listening on port 443')
