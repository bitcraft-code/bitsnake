import { useState, useEffect, useRef } from 'react';
import {
  createSnake,
  generateFood,
  moveSnake,
  checkCollisions,
} from '../utils/gameLogic';

export const useSnakeGame = () => {
  const [snake, setSnake] = useState(createSnake());
  const [food, setFood] = useState(generateFood([], 20));
  const [direction, setDirection] = useState('right');
  const [nextDirection, setNextDirection] = useState('right');
  const [gameRunning, setGameRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const gameLoopRef = useRef(null);
  const boardSize = 20;
  const gameSpeed = 150;

  useEffect(() => {
    if (!gameRunning || paused) return;

    gameLoopRef.current = setInterval(() => {
      setDirection(nextDirection);

      // Move snake logic from Citation 1 & 3
      const head = { ...snake[0] };
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

      // Check boundaries and collisions from Citation 3
      if (
        head.row < 0 ||
        head.row >= boardSize ||
        head.col < 0 ||
        head.col >= boardSize
      ) {
        setGameRunning(false);
        return;
      }

      const newSnake = [head, ...snake.slice(0, -1)];

      // Check food from Citation 3
      if (head.row === food.row && head.col === food.col) {
        setScore((s) => s + 10);
        setFood(generateFood(newSnake, boardSize));
      }

      // Self collision from Citation 3
      for (let i = 1; i < newSnake.length; i++) {
        if (head.row === newSnake[i].row && head.col === newSnake[i].col) {
          setGameRunning(false);
          return;
        }
      }

      setSnake(newSnake);
    }, gameSpeed);

    return () => clearInterval(gameLoopRef.current);
  }, [gameRunning, paused, nextDirection, snake, food]);

  const startGame = () => {
    setSnake(createSnake());
    setFood(generateFood([], boardSize));
    setScore(0);
    setDirection('right');
    setNextDirection('right');
    setGameRunning(true);
    setPaused(false);
  };

  const togglePause = () => {
    setPaused((prev) => !prev);
  };

  return {
    snake,
    food,
    direction,
    gameRunning,
    paused,
    score,
    highScore,
    startGame,
    togglePause,
    setNextDirection,
  };
};
