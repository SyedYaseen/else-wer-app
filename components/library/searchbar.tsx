import { useRef, useCallback } from "react";
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    Animated,
    Platform,
    StyleProp,
    ViewStyle,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/components/hooks/useTheme";

interface SearchBarProps {
    value: string;
    onChange: (text: string) => void;
    resultCount?: number;
    hasQuery: boolean;
    style?: StyleProp<ViewStyle>;
}

export function SearchBar({ value, onChange, resultCount, hasQuery, style }: SearchBarProps) {
    const T = useTheme();
    const inputRef = useRef<TextInput>(null);
    // Subtle animated underline width (fills on focus)
    const underlineAnim = useRef(new Animated.Value(0)).current;

    const handleFocus = useCallback(() => {
        Animated.spring(underlineAnim, {
            toValue: 1,
            useNativeDriver: false,
            tension: 120,
            friction: 8,
        }).start();
    }, [underlineAnim]);

    const handleBlur = useCallback(() => {
        if (!value) {
            Animated.spring(underlineAnim, {
                toValue: 0,
                useNativeDriver: false,
                tension: 120,
                friction: 8,
            }).start();
        }
    }, [underlineAnim, value]);

    const handleClear = useCallback(() => {
        onChange("");
        inputRef.current?.focus();
    }, [onChange]);

    const underlineWidth = underlineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
    });

    return (
        <View style={[styles.wrapper, style]}>
            <View
                style={[
                    styles.inputRow,
                    {
                        backgroundColor: T.surface,
                        borderColor: T.inkHairline,
                    },
                ]}
            >
                <MaterialIcons
                    name="search"
                    size={16}
                    color={hasQuery ? T.accent : T.inkSubtle}
                    style={styles.searchIcon}
                />
                <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={onChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="Search titles, authors, series…"
                    placeholderTextColor={T.inkSubtle}
                    style={[styles.input, { color: T.ink, fontFamily: "DMSans_400Regular" }]}
                    returnKeyType="search"
                    autoCorrect={false}
                    autoCapitalize="none"
                    clearButtonMode="never" // We render our own
                />
                {value.length > 0 && (
                    <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialIcons name="close" size={16} color={T.inkSubtle} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Animated accent underline */}
            <View style={[styles.underlineBg, { backgroundColor: T.inkHairline }]}>
                <Animated.View
                    style={[
                        styles.underlineFill,
                        { backgroundColor: T.accent, width: underlineWidth },
                    ]}
                />
            </View>

            {/* Result count badge — only visible while searching */}
            {hasQuery && resultCount !== undefined && (
                <Text style={[styles.resultCount, { color: T.inkSubtle }]}>
                    {resultCount === 0
                        ? "No results"
                        : `${resultCount} ${resultCount === 1 ? "book" : "books"}`}
                </Text>
            )}
        </View>
    );
}

// ── Highlight helper ──────────────────────────────────────────────────────────
// Use in BookCard / InProgressCard title text when query is active.
// Returns an array of <Text> spans with matches highlighted.
interface HighlightProps {
    text: string;
    query: string;
    style?: object;
    highlightColor: string;
    highlightTextColor: string;
}

export function HighlightedText({
    text,
    query,
    style,
    highlightColor,
    highlightTextColor,
}: HighlightProps) {
    if (!query.trim()) return <Text style={style}>{text}</Text>;

    let parts: string[];
    try {
        parts = text.split(new RegExp(`(${escapeRegex(query)})`, "gi"));
    } catch {
        // Regex construction failed — render plain text rather than crash
        return <Text style={style}>{text}</Text>;
    }

    return (
        <Text style={style}>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <Text
                        key={i}
                        style={{ backgroundColor: highlightColor, color: highlightTextColor }}
                    >
                        {part}
                    </Text>
                ) : (
                    <Text key={i}>{part}</Text>
                )
            )}
        </Text>
    );
}

function escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const styles = StyleSheet.create({
    wrapper: {
        gap: 2,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 0.5,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: Platform.OS === "ios" ? 9 : 6,
        gap: 8,
    },
    searchIcon: {
        flexShrink: 0,
    },
    input: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        padding: 0, // Reset Android default padding
    },
    underlineBg: {
        height: 1.5,
        borderRadius: 1,
        marginTop: 2,
        overflow: "hidden",
    },
    underlineFill: {
        height: "100%",
        borderRadius: 1,
    },
    resultCount: {
        fontFamily: "DMSans_400Regular",
        fontSize: 11,
        marginTop: 4,
        paddingHorizontal: 2,
    },
});