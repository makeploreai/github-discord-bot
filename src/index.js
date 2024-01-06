const express = require('express');
const bodyParser = require('body-parser');
const { Client, IntentsBitField } = require('discord.js');
require('dotenv').config();

const app = express();
const port = 3000; // You can change this to the desired port

const discordToken = process.env.DISCORD_TOKEN;
const githubSecret = process.env.GITHUB_SECRET;

const discordClient = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildMessageTyping,
    ],

});


app.use(bodyParser.json());

discordClient.login(discordToken);

discordClient.on('ready', () => {
  console.log(`Logged in as ${discordClient.user.tag}`);
});

app.post('/github-webhook', (req, res) => {
  const signature = req.get('X-Hub-Signature');
  if (!verifyGitHubSignature(signature, req.body, githubSecret)) {
    return res.status(403).send('Invalid GitHub signature');
  }

  const repoName = req.body.repository.name;
  const commitMessage = req.body.head_commit.message;
  const discordChannelId = process.env.DISCORD_CHANNEL_ID;

  const channel = discordClient.channels.cache.get(discordChannelId);
  if (channel) {
    channel.send(`New commit in ${repoName}:\n${commitMessage}`);
  }

  res.status(200).send('OK');
});

function verifyGitHubSignature(signature, body, secret) {
  const crypto = require('crypto');
  const hash = crypto.createHmac('sha1', secret).update(JSON.stringify(body)).digest('hex');
  const expectedSignature = `sha1=${hash}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

app.listen(port, () => {
  console.log(`✅ Bot Running Successfull ${port}`);
});
