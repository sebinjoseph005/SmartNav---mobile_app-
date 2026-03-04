import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import SafeMapView from '../../components/SafeMapView';
import { Marker, Polyline } from 'react-native-maps';
import {
  ArrowLeft,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  X,
  Info,
  Navigation2,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';

export default function ActiveNavigation() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { destination, route: routeData, startLocation } = route.params || {};
  const mapRef = useRef<SafeMapView>(null);

  const [userLocation, setUserLocation] = useState<any>(startLocation || null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [remainingDistance, setRemainingDistance] = useState(routeData?.distance || 0);
  const [remainingTime, setRemainingTime] = useState(routeData?.duration || 0);
  const [distanceToNextStep, setDistanceToNextStep] = useState(0);
  const [hasArrived, setHasArrived] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Track which announcements have been made for each step
  const announcedWarnings = useRef<Set<string>>(new Set());
  const lastAnnouncedStep = useRef<number>(-1);

  const steps = routeData?.steps || [];
  const currentStep = steps[currentStepIndex];

  // Speak instruction with Text-to-Speech
  const speak = async (text: string) => {
    if (isMuted) return;

    try {
      // Stop any ongoing speech
      await Speech.stop();

      // Speak with clear voice
      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9, // Slightly slower for clarity
        voice: undefined, // Use system default
      });

      console.log('🔊 Voice:', text);
    } catch (error) {
      console.error('Speech error:', error);
    }
  };

  // Toggle mute/unmute
  const toggleMute = async () => {
    if (!isMuted) {
      // Muting - stop any ongoing speech
      await Speech.stop();
    } else {
      // Unmuting - announce current instruction
      if (currentStep) {
        const instruction = getVoiceInstruction(currentStep, distanceToNextStep);
        speak(instruction);
      }
    }
    setIsMuted(!isMuted);
  };

  // Get voice instruction for speaking
  const getVoiceInstruction = (step: any, distance: number) => {
    const maneuver = step?.maneuver;
    if (!maneuver) return 'Continue on route';

    const type = maneuver.type;
    const modifier = maneuver.modifier || '';
    const name = step.name || 'the road';

    // Format distance for voice
    let distanceText = '';
    if (distance < 1000) {
      distanceText = `in ${Math.round(distance / 10) * 10} meters`;
    } else {
      distanceText = `in ${(distance / 1000).toFixed(1)} kilometers`;
    }

    if (type === 'arrive') return `Arriving at ${destination?.name || 'your destination'}`;
    if (type === 'depart') return `Head ${modifier} on ${name}`;
    if (type === 'turn') return `${distanceText}, turn ${modifier} onto ${name}`;
    if (type === 'fork') return `${distanceText}, take the ${modifier} fork onto ${name}`;
    if (type === 'merge') return `${distanceText}, merge ${modifier}`;
    if (type === 'roundabout') return `${distanceText}, take the roundabout exit onto ${name}`;
    if (type === 'new name') return `Continue onto ${name}`;

    return `${distanceText}, continue on ${name}`;
  };

  // Announce navigation updates based on distance
  const announceIfNeeded = (stepIndex: number, distance: number) => {
    if (isMuted || !steps[stepIndex]) return;

    const step = steps[stepIndex];
    const stepKey = `step-${stepIndex}`;

    // Announce when step changes
    if (stepIndex !== lastAnnouncedStep.current) {
      lastAnnouncedStep.current = stepIndex;
      announcedWarnings.current.clear(); // Clear warnings for new step

      // Announce the new instruction
      const instruction = getVoiceInstruction(step, distance);
      speak(instruction);
      return;
    }

    // Early warning at 500m
    if (distance < 500 && distance > 400 && !announcedWarnings.current.has(`${stepKey}-500m`)) {
      announcedWarnings.current.add(`${stepKey}-500m`);
      speak(getVoiceInstruction(step, distance));
    }
    // Second warning at 200m
    else if (distance < 200 && distance > 150 && !announcedWarnings.current.has(`${stepKey}-200m`)) {
      announcedWarnings.current.add(`${stepKey}-200m`);
      speak(getVoiceInstruction(step, distance));
    }
    // Final warning at 50m
    else if (distance < 50 && !announcedWarnings.current.has(`${stepKey}-50m`)) {
      announcedWarnings.current.add(`${stepKey}-50m`);
      const maneuver = step?.maneuver;
      const type = maneuver?.type || '';
      const modifier = maneuver?.modifier || '';

      if (type === 'turn') {
        speak(`Turn ${modifier} now`);
      } else if (type === 'arrive') {
        speak('You have arrived at your destination');
      }
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  // Get direction icon based on maneuver type
  const getDirectionIcon = (maneuver: any) => {
    const type = maneuver?.type || 'straight';
    const modifier = maneuver?.modifier || '';

    if (type === 'arrive') return <Navigation2 size={32} color="#10B981" />;
    if (type === 'depart') return <ArrowUp size={32} color="#3B82F6" />;

    if (type === 'turn') {
      if (modifier.includes('right')) return <ArrowRight size={32} color="#3B82F6" />;
      if (modifier.includes('left')) return <ArrowLeft size={32} color="#3B82F6" />;
    }

    if (type === 'fork' || type === 'merge') {
      if (modifier.includes('right')) return <ArrowUpRight size={32} color="#3B82F6" />;
      if (modifier.includes('left')) return <ArrowUpLeft size={32} color="#3B82F6" />;
    }

    if (type === 'roundabout') return <ArrowRight size={32} color="#F59E0B" />;

    return <ArrowUp size={32} color="#3B82F6" />; // Default: continue straight
  };

  // Get instruction text
  const getInstructionText = (step: any) => {
    const maneuver = step?.maneuver;
    if (!maneuver) return 'Continue on route';

    const type = maneuver.type;
    const modifier = maneuver.modifier || '';
    const name = step.name || 'the road';

    if (type === 'arrive') return `Arrive at ${destination?.name || 'destination'}`;
    if (type === 'depart') return `Head ${modifier} on ${name}`;
    if (type === 'turn') return `Turn ${modifier} onto ${name}`;
    if (type === 'fork') return `Take ${modifier} fork onto ${name}`;
    if (type === 'merge') return `Merge ${modifier}`;
    if (type === 'roundabout') return `Take roundabout exit onto ${name}`;
    if (type === 'new name') return `Continue onto ${name}`;

    return `Continue on ${name}`;
  };

  // Update navigation state based on user location
  const updateNavigationState = (location: any) => {
    if (!location || !steps.length) return;

    const { latitude, longitude } = location;

    // Check if arrived at destination
    const distanceToDestination = calculateDistance(
      latitude,
      longitude,
      destination.coordinates.latitude,
      destination.coordinates.longitude
    );

    if (distanceToDestination < 50 && !hasArrived) {
      setHasArrived(true);
      speak('You have arrived at your destination!');
      Alert.alert(
        'Arrived! 🎉',
        `You have arrived at ${destination.name}`,
        [
          {
            text: 'End Navigation',
            onPress: () => navigation.navigate('MapMain'),
          },
        ]
      );
      return;
    }

    // Find current step based on proximity
    let closestStepIndex = currentStepIndex;
    let minDistance = Infinity;

    for (let i = currentStepIndex; i < steps.length; i++) {
      const step = steps[i];
      const stepLocation = step.maneuver?.location;
      if (!stepLocation) continue;

      const dist = calculateDistance(
        latitude,
        longitude,
        stepLocation[1], // OSRM returns [lon, lat]
        stepLocation[0]
      );

      // If we're within 30m of next step, advance to it
      if (i > currentStepIndex && dist < 30) {
        closestStepIndex = i;
        break;
      }
    }

    if (closestStepIndex !== currentStepIndex) {
      setCurrentStepIndex(closestStepIndex);
    }

    // Calculate distance to next maneuver
    if (steps[closestStepIndex]) {
      const nextManeuver = steps[closestStepIndex].maneuver?.location;
      if (nextManeuver) {
        const distToNext = calculateDistance(
          latitude,
          longitude,
          nextManeuver[1],
          nextManeuver[0]
        );
        setDistanceToNextStep(distToNext);

        // Announce navigation updates
        announceIfNeeded(closestStepIndex, distToNext);
      }
    }

    // Calculate remaining distance and time
    let totalRemaining = 0;
    for (let i = closestStepIndex; i < steps.length; i++) {
      totalRemaining += steps[i].distance || 0;
    }
    setRemainingDistance(totalRemaining);

    // Estimate remaining time (assuming average speed from total route)
    const avgSpeed = routeData.distance / routeData.duration; // meters per second
    setRemainingTime(totalRemaining / avgSpeed);
  };

  // Track user location in real-time
  useEffect(() => {
    let subscription: any;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed for navigation');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5, // Update every 5 meters
          timeInterval: 1000, // Or every second
        },
        (location) => {
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(newLocation);
          updateNavigationState(newLocation);

          // Center map on user location
          mapRef.current?.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }, 500);
        }
      );
    })();

    return () => {
      if (subscription) {
        subscription.remove();
      }
      // Stop any ongoing speech when component unmounts
      Speech.stop();
    };
  }, []); // Run once on mount, cleanup on unmount

  // Initial navigation announcement
  useEffect(() => {
    if (steps.length > 0 && currentStep) {
      setTimeout(() => {
        speak('Navigation started. Follow the directions.');
        setTimeout(() => {
          const instruction = getVoiceInstruction(currentStep, distanceToNextStep);
          speak(instruction);
        }, 2000);
      }, 1000);
    }

    // Cleanup speech on unmount
    return () => {
      Speech.stop();
    };
  }, []);

  // Format distance for display
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <View style={styles.container}>
      {/* MAP */}
      <SafeMapView
        ref={mapRef}
        style={styles.map}
        region={{
          latitude: userLocation?.latitude || destination?.coordinates?.latitude || 0,
          longitude: userLocation?.longitude || destination?.coordinates?.longitude || 0,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        showsUserLocation
        followsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        mapType="standard"
      >
        {/* Destination Marker */}
        {destination?.coordinates && (
          <Marker
            coordinate={destination.coordinates}
            title={destination.name}
            pinColor="#10B981"
          />
        )}

        {/* Route Polyline */}
        {routeData?.coordinates && (
          <Polyline
            coordinates={routeData.coordinates}
            strokeWidth={6}
            strokeColor="#3B82F6"
          />
        )}
      </SafeMapView>

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            Alert.alert(
              'End Navigation?',
              'Do you want to close the directions and return to the map?',
              [
                { text: 'Keep Navigating', style: 'cancel' },
                { text: 'End Navigation', onPress: () => navigation.navigate('MapMain'), style: 'destructive' },
              ]
            );
          }}
        >
          <X size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.topInfo}>
          <Text style={styles.topDistance}>
            {formatDistance(remainingDistance)}
          </Text>
          <Text style={styles.topTime}>
            {Math.round(remainingTime / 60)} min remaining
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.audioButton, isMuted && styles.audioButtonMuted]}
          onPress={toggleMute}
        >
          {isMuted ? (
            <VolumeX size={24} color="#EF4444" />
          ) : (
            <Volume2 size={24} color="#10B981" />
          )}
        </TouchableOpacity>
      </View>

      {/* INSTRUCTION CARD */}
      {currentStep && !hasArrived && (
        <View style={styles.instructionCard}>
          <View style={styles.instructionIcon}>
            {getDirectionIcon(currentStep.maneuver)}
          </View>
          <View style={styles.instructionText}>
            <Text style={styles.instructionDistance}>
              {distanceToNextStep < 1000
                ? `In ${Math.round(distanceToNextStep)} m`
                : `In ${(distanceToNextStep / 1000).toFixed(1)} km`
              }
            </Text>
            <Text style={styles.instructionAction}>
              {getInstructionText(currentStep)}
            </Text>
          </View>
        </View>
      )}

      {/* ARRIVAL MESSAGE */}
      {hasArrived && (
        <View style={styles.arrivalCard}>
          <Text style={styles.arrivalEmoji}>🎉</Text>
          <Text style={styles.arrivalText}>You have arrived!</Text>
          <Text style={styles.arrivalDest}>{destination?.name}</Text>
        </View>
      )}

      {/* BOTTOM CARD */}
      <View style={styles.bottomCard}>
        <View style={styles.destInfo}>
          <Text style={styles.destName}>{destination?.name || 'Destination'}</Text>
          <Text style={styles.destAddress}>
            {destination?.address || 'Navigating...'}
          </Text>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.max(0, Math.min(100, ((routeData?.distance - remainingDistance) / routeData?.distance) * 100))}%`
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Step {currentStepIndex + 1} of {steps.length}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.endButton}
          onPress={() => {
            Alert.alert(
              'End Navigation?',
              'Are you sure you want to stop navigation?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'End', onPress: () => navigation.navigate('MapMain'), style: 'destructive' },
              ]
            );
          }}
        >
          <Text style={styles.endButtonText}>End Navigation</Text>
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
  map: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    backgroundColor: '#DC2626',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#991B1B',
  },
  topInfo: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  topDistance: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  topTime: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  audioButton: {
    backgroundColor: '#111827',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  audioButtonMuted: {
    borderColor: '#EF4444',
    backgroundColor: '#1F1827',
  },
  instructionCard: {
    position: 'absolute',
    top: 130,
    left: 16,
    right: 16,
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  instructionIcon: {
    backgroundColor: '#0B1220',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E3A8A',
  },
  instructionText: {
    flex: 1,
  },
  instructionDistance: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '700',
  },
  instructionAction: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  arrivalCard: {
    position: 'absolute',
    top: 130,
    left: 16,
    right: 16,
    backgroundColor: '#10B981',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#059669',
  },
  arrivalEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  arrivalText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
  },
  arrivalDest: {
    color: '#D1FAE5',
    fontSize: 16,
    marginTop: 4,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  destInfo: {
    marginBottom: 16,
  },
  destName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  destAddress: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  progressText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 6,
  },
  endButton: {
    backgroundColor: '#DC2626',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
