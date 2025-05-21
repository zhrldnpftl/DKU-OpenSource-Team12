import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeaderBar from '../components/HeaderBar';


export default function LoginScreen() {
  const navigation = useNavigation();

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [idError, setIdError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isValid, setIsValid] = useState(false);

  const validate = () => {
    let valid = true;

    if (!id) {
      setIdError('아이디를 입력해주세요.');
      valid = false;
    } else if (id.length < 4) {
      setIdError('아이디는 최소 4자 이상이어야 합니다.');
      valid = false;
    } else {
      setIdError('');
    }

    if (!password) {
      setPasswordError('비밀번호를 입력해주세요.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('비밀번호는 최소 6자 이상이어야 합니다.');
      valid = false;
    } else {
      setPasswordError('');
    }

    setIsValid(valid);
  };

  useEffect(() => {
    validate();
  }, [id, password]);

  // [0520 코드 수정]
  // ✅ 로그인 시도
  const onLoginPress = async () => {
    if (!isValid) return;

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: id,
          password: password,
        }),
      });

      const result = await response.json();
      console.log('0. ✅ 로그인 응답:', result);

      if (response.status === 404) {
        setIdError(result.error);
        return;
      }
      if (response.status === 401) {
        setPasswordError(result.error);
        return;
      }
      if (!response.ok) {
        Alert.alert('로그인 실패', result.error || '문제가 발생했습니다.');
        return;
      }

      // 🔒 값 확인 및 방어 처리
      const { user_id, email, username } = result;

      if (!user_id || !email || !username) {
        console.log('❌ 필수 값 누락:', result);
        Alert.alert('서버 오류', '응답 정보가 부족합니다.');
        return;
      }

      // ✅ 저장 안전하게 진행
      try {
        await AsyncStorage.setItem('userId', user_id.toString());
        console.log('2. ✅ userId 저장');
        await AsyncStorage.setItem('userEmail', email.toString());
        console.log('3. ✅ email 저장');
        await AsyncStorage.setItem('userName', username.toString());
        console.log('4. ✅ username 저장');
      } catch (e) {
        console.log('❌ AsyncStorage 저장 실패:', e);
        Alert.alert('저장 실패', '로컬 저장 중 문제가 발생했습니다.');
        return;
      }

      // ✅ 홈 화면 이동
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      console.log('5. ✅ Home으로 이동');

    } catch (error) {
      Alert.alert('서버 오류', '연결에 실패했습니다.');
      console.log('❌ 서버 통신 오류:', error);
    }
  };




  const onFindAccount = () => {
    navigation.navigate('FindAccount');
  };

  const onSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <View style={styles.container}>
      <HeaderBar /> 

      <Text style={styles.label}>아이디</Text>
      <TextInput
        style={[styles.input, idError ? styles.inputError : null]}
        placeholder="아이디를 입력해주세요"
        placeholderTextColor="#999"
        value={id}
        onChangeText={setId}
        autoCapitalize="none"
      />
      {idError ? <Text style={styles.errorText}>{idError}</Text> : null}

      <Text style={styles.label}>비밀번호</Text>
      <TextInput
        style={[styles.input, passwordError ? styles.inputError : null]}
        placeholder="비밀번호"
        placeholderTextColor="#999"
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
      />
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

      <TouchableOpacity
        style={[styles.loginButton, !isValid && styles.loginButtonDisabled]}
        disabled={!isValid}
        onPress={onLoginPress}
      >
        <Text style={styles.loginButtonText}>로그인</Text>
      </TouchableOpacity>

      <Text style={styles.signupGuide}>비회원일경우 회원가입을 해주세요.</Text>

      <View style={styles.linkRow}>
        <TouchableOpacity onPress={onFindAccount}>
          <Text style={styles.linkText}>아이디 비밀번호찾기</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onSignUp}>
          <Text style={styles.linkText}>회원가입</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#9ae87f',
    textAlign: 'center',
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 5,
    fontSize: 14,
    color: '#333',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontSize: 12,
  },
  loginButton: {
    backgroundColor: '#000',
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#666',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  signupGuide: {
    color: '#9ae87f',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 25,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  linkText: {
    color: '#999',
    fontSize: 13,
  },
});
