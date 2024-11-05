import React, { useState } from 'react';
import { StyleSheet, Image, View, SafeAreaView, KeyboardAvoidingView, Text, TextInput, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../firebaseConfig'; 
import { db } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore';
import HomeScreen from './HomeScreen';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const handleLogin = async () => {
    if (!emailPattern.test(email)) {
        showToast('error', 'Erreur', 'Adresse email invalide');
        return;
    }

    if (password.length < 6) {
        showToast('error', 'Erreur', 'Mot de passe trop court');
        return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Vérifie d'abord dans la collection des chauffeurs
      const driverDoc = await getDoc(doc(db, 'drivers', user.uid));

      if (driverDoc.exists()) {
          navigation.navigate('Driver'); // Si c'est un chauffeur
      } else {
          // Ensuite, vérifie dans la collection des utilisateurs
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
              navigation.navigate('HomeScreen'); // Si c'est un utilisateur
          } else {
              showToast('error', 'Erreur', 'Utilisateur introuvable');
          }
      }
  } catch (error) {
      showToast('error', 'Erreur', error.message);
  }
};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white', alignItems: 'center' }}>
      <View>
        <Image style={{ width: 150, height: 100,top:45 }} source={require('../../assets/Logo.png')} />
      </View>
      <KeyboardAvoidingView>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: 'bold',top:80 }}>Connectez votre compte</Text>
        </View>
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={24} color="gray" marginLeft={10} />
          <TextInput
            value={email}
            onChangeText={(text) => setEmail(text)}
            placeholder='Entrez votre email'
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
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',top:100}}>
          <Text>Restez connecté</Text>
          <Text style={{ color: 'blue' }}>Mot de passe oublié</Text>
        </View>
        <Pressable onPress={handleLogin} style={styles.loginButton}>
          <Text style={{ textAlign: 'center', color: 'white', fontWeight: 'bold' }}>Se Connecter</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Register')} style={{ marginTop: 10 }}>
          <Text style={{ textAlign: 'center', fontSize: 15, color: 'gray' }}>Je n'ai pas de compte? Inscrivez-vous</Text>
        </Pressable>
      </KeyboardAvoidingView>
      <Toast ref={(ref) => Toast.setRef(ref)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
    top:80,
    marginTop:20,
    paddingVertical: 'center',
    alignItems: 'center',
    backgroundColor: '#D0D0D0D0',
    borderRadius: 5,
  },
  inputField: {
    padding: 10,
    width: 300,
    height: 50,
    fontSize: 18,
  },
  loginButton: {
    marginTop: 140,
    backgroundColor: 'blue',
    marginLeft: 'auto',
    marginRight: 'auto',
    borderRadius: 6,
    width: 200,
    padding: 15,
  },
});

export default Login;