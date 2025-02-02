import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  StyleSheet 
} from 'react-native';
import { Car } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const CarTypeSelector = ({ userCarTypes, selectedType, onSelect }) => {
  const [activeType, setActiveType] = useState(null);
  const animatedValues = useRef(userCarTypes.map(() => ({
    scale: new Animated.Value(1),
    rotate: new Animated.Value(0),
    opacity: new Animated.Value(0.6)
  }))).current;

  const carTypeDetails = {
    eco: {
      name: 'Eco',
      colors: ['#10B981', '#6EE7B7'],
      shadowColor: '#10B981',
    },
    confort: {
      name: 'Confort', 
      colors: ['#3B82F6', '#93C5FD'],
      shadowColor: '#3B82F6',
    },
    luxe: {
      name: 'Luxe',
      colors: ['#8B5CF6', '#C4B5FD'],
      shadowColor: '#8B5CF6',
    }
  };

  const handlePress = (carType, index) => {
    onSelect(carType);
    setActiveType(carType);

    userCarTypes.forEach((_, i) => {
      Animated.parallel([
        Animated.spring(animatedValues[i].scale, {
          toValue: i === index ? 1.15 : 0.9,
          friction: 3,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.spring(animatedValues[i].rotate, {
          toValue: i === index ? 1 : 0,
          friction: 3,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.spring(animatedValues[i].opacity, {
          toValue: i === index ? 1 : 0.6,
          friction: 3,
          tension: 40,
          useNativeDriver: true
        })
      ]).start();
    });
  };

  return (
    <View style={styles.container}>
      {userCarTypes.map((carType, index) => {
        const normalizedType = carType.toLowerCase();
        const { name, colors, shadowColor } = carTypeDetails[normalizedType];
        const isSelected = activeType && activeType.toLowerCase() === normalizedType;

        const scaleAnim = animatedValues[index].scale;
        const rotateAnim = animatedValues[index].rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '-20deg']
        });
        const opacityAnim = animatedValues[index].opacity;

        return (
          <TouchableOpacity 
            key={normalizedType}
            onPress={() => handlePress(carType, index)}
            style={styles.cardWrapper}
          >
            <Animated.View 
              style={[
                styles.cardContainer,
                {
                  transform: [
                    { scale: scaleAnim },
                    { rotateX: rotateAnim }
                  ],
                  opacity: opacityAnim,
                  shadowColor
                }
              ]}
            >
              <BlurView intensity={50} style={StyleSheet.absoluteFill} />
              <View 
                style={[
                  styles.cardContent,
                  { 
                    backgroundColor: isSelected 
                      ? colors[0] 
                      : 'rgba(243, 244, 246, 0.8)' 
                  }
                ]}
              >
                <Car
                  size={40}
                  color={isSelected ? 'white' : '#6B7280'}
                  strokeWidth={isSelected ? 2 : 1.5}
                />
                <Text style={[
                  styles.cardText,
                  { color: isSelected ? 'white' : '#374151' }
                ]}>
                  {name}
                </Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  cardWrapper: {
    width: (width - 64) / 3,
  },
  cardContainer: {
    borderRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 10,
    overflow: 'hidden',
  },
  cardContent: {
    height: 90,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
  }
});

export default CarTypeSelector;