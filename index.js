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
  const res = await fetch(`https://www.tiktok.com/@${username}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const html = await res.text();
  const match = html.match(/"followerCount":(\d+)/);

  if (!match) return 0;

  return Number(match[1]);
}

async function updateFollowers() {
  try {
    const followers = await getFollowers(TIKTOK_USERNAME);
    const channel = await client.channels.fetch(VOICE_CHANNEL_ID);

    const name = `『🎯』Volgers: ${followers}`;

    if (channel.name !== name) {
      await channel.setName(name);
    }
  } catch (e) {
    console.log(e.message);
  }
}

// ===== EMBEDS =====
function buildEmbed(lang, type, link) {
  const EN = lang === "EN";

  if (type === "stream") {
    return {
      color: 0xffd700,
      title: "🔴 LIVE OP STREAM",
      description: `# We are **LIVE** <a:pepeD:881305738461470750>

-# 3K followers by July?? <a:PepoPopcorn:837880319146983425>

${link}`,
    };
  }

  if (type === "video") {
    if (EN) {
      return {
        color: 0x00bfff,
        title: "📹 NEW VIDEO",
        description: `# Don't forget to **LIKE** <a:pepeD:881305738461470750>

-# 3K followers by July?? <a:PepoPopcorn:837880319146983425>

${link}`,
      };
    } else {
      return {
        color: 0x00bfff,
        title: "📹 NIEUWE VIDEO",
        description: `# Vergeet niet te **LIKE** <a:pepeD:881305738461470750>

-# 3k volgers voor Juli?? <a:PepoPopcorn:837880319146983425>

${link}`,
      };
    }
  }

  return null;
}

// ===== COMMANDS =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");

  // !em
  if (args[0] === "!em") {
    const link = args[1];
    const lang = args[2]?.toUpperCase();
    const type = args[3]?.toLowerCase();

    if (!link || !lang || !type) {
      return message.reply("Gebruik: !em <link> EN|NL stream|video");
    }

    const embed = buildEmbed(lang, type, link);
    if (!embed) return message.reply("❌ Ongeldige input");

    return message.channel.send({
      content: `<@${USER_ID_TO_PING}>`,
      embeds: [embed],
    });
  }

  // !testembed
  if (message.content === "!testembed") {
    const link = `https://www.tiktok.com/@${TIKTOK_USERNAME}/live`;

    return message.channel.send({
      content: `<@${USER_ID_TO_PING}>`,
      embeds: [
        {
          color: 0xffd700,
          title: "🔴 TEST LIVE",
          description: `LIVE TEST\n\n${link}`,
        },
      ],
    });
  }
});

// ===== LIVE CHECK =====
async function checkTikTokLive() {
  try {
    const res = await fetch(`https://www.tiktok.com/@${TIKTOK_USERNAME}/live`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const html = await res.text();

    const isLive =
      html.includes('"LiveRoom"') ||
      html.includes('"is_live":true') ||
      html.includes("live-room");

    const link = `https://www.tiktok.com/@${TIKTOK_USERNAME}/live`;

    if (isLive && !wasLive) {
      wasLive = true;

      const channel = await client.channels.fetch(LIVE_CHANNEL_ID);

      await channel.send({
        content: `<@${USER_ID_TO_PING}>`,
        embeds: [
          {
            color: 0xffd700,
            title: "🔴 LIVE OP TIKTOK",
            description: `# WE ARE LIVE 🔴

${link}`,
          },
        ],
      });
    }

    if (!isLive) wasLive = false;
  } catch (e) {
    console.log(e.message);
  }
}

client.login(DISCORD_TOKEN);
