import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NameInputScreen({ navigation }) {
  const [name, setName] = useState('');

  // ✅ 저장 버튼 클릭 시
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('이름을 입력해주세요.');
      return;
    }

    try {
      // 🔑 로그인한 사용자 ID 불러오기
      const userId = await AsyncStorage.getItem('userId');

      // 🟡 백엔드에 이름 업데이트 요청
      const response = await fetch('http://localhost:5000/update-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,   // 🔑 어떤 유저인지 식별
          username: name,    // 📝 바꿀 이름
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        Alert.alert('오류', result.error || '서버 에러가 발생했습니다.');
        return;
      }

      // ✅ 닉네임도 local 저장
      await AsyncStorage.setItem('userName', name);

      // ✅ 홈화면으로 이동
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (error) {
      Alert.alert('서버 연결 실패', '네트워크 문제 또는 서버가 꺼져있을 수 있어요.');
    }
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
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
