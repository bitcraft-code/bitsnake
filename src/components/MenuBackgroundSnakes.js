import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  MENU_SNAKES_COUNT_MIN,
  MENU_SNAKES_COUNT_MAX,
  MENU_SNAKES_SPEED_MIN,
  MENU_SNAKES_SPEED_MAX,
  MENU_SNAKES_OPACITY_MIN,
  MENU_SNAKES_OPACITY_MAX,
  MENU_SNAKES_TURN_TICKS_MIN,
  MENU_SNAKES_TURN_TICKS_MAX,
  MENU_SNAKES_LIFETIME_MIN,
  MENU_SNAKES_LIFETIME_MAX,
  MENU_SNAKES_FADEOUT_SEC,
} from '../config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TICK_MS = 80;
const MIN_LENGTH = 4;
const MAX_LENGTH = 14;
const SEGMENT_SIZE_MIN = 6;
const SEGMENT_SIZE_MAX = 12;

const randomInRange = (min, max) => min + Math.random() * (max - min);

const DIRS = [
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: -1 },
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const ticksFromSec = (sec) => Math.max(1, Math.floor((sec * 1000) / TICK_MS));

const spawnAtEdge = () => {
  const edge = Math.random() < 0.5 ? 3 : 1;
  const length = randomInt(MIN_LENGTH, MAX_LENGTH);
  const segmentSize = randomInt(SEGMENT_SIZE_MIN, SEGMENT_SIZE_MAX);
  const speed = randomInt(MENU_SNAKES_SPEED_MIN, MENU_SNAKES_SPEED_MAX);
  const opacity = randomInRange(MENU_SNAKES_OPACITY_MIN, MENU_SNAKES_OPACITY_MAX);
  const direction = edge === 3 ? 0 : 2;
  const d = DIRS[direction];
  let headX, headY;
  const maxLen = length * segmentSize;
  if (edge === 1) {
    headX = SCREEN_WIDTH + segmentSize;
    headY = randomInt(0, Math.max(0, SCREEN_HEIGHT - segmentSize));
  } else {
    headX = -maxLen;
    headY = randomInt(0, Math.max(0, SCREEN_HEIGHT - segmentSize));
  }
  const path = [];
  for (let i = 0; i < length; i++) {
    path.push({
      x: headX - d.dx * i * segmentSize,
      y: headY - d.dy * i * segmentSize,
    });
  }
  const lifetimeTicks = randomInt(
    ticksFromSec(MENU_SNAKES_LIFETIME_MIN),
    ticksFromSec(MENU_SNAKES_LIFETIME_MAX)
  );
  const fadeTicks = ticksFromSec(MENU_SNAKES_FADEOUT_SEC);
  const ticksUntilTurn = randomInt(MENU_SNAKES_TURN_TICKS_MIN, MENU_SNAKES_TURN_TICKS_MAX);
  return {
    path,
    direction,
    length,
    segmentSize,
    speed,
    opacity,
    ticksUntilTurn,
    accumulated: 0,
    lifeRemaining: lifetimeTicks,
    fading: false,
    fadeProgress: 0,
    fadeStep: 1 / fadeTicks,
  };
};

const turnDirection = (currentDir) => {
  const perpendicular = currentDir % 2 === 0 ? [1, 3] : [0, 2];
  return perpendicular[randomInt(0, 1)];
};

const isOffScreen = (snake) => {
  const head = snake.path[0];
  const margin = snake.length * snake.segmentSize + 40;
  if (head.x < -margin || head.x > SCREEN_WIDTH + margin) return true;
  if (head.y < -margin || head.y > SCREEN_HEIGHT + margin) return true;
  return false;
};

const shouldRespawn = (snake) => {
  if (snake.fadeProgress >= 1) return true;
  return isOffScreen(snake);
};

const moveSnake = (snake) => {
  let {
    direction,
    path,
    segmentSize,
    speed,
    length,
    ticksUntilTurn,
    accumulated,
    lifeRemaining,
    fading,
    fadeProgress,
    fadeStep,
  } = snake;
  const d = DIRS[direction];

  if (!fading) {
    lifeRemaining -= 1;
    if (lifeRemaining <= 0) fading = true;
  }
  if (fading) {
    fadeProgress = Math.min(1, fadeProgress + fadeStep);
  }

  if (ticksUntilTurn <= 0) {
    direction = turnDirection(direction);
    ticksUntilTurn = randomInt(MENU_SNAKES_TURN_TICKS_MIN, MENU_SNAKES_TURN_TICKS_MAX);
  } else {
    ticksUntilTurn -= 1;
  }

  accumulated += speed;
  const newPath = [...path];
  while (accumulated >= segmentSize) {
    const head = newPath[0];
    const newHead = {
      x: head.x + d.dx * segmentSize,
      y: head.y + d.dy * segmentSize,
    };
    newPath.unshift(newHead);
    newPath.pop();
    accumulated -= segmentSize;
  }

  return {
    ...snake,
    path: newPath,
    direction,
    ticksUntilTurn,
    accumulated,
    lifeRemaining: Math.max(0, lifeRemaining),
    fading,
    fadeProgress,
  };
};

export default function MenuBackgroundSnakes() {
  const [snakes, setSnakes] = useState(() => {
    const count = randomInt(MENU_SNAKES_COUNT_MIN, MENU_SNAKES_COUNT_MAX);
    return Array.from({ length: count }, spawnAtEdge);
  });
  const tickRef = useRef(null);

  useEffect(() => {
    tickRef.current = () => {
      setSnakes((prev) =>
        prev.map((s) => {
          const next = moveSnake(s);
          return shouldRespawn(next) ? spawnAtEdge() : next;
        })
      );
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => tickRef.current?.(), TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {snakes.map((snake, idx) => {
        const seg = snake.segmentSize;
        const opacity = snake.opacity * (1 - snake.fadeProgress);
        return (
          <View key={idx} style={StyleSheet.absoluteFill} collapsable={false}>
            {snake.path.map((pos, i) => (
              <View
                key={i}
                style={[
                  styles.segment,
                  {
                    left: pos.x,
                    top: pos.y,
                    width: seg,
                    height: seg,
                    backgroundColor: i === 0
                      ? `rgba(0, 255, 65, ${opacity})`
                      : `rgba(0, 204, 51, ${opacity * 0.9})`,
                  },
                  i === 0 && styles.head,
                ]}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: 'hidden',
  },
  segment: {
    position: 'absolute',
    borderRadius: 1,
  },
  head: {
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
});
