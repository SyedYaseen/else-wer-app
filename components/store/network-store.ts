import { create } from "zustand";

interface NetworkState {
    isOnline: boolean;
    setNetworkState: (isOnline: boolean) => void;
}

export const useNetworkState = create<NetworkState>((set) => ({
    isOnline: false,
    setNetworkState: (isOnline: boolean) => set({ isOnline }),
}))