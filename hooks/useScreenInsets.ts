import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";

import { Spacing } from "@/constants/theme";

export function useScreenInsets() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  return {
    paddingTop: headerHeight + Spacing.xl,
    paddingBottom: insets.bottom + Spacing.xl,
    paddingLeft: insets.left + Spacing.xl,
    paddingRight: insets.right + Spacing.xl,
    scrollInsetBottom: insets.bottom + 16,
    insets,
    headerHeight,
  };
}

export function useLandscapeInsets() {
  const insets = useSafeAreaInsets();

  return {
    paddingTop: insets.top + Spacing.lg,
    paddingBottom: insets.bottom + Spacing.lg,
    paddingLeft: insets.left + Spacing.sidebarWidth + Spacing.lg,
    paddingRight: insets.right + Spacing.lg,
    insets,
    sidebarWidth: Spacing.sidebarWidth,
  };
}
