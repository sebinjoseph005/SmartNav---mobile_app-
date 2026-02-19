import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface GlobalSOSButtonProps {
  bottom?: number;
  right?: number;
}

export default function GlobalSOSButton({ 
  bottom = 30, 
  right = 20 
}: GlobalSOSButtonProps) {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      style={[styles.sosButton, { bottom, right }]}
      onPress={() => navigation.navigate('SOS')}
      activeOpacity={0.8}
    >
      <View style={styles.sosCircle}>
        <AlertCircle size={24} color="#FFF" strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sosButton: {
    position: 'absolute',
    zIndex: 1000,
  },

  sosCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
});
