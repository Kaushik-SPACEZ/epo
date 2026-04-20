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
}

export function ScreenHeader({ title, showBack = false, showLogo = true }: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      {/* Left: logo */}
      <View style={styles.left}>
        {showBack ? (
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.textDark} />
          </Pressable>
        ) : null}
        {showLogo ? <Logo /> : null}
      </View>

      {/* Centered title */}
      <Text style={styles.title}>
        {title}
      </Text>

      {/* Right spacer */}
      <View style={styles.right} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
    minHeight: 56,
  },
  left: {
    width: 34,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textDark,
    textAlign: 'center',
  },
  titleSpacer: {
    flex: 1,
  },
  right: {
    width: 34,
    alignItems: 'flex-end',
  },
});
