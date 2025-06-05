import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeaderBar from '../components/HeaderBar';
import FooterBar from '../components/FooterBar';

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState(null); // ✅ 로그인한 사용자 이름
  const [loginAlert, setLoginAlert] = useState(false); // ✅ 로그인 필요 알림 메시지 상태

  // ✅ 앱 시작 시 사용자 정보 불러오기
  useEffect(() => {
    const fetchUserName = async () => {
      const name = await AsyncStorage.getItem('userName');
      setUserName(name);

      // ✅ 로그인 정보 없으면 3초간 안내 문구 표시
      if (!name) {
        setLoginAlert(true);
        setTimeout(() => setLoginAlert(false), 3000);
      }
    };
    fetchUserName();
  }, []);

  // ✅ 로그아웃 처리: 사용자 정보 초기화 후 홈으로 리셋
  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  // ✅ 홈 메뉴 항목 정의
  const menuItems = [
    { icon: '🥕', label: '나의 냉장고', screen: 'Fridge' },
    { icon: '🍽', label: '레시피 추천', screen: 'Chatbot' },
    { icon: '⭐', label: '저장된 레시피', screen: 'Favorites' },
    { icon: '⚙️', label: '계정 설정', screen: 'Settings' },
  ];

  return (
    <View style={styles.container}>
      <HeaderBar />
      <Text style={styles.title}>무엇을 도와드릴까요?{'\n'}아래에서 골라주세요.</Text>

      {/* ✅ 로그인 필요 메시지 (3초간 표시) */}
      {loginAlert && (
        <View style={styles.loginAlertBox}>
          <Text style={styles.loginAlertText}>⚠️ 로그인을 먼저 해주세요.</Text>
        </View>
      )}

      {/* ✅ 메뉴 버튼 목록 */}
      {menuItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.menuButton,
            !userName && styles.disabledButton // ❌ 로그인 안 된 경우 버튼 흐리게 처리
          ]}
          onPress={() => navigation.navigate(item.screen)} // ✅ 해당 화면으로 이동
          disabled={!userName} // ❌ 로그인 안 된 경우 클릭 비활성화
        >
          <Text style={styles.menuText}>{item.icon} {item.label}</Text>
        </TouchableOpacity>
      ))}

      <FooterBar />
    </View>
  );
}

// ✅ 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 28,
  },
  menuButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  menuText: { fontSize: 18 },
  footer: { marginTop: 40, alignItems: 'center' },
  authRow: { flexDirection: 'row', alignItems: 'center' },
  linkText: { color: '#9ae87f', fontSize: 14, fontWeight: '600' },
  divider: { fontSize: 14, color: '#999', marginHorizontal: 8 },
  welcomeText: { fontSize: 15, color: '#333', fontWeight: '600', marginBottom: 8 },
  logoutText: { color: '#666', fontSize: 14, textDecorationLine: 'underline' },

  // ✅ 로그인 필요 메시지 스타일
  loginAlertBox: {
    backgroundColor: '#ffe6e6',
    borderColor: '#cc0000',
    borderWidth: 1,
    padding: 10,
    marginBottom: 16,
    borderRadius: 6,
  },
  loginAlertText: {
    color: '#cc0000',
    textAlign: 'center',
    fontWeight: '600',
  },

  // ✅ 비활성화된 버튼 스타일 (로그인 안 됐을 때)
  disabledButton: {
    opacity: 0.4,
  },
});
