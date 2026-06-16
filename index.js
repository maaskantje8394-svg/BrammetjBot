import express from "express";
import fetch from "node-fetch";
import { Client, GatewayIntentBits } from "discord.js";

// ===== CONFIG =====
const DISCORD_TOKEN = process.env.TOKEN;
const VOICE_CHANNEL_ID = "1458572087647011058";

const LIVE_CHANNEL_ID = "1516556821278625994";
const USER_ID_TO_PING = "1189931854657224858";

const TIKTOK_USERNAME = "brammetjenl";
const UPDATE_INTERVAL = 15 * 60 * 1000;
// ==================

const app = express();
app.get("/", (_, res) => res.send("Bot is online!"));
app.listen(process.env.PORT || 3000, () => console.log("Server running"));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let wasLive = false;

// ===== READY =====
client.once("ready", async () => {
  console.log(`Ingelogd als ${client.user.tag}`);

  client.user.setActivity("Kijkt naar Brammetje op TikTok 🎥", {
    type: 3,
  });

  await updateFollowers();

  setInterval(updateFollowers, UPDATE_INTERVAL);
  setInterval(checkTikTokLive, 60 * 1000);
});

// ===== FOLLOWERS =====
async function getFollowers(username) {
  const url = `https://www.tiktok.com/@${username}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const html = await res.text();
  const match = html.match(/"followerCount":(\d+)/);

  if (!match) throw new Error("Followers niet gevonden");

  return Number(match[1]);
}

async function updateFollowers() {
  try {
    const followers = await getFollowers(TIKTOK_USERNAME);
    const voiceChannel = await client.channels.fetch(VOICE_CHANNEL_ID);

    const newName = `『🎯』Volgers: ${followers}`;

    if (voiceChannel.name !== newName) {
      await voiceChannel.setName(newName);
      console.log("Kanaalnaam geüpdatet:", newName);
    }
  } catch (err) {
    console.error("Update fout:", err.message);
  }
}

// ===== MESSAGE BUILDER =====
function buildLiveMessage(lang, liveLink) {
  if (lang === "NL") {
    return `# We zijn **LIVE** <a:pepeD:881305738461470750>

-# Join gezellig en vergeet niet te volgen : ) | 3k volgers voor Juli?? <a:PepoPopcorn:837880319146983425>

${liveLink}`;
  }

  return `# We are **LIVE** <a:pepeD:881305738461470750>

-# Stick around and don't forget to follow | 3K followers by July?? <a:PepoPopcorn:837880319146983425>

${liveLink}`;
}

// ===== LIVE CHECK =====
async function checkTikTokLive() {
  try {
    const url = `https://www.tiktok.com/@${TIKTOK_USERNAME}/live`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const html = await res.text();

    const isLive =
      html.includes('"LiveRoom"') ||
      html.includes('"is_live":true') ||
      html.includes("live-room");

    const liveLink = `https://www.tiktok.com/@${TIKTOK_USERNAME}/live`;

    if (isLive && !wasLive) {
      wasLive = true;

      const channel = await client.channels.fetch(LIVE_CHANNEL_ID);

      const message = `\`\`\`\n${buildLiveMessage("EN", liveLink)}\n\n${buildLiveMessage("NL", liveLink)}\n\`\`\``;

      await channel.send({
        content: `<@${USER_ID_TO_PING}>\n\n${message}`,
      });

      console.log("LIVE bericht verstuurd!");
    }

    if (!isLive) {
      wasLive = false;
    }
  } catch (err) {
    console.error("Live check fout:", err.message);
  }
}

// ===== TEST COMMAND =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!testembed") {
    const liveLink = `https://www.tiktok.com/@${TIKTOK_USERNAME}/live`;

    const messageText =
      `\`\`\`\n` +
      buildLiveMessage("EN", liveLink) +
      `\n\n` +
      buildLiveMessage("NL", liveLink) +
      `\n\`\`\``;

    await message.channel.send({
      content: `<@${USER_ID_TO_PING}>\n\n${messageText}`,
    });
  }
});

client.login(DISCORD_TOKEN);
