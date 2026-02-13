import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Phone,
  Globe,
  Share2,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function PlaceDetails() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { place } = route.params || {};

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Place Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Share2 size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* PHOTO */}
        {place.photos?.[0] && (
          <Image
            source={{
              uri: `${place.photos[0].prefix}original${place.photos[0].suffix}`,
            }}
            style={styles.photo}
          />
        )}

        {/* INFO CARD */}
        <View style={styles.infoCard}>
          <Text style={styles.name}>{place.name}</Text>

          {/* RATING */}
          <View style={styles.row}>
            <Star size={18} color="#FACC15" fill="#FACC15" />
            <Text style={styles.rating}>
              {place.rating || '4.5'} · {place.stats?.total_ratings || '120'} reviews
            </Text>
          </View>

          {/* CATEGORY */}
          {place.categories?.[0] && (
            <Text style={styles.category}>
              {place.categories[0].name}
            </Text>
          )}

          {/* ADDRESS */}
          <View style={styles.section}>
            <View style={styles.sectionIcon}>
              <MapPin size={20} color="#3B82F6" />
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Address</Text>
              <Text style={styles.sectionText}>
                {place.location?.address || 'No address available'}
              </Text>
              {place.location?.locality && (
                <Text style={styles.sectionText}>
                  {place.location.locality}, {place.location.region}
                </Text>
              )}
            </View>
          </View>

          {/* HOURS */}
          <View style={styles.section}>
            <View style={styles.sectionIcon}>
              <Clock size={20} color="#22C55E" />
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Hours</Text>
              <Text style={styles.sectionText}>
                {place.hours?.display || 'Hours not available'}
              </Text>
            </View>
          </View>

          {/* PHONE */}
          {place.tel && (
            <View style={styles.section}>
              <View style={styles.sectionIcon}>
                <Phone size={20} color="#8B5CF6" />
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>Phone</Text>
                <Text style={styles.sectionText}>{place.tel}</Text>
              </View>
            </View>
          )}

          {/* WEBSITE */}
          {place.website && (
            <View style={styles.section}>
              <View style={styles.sectionIcon}>
                <Globe size={20} color="#F59E0B" />
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>Website</Text>
                <Text style={[styles.sectionText, styles.link]}>
                  {place.website}
                </Text>
              </View>
            </View>
          )}

          {/* DESCRIPTION */}
          {place.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{place.description}</Text>
            </View>
          )}

          {/* PHOTOS GALLERY */}
          {place.photos && place.photos.length > 1 && (
            <View style={styles.gallerySection}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {place.photos.map((photo: any, index: number) => (
                  <Image
                    key={index}
                    source={{
                      uri: `${photo.prefix}300x300${photo.suffix}`,
                    }}
                    style={styles.galleryPhoto}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* NAVIGATE BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={() => navigation.navigate('RouteSelection', { place })}
        >
          <Text style={styles.navigateButtonText}>Get Directions</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: 250,
    backgroundColor: '#1E293B',
  },
  infoCard: {
    padding: 20,
  },
  name: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rating: {
    color: '#FFF',
    fontSize: 16,
  },
  category: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 24,
  },
  section: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    color: '#3B82F6',
  },
  descriptionSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  description: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  gallerySection: {
    marginTop: 8,
  },
  galleryPhoto: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#1E293B',
  },
  footer: {
    padding: 16,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#1E3A8A',
  },
  navigateButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
