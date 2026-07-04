// components/ui/use-disclosure.ts — shared open/close boolean state, for the
// repeated IconButton + BottomSheet trigger pattern.

import { useState, useCallback } from 'react';

export function useDisclosure(initial = false) {
    const [visible, setVisible] = useState(initial);
    const open = useCallback(() => setVisible(true), []);
    const close = useCallback(() => setVisible(false), []);
    return { visible, open, close };
}
