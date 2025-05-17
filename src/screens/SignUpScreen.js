import React, { useState, useEffect } from 'react';
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

  const [isValid, setIsValid] = useState(false);

  const validateEmail = (email) => {
    const regex = /\S+@\S+\.\S+/;
    return regex.test(email);
  };

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

  const onSignUp = async () => {
    if (!isValid) return;

    try {
      // TODO: 백엔드 연동 시 여기에 API 호출 추가

      // 사용자 정보 저장
      await AsyncStorage.setItem('userId', id);
      await AsyncStorage.setItem('userEmail', email);

      Alert.alert('회원가입 완료', '환영합니다!');
      navigation.navigate('Welcome'); // 이후 이름 입력 화면으로 이동
    } catch (error) {
      Alert.alert('오류', '회원가입 중 문제가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>

      <Text style={styles.label}>아이디</Text>
      <TextInput
        style={[styles.input, idError ? styles.inputError : null]}
        placeholder="아이디를 입력해주세요"
        value={id}
        onChangeText={setId}
        autoCapitalize="none"
      />
      {idError ? <Text style={styles.errorText}>{idError}</Text> : null}

      <Text style={styles.label}>이메일</Text>
      <TextInput
        style={[styles.input, emailError ? styles.inputError : null]}
        placeholder="이메일을 입력해주세요"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      <Text style={styles.label}>비밀번호</Text>
      <TextInput
        style={[styles.input, passwordError ? styles.inputError : null]}
        placeholder="비밀번호를 입력해주세요"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

      <Text style={styles.label}>비밀번호 확인</Text>
      <TextInput
        style={[styles.input, confirmError ? styles.inputError : null]}
        placeholder="비밀번호를 다시 입력해주세요"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
      />
      {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}

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
  title: { fontSize: 26, fontWeight: '800', color: '#9ae87f', textAlign: 'center', marginBottom: 40 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#000', borderRadius: 4, padding: 10, marginBottom: 6 },
  inputError: { borderColor: 'red' },
  errorText: { color: 'red', fontSize: 12, marginBottom: 10 },
  button: { backgroundColor: '#000', padding: 14, borderRadius: 4, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { backgroundColor: '#999' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
