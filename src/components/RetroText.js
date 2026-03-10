import React from 'react';
import { Text } from 'react-native';
import { FONT_FAMILY } from '../theme';

/**
 * Text que sempre usa a fonte pixel retro em todo o app.
 * A fonte é aplicada por último; fontWeight é removido para evitar fallback no sistema.
 */
export default function RetroText({ style, ...props }) {
  return (
    <Text
      style={[style, { fontFamily: FONT_FAMILY, fontWeight: undefined }]}
      {...props}
    />
  );
}
