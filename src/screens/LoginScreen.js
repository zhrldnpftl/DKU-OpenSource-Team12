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

  const onLoginPress = () => {
    if (!isValid) return;
    navigation.navigate('Home');
  };

  const onFindAccount = () => {
    navigation.navigate('FindAccount');
  };

  const onSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>ByteBite</Text>

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
