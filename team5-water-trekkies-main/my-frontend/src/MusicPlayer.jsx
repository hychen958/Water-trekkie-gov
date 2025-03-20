import React, { useState, useRef, useEffect } from 'react';

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(true); // Default to true for autoplay
  const [volume, setVolume] = useState(0.5); // Default volume 50%
  const audioRef = useRef(null);

  // 播放/暫停切換
  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 音量變更
  const handleVolumeChange = (event) => {
    const volumeValue = event.target.value;
    setVolume(volumeValue);
    audioRef.current.volume = volumeValue;
  };

  // 於組件掛載時自動播放音樂
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error('Audio playback failed:', error);
      });
    }
  }, []); // 空的依賴陣列確保只在組件掛載時觸發

  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', alignItems: 'center' }}>
      {/* 音頻元素 */}
      <audio ref={audioRef} loop>
        <source src="/music.mp3" type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>

      {/* 播放/停止按鈕 */}
      <button 
        onClick={togglePlay} 
        style={{ 
          backgroundColor: 'black', // 黑色背景
          border: 'none', 
          color: 'white', 
          fontSize: '12px', 
          cursor: 'pointer', 
          marginRight: '2px',
          padding: '2px',
          borderRadius: '1px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {isPlaying ? (
          <i className="fa fa-stop"></i> // FontAwesome 停止圖示
        ) : (
          <i className="fa fa-play"></i> // FontAwesome 播放圖示
        )}
      </button>

      {/* 音量控制 */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
        style={{ width: '150px', marginLeft: '10px' }}
      />
    </div>
  );
};

export default MusicPlayer;

