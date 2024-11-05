import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, SafeAreaView, FlatList, Platform, Dimensions, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Item from './Item';
import { StatusBar } from 'expo-status-bar';
import Pagination from './Pagination';

const { width: WindowWidth } = Dimensions.get('window');
const Slide = [
  {
    id: 1,
    title: "Bienvue dans l'application revolutionnaire du transport ivoirien; Voyez d'une maniere differente les maniere de faire vos courses",
    image: require("../../assets/Bienvenue.png")
  },
  {
    id: 2,
    title: "Vous êtes fatigué?Ivre? Laissez nous vous conduire ",
    image: require("../../assets/First.png")
  },
  {
      id: 3,  
      title: "Vous avez du travail?Etes en reunion? Confiez nous vos voitures",
      image: require("../../assets/Busy.png"),
    },
    {
        id: 4,
        title: "N'ayez Craintes tous nos chauffeurs ont suivi une formation en plus il sont tous certifiés ",
        image: require("../../assets/Certfied.png"),
        isLastSlide: true,
    }, 
];

export default function PremierPage() {
  const [index, setIndex] = useState(0);
  const navigation = useNavigation();

  const onScroll = (event) => {
    const slideSize = WindowWidth;
    const n = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(n);
    if (index !== roundIndex) {
      setIndex(roundIndex);
    }
  };

  const handleStartAdventure = () => {
    navigation.navigate('Login');
  };

  const renderLastSlide = () => {
    const lastSlide = Slide[Slide.length - 1];
    return (
      <View style={styles.slide}>
        <Image source={lastSlide.image} style={styles.image} />
        <Text style={styles.title}>{lastSlide.title}</Text>
        <Pressable style={styles.button} onPress={handleStartAdventure}>
          {({ pressed }) => (
            <Text style={[styles.buttonText, { opacity: pressed ? 0.5 : 1 }]}>
              Deviens membre
            </Text>
          )}
        </Pressable>
      </View>
    );
  };

  const renderItem = ({ item, index }) => {
    if (item.isLastSlide) {
      return renderLastSlide();
    }
    return <Item item={item} />;
  };

  return (
    <SafeAreaView style={styles.container}>
    <Image 
         style={{width:100,height:100,top:50}}
        source={require('../../assets/Logo.png')}
       />

      <FlatList
        data={Slide}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        onScroll={onScroll}
      />
      <Pagination index={index} data={Slide} />
      {/* <StackNavigator /> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    backgroundColor: ' #00ff00',
    bottom:25,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.height : 0,
  },
  slide: {
    width: WindowWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    
  },
  button: {
    backgroundColor: 'blue',
    padding: 20,
    borderRadius: 10,
    marginLeft: 150,
    marginTop: 150,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});