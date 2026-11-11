import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const BiometricOvalFrame = ({ imageUri, isAnalyzing }) => {
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnalyzing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnim.setValue(0);
    }
  }, [isAnalyzing]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-110, 110],
  });

  return (
    <View style={styles.outerGlow}>
      <View style={styles.frame}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="person-outline" size={84} color="#94A3B8" />
          </View>
        )}
        {isAnalyzing && (
          <Animated.View
            style={[styles.scanLine, { transform: [{ translateY }] }]}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerGlow: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 140,
    backgroundColor: '#EEF2FF',
  },
  frame: {
    width: 240,
    height: 300,
    borderRadius: 120,
    borderWidth: 3,
    borderColor: '#3B82F6',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 3,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
});
