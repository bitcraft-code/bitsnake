import { View, StyleSheet } from 'react-native';
import { useSnakeGame } from '../hooks/useSnakeGame';

export const GameBoard = () => {
  const { snake, food, boardSize = 20 } = useSnakeGame();

  return (
    <View style={styles.board}>
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
  board: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: 20, height: 20, borderWidth: 1, borderColor: '#333' },
  snakeHead: { backgroundColor: '#4CAF50' },
  snakeBody: { backgroundColor: '#8BC34A' },
  food: { backgroundColor: '#F44336' },
});
