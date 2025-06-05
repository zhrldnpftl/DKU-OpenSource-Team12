// ✅ 필요한 라이브러리 및 컴포넌트 import
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeaderBar from '../components/HeaderBar';
import FooterBar from '../components/FooterBar';
import { useNavigation } from '@react-navigation/native';

export default function ChangePasswordScreen() {
  const navigation = useNavigation();

  // ✅ 상태값 정의
  const [currentPassword, setCurrentPassword] = useState('');       // 현재 비밀번호
  const [newPassword, setNewPassword] = useState('');               // 새 비밀번호
  const [confirmPassword, setConfirmPassword] = useState('');       // 새 비밀번호 확인
  const [verificationMsg, setVerificationMsg] = useState('');       // 현재 비밀번호 검증 메시지
  const [matchMsg, setMatchMsg] = useState('');                     // 새 비밀번호 일치 여부 메시지
  const [isVerified, setIsVerified] = useState(false);              // 현재 비밀번호 검증 여부
  const [isValid, setIsValid] = useState(false);                    // 새 비밀번호 유효성
  const [originalPassword, setOriginalPassword] = useState('');     // 기존 비밀번호 저장용

  // ✅ 현재 비밀번호 검증 요청
  const verifyCurrentPassword = async () => {
    const userId = await AsyncStorage.getItem('userId');            // 🧠 로컬 저장소에서 로그인된 사용자 ID 가져오기
    const response = await fetch('http://localhost:5000/verify-password', {
      method: 'POST',                                               // 🔁 POST 메서드로 서버에 요청
      headers: { 'Content-Type': 'application/json' },              // 📦 요청 헤더: JSON 형식 명시
      body: JSON.stringify({                                        // 📨 요청 본문: 사용자 ID와 입력한 현재 비밀번호 전달
        user_id: userId,
        password: currentPassword,
      }),
    });

    const result = await response.json();
    if (response.ok) {
      setIsVerified(true);                                          // ✅ 확인 완료 상태로 전환
      setVerificationMsg('✅ 비밀번호가 확인되었습니다.');
      setOriginalPassword(currentPassword);                         // 기존 비밀번호 저장
    } else {
      setVerificationMsg('❌ 비밀번호가 일치하지 않습니다.');       // ❌ 오류 메시지 표시
    }
  };

  // ✅ 새 비밀번호 유효성 검사
  useEffect(() => {
    if (confirmPassword.length > 0) {
      if (newPassword !== confirmPassword) {
        setMatchMsg('❌ 비밀번호가 일치하지 않습니다.');
        setIsValid(false);
        return;
      }
      if (newPassword.length < 6) {
        setMatchMsg('❌ 비밀번호는 최소 6자 이상이어야 합니다.');
        setIsValid(false);
        return;
      }
      if (newPassword === originalPassword) {
        setMatchMsg('❌ 기존 비밀번호와 동일합니다.');
        setIsValid(false);
        return;
      }
      setMatchMsg('✅ 비밀번호가 확인되었습니다.');
      setIsValid(true);
    } else {
      setMatchMsg('');
      setIsValid(false);
    }
  }, [newPassword, confirmPassword, originalPassword]);       // 입력값 변경 시마다 실행

  // ✅ 새 비밀번호 업데이트 요청
  const onChangePassword = async () => {
    const userId = await AsyncStorage.getItem('userId');                      // 🧠 로그인된 사용자 ID 로컬에서 불러오기
    const response = await fetch('http://localhost:5000/update-password', {
      method: 'POST',                                                         // 🔁 POST 방식으로 서버에 변경 요청
      headers: { 'Content-Type': 'application/json' },                        // 📦 요청 헤더: JSON 형식
      body: JSON.stringify({ user_id: userId, new_password: newPassword }),   // 📨 요청 본문: 사용자 ID와 새 비밀번호
    });

    const result = await response.json();                                     // 📥 서버 응답(JSON) 파싱
    console.log('[✅ ChangePasswordScreen Response result :]', result);       // 🐞 응답 확인용 로그 출력
    if (response.ok) {
      console.log('[✅ ChangePasswordScreen Response ok]');                   // ✅ 서버 응답 성공 로그
      Alert.alert('완료', '비밀번호가 성공적으로 변경되었습니다.');             // ✅ 성공 알림창 표시

      // ✅ 변경 성공 시, AccountSettingsScreen으로 이동 + 알림 전달
      navigation.navigate('Settings', { passwordChanged: true }); 
    } else {
      // ❌ 실패 시 오류 메시지 또는 기본 메시지 출력
      Alert.alert('오류', result.error || '변경 실패');
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar />
      <Text style={styles.title}>비밀번호 변경</Text>

      {/* ✅ 현재 비밀번호 입력 및 확인 */}
      <Text style={styles.label}>현재 비밀번호</Text>
      <View style={styles.verifyRow}>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholder="현재 비밀번호"
        />
        <TouchableOpacity onPress={verifyCurrentPassword}>
          <Text style={styles.checkBtn}>확인</Text>
        </TouchableOpacity>
      </View>
      {verificationMsg !== '' && (
        <Text style={verificationMsg.includes('✅') ? styles.success : styles.error}>
          {verificationMsg}
        </Text>
      )}

      {/* ✅ 새 비밀번호 입력 영역 (검증 완료 후 표시) */}
      {isVerified ? (
        <>
          <Text style={styles.label}>새 비밀번호</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="새 비밀번호"
            />
          </View>

          {/* ✅ 새 비밀번호 입력 영역 (현재 비밀번호 검증 완료 시만 표시) */}
          <Text style={styles.label}>새 비밀번호 확인</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="다시 입력"
            />
          </View>

          {/* ✅ 새 비밀번호 일치 여부 메시지 */}
          {matchMsg !== '' && (
            <Text style={matchMsg.includes('✅') ? styles.success : styles.error}>
              {matchMsg}
            </Text>
          )}

          {/* ✅ 비밀번호 변경 버튼 (유효성 검증 통과 시만 활성화) */}
          <TouchableOpacity
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={onChangePassword}
            disabled={!isValid}
          >
            <Text style={styles.buttonText}>변경하기</Text>
          </TouchableOpacity>
        </>
      ) : (
        // ❓ 비밀번호를 모를 경우 → 비밀번호 찾기 이동
        <TouchableOpacity onPress={() => navigation.navigate('FindAccount')}>
          <Text style={styles.findText}>비밀번호가 기억나지 않으세요? 비밀번호 찾기</Text>
        </TouchableOpacity>
      )}

      <FooterBar />
    </View>
  );
}

// ✅ 스타일 정의
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, marginTop: 50, fontWeight: 'bold', marginBottom: 20 },
  label: { marginBottom: 6, marginTop: 20 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, flex: 1,
  },
  verifyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
  },
  checkBtn: {
    backgroundColor: '#1976D2', color: '#fff',
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 6, fontWeight: '700',
  },
  success: { color: 'green', marginTop: 5 },
  error: { color: 'red', marginTop: 5 },
  button: {
    backgroundColor: '#4CAF50', padding: 14, alignItems: 'center',
    borderRadius: 6, marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#aaa',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  findText: {
    color: '#e53935', marginTop: 15,
    textDecorationLine: 'underline', textAlign: 'center',
  },
});
