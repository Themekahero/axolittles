#!/usr/bin/env node
// Fetches the Axo Rhymes channel's uploads and writes rhymes.json for the SPA.
//
// Primary source: the YouTube Data API (full catalog, paginated) when YT_API_KEY
// is set. Safety net: the channel RSS feed (latest ~15) if the API key is absent
// or the API call fails — so the file is always written and never left broken.
//
// Run on the Hetzner box from a cron; writes into the served dist dir. The SPA
// (VideoRoom.jsx) fetches /rhymes.json at runtime, so new uploads appear within
// one cron interval with no rebuild/redeploy.
//
//   YT_API_KEY=xxxx node fetch-rhymes.mjs [/srv/dapp/axolittles/dist/rhymes.json]
import { writeFile } from "node:fs/promises";

const CHANNEL_ID = "UC4H2mCujSLwz3H9It75-S4A";
const UPLOADS_PLAYLIST = "UU4H2mCujSLwz3H9It75-S4A"; // UC -> UU = the uploads playlist
const OUT = process.argv[2] || "/srv/dapp/axolittles/dist/rhymes.json";
const KEY = process.env.YT_API_KEY;

function decodeXml(s) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/gi, "'");
}

// Full catalog via the Data API (1 quota unit per 50-video page).
async function viaApi() {
  const videos = [];
  let pageToken = "";
  do {
    const url =
      "https://www.googleapis.com/youtube/v3/playlistItems" +
      "?part=snippet,contentDetails&maxResults=50&playlistId=" + UPLOADS_PLAYLIST +
      "&key=" + KEY + (pageToken ? "&pageToken=" + pageToken : "");
    // If the key is locked to HTTP referrers, send one so server-side calls
    // (which have no browser referer) satisfy the restriction. YT_REFERER
    // overrides the default. (Best practice is an IP restriction instead.)
    const r = await fetch(url, { headers: { Referer: process.env.YT_REFERER || "https://axolittles.io/" } });
    if (!r.ok) throw new Error("Data API " + r.status + ": " + (await r.text()).slice(0, 300));
    const j = await r.json();
    for (const it of j.items || []) {
      const s = it.snippet || {};
      const vid = it.contentDetails?.videoId || s.resourceId?.videoId;
      // Skip private/deleted entries (their title is literally "Private video").
      if (!vid || s.title === "Private video" || s.title === "Deleted video") continue;
      videos.push({
        yt: vid,
        title: s.title || "",
        published: it.contentDetails?.videoPublishedAt || s.publishedAt || "",
      });
    }
    pageToken = j.nextPageToken || "";
  } while (pageToken);
  return videos;
}

// Latest ~15 via the public RSS feed (no key, but a sliding window).
async function viaRss() {
  const r = await fetch("https://www.youtube.com/feeds/videos.xml?channel_id=" + CHANNEL_ID);
  if (!r.ok) throw new Error("RSS " + r.status);
  const xml = await r.text();
  const out = [];
  const re = /<yt:videoId>([^<]+)<\/yt:videoId>[\s\S]*?<title>([^<]+)<\/title>[\s\S]*?<published>([^<]+)<\/published>/g;
  let m;
  while ((m = re.exec(xml))) out.push({ yt: m[1], title: decodeXml(m[2]), published: m[3] });
  return out;
}

(async () => {
  let videos;
  let source;
  try {
    if (KEY) { videos = await viaApi(); source = "api"; }
    else { videos = await viaRss(); source = "rss"; }
  } catch (e) {
    console.error("primary fetch failed (" + e.message + "); falling back to RSS");
    videos = await viaRss();
    source = "rss-fallback";
  }

  // De-dup by id, newest first.
  const seen = new Set();
  videos = videos.filter((v) => v.yt && !seen.has(v.yt) && seen.add(v.yt));
  videos.sort((a, b) => (b.published || "").localeCompare(a.published || ""));

  const payload = { updated: new Date().toISOString(), source, count: videos.length, videos };
  await writeFile(OUT, JSON.stringify(payload));
  console.log("wrote " + videos.length + " videos (" + source + ") -> " + OUT);
})().catch((e) => {
  console.error("fetch-rhymes failed:", e);
  process.exit(1);
});
