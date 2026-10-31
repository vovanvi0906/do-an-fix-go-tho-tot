import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const StepIndicator = ({ currentStep, totalSteps = 6 }) => {
  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber <= currentStep;
          return (
            <View
              key={stepNumber}
              style={[
                styles.segment,
                isActive ? styles.segmentActive : styles.segmentInactive,
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.stepText}>
        Bước {currentStep}/{totalSteps}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  barContainer: {
    flexDirection: 'row',
    height: 4,
    gap: 6,
    marginBottom: 6,
  },
  segment: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
  },
  segmentActive: {
    backgroundColor: '#0084FF',
  },
  segmentInactive: {
    backgroundColor: '#E2E8F0',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'right',
  },
});
