import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { THEMES } from '../theme';
import { SHRINK_POINTS_THRESHOLD, SHRINK_PERCENT } from '../config';

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
  fixedBoardWidth,
  score = 0,
  displayBoardWidth,
}) => {
  const colors = THEMES[theme] || THEMES.dark;
  const maxWidth = Math.min(SCREEN_WIDTH - 30, 380);
  const frameSize = displayBoardWidth != null ? displayBoardWidth : (fixedBoardWidth != null ? fixedBoardWidth : maxWidth);
  const innerSize = frameSize - BOARD_BORDER * 2;
  const cellSize = innerSize / boardSize;
  const gridContentSize = cellSize * boardSize;
  const ghostWalls = wallMode === 'wrap';
  const now = Date.now();

  const shrinkSteps = SHRINK_POINTS_THRESHOLD > 0 ? Math.floor(score / SHRINK_POINTS_THRESHOLD) : 0;
  const shrinkScale =
    shrinkSteps > 0 && SHRINK_PERCENT > 0 ? Math.pow(1 - SHRINK_PERCENT / 100, shrinkSteps) : 1;
  const isShrinkUnits = shrinkScale < 1;
  const unitSize = isShrinkUnits ? Math.max(1, cellSize * shrinkScale) : cellSize;

  const snakeSet = new Set((snake || []).map((s) => `${s.row},${s.col}`));
  const hasSnakeAt = (r, c) => snakeSet.has(`${r},${c}`);
  const norm = (v) => ((v % boardSize) + boardSize) % boardSize;
  const neighbor = (r, c, dr, dc) => {
    const nr = r + dr;
    const nc = c + dc;
    if (!ghostWalls) return { row: nr, col: nc };
    return { row: norm(nr), col: norm(nc) };
  };

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

  const isFoodOrObstacleCell = (r, c) => {
    if (isObstacle(r, c)) return true;
    const food = getFoodAt(r, c);
    return food != null && isFoodVisible(food);
  };

  const renderCell = (row, col) => {
    const style = getCellStyle(row, col);
    const isSnakeCell = isSnakeHead(row, col) || isSnakeBody(row, col);
    const shrinkFoodOrObstacle = isShrinkUnits && isFoodOrObstacleCell(row, col);

    // Cobra: fica mais fina, mas com conectores para não desconectar
    if (isShrinkUnits && isSnakeCell) {
      const fillColor = style.backgroundColor;
      const halfGap = (cellSize - unitSize) / 2;
      const connLen = Math.max(0, halfGap);
      const up = neighbor(row, col, -1, 0);
      const down = neighbor(row, col, 1, 0);
      const left = neighbor(row, col, 0, -1);
      const right = neighbor(row, col, 0, 1);

      const connectUp = hasSnakeAt(up.row, up.col);
      const connectDown = hasSnakeAt(down.row, down.col);
      const connectLeft = hasSnakeAt(left.row, left.col);
      const connectRight = hasSnakeAt(right.row, right.col);

      return (
        <View
          key={col}
          style={[
            styles.cell,
            { width: cellSize, height: cellSize, backgroundColor: colors.gameBoardCell },
          ]}
        >
          <View
            style={[
              styles.cellInner,
              {
                width: unitSize,
                height: unitSize,
                backgroundColor: fillColor,
              },
            ]}
          />
          {connectUp && connLen > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: (cellSize - unitSize) / 2,
                width: unitSize,
                height: connLen,
                backgroundColor: fillColor,
              }}
            />
          )}
          {connectDown && connLen > 0 && (
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: (cellSize - unitSize) / 2,
                width: unitSize,
                height: connLen,
                backgroundColor: fillColor,
              }}
            />
          )}
          {connectLeft && connLen > 0 && (
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: (cellSize - unitSize) / 2,
                width: connLen,
                height: unitSize,
                backgroundColor: fillColor,
              }}
            />
          )}
          {connectRight && connLen > 0 && (
            <View
              style={{
                position: 'absolute',
                right: 0,
                top: (cellSize - unitSize) / 2,
                width: connLen,
                height: unitSize,
                backgroundColor: fillColor,
              }}
            />
          )}
        </View>
      );
    }

    // Comidas e obstáculos: diminuem
    if (shrinkFoodOrObstacle) {
      return (
        <View
          key={col}
          style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor: colors.gameBoardCell }]}
        >
          <View style={[styles.cellInner, { width: unitSize, height: unitSize }, style]} />
        </View>
      );
    }
    return (
      <View key={col} style={[{ width: cellSize, height: cellSize }, style]} />
    );
  };

  return (
    <View
      style={[
        styles.board,
        {
          width: frameSize,
          height: frameSize,
          backgroundColor: colors.gameBoardBg,
          borderColor: colors.gameBoardBorder,
          shadowColor: colors.gameBoardBorder,
        },
        ghostWalls && styles.boardGhost,
      ]}
    >
      <View style={[styles.gridContent, { width: gridContentSize, height: gridContentSize }]}>
        {Array.from({ length: boardSize }).map((_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: boardSize }).map((_, col) => renderCell(row, col))}
          </View>
        ))}
      </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardGhost: {
    borderStyle: 'dotted',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  row: {
    flexDirection: 'row',
  },
  gridContent: {},
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellInner: {},
});

export default GameBoard;
