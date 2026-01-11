import { View, Text, Image, StyleSheet, Pressable } from 'react-native';

export default function SplashScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/images/logos/logo.png')}
        style={styles.logo}
      />

      <Text style={styles.title}>SmartNav</Text>

      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate('Onboarding')}
      >
        <Text style={styles.buttonText}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
