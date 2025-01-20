import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { colors } from '../global/style';

const CarTypeSelector = ({ userCarTypes, selectedType, onSelect }) => {
  // Configuration des types de voitures avec leurs détails
  const carTypeDetails = {
    eco: {
      name: 'Eco',
      price: '1500F/km',
      image: require('../../assets/eco-car.png'),
      description: 'Économique et efficace',
    },
    confort: {
      name: 'Confort',
      price: '2500F/km',
      image: require('../../assets/comfort-car.png'),
      description: 'Plus d\'espace et de confort',
    },
    luxe: {
      name: 'Luxe',
      price: '3000F/km',
      image: require('../../assets/luxury-car.png'),
      description: 'Expérience premium',
    }
  };

  // Si aucun type de voiture n'est disponible
  if (!userCarTypes || userCarTypes.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Aucun véhicule enregistré</Text>
      </View>
    );
  }

  // Si l'utilisateur n'a qu'une seule voiture
  if (userCarTypes.length === 1) {
    const carType = userCarTypes[0].toLowerCase();
    const carDetails = carTypeDetails[carType];
    
    return (
      <View style={styles.singleCarContainer}>
        <View style={[styles.carCard, styles.carCardSelected]}>
          <View style={styles.carImageContainer}>
            <Image 
              source={carDetails.image}
              style={styles.carImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.carInfo}>
            <Text style={styles.carTypeName}>{carDetails.name}</Text>
            
          </View>
        </View>
      </View>
    );
  }

  // Si l'utilisateur a plusieurs voitures
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carTypesContainer}
    >
      {userCarTypes.map((carType) => {
        const normalizedType = carType.toLowerCase();
        const carDetails = carTypeDetails[normalizedType];
        if (!carDetails) return null;
        
        const isSelected = selectedType && selectedType.toLowerCase() === normalizedType;
        
        return (
          <TouchableOpacity
            key={normalizedType}
            style={[
              styles.carCard,
              isSelected && styles.carCardSelected
            ]}
            onPress={() => onSelect(carType)}
          >
            <View style={styles.carImageContainer}>
              <Image 
                source={carDetails.image}
                style={styles.carImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.carInfo}>
              <Text style={[
                styles.carTypeName,
                isSelected && styles.carTypeNameSelected
              ]}>
                {carDetails.name}
              </Text>
             
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    marginVertical: 10,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    fontSize: 14,
  },
  singleCarContainer: {
    padding: 16,
  },
  carTypesContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  carCard: {
    width: 200,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  carCardSelected: {
    borderColor: colors.blue,
    backgroundColor: '#F0F9FF',
  },
  carImageContainer: {
    height: 100,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  carInfo: {
    gap: 4,
  },
  carTypeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  carTypeNameSelected: {
    color: colors.blue,
  },
  carTypeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  carTypePrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  carTypePriceSelected: {
    color: colors.blue,
  }
});

export default CarTypeSelector;