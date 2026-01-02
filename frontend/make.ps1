# Create directories
mkdir -p assets/images/onboarding
mkdir -p assets/images/icons
mkdir -p assets/images/logos
mkdir -p assets/images/placeholders
mkdir -p assets/fonts
mkdir -p src/navigation/StackNavigators
mkdir -p src/screens/auth
mkdir -p src/screens/home
mkdir -p src/screens/trip-planning
mkdir -p src/screens/navigation-maps
mkdir -p src/screens/safety-emergency
mkdir -p src/screens/offline
mkdir -p src/screens/community
mkdir -p src/screens/road-intelligence
mkdir -p src/screens/eco
mkdir -p src/screens/settings
mkdir -p src/components/common
mkdir -p src/components/maps
mkdir -p src/components/emergency
mkdir -p src/components/community
mkdir -p src/components/trip
mkdir -p src/components/analytics
mkdir -p src/components/sensors
mkdir -p src/services
mkdir -p src/context
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p src/styles/themes
mkdir -p src/styles/components
mkdir -p src/types
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/e2e

# Create files
new-item App.tsx -type file
new-item app.json -type file
new-item package.json -type file
new-item tsconfig.json -type file
new-item .env -type file
new-item .gitignore -type file

# Assets
new-item assets/images/onboarding/onboarding1.png -type file
new-item assets/images/onboarding/onboarding2.png -type file
new-item assets/images/onboarding/onboarding3.png -type file
new-item assets/images/icons/home-filled.png -type file
new-item assets/images/icons/home-outline.png -type file
new-item assets/images/icons/map-filled.png -type file
new-item assets/images/icons/map-outline.png -type file
new-item assets/images/icons/community-filled.png -type file
new-item assets/images/icons/community-outline.png -type file
new-item assets/images/icons/safety-filled.png -type file
new-item assets/images/icons/safety-outline.png -type file
new-item assets/images/icons/profile-filled.png -type file
new-item assets/images/icons/profile-outline.png -type file
new-item assets/images/icons/sos-red.png -type file
new-item assets/images/icons/sos-white.png -type file
new-item assets/images/logos/logo.png -type file
new-item assets/images/logos/logo-dark.png -type file
new-item assets/images/logos/app-icon.png -type file
new-item assets/images/placeholders/avatar-default.png -type file
new-item assets/images/placeholders/location-default.png -type file
new-item assets/fonts/Inter-Bold.ttf -type file
new-item assets/fonts/Inter-Regular.ttf -type file
new-item assets/fonts/Inter-Medium.ttf -type file

# Navigation
new-item src/navigation/AppNavigator.tsx -type file
new-item src/navigation/AuthNavigator.tsx -type file
new-item src/navigation/BottomTabNavigator.tsx -type file
new-item src/navigation/StackNavigators/HomeStack.tsx -type file
new-item src/navigation/StackNavigators/MapStack.tsx -type file
new-item src/navigation/StackNavigators/CommunityStack.tsx -type file
new-item src/navigation/StackNavigators/SafetyStack.tsx -type file
new-item src/navigation/StackNavigators/ProfileStack.tsx -type file

# Screens auth
new-item src/screens/auth/SplashScreen.tsx -type file
new-item src/screens/auth/OnboardingScreen.tsx -type file
new-item src/screens/auth/LoginSignupScreen.tsx -type file

# Screens home
new-item src/screens/home/HomeDashboard.tsx -type file
new-item src/screens/home/SafetyStatusDetails.tsx -type file
new-item src/screens/home/WeatherDetails.tsx -type file

# Screens trip-planning
new-item src/screens/trip-planning/TripPlannerInput.tsx -type file
new-item src/screens/trip-planning/AIItineraryLoading.tsx -type file
new-item src/screens/trip-planning/AIItineraryResult.tsx -type file
new-item src/screens/trip-planning/EditItinerary.tsx -type file
new-item src/screens/trip-planning/BudgetTracker.tsx -type file
new-item src/screens/trip-planning/ExpenseSplitter.tsx -type file

# Screens navigation-maps
new-item src/screens/navigation-maps/MainMapScreen.tsx -type file
new-item src/screens/navigation-maps/SearchResults.tsx -type file
new-item src/screens/navigation-maps/RouteSelection.tsx -type file
new-item src/screens/navigation-maps/ActiveNavigation.tsx -type file
new-item src/screens/navigation-maps/NavigationSettings.tsx -type file
new-item src/screens/navigation-maps/SavedPlaces.tsx -type file
new-item src/screens/navigation-maps/PlaceDetails.tsx -type file
new-item src/screens/navigation-maps/LocalGemsFilter.tsx -type file

# Screens safety-emergency
new-item src/screens/safety-emergency/SafetyDashboard.tsx -type file
new-item src/screens/safety-emergency/EmergencySOS.tsx -type file
new-item src/screens/safety-emergency/SafeHavenLocator.tsx -type file
new-item src/screens/safety-emergency/DisasterAlerts.tsx -type file
new-item src/screens/safety-emergency/RiskMap.tsx -type file
new-item src/screens/safety-emergency/RiskReport.tsx -type file
new-item src/screens/safety-emergency/EmergencyContacts.tsx -type file
new-item src/screens/safety-emergency/SOSHistory.tsx -type file

# Screens offline
new-item src/screens/offline/OfflineModeDashboard.tsx -type file
new-item src/screens/offline/OfflineMapsDownload.tsx -type file
new-item src/screens/offline/ConnectivityPredictor.tsx -type file

# Screens community
new-item src/screens/community/CommunityFeed.tsx -type file
new-item src/screens/community/BlogDetail.tsx -type file
new-item src/screens/community/CreateBlog.tsx -type file
new-item src/screens/community/UserProfilePublic.tsx -type file

# Screens road-intelligence
new-item src/screens/road-intelligence/RoadQualityDashboard.tsx -type file
new-item src/screens/road-intelligence/CrowdComfortIntelligence.tsx -type file

# Screens eco
new-item src/screens/eco/CarbonFootprintDashboard.tsx -type file

# Screens settings
new-item src/screens/settings/SettingsScreen.tsx -type file

# Components common
new-item src/components/common/Button.tsx -type file
new-item src/components/common/Input.tsx -type file
new-item src/components/common/Card.tsx -type file
new-item src/components/common/BottomNavigation.tsx -type file
new-item src/components/common/FloatingSOSButton.tsx -type file
new-item src/components/common/OfflineIndicator.tsx -type file
new-item src/components/common/SafetyStatusIndicator.tsx -type file
new-item src/components/common/WeatherAlertBanner.tsx -type file
new-item src/components/common/LoadingSpinner.tsx -type file
new-item src/components/common/EmptyState.tsx -type file
new-item src/components/common/ErrorState.tsx -type file
new-item src/components/common/Modal.tsx -type file
new-item src/components/common/BottomSheet.tsx -type file
new-item src/components/common/Header.tsx -type file
new-item src/components/common/SearchBar.tsx -type file
new-item src/components/common/FilterChips.tsx -type file
new-item src/components/common/Tag.tsx -type file
new-item src/components/common/Badge.tsx -type file
new-item src/components/common/Avatar.tsx -type file
new-item src/components/common/Rating.tsx -type file
new-item src/components/common/ProgressBar.tsx -type file
new-item src/components/common/Toggle.tsx -type file
new-item src/components/common/Slider.tsx -type file
new-item src/components/common/DatePicker.tsx -type file
new-item src/components/common/TimePicker.tsx -type file
new-item src/components/common/Picker.tsx -type file
new-item src/components/common/ImagePicker.tsx -type file
new-item src/components/common/FileUpload.tsx -type file

# Components maps
new-item src/components/maps/MapView.tsx -type file
new-item src/components/maps/RoutePolyline.tsx -type file
new-item src/components/maps/SafetyPins.tsx -type file
new-item src/components/maps/HeatmapOverlay.tsx -type file
new-item src/components/maps/LocationMarker.tsx -type file
new-item src/components/maps/DirectionArrows.tsx -type file
new-item src/components/maps/MapControls.tsx -type file
new-item src/components/maps/MapLegend.tsx -type file
new-item src/components/maps/MapFilters.tsx -type file
new-item src/components/maps/MapSearch.tsx -type file
new-item src/components/maps/MapZoomControls.tsx -type file
new-item src/components/maps/RouteInfoCard.tsx -type file
new-item src/components/maps/NavigationHeader.tsx -type file

# Components emergency
new-item src/components/emergency/SOSCountdown.tsx -type file
new-item src/components/emergency/SafeHavenArrows.tsx -type file
new-item src/components/emergency/EmergencyContactCard.tsx -type file
new-item src/components/emergency/SOSButtonLarge.tsx -type file
new-item src/components/emergency/AlertCard.tsx -type file
new-item src/components/emergency/DisasterAlertBanner.tsx -type file
new-item src/components/emergency/RiskReportForm.tsx -type file
new-item src/components/emergency/EmergencyInstructions.tsx -type file
new-item src/components/emergency/index.ts -type file

# Components community
new-item src/components/community/BlogCard.tsx -type file
new-item src/components/community/SafetyTag.tsx -type file
new-item src/components/community/LocalVerificationBadge.tsx -type file
new-item src/components/community/UserCredibilityIndicator.tsx -type file
new-item src/components/community/CommentSection.tsx -type file
new-item src/components/community/LikeButton.tsx -type file
new-item src/components/community/ShareButton.tsx -type file
new-item src/components/community/ReportButton.tsx -type file
new-item src/components/community/BlogEditor.tsx -type file
new-item src/components/community/ImageGallery.tsx -type file
new-item src/components/community/index.ts -type file

# Components trip
new-item src/components/trip/ItineraryDayCard.tsx -type file
new-item src/components/trip/ActivityCard.tsx -type file
new-item src/components/trip/BudgetCard.tsx -type file
new-item src/components/trip/ExpenseItem.tsx -type file
new-item src/components/trip/SplitSelector.tsx -type file
new-item src/components/trip/TripTimeline.tsx -type file
new-item src/components/trip/InterestTags.tsx -type file
new-item src/components/trip/index.ts -type file

# Components analytics
new-item src/components/analytics/CarbonFootprintChart.tsx -type file
new-item src/components/analytics/SafetyScoreChart.tsx -type file
new-item src/components/analytics/CrowdChart.tsx -type file
new-item src/components/analytics/ProgressChart.tsx -type file
new-item src/components/analytics/StatsCard.tsx -type file
new-item src/components/analytics/index.ts -type file

# Components sensors
new-item src/components/sensors/AccelerometerGraph.tsx -type file
new-item src/components/sensors/SensorStatus.tsx -type file
new-item src/components/sensors/PotholeDetector.tsx -type file
new-item src/components/sensors/index.ts -type file

# Services
new-item src/services/api.ts -type file
new-item src/services/auth.ts -type file
new-item src/services/mapService.ts -type file
new-item src/services/offlineMeshService.ts -type file
new-item src/services/safetyService.ts -type file
new-item src/services/communityService.ts -type file
new-item src/services/tripService.ts -type file
new-item src/services/roadIntelligenceService.ts -type file
new-item src/services/ecoService.ts -type file
new-item src/services/locationService.ts -type file
new-item src/services/notificationService.ts -type file
new-item src/services/storageService.ts -type file
new-item src/services/sensorService.ts -type file
new-item src/services/aiService.ts -type file
new-item src/services/weatherService.ts -type file
new-item src/services/disasterService.ts -type file
new-item src/services/emergencyService.ts -type file
new-item src/services/bluetoothService.ts -type file
new-item src/services/wifiDirectService.ts -type file
new-item src/services/fileService.ts -type file
new-item src/services/index.ts -type file

# Context
new-item src/context/AuthContext.tsx -type file
new-item src/context/NavigationContext.tsx -type file
new-item src/context/SafetyContext.tsx -type file
new-item src/context/OfflineContext.tsx -type file
new-item src/context/ThemeContext.tsx -type file
new-item src/context/LocationContext.tsx -type file
new-item src/context/MapContext.tsx -type file
new-item src/context/EmergencyContext.tsx -type file
new-item src/context/CommunityContext.tsx -type file
new-item src/context/TripContext.tsx -type file
new-item src/context/SensorContext.tsx -type file
new-item src/context/index.ts -type file

# Hooks
new-item src/hooks/useAuth.ts -type file
new-item src/hooks/useLocation.ts -type file
new-item src/hooks/useOfflineMessaging.ts -type file
new-item src/hooks/usePotholeDetection.ts -type file
new-item src/hooks/useSafetyStatus.ts -type file
new-item src/hooks/useWeatherAlerts.ts -type file
new-item src/hooks/useDisasterAlerts.ts -type file
new-item src/hooks/useMeshNetwork.ts -type file
new-item src/hooks/useRouteNavigation.ts -type file
new-item src/hooks/useAccelerometer.ts -type file
new-item src/hooks/useBluetooth.ts -type file
new-item src/hooks/usePermissions.ts -type file
new-item src/hooks/useDebounce.ts -type file
new-item src/hooks/useLocalSearch.ts -type file
new-item src/hooks/useOnlineStatus.ts -type file
new-item src/hooks/useBatteryStatus.ts -type file
new-item src/hooks/useNetworkInfo.ts -type file
new-item src/hooks/useAppState.ts -type file
new-item src/hooks/useBackHandler.ts -type file
new-item src/hooks/useKeyboard.ts -type file
new-item src/hooks/useOrientation.ts -type file
new-item src/hooks/useVibration.ts -type file
new-item src/hooks/useSound.ts -type file
new-item src/hooks/useBiometrics.ts -type file
new-item src/hooks/useStorage.ts -type file
new-item src/hooks/useForm.ts -type file
new-item src/hooks/index.ts -type file

# Utils
new-item src/utils/constants.ts -type file
new-item src/utils/helpers.ts -type file
new-item src/utils/validation.ts -type file
new-item src/utils/storage.ts -type file
new-item src/utils/meshProtocol.ts -type file
new-item src/utils/accessibility.ts -type file
new-item src/utils/formatters.ts -type file
new-item src/utils/calculations.ts -type file
new-item src/utils/validators.ts -type file
new-item src/utils/algorithms.ts -type file
new-item src/utils/security.ts -type file
new-item src/utils/colors.ts -type file
new-item src/utils/dateTime.ts -type file
new-item src/utils/distance.ts -type file
new-item src/utils/safetyScore.ts -type file
new-item src/utils/carbonCalculator.ts -type file
new-item src/utils/expenseSplitter.ts -type file
new-item src/utils/routeOptimizer.ts -type file
new-item src/utils/potholeDetector.ts -type file
new-item src/utils/crowdEstimator.ts -type file
new-item src/utils/emergencyUtils.ts -type file
new-item src/utils/notificationUtils.ts -type file
new-item src/utils/fileUtils.ts -type file
new-item src/utils/imageUtils.ts -type file
new-item src/utils/permissionUtils.ts -type file
new-item src/utils/platformUtils.ts -type file
new-item src/utils/index.ts -type file

# Styles
new-item src/styles/global.ts -type file
new-item src/styles/colors.ts -type file
new-item src/styles/typography.ts -type file
new-item src/styles/spacing.ts -type file
new-item src/styles/shadows.ts -type file
new-item src/styles/borders.ts -type file
new-item src/styles/animations.ts -type file
new-item src/styles/themes/light.ts -type file
new-item src/styles/themes/dark.ts -type file
new-item src/styles/themes/highContrast.ts -type file
new-item src/styles/themes/elderly.ts -type file
new-item src/styles/themes/index.ts -type file
new-item src/styles/components/buttonStyles.ts -type file
new-item src/styles/components/inputStyles.ts -type file
new-item src/styles/components/cardStyles.ts -type file
new-item src/styles/components/mapStyles.ts -type file
new-item src/styles/components/emergencyStyles.ts -type file
new-item src/styles/components/index.ts -type file
new-item src/styles/index.ts -type file

# Types
new-item src/types/navigation.types.ts -type file
new-item src/types/safety.types.ts -type file
new-item src/types/map.types.ts -type file
new-item src/types/community.types.ts -type file
new-item src/types/user.types.ts -type file
new-item src/types/trip.types.ts -type file
new-item src/types/emergency.types.ts -type file
new-item src/types/offline.types.ts -type file
new-item src/types/sensor.types.ts -type file
new-item src/types/api.types.ts -type file
new-item src/types/service.types.ts -type file
new-item src/types/component.types.ts -type file
new-item src/types/index.ts -type file

# Tests
new-item tests/unit/.gitkeep -type file
new-item tests/integration/.gitkeep -type file
new-item tests/e2e/.gitkeep -type file
