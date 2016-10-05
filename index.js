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

controller.on('slash_command', function(bot, message) {
    if (message.command !== "spoiler") {
        console.log('Skipping command: ' + message.command);
        return;
    }
    
    var user = message.user;
    var params = message.text.match(/\w+|"[^"]+"/g); //split our (possibly quoted) params
    if (params.length === 0) {
        bot.replyPrivate(message, {
          response_type: 'ephemeral',
          text: 'You didnt enter anything to spoiler text.'
        });
    }
    
    var title, spoiler;
    if (message.text.indexOf('"') < 0) {
        title = '@' + user + ' just posted a spoiler.';
        spoiler = message.text;
    } else if (params.length === 1) {
        title = '@' + user + ' just posted a spoiler.';
        spoiler = params[0];
    } else {
        title = user + ' ' + params[0];
        params.splice(0, 1);
        spoiler = params.join(' ');
    }

    bot.replyPublic(message, {
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
    });
});
