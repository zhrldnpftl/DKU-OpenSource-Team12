import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function SignUpScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입 화면</Text>
      {/* 회원가입 폼은 추후 추가 */}
      <Button
        title="로그인 화면으로 이동"
        onPress={() => navigation.navigate('Login')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex:1, justifyContent:'center', alignItems:'center'},
  title: {fontSize:24, marginBottom:20}
});
