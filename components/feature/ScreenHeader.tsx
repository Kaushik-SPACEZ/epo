import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/feature/Logo';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';

interface ScreenHeaderProps {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, showBack = false, showLogo = true, right }: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      {/* Left: back button + logo — zIndex above title so taps register */}
      <View style={styles.left}>
        {showBack ? (
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.textDark} />
          </Pressable>
        ) : null}
        {showLogo ? <Logo /> : null}
      </View>

      {/* Centered title — pointerEvents="none" so it NEVER blocks touches */}
      {title ? (
        <View style={styles.titleContainer} pointerEvents="none">
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        </View>
      ) : null}

      {/* Right side */}
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
    minHeight: 56,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backBtn: {
    padding: 4,
  },
  // Absolute overlay — pointerEvents="none" on wrapping View passes all touches through
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textDark,
    textAlign: 'center',
    paddingHorizontal: 90, // keeps text away from left/right buttons
  },
  right: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
