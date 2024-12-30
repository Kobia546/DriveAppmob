import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function SearchingBottomSheet({ origin, destination, isVisible }) {
  const translateY = React.useRef(new Animated.Value(100)).current;
  const animation = React.useRef(null);

  React.useEffect(() => {
    if (isVisible) {
      // Démarrer l'animation
      animation.current = Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4
      });
      animation.current.start();
    } else {
      // Reset l'animation
      translateY.setValue(100);
    }

    // Cleanup function pour arrêter l'animation lors du démontage
    return () => {
      if (animation.current) {
        animation.current.stop();
      }
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY }]
        }
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>ÇA ROULE...</Text>
        <Text style={styles.subtitle}>On recherche un chauffeur </Text>
        
        <View style={styles.locationContainer}>
          <View style={styles.locationItem}>
            <View style={styles.dot} />
            <Text 
              numberOfLines={1} 
              style={styles.locationText}
            >
              {origin || 'Point de départ'}
            </Text>
          </View>

          <View style={styles.locationItem}>
            <View style={[styles.dot, styles.destinationDot]} />
            <Text 
              numberOfLines={1}
              style={styles.locationText}
            >
              {destination || 'Destination'}
            </Text>
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar}>
            <Animated.View 
              style={[
                styles.loadingProgress,
                {
                  width: '100%'
                }
              ]} 
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  content: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF1B6B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  locationContainer: {
    marginTop: 16,
    gap: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4285F4',
  },
  destinationDot: {
    backgroundColor: '#FF1B6B',
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  loadingContainer: {
    marginTop: 24,
  },
  loadingBar: {
    height: 4,
    backgroundColor: '#E8E8E8',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '50%',
    backgroundColor: '#FF1B6B',
  },
});