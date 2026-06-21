// Axo Rhymes — songs from the official Axo Rhymes YouTube channel.
//
// The full library is loaded at runtime from /rhymes.json (refreshed on the
// server by a cron that pulls the channel's uploads via the YouTube Data API),
// so new uploads appear automatically with no rebuild. If that file is missing
// (e.g. very first load, or offline) we fall back to a built-in curated set.
//
// Individual songs and "Play all" both embed via youtube-nocookie with rel=0,
// so when a song ends YouTube only ever surfaces other Axo Rhymes videos.
import React from "react";
import { Icon } from "../ui";
import AxoData from "../data";
import AxoAudio from "../audio";

const EMBED_BASE = "https://www.youtube-nocookie.com/embed";
const COMMON_PARAMS = "autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3";

function VideoRoom() {
  const [playing, setPlaying] = React.useState(null); // { yt, title } | { playlist, title }
  const [allVideos, setAllVideos] = React.useState(null); // full catalog from /rhymes.json

  // Load the auto-updated full catalog. Falls back silently to the built-in
  // curated topics if the file is missing or fails to parse.
  React.useEffect(() => {
    let alive = true;
    fetch("/rhymes.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d && Array.isArray(d.videos) && d.videos.length) setAllVideos(d.videos); })
      .catch(() => { /* keep fallback */ });
    return () => { alive = false; };
  }, []);

  React.useEffect(() => {
    if (!playing) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setPlaying(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [playing]);

  const channel = AxoData.rhymesChannel || {};

  const src = playing
    ? playing.playlist
      ? `${EMBED_BASE}/videoseries?list=${playing.playlist}&${COMMON_PARAMS}`
      : `${EMBED_BASE}/${playing.yt}?${COMMON_PARAMS}`
    : null;

  function openSong(v) {
    AxoAudio.playTone("pop");
    setPlaying(v);
  }

  function SongCard({ v }) {
    return (
      <button className="video-card" onClick={() => openSong(v)} aria-label={"Play " + v.title}>
        <img src={`https://i.ytimg.com/vi/${v.yt}/hqdefault.jpg`} alt="" loading="lazy"></img>
        <span className="video-play-badge"></span>
        <span className="video-title">{v.title}</span>
      </button>
    );
  }

  return (
    <React.Fragment>
      <div className="rhymes-playall-row">
        <button
          className="btn3d btn-gold rhymes-playall"
          onClick={() => {
            AxoAudio.playTone("chime");
            setPlaying({ playlist: channel.playlist, title: "Axo Rhymes — All Songs" });
          }}
        >
          <Icon name="play" fill="#3b2f5e"></Icon>
          Play all songs
        </button>
      </div>

      {allVideos ? (
        // Full, auto-updated catalog — every song as a card, newest first.
        <div className="rhymes-grid">
          {allVideos.map((v) => (
            <SongCard key={v.yt} v={v}></SongCard>
          ))}
        </div>
      ) : (
        // Fallback: built-in curated topics (used until /rhymes.json loads).
        <div className="video-rows">
          {AxoData.videoTopics.map((topic) => (
            <div key={topic.id}>
              <h2 className="video-topic-title">
                <span className="topic-dot" style={{ background: topic.color }}></span>
                {topic.title}
              </h2>
              <div className="video-cards">
                {topic.videos.map((v) => (
                  <SongCard key={v.yt} v={v}></SongCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {playing ? (
        <div className="overlay" onClick={() => setPlaying(null)}>
          <div
            style={{ position: "relative" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={playing.title}
          >
            <iframe
              className="video-player-frame"
              src={src}
              title={playing.title}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            ></iframe>
            <button className="overlay-close" onClick={() => setPlaying(null)} aria-label="Close video">
              <Icon name="close"></Icon>
            </button>
          </div>
        </div>
      ) : null}
    </React.Fragment>
  );
}

export { VideoRoom };
