var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');

var VERIFY_TOKEN = process.env.SLACK_VERIFY_TOKEN;
if (!VERIFY_TOKEN) {
    console.error('SLACK_VERIFY_TOKEN is required');
    process.exit(1);
}
var PORT = process.env.PORT
if (!PORT) {
    console.error('PORT is required');
    process.exit(1);
}

var app = express()
app.use(morgan('dev'))

app.route('/spoiler-callback')
.get(function (req, res) {
    return res.sendStatus(200);
})
.post(bodyParser.urlencoded({ extended: true }), function (req, res) {
    if (req.body.token !== VERIFY_TOKEN) {
        return res.sendStatus(401);
    }
    return res.sendStatus(200);
});

app.route('/spoiler')
.get(function (req, res) {
    res.sendStatus(200);
})
.post(bodyParser.urlencoded({ extended: true }), function (req, res) {
    if (req.body.token !== VERIFY_TOKEN) {
        return res.sendStatus(401);
    }

    var user = req.body.user_name;
    var params = req.body.text.match(/\w+|"[^"]+"/g); //split our (possibly quoted) params
    if (params.length === 0) {
        return res.json({
          response_type: 'ephemeral',
          text: 'You didnt enter anything to spoiler text.'
        });
    }
    
    var title, spoiler;
    if (req.body.text.indexOf('"') < 0) {
        title = user + ' just posted a spoiler.';
        spoiler = req.body.text;
    } else if (params.length === 1) {
        title = user + ' just posted a spoiler.';
        spoiler = params[0];
    } else {
        title = user + ' ' + params[0];
        params.splice(index, 1);
        spoiler = params.join(' ');
    }

    res.json({
        "response_type": "in_channel",
        "attachments": [{
            "callback_id": "spoiler-callback",
            "title": title,
            "attachment_type": "default",
            "fallback": "Uh oh - doesn't look like your device supports this",
            "actions": [{
                "name": "view",       
                "text": "Click to view spoiler",
                "style": "danger",
                "type": "button",
                "confirm": {
                    "title": "Spoiler",
                    "text": spoiler
                }
            }]
        }]
    })
});
app.listen(PORT, function (err) {
    if (err) {
        return console.error('Error starting server: ', err);
    }

    console.log('Server successfully started on port %s', PORT);
});
