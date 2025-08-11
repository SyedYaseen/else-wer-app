import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function SleepTimerButton() {
    const [show, setShow] = useState(false);

    return (
        <>
            <TouchableOpacity onPress={() => setShow(true)} style={styles.iconButton}>
                <MaterialIcons name="access-time" size={28} color="#CCCCCC" />
            </TouchableOpacity>

            <Modal transparent visible={show} animationType="slide">
                <TouchableOpacity style={styles.overlay} onPress={() => setShow(false)}>
                    <View style={styles.bottomSheet}>
                        <Text style={styles.sheetTitle}>Set Sleep Timer</Text>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    iconButton: { padding: 10, alignItems: "center" },
    overlay: { flex: 1 },
    bottomSheet: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        backgroundColor: "#222",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
    },
    sheetTitle: { color: "#fff", fontSize: 18, marginBottom: 10 },
});
