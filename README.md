# slack-spoiler-command

A basic [Slack slash command](https://api.slack.com/slash-commands) in node.js for running on the [Beep Boop](https://beepboophq.com) platform.  It can run on any platform as long as the following environment variables are provided:

+ `PORT` - the port to start the http server on
+ `SLACK_VERIFY_TOKEN` - the verify token for your Slack slash commands

Exposes a `/spoiler` route that is intended to power a Slack slash command for providing spoiler text for both mobile and desktop.

Due to hosting costs the slack app is currently unpublished in the slack store. You should be able to create your own fork of this and run it at beepboophq or elsewhere easily enough.


