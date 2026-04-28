import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

const GRAVITY = 0.6;
const JUMP_STRENGTH = -10;
const PIPE_SPEED = 3;
const PIPE_GAP = 170;
const PIPE_WIDTH = 70;
const PIPE_SPACING = 250;

function App() {
  const [gameState, setGameState] = useState('start'); // start, playing, gameover
  const [birdY, setBirdY] = useState(300);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('birdGameHighScore');
    return saved ? parseInt(saved) : 0;
  });
  const [pipes, setPipes] = useState([]);
  const gameLoopRef = useRef(null);
  const birdRef = useRef(null);

  const jump = useCallback(() => {
    if (gameState === 'playing') {
      setBirdVelocity(JUMP_STRENGTH);
    }
  }, [gameState]);

  const startGame = () => {
    setGameState('playing');
    setBirdY(300);
    setBirdVelocity(0);
    setScore(0);
    setPipes([]);
  };

  const resetGame = () => {
    setGameState('start');
    setBirdY(300);
    setBirdVelocity(0);
    setScore(0);
    setPipes([]);
  };

  // Handle keyboard and click input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'start') {
          startGame();
        } else if (gameState === 'playing') {
          jump();
        } else if (gameState === 'gameover') {
          resetGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, jump]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Update bird position
      setBirdY((prevY) => {
        setBirdVelocity((prevVel) => prevVel + GRAVITY);
        return prevY + birdVelocity;
      });

      // Update pipes
      setPipes((prevPipes) => {
        const newPipes = prevPipes
          .map((pipe) => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
          .filter((pipe) => pipe.x > -PIPE_WIDTH);

        // Add new pipe
        const lastPipe = newPipes[newPipes.length - 1];
        if (!lastPipe || lastPipe.x < 400) {
          const gapPosition = Math.random() * (400 - PIPE_GAP) + 100;
          newPipes.push({
            x: 500,
            gapTop: gapPosition,
            passed: false,
          });
        }

        return newPipes;
      });

      // Update score
      setPipes((prevPipes) => {
        let newScore = score;
        prevPipes.forEach((pipe) => {
          if (pipe.x + PIPE_WIDTH < 100 && !pipe.passed) {
            newScore++;
            pipe.passed = true;
          }
        });
        if (newScore > score) {
          setScore(newScore);
        }
        return prevPipes;
      });
    }, 20);

    gameLoopRef.current = gameLoop;
    return () => clearInterval(gameLoop);
  }, [gameState, birdVelocity, score]);

  // Collision detection
  useEffect(() => {
    if (gameState !== 'playing') return;

    const birdBottom = birdY + 30;
    const birdTop = birdY;
    const birdLeft = 80;
    const birdRight = 140;

    // Check ground collision
    if (birdBottom > 520 || birdTop < 0) {
      gameOver();
      return;
    }

    // Check pipe collision
    pipes.forEach((pipe) => {
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + PIPE_WIDTH;

      if (birdRight > pipeLeft && birdLeft < pipeRight) {
        if (birdTop < pipe.gapTop || birdBottom > pipe.gapTop + PIPE_GAP) {
          gameOver();
        }
      }
    });
  }, [birdY, pipes, gameState]);

  const gameOver = () => {
    setGameState('gameover');
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('birdGameHighScore', score.toString());
    }
  };

  return (
    <div className="game-container" onClick={() => {
      if (gameState === 'start') startGame();
      else if (gameState === 'playing') jump();
      else if (gameState === 'gameover') resetGame();
    }}>
      {/* Background */}
      <div className="background">
        <div className="clouds">
          <div className="cloud cloud-1"></div>
          <div className="cloud cloud-2"></div>
          <div className="cloud cloud-3"></div>
        </div>
        <div className="mountains">
          <div className="mountain mountain-1"></div>
          <div className="mountain mountain-2"></div>
        </div>
      </div>

      {/* Pipes */}
      {pipes.map((pipe, index) => (
        <div key={index}>
          <div
            className="pipe pipe-top"
            style={{ left: pipe.x, height: pipe.gapTop }}
          />
          <div
            className="pipe pipe-bottom"
            style={{ left: pipe.x, top: pipe.gapTop + PIPE_GAP }}
          />
        </div>
      ))}

      {/* Bird */}
      <div
        className={`bird ${gameState === 'playing' ? 'flapping' : ''}`}
        style={{ top: birdY }}
      >
        <div className="bird-body">
          <div className="bird-eye"></div>
          <div className="bird-beak"></div>
        </div>
        <div className="bird-wing"></div>
      </div>

      {/* Ground */}
      <div className="ground">
        <div className="ground-pattern"></div>
      </div>

      {/* UI Overlay */}
      <div className="ui-overlay">
        {/* Score */}
        <div className="score-display">
          <span className="score-label">SCORE</span>
          <span className="score-value">{score}</span>
        </div>

        {/* High Score */}
        <div className="high-score-display">
          <span className="high-score-label">BEST</span>
          <span className="high-score-value">{highScore}</span>
        </div>
      </div>

      {/* Start Screen */}
      {gameState === 'start' && (
        <div className="menu-screen">
          <h1 className="game-title">FLAPPY BIRD</h1>
          <p className="game-subtitle">Click or Press Space to Play</p>
          <button className="play-button" onClick={(e) => { e.stopPropagation(); startGame(); }}>
            PLAY
          </button>
          <div className="instructions">
            <span>SPACE</span> to jump
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="menu-screen game-over">
          <h1 className="game-title">GAME OVER</h1>
          <div className="final-score">
            <div className="score-row">
              <span>SCORE</span>
              <span>{score}</span>
            </div>
            <div className="score-row best">
              <span>BEST</span>
              <span>{highScore}</span>
            </div>
          </div>
          <button className="play-button" onClick={(e) => { e.stopPropagation(); resetGame(); }}>
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
