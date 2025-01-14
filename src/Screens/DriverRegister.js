import React, { useState } from 'react';
import { StyleSheet, Image, View, SafeAreaView, KeyboardAvoidingView, Text, TextInput, Pressable, ScrollView,Platform,Dimensions } from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { auth, db } from '../../firebaseConfig'; 
import { createUserWithEmailAndPassword,getIdToken } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

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

      
      const licenseImageUrl = await uploadImage(licenseImage, `license_${userId}.jpg`);
      const idCardImageUrl = await uploadImage(idCardImage, `idCard_${userId}.jpg`);
      const token = await getIdToken(auth.currentUser);
  

      const driverData = {
        uid: userId,
        email: email,
        name: name,
        phone: phoneNumber,
        licenseImage: licenseImageUrl,
        idCardImage: idCardImageUrl,
        token:token
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={false}
        >
          <View style={styles.innerContainer}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/Logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Inscription Chauffeur</Text>

            <View style={styles.formContainer}>
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
                <AntDesign name="lock" size={24} color="gray" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                  placeholder="Entrez votre mot de passe"
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

              <View style={styles.imageSection}>
                <Pressable 
                  onPress={() => handlePickImage(setLicenseImage)} 
                  style={styles.imagePickerButton}
                >
                  <Text style={styles.imagePickerText}>
                    {licenseImage ? 'Modifier le permis de conduire' : 'Sélectionner Permis de Conduire'}
                  </Text>
                </Pressable>
                
                {licenseImage && (
                  <View style={styles.imagePreviewContainer}>
                    <Image 
                      source={{ uri: licenseImage }} 
                      style={styles.previewImage} 
                      resizeMode="contain"
                    />
                  </View>
                )}

                <Pressable 
                  onPress={() => handlePickImage(setIdCardImage)} 
                  style={styles.imagePickerButton}
                >
                  <Text style={styles.imagePickerText}>
                    {idCardImage ? 'Modifier la carte d\'identité' : 'Sélectionner Carte d\'Identité'}
                  </Text>
                </Pressable>
                
                {idCardImage && (
                  <View style={styles.imagePreviewContainer}>
                    <Image 
                      source={{ uri: idCardImage }} 
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  </View>
                )}
              </View>

              <Pressable onPress={handleRegister} style={styles.registerButton}>
                <Text style={styles.registerButtonText}>S'inscrire</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <Toast ref={(ref) => Toast.setRef(ref)} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  innerContainer: {
    paddingHorizontal: windowWidth * 0.05,
    paddingBottom: windowHeight * 0.05,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: windowHeight * 0.03,
  },
  logo: {
    width: windowWidth * 0.4,
    height: windowHeight * 0.1,
    maxWidth: 200,
    maxHeight: 100,
  },
  title: {
    fontSize: Math.min(windowWidth * 0.06, 24),
    fontWeight: 'bold',
    marginBottom: windowHeight * 0.03,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D0D0D0',
    borderRadius: 5,
    marginBottom: windowHeight * 0.02,
    width: '100%',
    maxWidth: 500,
    paddingHorizontal: windowWidth * 0.03,
    height: 50,
  },
  inputField: {
    flex: 1,
    marginLeft: windowWidth * 0.02,
    fontSize: Math.min(windowWidth * 0.04, 18),
  },
  imageSection: {
    width: '100%',
    marginVertical: windowHeight * 0.02,
  },
  imagePickerButton: {
    backgroundColor: '#1b5988',
    borderRadius: 5,
    padding: windowWidth * 0.03,
    marginVertical: windowHeight * 0.01,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  imagePickerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: Math.min(windowWidth * 0.04, 16),
  },
  imagePreviewContainer: {
    width: '100%',
    height: windowHeight * 0.2,
    marginVertical: windowHeight * 0.01,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  registerButton: {
    backgroundColor: 'black',
    borderRadius: 6,
    width: '80%',
    maxWidth: 400,
    padding: windowWidth * 0.04,
    alignItems: 'center',
    marginTop: windowHeight * 0.03,
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: Math.min(windowWidth * 0.04, 16),
  },
});
export default DriverRegister;
