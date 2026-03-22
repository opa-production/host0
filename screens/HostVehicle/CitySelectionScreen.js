import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../ui/tokens';

/** Kenyan cities where hosts can list — images from assets/images */
export const HOST_LISTING_CITIES = [
  {
    id: 'nairobi',
    name: 'Nairobi',
    subtitle: 'Capital & business hub',
    image: require('../../assets/images/nairobi.jpg'),
  },
  {
    id: 'mombasa',
    name: 'Mombasa',
    subtitle: 'Coast & beaches',
    image: require('../../assets/images/mombasa.jpg'),
  },
  {
    id: 'kisumu',
    name: 'Kisumu',
    subtitle: 'Lake Victoria',
    image: require('../../assets/images/kisumu.jpg'),
  },
  {
    id: 'nakuru',
    name: 'Nakuru',
    subtitle: 'Great Rift Valley',
    image: require('../../assets/images/nakuru.jpg'),
  },
];

export default function CitySelectionScreen({ onSelectCity, selectedCityId }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const horizontalPadding = SPACING.l * 2;
  const gap = 12;
  const cardWidth = (width - horizontalPadding - gap) / 2;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + SPACING.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.headline}>Where will you host?</Text>
      {/* <Text style={styles.subhead}>
        Choose the city your car will be listed in. You can set the exact pickup spot in a later step.
      </Text> */}

      <View style={styles.grid}>
        {HOST_LISTING_CITIES.map((city) => {
          const selected = selectedCityId === city.id;
          return (
            <TouchableOpacity
              key={city.id}
              activeOpacity={0.88}
              onPress={() => onSelectCity(city)}
              style={[styles.cardWrap, { width: cardWidth }]}
            >
              <ImageBackground
                source={city.image}
                style={[styles.card, selected && styles.cardSelected]}
                imageStyle={styles.cardImage}
              >
                <View style={styles.cardGradient} />
                <View style={styles.cardLabel}>
                  <Text style={styles.cityName}>{city.name}</Text>
                  <Text style={styles.citySubtitle}>{city.subtitle}</Text>
                </View>
                {selected && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>Selected</Text>
                  </View>
                )}
              </ImageBackground>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: SPACING.l,
    paddingTop: 8,
  },
  headline: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subhead: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
    lineHeight: 22,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  cardWrap: {
    marginBottom: 0,
  },
  card: {
    height: 168,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: COLORS.brand,
  },
  cardImage: {
    borderRadius: 14,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
  },
  cardLabel: {
    padding: 14,
    paddingBottom: 12,
  },
  cityName: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  citySubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255,255,255,0.92)',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectedBadgeText: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    color: '#FFFFFF',
  },
});
