import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_WIDTH - 48) / 3; // 3 columns with padding

export default function CarGalleryScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { carId, carName } = route.params || {};

  // Mock images - TODO: Replace with actual API data
  const carImages = [
    require('../assets/images/bmw.jpg'),
    require('../assets/images/bm.jpg'),
    require('../assets/images/deon.jpg'),
    require('../assets/images/jeep.jpg'),
    require('../assets/images/bmw.jpg'),
    require('../assets/images/bm.jpg'),
    require('../assets/images/deon.jpg'),
    require('../assets/images/jeep.jpg'),
    require('../assets/images/bmw.jpg'),
  ];

  const [selectedImage, setSelectedImage] = useState(null);

  const renderImage = ({ item, index }) => (
    <TouchableOpacity
      style={styles.imageItem}
      onPress={() => setSelectedImage(index)}
      activeOpacity={1}
    >
      <Image source={item} style={styles.galleryImage} resizeMode="cover" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={1}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Image Repository</Text>
          <Text style={styles.headerSubtitle}>{carName || 'Car Gallery'}</Text>
        </View>
      </View>

      {/* Gallery Grid */}
      <FlatList
        data={carImages}
        renderItem={renderImage}
        keyExtractor={(item, index) => `image-${index}`}
        numColumns={3}
        contentContainerStyle={[styles.galleryContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.infoSection}>
            <Text style={styles.imageCount}>{carImages.length} images</Text>
          </View>
        }
      />

      {/* Full Screen Image Modal */}
      {selectedImage !== null && (
        <View style={styles.fullScreenModal}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedImage(null)}
            activeOpacity={1}
          >
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
          
          <Image
            source={carImages[selectedImage]}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
          
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {selectedImage + 1} / {carImages.length}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  infoSection: {
    padding: 24,
    paddingBottom: 16,
  },
  imageCount: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  galleryContainer: {
    padding: 16,
  },
  imageItem: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  fullScreenModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 1000,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1001,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  imageCounterText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
});

