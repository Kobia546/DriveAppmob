import React, { useState } from 'react';
import { StyleSheet, Image, View, Text, TextInput, Pressable, SafeAreaView, ScrollView, } from 'react-native';
import { MaterialIcons, AntDesign, FontAwesome } from '@expo/vector-icons';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import User from '../../user';
import * as Notifications from 'expo-notifications';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [cars, setCars] = useState([{ carType: '', carPhoto: null }]);
  const navigation = useNavigation();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const showToast = (type, text1, text2) => {
    Toast.show({ type, position: 'bottom', text1, text2, visibilityTime: 3000 });
  };

  const handlePickImage = async (index) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const updatedCars = [...cars];
      updatedCars[index].carPhoto = result.assets[0].uri;
      setCars(updatedCars);
    }
  };

  const handleCarTypeChange = (index, type) => {
    const updatedCars = [...cars];
    updatedCars[index].carType = type;
    setCars(updatedCars);
  };

  const handleAddCar = () => {
    setCars([...cars, { carType: '', carPhoto: null }]);
  };
  const storage = getStorage();

const uploadImage = async (uri, userId, carIndex) => {
  try {
   
    const response = await fetch(uri);
    const blob = await response.blob();

    
    const storageRef = ref(storage, `users/${userId}/cars/car_${carIndex}.jpg`);

 
    await uploadBytes(storageRef, blob);

   
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Erreur d'upload de l'image:", error);
    return null;
  }
};
const handleRemoveCar = (index) => {
  setCars(cars.filter((_, i) => i !== index));
};

  const handleRegister = async () => {

    if (!emailPattern.test(email)) {
      showToast('error', 'Erreur', 'Adresse email invalide');
      return;
    }

    if (password.length < 6 || password !== confirmPassword) {
      showToast('error', 'Erreur', 'Le mot de passe doit être de 6 caractères minimum et identique');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log("Token de notification généré:", token);
      const carData = await Promise.all(
        cars.map(async (car, index) => {
          const carPhotoURL = car.carPhoto ? await uploadImage(car.carPhoto, userId, index) : null;
          return { carType: car.carType, carPhoto: carPhotoURL };
        }))

      const newUser = new User(userId, email, username, cars, token);

      await setDoc(doc(db, 'users', userId), newUser.toFirestore());
      showToast('success', 'Succès', 'Inscription réussie');
      navigation.navigate('HomeScreen');
    } catch (error) {
      console.error('Erreur:', error);
      showToast('error', 'Erreur', error.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
        <Image style={{ width: 150, height: 100, marginVertical: 20 }} source={require('../../assets/Logo.png')} />
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Inscription Client</Text>
        
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={24} color="gray" />
          <TextInput value={email} onChangeText={setEmail} placeholder='Email' style={styles.inputField} />
        </View>
        
        <View style={styles.inputContainer}>
          <AntDesign name="lock" size={24} color="gray" />
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder='Mot de passe' style={styles.inputField} />
        </View>

        <View style={styles.inputContainer}>
          <AntDesign name="lock" size={24} color="gray" />
          <TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder='Confirmer le mot de passe' style={styles.inputField} />
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome name="user" size={24} color="gray" />
          <TextInput value={username} onChangeText={setUsername} placeholder='Nom utilisateur' style={styles.inputField} />
        </View>

        {cars.map((car, index) => (
  <View key={index} style={styles.carContainer}>
    <Text style={styles.carTitle}>Véhicule {index + 1}</Text>

    {/* Bouton croix pour supprimer */}
    <Pressable onPress={() => handleRemoveCar(index)} style={styles.crossButton}>
      <FontAwesome name="close" size={24} color="gray" />
    </Pressable>

    {/* Sélecteur de type de voiture */}
    <View style={styles.toggleContainer}>
      {['Eco', 'Confort', 'Luxe'].map((type) => (
        <Pressable
          key={type}
          onPress={() => handleCarTypeChange(index, type)}
          style={[styles.toggleButton, car.carType === type && styles.selected]}>
          <Text style={styles.toggleButtonText}>{type}</Text>
        </Pressable>
      ))}
    </View>

            <Pressable onPress={() => handlePickImage(index)} style={styles.photoButton}>
              <Text style={{ color: 'white', textAlign: 'center' }}>{car.carPhoto ? 'Photo sélectionnée' : 'Ajouter une photo'}</Text>
            </Pressable>
          </View>
        ))}

        <Pressable onPress={handleAddCar} style={styles.addButton}>
          <Text style={{ color: 'blue' }}>+ Ajouter un véhicule</Text>
        </Pressable>

        <Pressable onPress={handleRegister} style={styles.registerButton}>
          <Text style={{ textAlign: 'center', color: 'white', fontWeight: 'bold' }}>S'inscrire</Text>
        </Pressable>
      </ScrollView>
      <Toast ref={(ref) => Toast.setRef(ref)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D0D0D0',
    borderRadius: 5,
    marginVertical: 10,
    width: '90%',
    paddingHorizontal: 10,
  },
  inputField: {
    padding: 10,
    width: '85%',
  },
  carContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    width: '90%',
  },
  carTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  crossButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: 'lightgray',
    width: 90, 
    alignItems: 'center',
    
  },
  selected: {
    backgroundColor: '#1b5988',
  },
  toggleButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  photoButton: {
    backgroundColor: '#D0D0D0',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButton: {
    marginVertical: 10,
  },
  registerButton: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 5,
    width: '90%',
    marginVertical: 20,
  },
});

export default Register;