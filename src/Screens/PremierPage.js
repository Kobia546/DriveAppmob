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
    title: "Vous avez un véhicule , Bienvenue dans l'application qui révolutionne la manière de faire vos courses",
    image: require("../../assets/Bienvenue.png")
  },
  {
    id: 2,
    title: " Fatigué? Occupé? Laissez nous conduire.",
    image: require("../../assets/First.png")
  },
  {
      id: 3,  
      title: "Vous avez du travail, vous êtes en réunion? Votre temps est précieux, confiez-nous vos courses.",
      image: require("../../assets/Busy.png"),
    },
    {
        id: 4,
        title: "N'ayez Crainte, tous nos chauffeurs sont des professionnels formés et sont certifiés.",
        image: require("../../assets/verification.png"),
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
              Commencer
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
    top:30,
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
    top:40,
    left:10,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 23,
    fontWeight: 'bold',
    marginVertical: 10,
    paddingLeft:20,
    top:120,
    
    
  },
  button: {
    backgroundColor: '#1b5988',
    padding: 20,
    borderRadius: 10,
    marginLeft: 200,
    marginTop: 200,
   
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});