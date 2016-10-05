var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var Botkit = require('botkit')

var token = process.env.SLACK_TOKEN

var controller = Botkit.slackbot({
  // reconnect to Slack RTM when connection goes bad
  retry: Infinity,
  debug: false
})

// Assume single team mode if we have a SLACK_TOKEN
if (token) {
  console.log('Starting in single-team mode')
  controller.spawn({
    token: token,
    retry: Infinity
  }).startRTM(function (err, bot, payload) {
    if (err) {
      throw new Error(err)
    }

    console.log('Connected to Slack RTM')
  })
// Otherwise assume multi-team mode - setup beep boop resourcer connection
} else {
  console.log('Starting in Beep Boop multi-team mode')
  require('beepboop-botkit').start(controller, { debug: true })
}

controller.on('bot_channel_join', function (bot, message) {
  bot.reply(message, "I'm here!")
})

controller.hears(['hello', 'hi'], ['direct_mention'], function (bot, message) {
  bot.reply(message, 'Hello.')
})

controller.hears(['hello', 'hi'], ['direct_message'], function (bot, message) {
  bot.reply(message, 'Hello.')
  bot.reply(message, 'It\'s nice to talk to you directly.')
})

controller.hears('.*', ['mention'], function (bot, message) {
  bot.reply(message, 'You really do care about me. :heart:')
})

controller.hears('help', ['direct_message', 'direct_mention'], function (bot, message) {
  var help = 'I will respond to the following messages: \n' +
      '`bot hi` for a simple message.\n' +
      '`bot attachment` to see a Slack attachment message.\n' +
      '`@<your bot\'s name>` to demonstrate detecting a mention.\n' +
      '`bot help` to see this again.'
  bot.reply(message, help)
})

controller.hears(['attachment'], ['direct_message', 'direct_mention'], function (bot, message) {
  var text = 'Beep Beep Boop is a ridiculously simple hosting platform for your Slackbots.'
  var attachments = [{
    fallback: text,
    pretext: 'We bring bots to life. :sunglasses: :thumbsup:',
    title: 'Host, deploy and share your bot in seconds.',
    image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
    title_link: 'https://beepboophq.com/',
    text: text,
    color: '#7CD197'
  }]

  bot.reply(message, {
    attachments: attachments
  }, function (err, resp) {
    console.log(err, resp)
  })
})

controller.hears('.*', ['direct_message', 'direct_mention'], function (bot, message) {
  bot.reply(message, 'Sorry <@' + message.user + '>, I don\'t understand. \n')
})

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
        title = '@' + user + ' just posted a spoiler.';
        spoiler = req.body.text;
    } else if (params.length === 1) {
        title = '@' + user + ' just posted a spoiler.';
        spoiler = params[0];
    } else {
        title = user + ' ' + params[0];
        params.splice(0, 1);
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
