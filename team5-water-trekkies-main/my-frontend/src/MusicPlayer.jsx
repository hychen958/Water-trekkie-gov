// MusicPlayer.jsx
import React, { useState, useRef, useEffect } from 'react';

const MusicPlayer = ({ audioSrc }) => {
  const [isPlaying, setIsPlaying] = useState(false); // Initially set to false
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef(null);

  // Play/Pause toggle
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('使用者點擊播放，但播放失敗:', err);
      });
    }
  };

  // Adjust volume
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Attempt to autoplay (may be blocked by the browser)
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.play().then(() => {
        setIsPlaying(true);
        console.log('✅ 自動播放成功');
      }).catch((err) => {
        console.warn('⚠️ 自動播放失敗（可能被瀏覽器阻擋）:', err);
        setIsPlaying(false); // Display button in pause state
      });
    }
  }, [audioSrc]);

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      left: 20,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: '8px 12px',
      borderRadius: '8px',
      boxShadow: '0 0 6px rgba(0,0,0,0.2)'
    }}>
      <audio ref={audioRef} loop>
        <source src={audioSrc} type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>

      <button
        onClick={togglePlay}
        style={{
          backgroundColor: '#0073a5',
          border: 'none',
          color: 'white',
          fontSize: '12px',
          cursor: 'pointer',
          padding: '5px 10px',
          borderRadius: '4px',
          marginRight: '10px'
        }}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
        style={{ width: '100px' }}
      />
    </div>
  );
};

export default MusicPlayer;
