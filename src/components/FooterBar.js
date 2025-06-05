import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FooterBar() {
  const navigation = useNavigation();
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const fetchUserName = async () => {
      const name = await AsyncStorage.getItem('userName');
      setUserName(name);
    };
    fetchUserName();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <View style={styles.footer}>
      {userName ? (
        <>
          <Text style={styles.welcomeText}>{userName}님 안녕하세요!</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.authRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>로그인</Text>
          </TouchableOpacity>
          <Text style={styles.divider}> / </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.linkText}>회원가입</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
  },
  logoutText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  authRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    color: '#9ae87f',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    fontSize: 14,
    color: '#999',
    marginHorizontal: 8,
  },
});
