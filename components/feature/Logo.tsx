import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center';
}

export function Logo({ size = 'md', align = 'left' }: LogoProps) {
  const width = size === 'sm' ? 80 : size === 'lg' ? 150 : 130;
  const height = size === 'sm' ? 40 : size === 'lg' ? 70 : 55;

  return (
    <View style={[styles.container, align === 'center' && styles.containerCenter]}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={{ width, height }}
        contentFit="contain"
        contentPosition={align}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  containerCenter: {
    alignItems: 'center',
  },
});
