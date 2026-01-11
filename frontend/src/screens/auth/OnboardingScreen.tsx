import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const DATA = [
  {
    id: '1',
    title: 'Smart & Safe Navigation',
    description:
      'Get route recommendations based on real-time safety data, not just speed.',
    image: require('../../../assets/images/onboarding/onboarding1.png'),
  },
  {
    id: '2',
    title: 'Stay Connected Offline',
    description:
      'Message nearby travelers even without cellular service.',
    image: require('../../../assets/images/onboarding/onboarding2.png'),
  },
  {
    id: '3',
    title: 'Live Like a Local',
    description:
      'Find hidden gems verified by locals, not tourists.',
    image: require('../../../assets/images/onboarding/onboarding3.png'),
  },
];

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // ✅ startIndex support (default = 0)
  const initialIndex =
    typeof route.params?.startIndex === 'number'
      ? route.params.startIndex
      : 0;

  const [index, setIndex] = useState(initialIndex);

  // ✅ Scroll to correct slide when screen loads
  useEffect(() => {
    if (initialIndex > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
        });
      }, 50);
    }
  }, [initialIndex]);

  const goNext = () => {
    if (index < DATA.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: index + 1,
      });
    } else {
      // ✅ New users go to Register
      navigation.replace('Register');
    }
  };

  const skipToLast = () => {
    flatListRef.current?.scrollToIndex({ index: 2 });
    setIndex(2);
  };

  return (
    <View style={styles.container}>
      {/* SKIP */}
      {index < 2 && (
        <TouchableOpacity
          style={styles.skip}
          onPress={skipToLast}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* SLIDES */}
      <FlatList
        ref={flatListRef}
        data={DATA}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(
            e.nativeEvent.contentOffset.x / width
          );
          setIndex(newIndex);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image
              source={item.image}
              style={styles.image}
            />
            <Text style={styles.title}>
              {item.title}
            </Text>
            <Text style={styles.description}>
              {item.description}
            </Text>
          </View>
        )}
      />

      {/* DOTS */}
      <View style={styles.dots}>
        {DATA.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              index === i && styles.activeDot,
            ]}
          />
        ))}
      </View>

      {/* BUTTON */}
      <TouchableOpacity
        style={styles.button}
        onPress={goNext}
      >
        <Text style={styles.buttonText}>
          {index === 2
            ? 'Get Started →'
            : 'Next →'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  skip: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 120,
  },
  image: {
    width: '100%',
    height: 260,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#A0AEC0',
    textAlign: 'center',
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#334155',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 16,
    backgroundColor: '#2563EB',
  },
  button: {
    marginHorizontal: 24,
    marginBottom: 48,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
