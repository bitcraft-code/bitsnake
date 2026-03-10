import React from 'react';
import { View, Text, Button } from 'react-native';

const MenuScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Snake Game</Text>
      <Button title="Start Game" onPress={() => navigation.navigate('Game')} />
    </View>
  );
};

export default MenuScreen;
