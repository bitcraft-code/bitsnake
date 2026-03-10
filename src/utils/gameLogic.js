export const createSnake = () => {
  const boardSize = 20; // Default value
  const startRow = Math.floor(boardSize / 2);
  const startCol = Math.floor(boardSize / 2);

  return Array.from({ length: 3 }, (_, i) => ({
    row: startRow,
    col: startCol - i,
  }));
};

export const generateFood = (snake, boardSize) => {
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

export const moveSnake = (snake, direction, food, boardSize, wallMode) => {
  const head = { ...snake[0] };

  switch (direction) {
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

  // Wall mode handling - Citação 2
  if (wallMode === 'normal') {
    if (
      head.row < 0 ||
      head.row >= boardSize ||
      head.col < 0 ||
      head.col >= boardSize
    ) {
      return { gameOver: true };
    }
  } else {
    // Teleport mode
    if (head.row < 0) head.row = boardSize - 1;
    if (head.row >= boardSize) head.row = 0;
    if (head.col < 0) head.col = boardSize - 1;
    if (head.col >= boardSize) head.col = 0;
  }

  snake.unshift(head);

  // Check food - Citação 3
  if (head.row === food.row && head.col === food.col) {
    return { snake, food: null }; // Food eaten
  } else {
    snake.pop();
    return { snake };
  }
};

export const checkCollisions = (snake) => {
  const head = snake[0];

  for (let i = 1; i < snake.length; i++) {
    if (head.row === snake[i].row && head.col === snake[i].col) {
      return true; // Collision detected
    }
  }
  return false;
};

export const gameOver = () => {
  return false;
};
