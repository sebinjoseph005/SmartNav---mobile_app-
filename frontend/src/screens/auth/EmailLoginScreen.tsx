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

const EmailLoginScreen = () => {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const canContinue =
    isValidEmail(email) && password.length >= 6;

  const handleContinue = async () => {
    if (!canContinue) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Log full response for debugging (will appear in Metro/console)
      console.log('Supabase signIn response:', { data, error });

      if (error) {
        Alert.alert('Sign in failed', error.message || 'Unable to sign in');
        return;
      }

      // Ensure we received a user or session before proceeding
      if (data?.user || data?.session) {
        navigation.replace('Home');
      } else {
        Alert.alert(
          'Sign in failed',
          'Signed in but no session returned. Check Supabase project settings.'
        );
      }
    } catch (err: any) {
      Alert.alert('Sign in error', String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔙 Back → Register */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>SafeTravels</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Sign in</Text>

        <Text style={styles.subtitle}>
          Welcome back to your{' '}
          <Text style={styles.highlight}>
            safety ecosystem
          </Text>.
        </Text>

        {/* Email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#8A94A6"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {/* Password */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#8A94A6"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            onPress={() =>
              setShowPassword(!showPassword)
            }
          >
            <Text style={styles.showText}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Continue */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            !canContinue && styles.disabledButton,
          ]}
          disabled={!canContinue || isLoading}
          onPress={handleContinue}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Signing in…' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.line} />
        </View>

        {/* Google (later) */}
        <TouchableOpacity style={styles.googleButton}>
          <Text style={styles.googleText}>
            Continue with Google
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default EmailLoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  backButton: {
    position: 'absolute',
    top: 45,
    left: 20,
    zIndex: 10,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 22,
  },
  header: {
    alignItems: 'center',
    marginTop: 50,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  passwordContainer: {
    backgroundColor: '#1A2235',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    color: '#FFFFFF',
  },
  showText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#2A3347',
  },
  orText: {
    color: '#9AA4B2',
    marginHorizontal: 10,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  googleText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
  },
});
