import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { THEMES } from '../theme';

const BOARD_BORDER = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;

const FOOD_OPACITY = { 1: 0.4, 2: 0.7, 3: 1 };

export const GameBoard = ({
  theme = 'dark',
  snake,
  foods = [],
  obstacles = [],
  boardSize,
  wallMode = 'normal',
  blinkTick = 0,
  blinkStartMs = 4000,
  blinkIntervalMs = 200,
}) => {
  const colors = THEMES[theme] || THEMES.dark;
  const maxWidth = Math.min(SCREEN_WIDTH - 30, 380);
  const cellSize = Math.floor((maxWidth - BOARD_BORDER * 2) / boardSize);
  const boardWidth = cellSize * boardSize + BOARD_BORDER * 2;
  const ghostWalls = wallMode === 'wrap';
  const now = Date.now();

  const isSnakeHead = (r, c) => snake[0]?.row === r && snake[0]?.col === c;
  const isSnakeBody = (r, c) => snake.slice(1).some((s) => s.row === r && s.col === c);
  const isObstacle = (r, c) => obstacles.some((o) => o.row === r && o.col === c);
  const getFoodAt = (r, c) => foods.find((f) => f.row === r && f.col === c);

  const isFoodVisible = (food) => {
    if (!food.spawnTime) return true;
    const elapsed = now - food.spawnTime;
    if (elapsed < blinkStartMs) return true;
    return Math.floor(elapsed / blinkIntervalMs) % 2 === 0;
  };

  const getCellStyle = (r, c) => {
    if (isSnakeHead(r, c)) return { backgroundColor: colors.snakeHead };
    if (isSnakeBody(r, c)) return { backgroundColor: colors.snakeBody };
    if (isObstacle(r, c)) return { backgroundColor: colors.obstacle, borderWidth: 1, borderColor: colors.obstacleBorder };
    const food = getFoodAt(r, c);
    if (food) {
      if (!isFoodVisible(food)) return { backgroundColor: colors.gameBoardCell };
      const opacity = FOOD_OPACITY[food.points] ?? 1;
      return { backgroundColor: `rgba(${colors.foodRgb}, ${opacity})` };
    }
    return { backgroundColor: colors.gameBoardCell };
  };

  return (
    <View
      style={[
        styles.board,
        {
          width: boardWidth,
          backgroundColor: colors.gameBoardBg,
          borderColor: colors.gameBoardBorder,
          shadowColor: colors.gameBoardBorder,
        },
        ghostWalls && styles.boardGhost,
      ]}
    >
      {Array.from({ length: boardSize }).map((_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: boardSize }).map((_, col) => (
            <View
              key={col}
              style={[{ width: cellSize, height: cellSize }, getCellStyle(row, col)]}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  board: {
    borderWidth: BOARD_BORDER,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  boardGhost: {
    borderStyle: 'dotted',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  row: {
    flexDirection: 'row',
  },
});

export default GameBoard;
