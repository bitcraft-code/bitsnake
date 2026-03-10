import React from 'react';
import { View, StyleSheet } from 'react-native';

export const GameBoard = ({ snake, food, boardSize }) => {
  const cellSize = Math.min(200 / boardSize, 15);

  return (
    <View
      style={[
        styles.board,
        { width: boardSize * cellSize, height: boardSize * cellSize },
      ]}
    >
      {Array.from({ length: boardSize * boardSize }).map((_, index) => {
        const row = Math.floor(index / boardSize);
        const col = index % boardSize;

        const isSnakeHead = snake[0]?.row === row && snake[0]?.col === col;
        const isSnakeBody = snake
          .slice(1)
          .some((s) => s.row === row && s.col === col);
        const isFood = food?.row === row && food?.col === col;

        let cellStyle = styles.cell;
        if (isSnakeHead) cellStyle = [styles.cell, styles.snakeHead];
        else if (isSnakeBody) cellStyle = [styles.cell, styles.snakeBody];
        else if (isFood) cellStyle = [styles.cell, styles.food];

        return <View key={index} style={cellStyle} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#000',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  cell: {
    width: 15,
    height: 15,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  snakeHead: {
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  snakeBody: {
    backgroundColor: '#8BC34A',
    borderRadius: 2,
  },
  food: {
    backgroundColor: '#FF5252',
    borderRadius: 7.5,
  },
});

export default GameBoard;
