import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Icon } from 'react-native-elements';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const VehicleInspectionChecklist = ({ orderId, isDriver, onComplete }) => {
  const [checklist, setChecklist] = useState({
    water: false,
    oil: false,
    windows: false,
    bodywork: false,
    fuel: false,
    papers: false
  });

  const [previousInspection, setPreviousInspection] = useState(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Liste des éléments avec indication de leur caractère obligatoire
  const checklistItems = [
    { key: 'oil', label: 'Niveau d\'huile', icon: 'oil', required: true },
    { key: 'fuel', label: 'Niveau de carburant', icon: 'gas-station', required: true },
    { key: 'papers', label: 'Documents du véhicule', icon: 'file-document', required: true },
    { key: 'water', label: 'Niveau d\'eau', icon: 'water', required: false },
    { key: 'windows', label: 'État des vitres', icon: 'car-door', required: false },
    { key: 'bodywork', label: 'État de la carrosserie', icon: 'car', required: false }
  ];

  useEffect(() => {
    if (!isDriver) {
      loadPreviousInspection();
    }
  }, [orderId, isDriver]);

  const loadPreviousInspection = async () => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      if (orderDoc.exists()) {
        const data = orderDoc.data();
        if (data.pickupInspection?.checklist) {
          setPreviousInspection(data.pickupInspection);
          setChecklist(data.pickupInspection.checklist);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'inspection initiale:', error);
    }
  };

  const handleToggleItem = (key) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Vérifier uniquement les éléments obligatoires
  const isRequiredChecked = () => {
    return checklistItems
      .filter(item => item.required)
      .every(item => checklist[item.key] === true);
  };

  const handleSubmitInspection = async () => {
    if (!isRequiredChecked()) {
      alert('Veuillez vérifier tous les éléments obligatoires avant de continuer');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const inspectionData = {
        checklist,
        timestamp: new Date(),
        inspectedBy: isDriver ? 'driver' : 'client',
        notes
      };

      await updateDoc(orderRef, {
        [`${isDriver ? 'pickupInspection' : 'returnInspection'}`]: inspectionData
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'inspection:', error);
      alert('Une erreur est survenue lors de l\'enregistrement de l\'inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItemStatus = (item) => {
    if (!isDriver && previousInspection) {
      const hasChanged = previousInspection.checklist[item.key] !== checklist[item.key];
      return (
        <View style={styles.statusContainer}>
          <Icon
            type="material-community"
            name={checklist[item.key] ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={24}
            color={checklist[item.key] ? '#fff' : '#666'}
          />
          {hasChanged && <Text style={styles.changedText}>Modifié</Text>}
        </View>
      );
    }

    return (
      <Icon
        type="material-community"
        name={checklist[item.key] ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
        size={24}
        color={checklist[item.key] ? '#fff' : '#666'}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isDriver ? 'Contrôle de la voiture avant départ' : 'Vérification après utilisation'}
      </Text>
      
      <ScrollView style={styles.checklistContainer}>
        {checklistItems.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.checklistItem,
              checklist[item.key] && styles.checklistItemChecked
            ]}
            onPress={() => handleToggleItem(item.key)}
          >
            <Icon
              type="material-community"
              name={item.icon}
              size={24}
              color={checklist[item.key] ? '#fff' : '#666'}
            />
            <View style={styles.labelContainer}>
              <Text style={[
                styles.checklistText,
                checklist[item.key] && styles.checklistTextChecked
              ]}>
                {item.label}
              </Text>
              {item.required && (
                <Text style={styles.requiredBadge}>Obligatoire</Text>
              )}
            </View>
            {renderItemStatus(item)}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.submitButton,
          isRequiredChecked() ? styles.submitButtonEnabled : styles.submitButtonDisabled
        ]}
        onPress={handleSubmitInspection}
        disabled={!isRequiredChecked() || isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'Enregistrement...' : 'Confirmer l\'inspection'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  checklistContainer: {
    marginBottom: 20,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 10,
  },
  checklistItemChecked: {
    backgroundColor: '#1a73e8',
  },
  labelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  checklistText: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  checklistTextChecked: {
    color: '#fff',
  },
  requiredBadge: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#ff5252',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonEnabled: {
    backgroundColor: '#4CAF50',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  changedText: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#ff9800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  }
});

export default VehicleInspectionChecklist;