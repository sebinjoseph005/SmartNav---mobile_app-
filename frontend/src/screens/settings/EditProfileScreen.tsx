import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setFullName(data.user.user_metadata?.full_name || '');
        setEmail(data.user.email || '');
        setEmergencyContactName(data.user.user_metadata?.emergency_contact_name || '');
        setEmergencyContactPhone(data.user.user_metadata?.emergency_contact_phone || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!emergencyContactName.trim()) {
      Alert.alert('Error', 'Please enter emergency contact name');
      return;
    }

    if (!emergencyContactPhone.trim() || !/^[\d\s\+\-\(\)]+$/.test(emergencyContactPhone) || emergencyContactPhone.replace(/\D/g, '').length < 10) {
      Alert.alert('Error', 'Please enter a valid emergency contact phone number (min 10 digits)');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          emergency_contact_name: emergencyContactName.trim(),
          emergency_contact_phone: emergencyContactPhone.trim(),
        }
      });

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* FULL NAME */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor="#64748B"
            />
          </View>

          {/* EMAIL (READ-ONLY) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputReadOnly}>
              <Text style={styles.inputReadOnlyText}>{email}</Text>
            </View>
            <Text style={styles.helperText}>
              Email cannot be changed. Contact support if needed.
            </Text>
          </View>

          {/* EMERGENCY CONTACT NAME */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Emergency Contact Name</Text>
            <TextInput
              style={styles.input}
              value={emergencyContactName}
              onChangeText={setEmergencyContactName}
              placeholder="Enter emergency contact name"
              placeholderTextColor="#64748B"
            />
          </View>

          {/* EMERGENCY CONTACT PHONE */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Emergency Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={emergencyContactPhone}
              onChangeText={setEmergencyContactPhone}
              placeholder="Enter emergency contact phone"
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
            />
            <Text style={styles.helperText}>
              This contact will be notified in case of emergency.
            </Text>
          </View>

          {/* SAVE BUTTON */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Save size={20} color="#FFF" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },

  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },

  placeholder: {
    width: 44,
  },

  content: {
    padding: 20,
  },

  inputGroup: {
    marginBottom: 24,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 10,
  },

  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },

  inputReadOnly: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },

  inputReadOnlyText: {
    fontSize: 16,
    color: '#94A3B8',
  },

  helperText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },

  saveBtnDisabled: {
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
  },

  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
