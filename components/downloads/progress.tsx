// components/downloads/progress.tsx — Folio Progress Ring

import { useDownloadStore } from "../store/download-strore";
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/components/hooks/useTheme';

const SIZE = 52;
const STROKE_WIDTH = 3;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Progress({ bookId }: { bookId: number }) {
  const T = useTheme();
  const bookProgress = useDownloadStore(s => s.bookProgress);
  const curr = bookProgress[bookId];

  if (!curr) return null;

  const pcnt = Math.min((curr.currentProgress / curr.totalSize) * 100, 100);
  const strokeDashoffset = CIRCUMFERENCE - (pcnt / 100) * CIRCUMFERENCE;

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        {/* Track */}
        <Circle
          stroke={T.inkHairline}
          fill="none"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
        />
        {/* Progress arc */}
        <Circle
          stroke={T.accent}
          fill="none"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${SIZE / 2}, ${SIZE / 2})`}
        />
      </Svg>
      {/* Centred percentage label */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.labelWrap}>
          <Text style={[styles.pcntText, { color: T.ink }]}>
            {pcnt.toFixed(0)}
          </Text>
          <Text style={[styles.pcntSymbol, { color: T.inkSubtle }]}>%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
  },
  labelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pcntText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    lineHeight: 16,
  },
  pcntSymbol: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 9,
    lineHeight: 16,
    marginTop: 1,
  },
});