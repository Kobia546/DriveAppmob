import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { colors } from "../global/style";

const Parking = () => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fonction pour mettre à jour la date de départ
  const handleConfirm = (selectedDate) => {
    setDate(selectedDate); // Met à jour la date
    setShowDatePicker(false); // Ferme le picker après la sélection
  };

  // Ouvre le DateTimePicker
  const showPicker = () => {
    setShowDatePicker(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Réservation de Parking</Text>

      {/* Champ de DateTime Picker pour la date de départ */}
      <Text style={styles.label}>Départ:</Text>
      <TouchableOpacity onPress={showPicker} style={styles.dateInput}>
        <Text style={styles.dateText}>{date.toLocaleString()}</Text>
      </TouchableOpacity>

      {/* Modal DateTimePicker */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="datetime"
        onConfirm={handleConfirm}
        onCancel={() => setShowDatePicker(false)}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      />

      {/* Bouton pour réserver */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Réserver maintenant</Text>
      </TouchableOpacity>

      {/* Note de prix */}
      <Text style={styles.note}>1000 FCFA / heure et 500 FCFA pour le service</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
   
    top:'8%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    top:'2%',
     // Couleur conservée
    textAlign: 'center',
  },
  label: {
    fontSize: 18,
    marginVertical: 10,
    color: '#333',
    textAlign: 'left',
  },
  dateInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: colors.blue,  // Bleu pour "Réserver maintenant"
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    marginTop: 20,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
});

export default Parking;
