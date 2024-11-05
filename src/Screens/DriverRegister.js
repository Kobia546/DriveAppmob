import React, { useState } from 'react';
import { StyleSheet, Image, View, SafeAreaView, KeyboardAvoidingView, Text, TextInput, Pressable, ImageBackground } from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { auth, db } from '../../firebaseConfig'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const DriverRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [licenseImage, setLicenseImage] = useState(null);
  const [idCardImage, setIdCardImage] = useState(null);
  const navigation = useNavigation();

  const showToast = (type, text1, text2) => {
    Toast.show({
      type: type,
      position: 'bottom',
      text1: text1,
      text2: text2,
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 30,
    });
  };

  const handlePickImage = async (setImage) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      console.log('Image URI:', result.assets[0].uri);
    }
  };
  const uploadImage = async (uri, name) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(storage, `drivers/${name}`);
  
      console.log('Uploading image...');
      await uploadBytes(storageRef, blob);
      console.log('Image uploaded successfully');
  
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Download URL:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Error uploading image');
    }
  };
  const handleRegister = async () => {
    if (!name || !email || !phoneNumber || !password || !licenseImage || !idCardImage) {
      showToast('error', 'Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Télécharger les images et obtenir leurs URL
      const licenseImageUrl = await uploadImage(licenseImage, `license_${userId}.jpg`);
      const idCardImageUrl = await uploadImage(idCardImage, `idCard_${userId}.jpg`);

      const driverData = {
        uid: userId,
        email: email,
        name: name,
        phone: phoneNumber,
        licenseImage: licenseImageUrl,
        idCardImage: idCardImageUrl,
      };

      await setDoc(doc(db, 'drivers', userId), driverData);

      showToast('success', 'Inscription réussie !');
      navigation.navigate("Driver");
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      showToast('error', 'Erreur lors de l\'inscription : ' + error.message);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/Logo.png')} style={styles.logo} />
        </View>
      <KeyboardAvoidingView  >
      
    <View style={{ alignItems: 'center' }}>
          <Text style={styles.title}>Inscription Chauffeur</Text>
        </View>

        <View style={styles.inputContainer}>
          <AntDesign name="user" size={24} color="gray" />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nom"
            style={styles.inputField}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={24} color="gray" />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            style={styles.inputField}
          />
        </View>
        <View style={styles.inputContainer}>
          <AntDesign name="lock" size={24} color="gray" marginLeft={10} />
          <TextInput
            value={password}
            onChangeText={(text) => setPassword(text)}
            secureTextEntry={true}
            placeholder='Entrez votre mot de passe'
            style={styles.inputField}
          />
           </View>
        <View style={styles.inputContainer}>
          <AntDesign name="phone" size={24} color="gray" />
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Numéro de téléphone"
            style={styles.inputField}
            keyboardType="numeric"
          />
        </View>

        <Pressable onPress={() => handlePickImage(setLicenseImage)} style={styles.imagePickerButton}>
          <Text style={styles.imagePickerText}>Sélectionner Permis de Conduire</Text>
        </Pressable>
        {licenseImage && <Image source={{ uri: licenseImage }} style={styles.previewImage} />}

        <Pressable onPress={() => handlePickImage(setIdCardImage)} style={styles.imagePickerButton}>
          <Text style={styles.imagePickerText}>Sélectionner Carte d'Identité</Text>
        </Pressable>
        {idCardImage && <Image source={{ uri: idCardImage }} style={styles.previewImage} />}

        <Pressable onPress={handleRegister} style={styles.registerButton}>
          <Text style={{ textAlign: 'center', color: 'white', fontWeight: 'bold' }}>S'inscrire</Text>
        </Pressable>
      </KeyboardAvoidingView>
      <Toast ref={(ref) => Toast.setRef(ref)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    // justifyContent: 'center',
    // paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 100,
    top: 45,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    top: 80,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D0D0D0',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    top: 80,
  },
 
  inputField: {
    padding: 10,
    width: 300,
    height: 50,
    fontSize: 18,
  },
  imagePickerButton: {
    backgroundColor: '#00A0E4',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    alignItems: 'center',
    top: 70,
  },
  imagePickerText: {
    color: 'white',
    fontWeight: 'bold',
  },
  previewImage: {
    
   
  },
  registerButton: {
    marginTop:150,
    backgroundColor: 'black',
    marginLeft: 'auto',
    marginRight: 'auto',
    borderRadius: 6,
    width: 200,
    padding: 15,
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DriverRegister;
