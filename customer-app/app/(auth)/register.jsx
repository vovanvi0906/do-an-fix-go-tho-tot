import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function RegisterRoute() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(auth)/register-customer');
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0084FF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
