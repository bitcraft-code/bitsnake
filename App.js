import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameBoard } from './src/components/GameBoard';
import MenuScreen from './src/screens/MenuScreen';
import GameOverScreen from './src/screens/GameOverScreen';

const difficultySettings = {
  easy: { speed: 200, size: 15 },
  medium: { speed: 150, size: 20 },
  hard: { speed: 100, size: 20 },
  expert: { speed: 70, size: 20 },
};

export default function App() {
  const [gameState, setGameState] = useState('menu');
  const [difficulty, setDifficulty] = useState('medium');
  const [boardSize, setBoardSize] = useState(20);
  const [wallMode, setWallMode] = useState('normal');

  const [snake, setSnake] = useState([]);
  const [food, setFood] = useState(null);
  const [direction, setDirection] = useState('right');
  const [nextDirection, setNextDirection] = useState('right');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [paused, setPaused] = useState(false);

  const gameLoopRef = useRef(null);
  const gameSpeedRef = useRef(difficultySettings.medium.speed);

  useEffect(() => {
    loadHighScore();
  }, []);

  useEffect(() => {
    if (difficultySettings[difficulty]) {
      gameSpeedRef.current = difficultySettings[difficulty].speed;
    }
  }, [difficulty]);

  const loadHighScore = async () => {
    try {
      const saved = await AsyncStorage.getItem('snakeHighScore');
      if (saved) setHighScore(parseInt(saved, 10));
    } catch (error) {
      console.error('Failed to load high score:', error);
    }
  };

  const saveHighScore = async () => {
    try {
      await AsyncStorage.setItem('snakeHighScore', highScore.toString());
    } catch (error) {
      console.error('Failed to save high score:', error);
    }
  };

  const initGame = () => {
    setSnake([
      { row: Math.floor(boardSize / 2), col: Math.floor(boardSize / 2) },
    ]);
    setFood(generateFood());
    setScore(0);
    setDirection('right');
    setNextDirection('right');
    setPaused(false);
    setGameState('playing');
  };

  const generateFood = () => {
    let newFood;
    let onSnake;

    do {
      onSnake = false;
      newFood = {
        row: Math.floor(Math.random() * boardSize),
        col: Math.floor(Math.random() * boardSize),
      };

      for (let segment of snake) {
        if (segment.row === newFood.row && segment.col === newFood.col) {
          onSnake = true;
          break;
        }
      }
    } while (onSnake);

    return newFood;
  };

  const moveSnake = () => {
    setDirection(nextDirection);
    setSnake((prevSnake) => {
      const head = { ...prevSnake[0] };

      switch (nextDirection) {
        case 'up':
          head.row--;
          break;
        case 'down':
          head.row++;
          break;
        case 'left':
          head.col--;
          break;
        case 'right':
          head.col++;
          break;
      }

      if (wallMode === 'normal') {
        if (
          head.row < 0 ||
          head.row >= boardSize ||
          head.col < 0 ||
          head.col >= boardSize
        ) {
          handleGameOver();
          return prevSnake;
        }
      } else {
        if (head.row < 0) head.row = boardSize - 1;
        if (head.row >= boardSize) head.row = 0;
        if (head.col < 0) head.col = boardSize - 1;
        if (head.col >= boardSize) head.col = 0;
      }

      if (head.row === food.row && head.col === food.col) {
        setScore((s) => s + 10);
        setFood(generateFood());
      } else {
        return [head, ...prevSnake.slice(0, -1)];
      }

      for (let i = 1; i < prevSnake.length; i++) {
        if (head.row === prevSnake[i].row && head.col === prevSnake[i].col) {
          handleGameOver();
          return prevSnake;
        }
      }

      return [head, ...prevSnake.slice(0, -1)];
    });
  };

  const handleGameOver = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);

    if (score > highScore) {
      setHighScore(score);
      saveHighScore();
    }

    setGameState('gameOver');
  };

  useEffect(() => {
    if (gameState !== 'playing' || paused) return;

    gameLoopRef.current = setInterval(moveSnake, gameSpeedRef.current);

    return () => clearInterval(gameLoopRef.current);
  }, [gameState, paused]);

  const handleDirectionChange = (newDir) => {
    if (!['up', 'down', 'left', 'right'].includes(newDir)) return;

    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (direction !== opposites[newDir]) {
      setNextDirection(newDir);
    }
  };

  const togglePause = () => {
    setPaused((prev) => !prev);
  };

  const restartGame = () => {
    initGame();
  };

  const goMenu = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    setGameState('menu');
  };

  if (gameState === 'menu') {
    return <MenuScreen onStart={initGame} />;
  }

  if (gameState === 'gameOver') {
    return (
      <GameOverScreen
        score={score}
        highScore={highScore}
        onRestart={restartGame}
        onMenu={goMenu}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* CORREÇÃO: Texto dentro de <Text> */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>Pontuação:</Text>
        <Text style={styles.score}>{score}</Text>
      </View>

      <GameBoard snake={snake} food={food} boardSize={boardSize} />

      {/* CORREÇÃO: Textos dentro de <Text> */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={() => handleDirectionChange('up')}
          style={styles.controlBtn}
        >
          <Text style={styles.controlText}>⬆️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDirectionChange('left')}
          style={styles.controlBtn}
        >
          <Text style={styles.controlText}>⬅️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDirectionChange('down')}
          style={styles.controlBtn}
        >
          <Text style={styles.controlText}>⬇️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDirectionChange('right')}
          style={styles.controlBtn}
        >
          <Text style={styles.controlText}>➡️</Text>
        </TouchableOpacity>
      </View>

      {/* CORREÇÃO: Textos dentro de <Text> */}
      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={togglePause} style={styles.button}>
          <Text style={styles.buttonText}>
            {paused ? 'Continuar' : 'Pausar'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={goMenu}
          style={[styles.button, styles.secondaryButton]}
        >
          <Text style={styles.buttonText}>Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  scoreLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  score: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 10,
  },
  controls: {
    flexDirection: 'row',
    marginTop: 20,
  },
  controlBtn: {
    width: 60,
    height: 60,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 10,
  },
  controlText: {
    fontSize: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  secondaryButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
