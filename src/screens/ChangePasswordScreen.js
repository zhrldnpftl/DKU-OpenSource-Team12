import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert('오류', '모든 항목을 입력해주세요.');
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
    }

    // TODO: 현재 비밀번호 확인 로직 추가 (백엔드 연동 시)
    Alert.alert('완료', '비밀번호가 변경되었습니다.');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>비밀번호 변경</Text>

      <Text style={styles.label}>현재 비밀번호</Text>
      <TextInput
        style={styles.input}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        placeholder="현재 비밀번호"
      />

      <Text style={styles.label}>새 비밀번호</Text>
      <TextInput
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        placeholder="새 비밀번호"
      />

      <Text style={styles.label}>새 비밀번호 확인</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholder="다시 입력"
      />

      <TouchableOpacity style={styles.button} onPress={onChangePassword}>
        <Text style={styles.buttonText}>변경하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, marginTop: 50, fontWeight: 'bold', marginBottom: 20 },
  label: { marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 14,
    alignItems: 'center',
    borderRadius: 6,
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
