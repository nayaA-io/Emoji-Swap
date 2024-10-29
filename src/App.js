//import "./App.css";
import React, { useState, useEffect, useCallback } from "react";
import { Shuffle, Volume2, VolumeX, Clock } from "lucide-react";

export default function App() {
  const THEMES = {
    animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"],
    fruits: ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓"],
    sports: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱"],
    weather: ["☀️", "🌙", "⭐", "☁️", "⛈️", "❄️", "🌈", "⚡"],
  };

  // Create simple oscillator sounds
  const playBeep = (frequency, duration, type = "sine") => {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Add fade out to avoid clicks
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + duration
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);

      // Cleanup
      setTimeout(() => {
        audioContext.close();
      }, duration * 1000 + 100);
    } catch (error) {
      console.log("Sound playback failed:", error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("animals");
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Sound playback functions
  const playSound = (type) => {
    if (!isSoundEnabled) return;

    switch (type) {
      case "flip":
        playBeep(300, 0.1); // Short low beep
        break;
      case "match":
        playBeep(500, 0.15); // Medium high beep
        break;
      case "win":
        // Play victory melody
        playBeep(400, 0.15);
        setTimeout(() => playBeep(500, 0.15), 150);
        setTimeout(() => playBeep(600, 0.3), 300);
        break;
      default:
        break;
    }
  };

  // Initialize game
  const initializeGame = useCallback(() => {
    const currentEmojis = THEMES[currentTheme];
    const shuffledCards = [...currentEmojis, ...currentEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji: emoji,
      }));

    setCards(shuffledCards);
    setFlipped([]);
    setSolved([]);
    setMoves(0);
    setIsWon(false);
    setTimer(0);
    setIsPlaying(true);
  }, [currentTheme]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isPlaying && !isWon) {
      interval = setInterval(() => {
        setTimer((time) => time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isWon]);

  // Handle card click
  const handleCardClick = (cardId) => {
    if (
      flipped.length === 2 ||
      solved.includes(cardId) ||
      flipped.includes(cardId)
    )
      return;

    playSound("flip");

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstId, secondId] = newFlipped;

      if (cards[firstId].emoji === cards[secondId].emoji) {
        setSolved((solved) => [...solved, firstId, secondId]);
        setFlipped([]);
        playSound("match");
      } else {
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
    }
  };

  // Check for win
  useEffect(() => {
    if (solved.length === cards.length && cards.length > 0) {
      setIsWon(true);
      setIsPlaying(false);
      playSound("win");
    }
  }, [solved, cards]);

  // Initialize game on first load
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  return (
    <div className="max-w-2xl mx-auto p-4 min-h-screen animated-gradient">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-4">Emoji Match Game</h1>

        <div className="flex justify-center items-center gap-4 mb-4">
          <select
            value={currentTheme}
            onChange={(e) => setCurrentTheme(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            {Object.keys(THEMES).map((theme) => (
              <option key={theme} value={theme}>
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="p-2 rounded hover:bg-gray-100"
          >
            {isSoundEnabled ? (
              <Volume2 className="w-6 h-6" />
            ) : (
              <VolumeX className="w-6 h-6" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timer)}</span>
          </div>

          <p className="text-lg">Moves: {moves}</p>

          <button
            onClick={initializeGame}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Shuffle className="w-4 h-4" />
            Reset Game
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(index)}
            className={`aspect-square text-4xl flex items-center justify-center rounded-lg transition-all duration-300 transform 
                ${
                  flipped.includes(index) || solved.includes(index)
                    ? "bg-white rotate-0"
                    : "bg-blue-500 rotate-180"
                }
                ${solved.includes(index) ? "bg-green-100" : ""}
                hover:scale-105`}
          >
            <span
              className={
                flipped.includes(index) || solved.includes(index)
                  ? ""
                  : "invisible"
              }
            >
              {card.emoji}
            </span>
          </button>
        ))}
      </div>

      {isWon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              🎉 Congratulations! You Won! 🎉
            </h2>
            <p className="text-lg mb-2">Time: {formatTime(timer)}</p>
            <p className="text-lg mb-6">Total Moves: {moves}</p>
            <button
              onClick={initializeGame}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
