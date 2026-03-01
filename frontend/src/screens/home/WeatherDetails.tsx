import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCachedLocation } from '../../services/locationCache';

/* ---------------- INTERFACES ---------------- */

interface WeatherData {
  current_weather: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    time: string;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    weathercode: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
}

interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
}

interface CitySuggestion {
  id: number;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

/* ---------------- WEATHER CODES ---------------- */

const getWeatherInfo = (code: number) => {
  if (code === 0) return { desc: 'Clear Sky', icon: '☀️', color: '#FACC15' };
  if (code <= 3) return { desc: 'Partly Cloudy', icon: '🌤️', color: '#94A3B8' };
  if (code <= 48) return { desc: 'Foggy', icon: '🌫️', color: '#64748B' };
  if (code <= 67) return { desc: 'Rainy', icon: '🌧️', color: '#3B82F6' };
  if (code <= 77) return { desc: 'Snowy', icon: '❄️', color: '#60A5FA' };
  if (code <= 82) return { desc: 'Showers', icon: '🌦️', color: '#3B82F6' };
  return { desc: 'Thunderstorm', icon: '⛈️', color: '#8B5CF6' };
};

/* ---------------- SCREEN ---------------- */

export default function WeatherDetails() {
  const navigation = useNavigation<any>();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  /* ---------------- GET CURRENT LOCATION ---------------- */

  useEffect(() => {
    getCurrentLocationWeather();
  }, []);

  const getCurrentLocationWeather = async () => {
    try {
      setLoading(true);

      const loc = await getCachedLocation();
      if (!loc) {
        Alert.alert('Permission Denied', 'Location access is required for weather.');
        setLoading(false);
        return;
      }

      const { latitude, longitude } = loc;

      // Reverse geocode to get city name
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      const cityName = geocode[0]?.city || geocode[0]?.district || 'Current Location';

      const locationData = {
        name: cityName,
        latitude,
        longitude,
      };

      setLocation(locationData);

      // Fetch weather
      await fetchWeather(latitude, longitude);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Could not get your location');
      setLoading(false);
    }
  };

  /* ---------------- FETCH WEATHER ---------------- */

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=14`
      );

      const data = await response.json();
      setWeather(data);
      setLoading(false);
    } catch (error) {
      console.error('Weather error:', error);
      Alert.alert('Error', 'Could not fetch weather data');
      setLoading(false);
    }
  };

  /* ---------------- SEARCH LOCATION ---------------- */

  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      );

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        setSuggestions(data.results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Suggestions error:', error);
      setSuggestions([]);
    }
  };

  const selectSuggestion = async (suggestion: CitySuggestion) => {
    try {
      setSearching(true);
      setShowSuggestions(false);
      setSearchQuery('');

      const locationData = {
        name: suggestion.name + (suggestion.country ? `, ${suggestion.country}` : ''),
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      };

      setLocation(locationData);
      await fetchWeather(suggestion.latitude, suggestion.longitude);
      setSearching(false);
    } catch (error) {
      console.error('Select suggestion error:', error);
      Alert.alert('Error', 'Could not load weather for this location');
      setSearching(false);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setShowSuggestions(false);

      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=en&format=json`
      );

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        Alert.alert('Not Found', 'Could not find this location');
        setSearching(false);
        return;
      }

      const result = data.results[0];

      const locationData = {
        name: result.name + (result.country ? `, ${result.country}` : ''),
        latitude: result.latitude,
        longitude: result.longitude,
      };

      setLocation(locationData);
      await fetchWeather(result.latitude, result.longitude);
      setSearchQuery('');
      setSearching(false);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Could not search location');
      setSearching(false);
    }
  };

  /* ---------------- RENDER ---------------- */

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Getting weather...</Text>
      </View>
    );
  }

  if (!weather || !weather.current_weather || !weather.daily || !weather.hourly) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Text style={styles.errorText}>No weather data available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocationWeather}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentInfo = getWeatherInfo(weather.current_weather.weathercode || 0);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Weather Forecast</Text>

          <TouchableOpacity onPress={getCurrentLocationWeather} style={styles.refreshButton}>
            <Text style={styles.refreshIcon}>📍</Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a city..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                fetchSuggestions(text);
              }}
              onSubmitEditing={searchLocation}
              returnKeyType="search"
              onBlur={() => setTimeout(() => setShowSuggestions(false), 500)}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={searchLocation}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.searchButtonText}>🔍</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* SUGGESTIONS DROPDOWN */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="always"
                style={styles.suggestionsScroll}
              >
                {suggestions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.suggestionItem}
                    onPress={() => selectSuggestion(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>
                      📍 {item.name}{item.country ? `, ${item.country}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* LOCATION */}
        {location && (
          <View style={styles.locationBar}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{location.name}</Text>
          </View>
        )}

        {/* MAIN WEATHER */}
        <View style={styles.mainWeather}>
          <Text style={styles.weatherIcon}>{currentInfo.icon}</Text>
          <Text style={styles.temp}>{Math.round(weather.current_weather.temperature)}°C</Text>
          <Text style={styles.condition}>{currentInfo.desc}</Text>
          <Text style={styles.feels}>
            Wind: {Math.round(weather.current_weather.windspeed)} km/h
          </Text>
        </View>

        {/* TODAY'S HIGH/LOW */}
        <View style={styles.todayRange}>
          <View style={styles.rangeItem}>
            <Text style={styles.rangeLabel}>High</Text>
            <Text style={styles.rangeValue}>
              {Math.round(weather.daily.temperature_2m_max?.[0] || 0)}°
            </Text>
          </View>
          <View style={styles.rangeDivider} />
          <View style={styles.rangeItem}>
            <Text style={styles.rangeLabel}>Low</Text>
            <Text style={styles.rangeValue}>
              {Math.round(weather.daily.temperature_2m_min?.[0] || 0)}°
            </Text>
          </View>
          <View style={styles.rangeDivider} />
          <View style={styles.rangeItem}>
            <Text style={styles.rangeLabel}>Rain</Text>
            <Text style={styles.rangeValue}>
              {weather.daily.precipitation_probability_max?.[0] || 0}%
            </Text>
          </View>
        </View>

        {/* HOURLY FORECAST */}
        <Text style={styles.sectionTitle}>Next 24 Hours</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll}>
          {weather.hourly?.time?.slice(0, 24).map((time, idx) => {
            const hour = new Date(time);
            const temp = Math.round(weather.hourly.temperature_2m?.[idx] || 0);

            return (
              <View key={idx} style={styles.hourlyCard}>
                <Text style={styles.hourlyTime}>
                  {idx === 0 ? 'Now' : hour.getHours() + ':00'}
                </Text>
                <Text style={styles.hourlyTemp}>{temp}°</Text>
              </View>
            );
          }) || []}
        </ScrollView>

        {/* 14-DAY FORECAST */}
        <Text style={styles.sectionTitle}>14-Day Forecast</Text>

        {weather.daily?.time?.map((date, idx) => {
          const day = new Date(date);
          const dayName = idx === 0
            ? 'Today'
            : idx === 1
              ? 'Tomorrow'
              : day.toLocaleDateString('en-US', { weekday: 'short' });
          const monthDay = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const weatherInfo = getWeatherInfo(weather.daily.weathercode?.[idx] || 0);

          return (
            <View key={idx} style={styles.dailyCard}>
              <View style={styles.dailyDateContainer}>
                <Text style={styles.dailyDay}>{dayName}</Text>
                <Text style={styles.dailyDate}>{monthDay}</Text>
              </View>

              <Text style={styles.dailyIcon}>{weatherInfo.icon}</Text>

              <View style={styles.dailyTemps}>
                <Text style={styles.dailyHigh}>
                  {Math.round(weather.daily.temperature_2m_max?.[idx] || 0)}°
                </Text>
                <Text style={styles.dailyLow}>
                  {Math.round(weather.daily.temperature_2m_min?.[idx] || 0)}°
                </Text>
              </View>

              <View style={styles.dailyRain}>
                <Text style={styles.dailyRainText}>
                  💧 {weather.daily.precipitation_probability_max?.[idx] || 0}%
                </Text>
              </View>
            </View>
          );
        }) || []}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B1220',
  },

  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 16,
  },

  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 20,
  },

  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 34,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backArrow: {
    color: '#FFF',
    fontSize: 24,
  },

  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginLeft: 16,
  },

  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },

  refreshIcon: {
    fontSize: 20,
  },

  searchWrapper: {
    marginBottom: 16,
    zIndex: 1000,
  },

  searchContainer: {
    flexDirection: 'row',
    gap: 10,
  },

  suggestionsContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    maxHeight: 200,
  },

  suggestionsScroll: {
    maxHeight: 200,
  },

  suggestionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },

  suggestionText: {
    color: '#CBD5E1',
    fontSize: 15,
  },

  searchInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },

  searchButton: {
    backgroundColor: '#3B82F6',
    width: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchButtonText: {
    fontSize: 22,
  },

  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },

  locationIcon: {
    fontSize: 18,
    marginRight: 8,
  },

  locationText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },

  mainWeather: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },

  weatherIcon: {
    fontSize: 72,
    marginBottom: 8,
  },

  temp: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 4,
  },

  condition: {
    color: '#CBD5E1',
    fontSize: 18,
    marginBottom: 4,
  },

  feels: {
    color: '#94A3B8',
    fontSize: 15,
  },

  todayRange: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    justifyContent: 'space-around',
  },

  rangeItem: {
    alignItems: 'center',
  },

  rangeLabel: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 8,
  },

  rangeValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
  },

  rangeDivider: {
    width: 1,
    backgroundColor: '#1E293B',
  },

  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 2,
  },

  hourlyScroll: {
    marginBottom: 16,
  },

  hourlyCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 70,
  },

  hourlyTime: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 8,
  },

  hourlyTemp: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },

  dailyCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dailyDateContainer: {
    width: 100,
  },

  dailyDay: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  dailyDate: {
    color: '#64748B',
    fontSize: 13,
  },

  dailyIcon: {
    fontSize: 32,
    width: 50,
    textAlign: 'center',
  },

  dailyTemps: {
    flexDirection: 'row',
    gap: 12,
    width: 80,
    justifyContent: 'flex-end',
  },

  dailyHigh: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  dailyLow: {
    color: '#64748B',
    fontSize: 16,
  },

  dailyRain: {
    width: 60,
    alignItems: 'flex-end',
  },

  dailyRainText: {
    color: '#3B82F6',
    fontSize: 13,
  },
});
