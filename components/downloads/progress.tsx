import { useDownloadStore } from "../store/download-strore"
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const SIZE = 40;
const STROKE_WIDTH = 7;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Progress({ bookId }: { bookId: number }) {
  const bookProgress = useDownloadStore(s => s.bookProgress)
  const curr = bookProgress[bookId]
  if (!curr) return <></>
  const pcnt = (curr.currentProgress / curr.totalSize) * 100

  const strokeDashoffset = CIRCUMFERENCE - (pcnt / 100) * CIRCUMFERENCE;

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        {/* Background Circle (The empty part of the ring) */}
        <Circle
          stroke="#e6e6e6"
          fill="none"
          cx={SIZE / 2} // Center X
          cy={SIZE / 2} // Center Y
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
        />

        <Circle
          stroke="#007aff"
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

      {/* Text Label (Placed in the center) */}
      <View style={styles.textContainer}>
        <Text style={styles.progressText}>
          {pcnt.toFixed(0)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute', // Allows text to overlay the SVG
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
  }
});
