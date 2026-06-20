import { useEffect, useRef, useState } from "react";

const AudioControl = ({ raised = false }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.35;

    const syncState = () => setIsPlaying(!audio.paused);

    audio.addEventListener("play", syncState);
    audio.addEventListener("pause", syncState);

    return () => {
      audio.removeEventListener("play", syncState);
      audio.removeEventListener("pause", syncState);
    };
  }, []);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        return;
      }
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="https://res.cloudinary.com/dbtsrjssc/video/upload/v1773725418/axogame%20assets/MUSICS/bg-song_tydbau.mp3"
        loop
        preload="auto"
      />
      <button
        type="button"
        className={`audio-control ${raised ? "audio-control--immersive " : ""}${isPlaying ? "is-playing" : "is-paused"}`}
        onClick={togglePlayback}
        aria-label={
          isPlaying ? "Pause background music" : "Play background music"
        }
      >
        <span className="audio-control__art" aria-hidden="true">
          <img
            src="https://res.cloudinary.com/dbtsrjssc/image/upload/v1773298190/nft-collection-2_c2bul6.webp"
            alt=""
          />
        </span>

        <span className="audio-control__divider" aria-hidden="true"></span>

        <span className="audio-control__action" aria-hidden="true">
          {isPlaying ? (
            <span className="audio-control__equalizer">
              <span></span>
              <span></span>
              <span></span>
            </span>
          ) : (
            <span className="audio-control__play-icon"></span>
          )}
        </span>

        <span className="audio-control__label">
          {isPlaying ? "Pause music" : "Play music"}
        </span>
      </button>
    </>
  );
};

export default AudioControl;
