import React, { useRef } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';

const TRACKPAD_HEIGHT = 196;
const SWIPE_THRESHOLD = 20;

/**
 * Área tipo trackpad: o usuário desliza o dedo e a direção do movimento
 * define para onde a cobra vai (cima, baixo, esquerda, direita).
 */
export default function Trackpad({ onDirectionChange, style }) {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_evt, gestureState) => {
        const { dx, dy } = gestureState;
        if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
        if (Math.abs(dx) >= Math.abs(dy)) {
          onDirectionChange(dx > 0 ? 'right' : 'left');
        } else {
          onDirectionChange(dy > 0 ? 'down' : 'up');
        }
      },
    })
  ).current;

  return (
    <View
      style={[styles.trackpad, style]}
      {...panResponder.panHandlers}
    />
  );
}

const styles = StyleSheet.create({
  trackpad: {
    width: '92%',
    height: TRACKPAD_HEIGHT,
    backgroundColor: '#0d1a14',
    borderWidth: 1,
    borderColor: '#00ff41',
    borderRadius: 8,
    marginVertical: 12,
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
});
