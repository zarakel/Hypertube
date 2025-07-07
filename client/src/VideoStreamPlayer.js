import ReactPlayer from "react-player";
import { useEffect, useState } from "react";

const VideoStreamPlayer = ({ videoName }) => {
  const [error, setError] = useState(null);
  const [subtitles, setSubtitles] = useState(null);

  function onVideoError(error) {
    console.log("Video error?.target?.error", error?.target?.error);
    setError("An error occurred while loading the video stream");
  }

  useEffect(() => {
    async function fetchSubtitles() {
      try {
        const response = await fetch(`http://localhost:5001/stream/${videoName}/subtitles`);

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        const subtitleTracks = data.map((sub, idx) => ({
          kind: "subtitles",
          src: `http://localhost:5001${sub.path}`,
          srcLang: sub.lang,
          label: sub.lang,
          default: idx === 0
        }));
        setSubtitles(subtitleTracks);
      } catch (error) {
        console.log("Could not fetch subtitles:", error);
        setSubtitles([]);
      }
    }

    fetchSubtitles();
  }, [videoName]);


  if (error) return <div>{error}</div>;
  if (subtitles === null) return <div>Loading...</div>;

  return (
    <ReactPlayer
      url={`http://localhost:5001/stream/${videoName}`}
      controls={true}
      width="100%"
      height="100%"
      onError={onVideoError}
      config={{
        file: {
          attributes: {
            crossOrigin: "true",
          },
          tracks: subtitles
        }
      }}
    />
  );
};

export default VideoStreamPlayer;
