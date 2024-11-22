import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { updateProfile, updateEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

const ProfileSettings = ({ route, navigation }) => {
  const { user, userType } = route.params;
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [email, setEmail] = useState(user.email || '');

  const handleUpdateProfile = async () => {
    try {
      
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });

    
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, {
        username: displayName
      });

      // Update email if changed
      if (email !== user.email) {
        await updateEmail(auth.currentUser, email);
      }

      Alert.alert('Succès', 'Profil mis à jour');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paramètres du Profil</Text>
      <Text style={styles.subtitle}>Type de Compte: {userType}</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nom</Text>
        <TextInput 
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Votre nom"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput 
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Votre email"
          keyboardType="email-address"
        />
      </View>

      <TouchableOpacity 
        style={styles.updateButton}
        onPress={handleUpdateProfile}
      >
        <Text style={styles.updateButtonText}>Mettre à jour</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
  },
  updateButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileSettings;