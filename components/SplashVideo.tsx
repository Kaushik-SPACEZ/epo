import React, { useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Animated, View, Platform, Image } from 'react-native';

interface Props {
  onFinish: () => void;
}

// Web-specific video component using native HTML5 <video>
function WebVideo({ onEnd }: { onEnd: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.play().catch(() => {});
    }
  }, []);

  return (
    <video
      ref={videoRef}
      // @ts-ignore – Metro/webpack resolves require() to a URI string on web
      src={require('@/assets/splash-logo.mp4')}
      autoPlay
      muted
      playsInline
      onEnded={onEnd}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
      }}
    />
  );
}

// Native video component using expo-av
function NativeVideo({ onEnd }: { onEnd: () => void }) {
  const { Video, ResizeMode } = require('expo-av');

  const handleStatus = (status: any) => {
    if (status.isLoaded && status.didJustFinish) {
      onEnd();
    }
  };

  return (
    <Video
      source={require('@/assets/splash-logo.mp4')}
      style={{ width: 250, height: 250 }}
      resizeMode={ResizeMode.CONTAIN}
      shouldPlay
      isLooping={false}
      isMuted
      onPlaybackStatusUpdate={handleStatus}
    />
  );
}

export function SplashVideo({ onFinish }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const calledRef = useRef(false);

  const fadeOut = useCallback(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    Animated.timing(opacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => onFinish());
  }, [opacity, onFinish]);

  // Safety fallback — move on after 6s if video never ends
  useEffect(() => {
    const timer = setTimeout(fadeOut, 6000);
    return () => clearTimeout(timer);
  }, [fadeOut]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {Platform.OS === 'web' ? (
        <WebVideo onEnd={fadeOut} />
      ) : (
        <NativeVideo onEnd={fadeOut} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    zIndex: 9999,
    elevation: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
