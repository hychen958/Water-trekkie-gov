// MusicPlayer.jsx
import React, { useState, useRef, useEffect } from 'react';

const MusicPlayer = ({ audioSrc }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (event) => {
    const volumeValue = event.target.value;
    setVolume(volumeValue);
    audioRef.current.volume = volumeValue;
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error('Audio playback failed:', error);
      });
    }
  }, [audioSrc]); // 在 audioSrc 改變時重新播放音樂

  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', alignItems: 'center' }}>
      <audio ref={audioRef} loop>
        <source src={audioSrc} type="audio/wav" />
        Your browser does not support the audio element.
      </audio>
      <button onClick={togglePlay} style={{ backgroundColor: 'black', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer', marginRight: '2px', padding: '2px', borderRadius: '1px', display: 'flex', alignItems: 'center' }}>
        {isPlaying ? <i className="fa fa-stop"></i> : <i className="fa fa-play"></i>}
      </button>
      <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} style={{ width: '150px', marginLeft: '10px' }} />
    </div>
  );
};

export default MusicPlayer;
