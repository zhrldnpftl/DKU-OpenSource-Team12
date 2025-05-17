import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NameInputScreen({ navigation }) {
  const [name, setName] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('이름을 입력해주세요.');
      return;
    }
    await AsyncStorage.setItem('userName', name);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>사용자님의 이름을 입력해주세요.</Text>
      <TextInput
        style={styles.input}
        placeholder="예: 차은우"
        value={name}
        onChangeText={setName}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>완료</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 20, marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 20
  },
  button: {
    backgroundColor: '#4CAF50', padding: 14, borderRadius: 6, alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});
