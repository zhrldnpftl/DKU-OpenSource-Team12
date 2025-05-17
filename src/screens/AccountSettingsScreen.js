import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function AccountSettingsScreen() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [editingName, setEditingName] = useState(false); // 수정 모드 여부

  useEffect(() => {
    const loadUserInfo = async () => {
      const savedName = await AsyncStorage.getItem('userName');
      const savedEmail = await AsyncStorage.getItem('userEmail');
      if (savedName) setUsername(savedName);
      if (savedEmail) setEmail(savedEmail);
    };
    loadUserInfo();
  }, []);

  const onSaveName = async () => {
    await AsyncStorage.setItem('userName', username);
    setEditingName(false);
    Alert.alert('저장 완료', '사용자 이름이 변경되었습니다.');
  };

  const onLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userName', 'userEmail']);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>계정 설정</Text>

      {/* 사용자 이름 */}
      <Text style={styles.label}>사용자 이름</Text>
      <View style={styles.row}>
        {editingName ? (
          <>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={username}
              onChangeText={setUsername}
              placeholder="사용자 이름"
            />
            <TouchableOpacity onPress={onSaveName}>
              <Text style={styles.linkText}>저장하기</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.value}>{username || '이름 없음'}</Text>
            <TouchableOpacity onPress={() => setEditingName(true)}>
              <Text style={styles.linkText}>변경하기</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 이메일 (수정불가) */}
      <Text style={styles.label}>이메일</Text>
      <Text style={styles.value}>{email || '이메일 없음'}</Text>

      {/* 버튼들 */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#1976D2' }]}
        onPress={() => navigation.navigate('ChangePassword')}
      >
        <Text style={styles.buttonText}>비밀번호 변경</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={onLogout}
      >
        <Text style={styles.logoutButtonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginTop: 50, marginBottom: 20 },
  label: { fontSize: 14, marginTop: 20, marginBottom: 6, color: '#333' },
  value: { fontSize: 16, fontWeight: '500', flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  linkText: {
    color: '#1976D2',
    fontSize: 14,
    marginLeft: 12,
  },
  button: {
    marginTop: 30,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  logoutButton: { backgroundColor: '#e53935', marginTop: 15 },
  logoutButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

