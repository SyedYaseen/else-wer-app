import { View, StyleSheet } from "react-native";
import ChaptersButton from "./chapters";
import PlaybackSpeedButton from "./playback-speed";
import SleepTimerButton from "./sleep-timer";
import VolumeButton from "./volume";

export default function SecondaryControls() {
    return (
        <View style={styles.bottomBar}>
            <PlaybackSpeedButton />
            <SleepTimerButton />
            <VolumeButton />
            <ChaptersButton />
        </View>
    );
}

const styles = StyleSheet.create({
    bottomBar: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingVertical: 10,
        marginBottom: 20,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
});
