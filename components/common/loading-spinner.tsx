import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const LoadingSpinner = ({ size = 40, color = "#555555" }) => (
    <View style={styles.spinnerContainer}>
        <ActivityIndicator size={size} color={color} />
    </View>
);

const styles = StyleSheet.create({
    spinnerContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default LoadingSpinner;