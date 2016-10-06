var Botkit = require('botkit');

var PORT = process.env.PORT
if (!PORT) {
    console.error('PORT is required');
    process.exit(1);
}

var VERIFY_TOKEN = process.env.SLACK_VERIFY_TOKEN
if (!VERIFY_TOKEN) {
  console.error('SLACK_VERIFY_TOKEN is required')
  process.exit(1)
}

var controller = Botkit.slackbot({
  // reconnect to Slack RTM when connection goes bad
  retry: Infinity,
  debug: false
});

console.log('Starting in Beep Boop multi-team mode')
require('beepboop-botkit').start(controller, { debug: true })

controller.setupWebserver(PORT, function(err, webserver) {
    if (err) {
        console.error(err)
        process.exit(1)
    }
    // Setup our slash command webhook endpoints
    controller.createWebhookEndpoints(webserver)
});

controller.on('slash_command', function(bot, message) {
    if (message.token !== VERIFY_TOKEN) {
        return bot.res.send(401, 'Unauthorized');
    }
    if (message.command !== "/spoiler") {
        bot.replyAcknowledge();
        return;
    }
    
    var user = message.user_name;
    var params = message.text.match(/\w+|"[^"]+"/g); //split our (possibly quoted) params
    if (!params || params.length === 0) {
        bot.replyPrivate(message, {
          response_type: 'ephemeral',
          text: 'You didnt enter anything to spoiler text.'
        });
        return;
    }
    
    var title, spoiler;
    if (message.text.indexOf('"') < 0) {
        title = '@' + user + ' just posted a spoiler.';
        spoiler = message.text;
    } else if (params.length === 1) {
        title = '@' + user + ' just posted a spoiler.';
        spoiler = params[0];
    } else {
        title = '@' + user + ' just posted a spoiler ' + params[0];
        params.splice(0, 1);
        spoiler = params.join(' ');
    }

    bot.replyPublicDelayed(message, {
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
    }, function() {
        return bot.res.send(200, '');
    });
});

// receive an interactive message, and reply with a message that will replace the original
controller.on('interactive_message_callback', function(bot, message) {
    if (message.token !== VERIFY_TOKEN) {
        return bot.res.send(401, 'Unauthorized');
    }
    
    // check message.actions and message.callback_id to see what action to take...
    bot.replyPrivateDelayed(message, 'Sike! - Still gotta find the original spoiler text :(');
});
