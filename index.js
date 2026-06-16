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

// ===== EMBED BUILDER =====
function buildEmbed(lang, type, link) {
  const isEN = lang === "EN";

  if (type === "stream") {
    return {
      color: 0xffd700,
      title: "🔴 LIVE OP STREAM",
      description: `# We are **LIVE** <a:pepeD:881305738461470750>

-# Stick around and don't forget to follow | 3K followers by July?? <a:PepoPopcorn:837880319146983425>

${link}`,
    };
  }

  if (type === "video") {
    if (isEN) {
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

// ===== !EM COMMAND =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");

  // !em handler
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

    const embed = {
      color: 0xffd700,
      title: "🔴 TEST LIVE MESSAGE",
      description: `# We are **LIVE** <a:pepeD:881305738461470750>

-# Stick around and don't forget to follow | 3K followers by July?? <a:PepoPopcorn:837880319146983425>

${link}

-------------------------

# We zijn **LIVE** <a:pepeD:881305738461470750>

-# Join gezellig en vergeet niet te volgen : ) | 3k volgers voor Juli?? <a:PepoPopcorn:837880319146983425>

${link}`,
    };

    return message.channel.send({
      content: `<@${USER_ID_TO_PING}>`,
      embeds: [embed],
    });
  }
});

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

      const embed = {
        color: 0xffd700,
        title: "🔴 LIVE OP TIKTOK",
        description: `# We are **LIVE** <a:pepeD:881305738461470750>

-# Stick around and don't forget to follow | 3K followers by July?? <a:PepoPopcorn:837880319146983425>

${liveLink}

-------------------------

# We zijn **LIVE** <a:pepeD:881305738461470750>

-# Join gezellig en vergeet niet te volgen : ) | 3k volgers voor Juli?? <a:PepoPopcorn:837880319146983425>

${liveLink}`,
      };

      await channel.send({
        content: `<@${USER_ID_TO_PING}>`,
        embeds: [embed],
      });

      console.log("LIVE bericht verstuurd!");
    }

    if (!isLive) wasLive = false;
  } catch (err) {
    console.error("Live check fout:", err.message);
  }
}

client.login(DISCORD_TOKEN);
