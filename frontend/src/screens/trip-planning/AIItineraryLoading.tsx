import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function AIItineraryLoading() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('AIItineraryResult', {
        itinerary: MOCK_ITINERARY,
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/images/logos/ai-bot.png')}
        style={{ width: 80, height: 80, marginBottom: 20 }}
      />
      <Text style={styles.text}>Crafting your trip…</Text>
      <Text style={styles.sub}>Analyzing safe routes & spots</Text>
    </View>
  );
}

const MOCK_ITINERARY = {
  title: 'Kyoto Trip',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { color: '#fff', fontSize: 18 },
  sub: { color: '#9CA3AF', marginTop: 6 },
});
