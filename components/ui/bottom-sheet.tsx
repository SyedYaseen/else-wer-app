// components/ui/bottom-sheet.tsx — generalized from
// components/player/secondary-controls/sleep-timer.tsx's hand-rolled Modal
// pattern. Used by chapters/playback-speed/sleep-timer/volume.
//
// The inner no-op-onPress wrapper stops taps on the sheet content from
// bubbling to the overlay's dismiss handler (a bug in the original
// sleep-timer.tsx, where tapping the sheet itself also closed it).

import React from 'react';
import { Modal, View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

export type BottomSheetProps = {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
};

export function BottomSheet({ visible, onClose, children, style }: BottomSheetProps) {
    const T = useTheme();

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} onPress={() => { }}>
                    <View
                        style={[
                            {
                                position: 'absolute',
                                bottom: 0,
                                width: '100%',
                                backgroundColor: T.surface,
                                borderTopWidth: 0.5,
                                borderTopColor: T.inkHairline,
                                borderTopLeftRadius: T.radius.xl,
                                borderTopRightRadius: T.radius.xl,
                                padding: T.space.xl,
                            },
                            style,
                        ]}
                    >
                        {children}
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}
