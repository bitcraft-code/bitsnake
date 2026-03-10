import { useState, useEffect } from 'react';

// Custom hook for snake game state management
export const useSnakeGame = () => {
  const [snake, setSnake] = useState([]);
  const [direction, setDirection] = useState('RIGHT');
  const [food, setFood] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);

  // TODO: implement game logic

  return { snake, direction, food, gameOver, setDirection };
};
