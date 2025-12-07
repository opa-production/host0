import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HostScreen({ navigation }) {
  const handleHostVehicle = () => {
    // TODO: Navigate to host vehicle screen
    console.log('Host Vehicle pressed');
  };

  const handleHostService = () => {
    // TODO: Navigate to host service screen
    console.log('Host Service pressed');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Host</Text>
              <Text style={styles.subtitle}>Add cars and services</Text>
            </View>
            <TouchableOpacity
              style={styles.listButton}
              onPress={() => navigation.navigate('MyListings')}
              activeOpacity={1}
            >
              <Ionicons name="list-outline" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Host Vehicle Button */}
        <TouchableOpacity 
          style={styles.button}
          onPress={handleHostVehicle}
          activeOpacity={1}
        >
          <Ionicons name="car-outline" size={24} color="#666666" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Host a Vehicle</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#666666" />
        </TouchableOpacity>

        {/* Host Service Button */}
        <TouchableOpacity 
          style={styles.button}
          onPress={handleHostService}
          activeOpacity={1}
        >
          <Ionicons name="construct-outline" size={24} color="#666666" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Host a Service</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#666666" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 16,
  },
  buttonText: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
  },
});
