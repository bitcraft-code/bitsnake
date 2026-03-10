import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const BOARD_BORDER = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;

export const GameBoard = ({ snake, food, boardSize, wallMode = 'normal' }) => {
  const maxWidth = Math.min(SCREEN_WIDTH - 30, 380);
  const cellSize = Math.floor((maxWidth - BOARD_BORDER * 2) / boardSize);
  const boardWidth = cellSize * boardSize + BOARD_BORDER * 2;
  const ghostWalls = wallMode === 'wrap';

  const isSnakeHead = (r, c) => snake[0]?.row === r && snake[0]?.col === c;
  const isSnakeBody = (r, c) => snake.slice(1).some((s) => s.row === r && s.col === c);
  const isFood = (r, c) => food?.row === r && food?.col === c;

  const getCellStyle = (r, c) => {
    if (isSnakeHead(r, c)) return styles.snakeHead;
    if (isSnakeBody(r, c)) return styles.snakeBody;
    if (isFood(r, c)) return styles.food;
    return styles.emptyCell;
  };

  return (
    <View
      style={[
        styles.board,
        { width: boardWidth },
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
    backgroundColor: '#080c14',
    borderWidth: BOARD_BORDER,
    borderColor: '#00ff41',
    marginBottom: 20,
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  boardGhost: {
    borderStyle: 'dotted',
    borderColor: 'rgba(0, 255, 65, 0.55)',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  row: {
    flexDirection: 'row',
  },
  emptyCell: {
    backgroundColor: '#0a1210',
  },
  snakeHead: {
    backgroundColor: '#00ff41',
  },
  snakeBody: {
    backgroundColor: '#00cc33',
  },
  food: {
    backgroundColor: '#ff3333',
  },
});

export default GameBoard;
