import express from "express";
import fetch from "node-fetch";
import { Client, GatewayIntentBits } from "discord.js";

// ===== CONFIG =====
const DISCORD_TOKEN = "PLAATS_HIER_JE_BOT_TOKEN"; // Zet hier je echte token
const VOICE_CHANNEL_ID = "1458572087647011058";
const TIKTOK_USERNAME = "csmp.brammetje";
const UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minuten
// ==================

const app = express();
app.get("/", (_, res) => res.send("OK")); // Voor UptimeRobot
app.listen(3000);

// Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`Ingelogd als ${client.user.tag}`);

  // Bot status
  client.user.setActivity("Kijkt naar Brammetje op TikTok 🎥", { type: 3 });

  // Eerste update
  await updateFollowers();

  // Interval updates
  setInterval(updateFollowers, UPDATE_INTERVAL);
});

async function getFollowers(username) {
  const url = `https://www.tiktok.com/@${username}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
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

client.login(DISCORD_TOKEN);
