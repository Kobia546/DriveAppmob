import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import React from 'react';

const { width: WindowWidth, height: WindowHeight } = Dimensions.get('window');

export default function Item({ item }) {
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Image style={styles.image} source={item.image} resizeMode="contain" />
        <Text style={styles.title}> {item.title} </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: WindowWidth,
    height: WindowHeight - 100,
    alignItems: 'center',
  },
  item: {
    flex: 1,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  image: {
   height:  WindowHeight * 0.4,
  },
});