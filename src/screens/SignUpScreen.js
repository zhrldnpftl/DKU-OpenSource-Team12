import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import HeaderBar from '../components/HeaderBar';

export default function SignUpScreen() {
  const navigation = useNavigation();

  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [idError, setIdError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const [idSuccess, setIdSuccess] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  const [isValid, setIsValid] = useState(false);

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  useEffect(() => {
    let valid = true;

    if (!id || id.length < 4) {
      setIdError('아이디는 최소 4자 이상이어야 합니다.');
      valid = false;
    } else {
      setIdError('');
    }

    if (!email) {
      setEmailError('이메일을 입력해주세요.');
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password || password.length < 6) {
      setPasswordError('비밀번호는 최소 6자 이상이어야 합니다.');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (password !== confirm) {
      setConfirmError('비밀번호가 일치하지 않습니다.');
      valid = false;
    } else {
      setConfirmError('');
    }

    setIsValid(valid);
  }, [id, email, password, confirm]);

  const checkDuplicateId = async () => {
    const res = await fetch(`http://localhost:5000/check-id/${id}`);
    const result = await res.json();
    if (res.status === 409) {
      setIdError(result.error);
      setIdSuccess('');
    } else if (res.status === 200) {
      setIdError('');
      setIdSuccess(result.message);
    }
  };

  const checkDuplicateEmail = async () => {
    const res = await fetch(`http://localhost:5000/check-email/${email}`);
    const result = await res.json();
    if (res.status === 409) {
      setEmailError(result.error);
      setEmailSuccess('');
    } else if (res.status === 200) {
      setEmailError('');
      setEmailSuccess(result.message);
    }
  };

  const onSignUp = async () => {
    if (!isValid) return;
    try {
      const response = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: id,
          username: id,
          email,
          password,
        }),
      });

      const result = await response.json();
      if (response.status === 409) {
        if (result.error.includes('아이디')) setIdError(result.error);
        else if (result.error.includes('이메일')) setEmailError(result.error);
        return;
      }
      if (!response.ok) return;

      await AsyncStorage.setItem('userId', id);
      await AsyncStorage.setItem('userEmail', email);
      navigation.navigate('Welcome');
    } catch (error) {
      console.log('회원가입 요청 실패:', error);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar /> 
      <Text style={styles.title}>회원가입</Text>

      {/* 아이디 */}
      <Text style={styles.label}>아이디</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, idError ? styles.inputError : null]}
          placeholder="아이디를 입력해주세요"
          value={id}
          onChangeText={setId}
        />
        <TouchableOpacity style={styles.smallButton} onPress={checkDuplicateId}>
          <Text style={styles.smallButtonText}>중복확인</Text>
        </TouchableOpacity>
      </View>
      {idError ? <Text style={styles.errorText}>{idError}</Text> : null}
      {idSuccess ? <Text style={styles.successText}>{idSuccess}</Text> : null}

      {/* 이메일 */}
      <Text style={styles.label}>이메일</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, emailError ? styles.inputError : null]}
          placeholder="이메일을 입력해주세요"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TouchableOpacity style={styles.smallButton} onPress={checkDuplicateEmail}>
          <Text style={styles.smallButtonText}>중복확인</Text>
        </TouchableOpacity>
      </View>
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      {emailSuccess ? <Text style={styles.successText}>{emailSuccess}</Text> : null}

      {/* 비밀번호 */}
      <Text style={styles.label}>비밀번호</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, passwordError ? styles.inputError : null]}
          placeholder="비밀번호를 입력해주세요"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

      {/* 비밀번호 확인 */}
      <Text style={styles.label}>비밀번호 확인</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, confirmError ? styles.inputError : null]}
          placeholder="비밀번호를 다시 입력해주세요"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />
      </View>
      {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}

      {/* 회원가입 버튼 */}
      <TouchableOpacity
        style={[styles.button, !isValid && styles.buttonDisabled]}
        onPress={onSignUp}
        disabled={!isValid}
      >
        <Text style={styles.buttonText}>회원가입</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#9ae87f', textAlign: 'center', marginBottom: 40 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  input: { flex: 1, borderWidth: 1, borderColor: '#000', borderRadius: 4, padding: 10, marginBottom: 6 },
  smallButton: {
    marginLeft: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#9ae87f',
    borderRadius: 4,
  },
  smallButtonText: { color: '#fff', fontWeight: '700' },
  inputError: { borderColor: 'red' },
  errorText: { color: 'red', fontSize: 12, marginBottom: 10 },
  successText: { color: 'blue', fontSize: 12, marginBottom: 10 }, // ✅ 파란 성공 메시지 스타일
  button: { backgroundColor: '#000', padding: 14, borderRadius: 4, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { backgroundColor: '#999' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
