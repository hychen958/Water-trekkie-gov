import React, { useState, useRef, useEffect } from 'react';

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(true); // Default to true for autoplay
  const [volume, setVolume] = useState(0.5); // Default volume 50%
  const audioRef = useRef(null);

  // Toggle play/pause state
  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause(); // Pause the audio if it's playing
    } else {
      audioRef.current.play(); // Play the audio if it's paused
    }
    setIsPlaying(!isPlaying); // Toggle the playing state
  };

  // Handle volume change
  const handleVolumeChange = (event) => {
    const volumeValue = event.target.value;
    setVolume(volumeValue);
    audioRef.current.volume = volumeValue; // Set audio volume
  };

  // Automatically play the audio when the component mounts
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error('Audio playback failed:', error); // Handle error if playback fails
      });
    }
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', alignItems: 'center' }}>
      {/* Audio element */}
      <audio ref={audioRef} loop>
        <source src="/music.mp3" type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>

      {/* Play/Stop button */}
      <button 
        onClick={togglePlay} 
        style={{ 
          backgroundColor: 'black', // Black button background
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
          <i className="fa fa-stop"></i> // FontAwesome Stop Icon
        ) : (
          <i className="fa fa-play"></i> // FontAwesome Play Icon
        )}
      </button>

      {/* Volume control slider */}
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

