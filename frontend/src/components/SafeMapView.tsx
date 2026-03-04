import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';
import { MapPin } from 'lucide-react-native';

// Error Boundary that catches MapView crashes
class MapErrorBoundary extends Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: any, info: any) {
        console.error('MapView crashed:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <View style={fallbackStyles.container}>
                        <MapPin size={40} color="#3B82F6" />
                        <Text style={fallbackStyles.title}>Map Unavailable</Text>
                        <Text style={fallbackStyles.subtitle}>
                            The map couldn't load on this device.{'\n'}
                            Other features still work normally.
                        </Text>
                    </View>
                )
            );
        }
        return this.props.children;
    }
}

// Wrapper that exports SafeMapView as a drop-in replacement for MapView
const SafeMapView = React.forwardRef((props: any, ref: any) => (
    <MapErrorBoundary>
        <MapView ref={ref} {...props} />
    </MapErrorBoundary>
));

SafeMapView.displayName = 'SafeMapView';

export { MapErrorBoundary };
export default SafeMapView;

const fallbackStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    title: {
        color: '#F1F5F9',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
        textAlign: 'center',
    },
    subtitle: {
        color: '#64748B',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
});
