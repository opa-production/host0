import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

const BRAND_BLUE = '#007AFF';

/**
 * CircleLoader - A React Native implementation of react-spinners CircleLoader.
 * It features concentric circles that rotate and scale.
 */
export default function CircleLoader({ 
  size = 50, 
  color = BRAND_BLUE, 
  loading = true,
  style 
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      const animation = Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [loading, anim]);

  if (!loading) return null;

  const circleStyle = (index) => {
    const scale = anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.8, 1],
    });

    const rotate = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [`${index * 30}deg`, `${index * 30 + 360}deg`],
    });

    return {
      position: 'absolute',
      width: size * (1 - index * 0.15),
      height: size * (1 - index * 0.15),
      borderWidth: size * 0.05,
      borderColor: color,
      borderRadius: size,
      borderTopColor: 'transparent',
      borderLeftColor: 'transparent',
      transform: [{ rotate }],
    };
  };

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Animated.View key={i} style={circleStyle(i)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
