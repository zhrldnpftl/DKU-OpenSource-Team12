import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>로그인</Text>

      <Text style={styles.label}>아이디</Text>
      <TextInput
        style={styles.input}
        placeholder="아이디를 입력해주세요"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>비밀번호</Text>
      <TextInput
        style={[styles.input, styles.passwordInput]}
        placeholder="비밀번호"
        placeholderTextColor="#999"
        secureTextEntry={true}
      />

      <TouchableOpacity style={styles.loginButton}>
        <Text style={styles.loginButtonText}>로그인</Text>
      </TouchableOpacity>

      <Text style={styles.signupGuide}>비회원일경우 회원가입을 해주세요.</Text>

      <View style={styles.linkRow}>
        <TouchableOpacity>
          <Text style={styles.linkText}>아이디 비밀번호찾기</Text>
        </TouchableOpacity>

        <TouchableOpacity>
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
  title: {
    fontSize: 30,
    fontWeight: '700',
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
    marginBottom: 20,
    fontSize: 14,
    color: '#333',
  },
  passwordInput: {
    borderColor: '#ccc',
  },
  loginButton: {
    backgroundColor: '#000',
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
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
