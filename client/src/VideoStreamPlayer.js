import ReactPlayer from "react-player";
import { useState } from "react";

const VideoStreamPlayer = ({ videoName }) => {
  const [error, setError] = useState(null);

  function onVideoError(error) {
    console.log("Video error?.target?.error", error?.target?.error);
    setError("An error occurred while loading the video stream");
  }

  return (
    <div>
      {error && <div>{error}</div>}
      {!error && (
        <ReactPlayer
          url={`http://localhost:5001/stream/${videoName}`}
          controls={true}
          width="100%"
          height="100%"
          onError={onVideoError}
        />
      )}
    </div>
  );
};

export default VideoStreamPlayer;
