import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

const RegisterScreen = () => {
  const navigation = useNavigation<any>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isValidEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const isPasswordValid = password.length >= 6;
  const isNameValid = name.trim().length >= 2;

  const canRegister =
    isNameValid && isValidEmail(email) && isPasswordValid;

  const handleRegister = async () => {
    setSubmitted(true);
    if (!canRegister) return;

    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        Alert.alert('Registration failed', error.message);
        return;
      }

      Alert.alert('Account created', 'Please sign in to continue.', [
        {
          text: 'OK',
          onPress: () => navigation.replace('EmailLogin'),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.replace('Onboarding')}
      >
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      {/* HEADER — DO NOT TOUCH */}
      <View style={styles.header}>
        <Text style={styles.logo}>SafeTravels</Text>
      </View>

      {/* FORM — PUSHED DOWN */}
      <View style={styles.form}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>
          Get started with{' '}
          <Text style={styles.highlight}>SafeNav</Text>
        </Text>

        {/* Name */}
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#8A94A6"
            value={name}
            onChangeText={setName}
          />
          {submitted && !isNameValid && (
            <Text style={styles.errorText}>
              Please enter your name
            </Text>
          )}
        </View>

        {/* Email */}
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#8A94A6"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password */}
        <View style={styles.field}>
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
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.showText}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>

          {submitted && !isPasswordValid && (
            <Text style={styles.errorText}>
              Password must be at least 6 characters
            </Text>
          )}
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            !canRegister && styles.disabledButton,
          ]}
          disabled={isLoading}
          onPress={handleRegister}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Creating account…' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        {/* Sign in */}
        <TouchableOpacity
          onPress={() => navigation.navigate('EmailLogin')}
          style={styles.signInLink}
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
    marginTop: 50, // 🔒 stays the same
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  form: {
    paddingHorizontal: 24,
    marginTop: 110, // ✅ THIS is what you asked for
  },

  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9AA4B2',
    fontSize: 14,
    marginBottom: 22,
  },
  highlight: {
    color: '#2563EB',
    fontWeight: '600',
  },

  field: {
    marginBottom: 14,
  },

  input: {
    backgroundColor: '#1A2235',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
  },

  passwordContainer: {
    backgroundColor: '#1A2235',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
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

  errorText: {
    marginTop: 6,
    marginLeft: 4,
    color: '#EF4444',
    fontSize: 13,
  },

  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  disabledButton: {
    backgroundColor: '#1E293B',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  signInLink: {
    marginTop: 16,
  },
  linkText: {
    color: '#3B82F6',
    textAlign: 'center',
    fontSize: 14,
  },
});
