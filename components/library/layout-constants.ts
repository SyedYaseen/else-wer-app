// components/library/layout-constants.ts — shared grid-layout constants.
// Extracted from index.tsx to break the circular import with book-card.tsx
// (index.tsx imported BookCard, book-card.tsx imported ITEM_WIDTH from index.tsx).

import { Dimensions } from "react-native";

export const NUM_COLUMNS = 2;
const SCREEN_WIDTH = Dimensions.get("window").width;
export const H_PADDING = 16;
export const COL_GAP = 10;
export const ITEM_WIDTH =
  (SCREEN_WIDTH - H_PADDING * 2 - COL_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
