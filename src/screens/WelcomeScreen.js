import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉ByteBite와 함께 즐거운 식생활 만들어봐요!🎉</Text>
      <Text style={styles.text}>회원가입이 완료되었습니다.</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('NameInput')}
      >
        <Text style={styles.buttonText}>다음</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 19, fontWeight: 'bold', marginBottom: 20 },
  text: { fontSize: 16, marginBottom: 40 },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
