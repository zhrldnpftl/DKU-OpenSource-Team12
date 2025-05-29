import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,                                                                // ⚠️ 경고창 띄우기 위한 컴포넌트
} from 'react-native';
import { useNavigation } from '@react-navigation/native';               // 🔁 화면 이동 hook
import AsyncStorage from '@react-native-async-storage/async-storage';   // 🧠 로컬 저장소
import HeaderBar from '../components/HeaderBar';                        // 📌 공통 상단 헤더

// 🔐 로그인 화면 컴포넌트 정의
export default function LoginScreen() {
  // 📍 화면 이동을 위한 네비게이션 객체
  const navigation = useNavigation();

  // 🔣 입력값 및 상태 변수 정의
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [idError, setIdError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isValid, setIsValid] = useState(false);            // 전체 입력값 유효성 상태

  // ✅ 입력 유효성 검사 함수
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

    setIsValid(valid);        // 유효성 검사 결과 업데이트
  };

  // ⏱ 입력값이 변경될 때마다 유효성 검사 실행
  useEffect(() => {
    validate();
  }, [id, password]);

  // ✅ 로그인 시도 함수
  const onLoginPress = async () => {
    // 유효성 실패 시 함수 종료
    if (!isValid) return;

    try {
      // 🔐 Flask 서버로 로그인 요청
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: id,
          password: password,
        }),
      });

      // 📩 서버 응답 JSON
      const result = await response.json();
      console.log('0. ✅ 로그인 응답:', result);

      // ❌ 존재하지 않는 아이디
      if (response.status === 404) {
        setIdError(result.error);
        return;
      }
      // ❌ 비밀번호 불일치
      if (response.status === 401) {
        setPasswordError(result.error);
        return;
      }
      // ❌ 기타 오류 발생 시 Alert
      if (!response.ok) {
        Alert.alert('로그인 실패', result.error || '문제가 발생했습니다.');
        return;
      }

      // 🔍 필수 응답 필드 확인
      const { user_id, email, username } = result;

      if (!user_id || !email || !username) {
        console.log('❌ 필수 값 누락:', result);
        Alert.alert('서버 오류', '응답 정보가 부족합니다.');
        return;
      }

      // 💾 사용자 정보 로컬 저장
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

      // 🏠 홈 화면으로 이동 (스택 초기화)
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      console.log('5. ✅ Home으로 이동');

    } catch (error) {
      // ❌ 네트워크 또는 서버 연결 실패
      Alert.alert('서버 오류', '연결에 실패했습니다.');
      console.log('❌ 서버 통신 오류:', error);
    }
  };



  // 🔗 아이디/비밀번호 찾기 화면 이동
  const onFindAccount = () => {
    navigation.navigate('FindAccount');
  };
  // 🔗 회원가입 화면 이동
  const onSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <View style={styles.container}>
      <HeaderBar />   {/* 상단 헤더 표시 */}

      {/* 🔤 아이디 입력 필드 */}
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

      {/* 🔐 비밀번호 입력 필드 */}
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

      {/* ✅ 로그인 버튼 */}
      <TouchableOpacity
        style={[styles.loginButton, !isValid && styles.loginButtonDisabled]}
        disabled={!isValid}
        onPress={onLoginPress}
      >
        <Text style={styles.loginButtonText}>로그인</Text>
      </TouchableOpacity>

      {/* 📌 회원가입 안내 메시지 */}
      <Text style={styles.signupGuide}>비회원일경우 회원가입을 해주세요.</Text>

      {/* 🔗 하단 링크 (계정 찾기 / 회원가입) */}
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
