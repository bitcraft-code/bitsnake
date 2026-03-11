import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';

const TRACKPAD_HEIGHT = 196;
const SWIPE_THRESHOLD = 20;

function getDirectionFromDelta(dx, dy) {
  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return null;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }
  return dy > 0 ? 'down' : 'up';
}

/**
 * Área tipo trackpad: o usuário desliza o dedo e a direção do movimento
 * define para onde a cobra vai (cima, baixo, esquerda, direita).
 * Usa onTouch* para evitar que PanResponder ou gestos do sistema capturem o swipe esquerda.
 */
export default function Trackpad({ onDirectionChange, style }) {
  const firedRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });

  const handleTouchStart = (evt) => {
    firedRef.current = false;
    const { pageX, pageY } = evt.nativeEvent.touches[0];
    startRef.current = { x: pageX, y: pageY };
  };

  const handleTouchMove = (evt) => {
    if (firedRef.current) return;
    const touch = evt.nativeEvent.touches[0];
    if (!touch) return;
    const dx = touch.pageX - startRef.current.x;
    const dy = touch.pageY - startRef.current.y;
    const dir = getDirectionFromDelta(dx, dy);
    if (dir) {
      firedRef.current = true;
      onDirectionChange(dir);
    }
  };

  const handleTouchEnd = (evt) => {
    if (firedRef.current) return;
    if (evt.nativeEvent.touches.length > 0) return;
    const lastTouch = evt.nativeEvent.changedTouches[0];
    if (!lastTouch) return;
    const dx = lastTouch.pageX - startRef.current.x;
    const dy = lastTouch.pageY - startRef.current.y;
    const dir = getDirectionFromDelta(dx, dy);
    if (dir) {
      firedRef.current = true;
      onDirectionChange(dir);
    }
  };

  const handleTouchCancel = () => {
    firedRef.current = true;
  };

  return (
    <View
      style={[styles.trackpad, style]}
      onStartShouldSetResponder={() => true}
      onStartShouldSetResponderCapture={() => true}
      onMoveShouldSetResponder={() => true}
      onMoveShouldSetResponderCapture={() => true}
      onResponderTerminationRequest={() => false}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
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
