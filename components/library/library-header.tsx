import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/components/hooks/useTheme";
import { useNetworkState } from "../store/network-store";
import { apiFetch } from "@/data/api/fetch-wrapper";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LIBRARY_KEYS } from "../hooks/useLibraryBooks";

interface LibraryHeaderProps {
    bookCount: number;
    onRescan: () => void;
    isRescanning: boolean;
}

const H_PADDING = 16;

export function LibraryHeader({ bookCount, onRescan, isRescanning }: LibraryHeaderProps) {
    const T = useTheme();
    const insets = useSafeAreaInsets();
    const [pinging, setPinging] = useState(false);

    const isOnline = useNetworkState(s => s.isOnline);
    const setNetworkState = useNetworkState(s => s.setNetworkState);
    const queryClient = useQueryClient();

    const TAG = "[LibraryHeader]";

    const handleNetworkToggle = async () => {
        if (isOnline) {
            console.log(`${TAG} going offline`);
            setNetworkState(false);
            await queryClient.invalidateQueries({ queryKey: ["library"] });
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        setPinging(true);
        try {
            console.log(`${TAG} pinging server to go online`);
            const res = await apiFetch("/hello", { method: "GET", signal: controller.signal });
            if (res.ok || res.status === 404) {
                console.log(`${TAG} server reachable (status=${res.status}), going online`);
                setNetworkState(true);
                await queryClient.invalidateQueries({ queryKey: ["library"] });
            } else {
                console.warn(`${TAG} server returned unexpected status ${res.status}`);
                Alert.alert("Unreachable", `Server responded with status ${res.status}.`);
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
                console.warn(`${TAG} ping timed out after 4s`);
                Alert.alert("Timed Out", "Server did not respond in time. Check your network.");
            } else {
                console.error(`${TAG} ping failed`, err);
                Alert.alert("Unreachable", "Could not connect to the server.");
            }
        } finally {
            setPinging(false);
            clearTimeout(timeoutId);
        }
    };

    return (
        <View
            style={[
                styles.header,
                {
                    paddingTop: insets.top + 16,
                    paddingHorizontal: H_PADDING,
                    borderBottomColor: T.inkHairline,
                    backgroundColor: T.background,
                },
            ]}
        >
            <View style={styles.titleRow}>
                <View>
                    <Text style={[styles.title, { color: T.ink }]}>Library</Text>
                    <Text style={[styles.subtitle, { color: T.inkSubtle }]}>
                        Your audiobook collection
                    </Text>
                </View>

                <View style={styles.actions}>
                    {isOnline && bookCount > 0 && (
                        <TouchableOpacity
                            style={[styles.pill, { borderColor: T.inkHairline }]}
                            onPress={onRescan}
                            activeOpacity={0.6}
                            disabled={isRescanning}
                        >
                            {isRescanning
                                ? <ActivityIndicator size={12} color={T.accent} />
                                : <MaterialIcons name="refresh" size={14} color={T.accent} />
                            }
                            <Text style={[styles.pillText, { color: T.accent }]}>
                                {isRescanning ? "Scanning…" : "Rescan"}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.pill,
                            {
                                borderColor: isOnline ? T.inkHairline : T.accent + "66",
                                backgroundColor: isOnline ? "transparent" : T.accent + "14",
                            },
                        ]}
                        onPress={handleNetworkToggle}
                        activeOpacity={0.6}
                        disabled={pinging}
                    >
                        {pinging
                            ? <ActivityIndicator size={12} color={T.accent} />
                            : <MaterialIcons
                                name={isOnline ? "cloud-off" : "cloud-queue"}
                                size={14}
                                color={isOnline ? T.inkSubtle : T.accent}
                            />
                        }
                        <Text style={[styles.pillText, { color: isOnline ? T.inkSubtle : T.accent }]}>
                            {pinging ? "Checking…" : isOnline ? "Go Offline" : "Go Online"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {bookCount > 0 && (
                <Text style={[styles.count, { color: T.inkSubtle }]}>
                    {bookCount} {bookCount === 1 ? "audiobook" : "audiobooks"}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingBottom: 14,
        borderBottomWidth: 0.5,
        gap: 6,
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    title: {
        fontFamily: "DMSerifDisplay_400Regular",
        fontSize: 32,
        lineHeight: 36,
    },
    subtitle: {
        fontFamily: "DMSans_300Light",
        fontSize: 13,
        marginTop: 2,
    },
    count: {
        fontFamily: "DMSans_400Regular",
        fontSize: 11,
        letterSpacing: 0.04,
    },
    actions: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    pill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 100,
        borderWidth: 0.5,
        marginBottom: 2,
    },
    pillText: {
        fontFamily: "DMSans_500Medium",
        fontSize: 12,
    },
});