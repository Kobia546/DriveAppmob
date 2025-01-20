import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Image } from 'react-native';
import { colors } from '../global/style';
import DateTimePicker from '@react-native-community/datetimepicker';
import CarTypeSelector from './CarTypeSelector';

export default class ModernBottomSheet extends React.Component {
  render() {
    const {
      distance,
      travelTime,
      price,
      isRoundTrip,
      carType,
      isReserveLater,
      departureDate,
      returnDate,
      onCarTypeChange,
      onToggleRoundTrip,
      onToggleReserveLater,
      userCarTypes,  // Reçu comme prop
      onContinue,
      onDepartureDatePress,
      onReturnDatePress,
      showDepartureDatePicker,
      showReturnDatePicker,
      onDepartureDateChange,
      onReturnDateChange
    } = this.props;

    return (
      <View style={styles.container}>
        <View style={styles.indicatorContainer}>
          <View style={styles.indicator} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Détails du trajet</Text>
          </View>

          {/* Car Type Display */}
          <CarTypeSelector 
            userCarTypes={userCarTypes}
            selectedType={carType}
            onSelect={onCarTypeChange}
          />

          {/* Trip Type Toggle */}
          <View style={styles.tripTypeContainer}>
            <TouchableOpacity
              style={[
                styles.tripTypeButton,
                !isRoundTrip && styles.tripTypeButtonActive
              ]}
              onPress={() => onToggleRoundTrip(false)}
            >
              <Text style={[
                styles.tripTypeText,
                !isRoundTrip && styles.tripTypeTextActive
              ]}>
                Aller simple
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tripTypeButton,
                isRoundTrip && styles.tripTypeButtonActive
              ]}
              onPress={() => onToggleRoundTrip(true)}
            >
              <Text style={[
                styles.tripTypeText,
                isRoundTrip && styles.tripTypeTextActive
              ]}>
                Aller-retour
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{distance.toFixed(2)} km</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Durée</Text>
              <Text style={styles.statValue}>{travelTime}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Prix Total</Text>
              <Text style={[styles.statValue, styles.priceValue]}>{price.toFixed(0)}F</Text>
            </View>
          </View>

          {/* Date Selection */}
          {isReserveLater && (
            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={onDepartureDatePress}
              >
                <Text style={styles.dateLabel}>Date de départ</Text>
                <Text style={styles.dateValue}>
                  {departureDate ? departureDate.toLocaleDateString() : 'Sélectionner'}
                </Text>
              </TouchableOpacity>

              {isRoundTrip && (
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={onReturnDatePress}
                >
                  <Text style={styles.dateLabel}>Date de retour</Text>
                  <Text style={styles.dateValue}>
                    {returnDate ? returnDate.toLocaleDateString() : 'Sélectionner'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
            <Text style={styles.continueButtonText}>Continuer</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.reserveLaterButton} 
            onPress={onToggleReserveLater}
          >
            <Text style={styles.reserveLaterButtonText}>
              {isReserveLater ? 'Réserver maintenant' : 'Réserver plus tard'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Date Pickers */}
        {showDepartureDatePicker && (
          <DateTimePicker
            value={departureDate || new Date()}
            mode="date"
            display="default"
            onChange={onDepartureDateChange}
          />
        )}
        
        {showReturnDatePicker && (
          <DateTimePicker
            value={returnDate || new Date()}
            mode="date"
            display="default"
            onChange={onReturnDateChange}
          />
        )}
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: '80%',
  },
  indicatorContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  carTypesContainer: {
    paddingVertical: 10,
  },
  carTypeCard: {
    width: 200,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  carTypeCardSelected: {
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
  },
  tripTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginVertical: 20,
  },
  tripTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tripTypeButtonActive: {
    backgroundColor: colors.blue,
  },
  tripTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tripTypeTextActive: {
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  priceValue: {
    color: colors.blue,
    fontSize: 18,
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateButton: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  continueButton: {
    backgroundColor: colors.blue,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reserveLaterButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  reserveLaterButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  }
});