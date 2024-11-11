import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';
import { colors } from "../global/style";

const Conciergerie = () => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nature, setNature] = useState('');

  // Fonction pour gérer la confirmation de la date
  const handleConfirm = (selectedDate) => {
    setDate(selectedDate); // Met à jour la date
    setShowDatePicker(false); // Ferme le picker après la sélection
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Réservation de Conciergerie</Text>
      
      {/* Champ Nature */}
      <Text style={styles.label}>Nature:</Text>
      <Picker
        selectedValue={nature}
        style={styles.input}
        onValueChange={(itemValue) => setNature(itemValue)}
      >
        <Picker.Item label="Choisissez la nature" value="" />
        <Picker.Item label="VIDANGE" value="option1" />
        <Picker.Item label="REPARATION" value="option2" />
      </Picker>

      {/* Champ de DateTime Picker pour la date de départ */}
      <Text style={styles.label}>Départ:</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
        <Text style={styles.dateText}>{date.toLocaleString()}</Text>
      </TouchableOpacity>

      {/* Modal DateTimePicker */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="datetime"
        onConfirm={handleConfirm}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Champ Destination */}
      <Text style={styles.label}>Destination:</Text>
      <TextInput
        style={styles.input}
        placeholder="Entrez la destination"
        placeholderTextColor="#888"
      />

      {/* Bouton pour réserver maintenant */}
      <TouchableOpacity style={styles.buttonBlue}>
        <Text style={styles.buttonText}>Réserver maintenant</Text>
      </TouchableOpacity>

      {/* Bouton pour réserver pour plus tard */}
      <TouchableOpacity style={styles.buttonBlack}>
        <Text style={styles.buttonText}>Réserver pour plus tard</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Conciergerie;

// Définition des styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
   
    top:'8%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    color: '#333',
  },
  dateInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  dateText: {
    color: '#333',
    fontSize: 16,
  },
  buttonBlue: {
    backgroundColor: colors.blue, // Bleu pour "Réserver maintenant"
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonBlack: {
    backgroundColor: colors.black, // Noir pour "Plus tard"
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    top:10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
