import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValidEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const canRegister = isValidEmail(email) && password.length >= 6;

  const handleRegister = async () => {
    if (!canRegister) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        Alert.alert('Registration failed', error.message || 'Unable to register');
        return;
      }

      // On successful sign-up, show success and navigate to sign-in
      Alert.alert('Account created', 'Please sign in to continue.');
      navigation.navigate('EmailLogin');
    } catch (err: any) {
      Alert.alert('Registration error', String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔙 Back → Onboarding */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.replace('Onboarding')}
      >
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Create account</Text>

        <Text style={styles.subtitle}>
          Get started with{' '}
          <Text style={styles.highlight}>SafeTravels</Text>
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#8A94A6"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password (min 6 chars)"
          placeholderTextColor="#8A94A6"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !canRegister && styles.disabledButton,
          ]}
          disabled={!canRegister || isLoading}
          onPress={handleRegister}
        >
          <Text style={styles.primaryButtonText}>
            Create Account
          </Text>
        </TouchableOpacity>

        {/* Existing user */}
        <TouchableOpacity
          onPress={() => navigation.navigate('EmailLogin')}
          style={{ marginTop: 16 }}
        >
          <Text style={styles.linkText}>
            Already have an account? Sign in
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220' },
  backButton: {
    position: 'absolute',
    top: 45,
    left: 20,
    zIndex: 10,
  },
  backText: { color: '#FFF', fontSize: 22 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9AA4B2',
    fontSize: 14,
    marginBottom: 32,
  },
  highlight: {
    color: '#2563EB',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1A2235',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#1E293B',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#3B82F6',
    textAlign: 'center',
    fontSize: 14,
  },
});
