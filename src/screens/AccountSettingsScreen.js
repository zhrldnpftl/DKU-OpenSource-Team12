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
import { useNavigation, useRoute } from '@react-navigation/native'; // ✅ route 추가
import HeaderBar from '../components/HeaderBar';
import FooterBar from '../components/FooterBar';

export default function AccountSettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute(); // ✅ 현재 route 접근
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false); // ✅ 메시지 상태 추가

  // ✅ 비밀번호 변경 성공 메시지 처리
  useEffect(() => {
    console.log('[🔍 route.params]', route.params);  // 여기에 진입하는지 확인
    if (route.params?.passwordChanged) {
      console.log('[✅ passwordChanged true]'); // 로그 찍힘 확인
      setShowPasswordSuccess(true);
      setTimeout(() => setShowPasswordSuccess(false), 3000);
    }
  }, [route]);



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
    try {
      const userId = await AsyncStorage.getItem('userId');

      const response = await fetch('http://localhost:5000/update-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          username: username,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('userName', username);
        setEditingName(false);
        Alert.alert('저장 완료', '사용자 이름이 변경되었습니다.');
      } else {
        Alert.alert('오류', result.error || '변경에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('서버 오류', '이름 변경 중 문제가 발생했습니다.');
    }
  };

  const onLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userId', 'userName', 'userEmail']);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch {
      Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar />

      <Text style={styles.title}>계정 설정</Text>

      {/* ✅ 비밀번호 변경 성공 메시지 */}
      {showPasswordSuccess && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✅ 비밀번호가 성공적으로 변경되었습니다.</Text>
        </View>
      )}

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

      {/* 이메일 */}
      <Text style={styles.label}>이메일</Text>
      <Text style={styles.value}>{email || '이메일 없음'}</Text>

      {/* 버튼 */}
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

  successBox: {
    backgroundColor: '#e6ffed',
    borderColor: '#3c763d',
    borderWidth: 1,
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
  },
  successText: {
    color: '#3c763d',
    textAlign: 'center',
    fontWeight: '600',
  },
});
