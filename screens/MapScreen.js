import React from 'react';
import { StyleSheet, View, TouchableOpacity, StatusBar, Text, PermissionsAndroid, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

let MapView = null;
try {
  MapView = require('react-native-maps').default;
} catch (_) {
  // react-native-maps not available (e.g. Expo Go, web)
}

export default function MapScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [mapError, setMapError] = React.useState(null);
  const [locationGranted, setLocationGranted] = React.useState(false);

  React.useEffect(() => {
    const request = async () => {
      try {
        if (Platform.OS !== 'android') {
          setLocationGranted(true);
          return;
        }
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        setLocationGranted(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (e) {
        setLocationGranted(false);
      }
    };
    request();
  }, []);

  // Default location: Nakuru, Kenya
  const defaultRegion = {
    latitude: -0.3031,
    longitude: 36.0800,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const title = route?.params?.title;
  const plate = route?.params?.plate;
  const initialRegion = route?.params?.initialRegion ?? defaultRegion;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 16 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={1}
      >
        <Ionicons name="arrow-back" size={24} color="#000000" />
      </TouchableOpacity>

      {(title || plate) && (
        <View style={[styles.infoPill, { top: insets.top + 16 }]}>
          <Text style={styles.infoTitle} numberOfLines={1}>
            {title || 'Vehicle'}
          </Text>
          {!!plate && <Text style={styles.infoSub}>{plate}</Text>}
        </View>
      )}

      {/* Map */}
      {!MapView || mapError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="map-outline" size={48} color="#C7C7CC" style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>
            {!MapView ? 'Maps require a development build.' : 'Map unavailable'}
          </Text>
          <Text style={styles.errorSubtext}>
            {!MapView ? 'Use a dev build or open in a browser for full features.' : 'Please try again later.'}
          </Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={locationGranted}
          showsMyLocationButton={locationGranted}
          mapType="standard"
          onMapReady={() => setMapError(null)}
          onError={(error) => {
            console.log('Map error:', error);
            setMapError('Map failed to load');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  map: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoPill: {
    position: 'absolute',
    left: 76,
    right: 16,
    zIndex: 10,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  infoSub: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  errorSubtext: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
});
