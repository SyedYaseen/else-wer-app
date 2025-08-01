import * as FileSystem from "expo-file-system";

export const AUDIO_EXTS = [".mp3", ".m4b", ".m4a", ".aac", ".wav", ".ogg"];
export const ROOT = FileSystem.documentDirectory + "audiobooks/";

const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
