import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }) {
  const menuItems = [
    { icon: '🥕', label: '나의 냉장고', screen: 'Fridge' },
    { icon: '🍽', label: '레시피 추천', screen: 'Recommend' },
    { icon: '⭐', label: '저장된 레시피', screen: 'Favorites' },
    { icon: '⚙️', label: '계정 설정', screen: 'Settings' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>무엇을 도와드릴까요?{'\n'}아래에서 골라주세요.</Text>
      {menuItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.menuButton}
          onPress={() => navigation.navigate(item.screen)}
        >
          <Text style={styles.menuText}>{item.icon} {item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

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
  menuText: {
    fontSize: 18,
  },
});
