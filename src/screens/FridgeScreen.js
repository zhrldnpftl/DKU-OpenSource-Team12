// ✅ 필수 라이브러리 및 컴포넌트 임포트
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFridgeStore } from '../stores/fridgeStore';
import HeaderBar from '../components/HeaderBar';
import FooterBar from '../components/FooterBar';

export default function FridgeScreen() {
  // ✅ 글로벌 상태관리 (zustand)로부터 재료 추가 함수 호출
  const { ingredients, addIngredient } = useFridgeStore();

  // ✅ react-hook-form으로 폼 처리
  const { control, handleSubmit, reset } = useForm();

  // ✅ 현재 입력 유형 (재료 / 조미료)
  const [type, setType] = useState('ingredient');

  // ✅ DB로부터 불러온 재료/조미료 항목 목록
  const [ingredientItems, setIngredientItems] = useState([]);
  const [seasoningItems, setSeasoningItems] = useState([]);

  // ✅ 메시지 상태 및 타입
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success'); // 'success' 또는 'error'

  // ✅ 메시지를 3초 뒤 자동 숨김
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // ✅ DB에서 현재 로그인한 유저의 냉장고 재료 불러오기
  useEffect(() => {
    const fetchFridgeItems = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const response = await fetch(`http://localhost:5000/fridge/list/${userId}`);
        const result = await response.json();

        if (response.ok) {
          const ingredients = result.items.filter(item => !item.is_seasoning).map(item => item.item_name);
          const seasonings = result.items.filter(item => item.is_seasoning).map(item => item.item_name);
          setIngredientItems(ingredients);
          setSeasoningItems(seasonings);
        }
      } catch (error) {
        console.error('서버 오류:', error);
      }
    };
    fetchFridgeItems();
  }, []);

  // ✅ 재료 추가 버튼 클릭 시 호출
  const onSubmit = async ({ ingredient }) => {
    if (!ingredient) return;

    const isSeasoning = type === 'seasoning';

    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch('http://localhost:5000/fridge/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          item_name: ingredient,
          is_seasoning: isSeasoning,
        }),
      });

      const result = await response.json();

      if (response.status === 409) {
        setMessage(result.error); // 중복일 경우
        setMessageType('error');
      } else if (response.ok) {
        // 성공 시 글로벌 상태에도 추가
        addIngredient(ingredient);
        isSeasoning
          ? setSeasoningItems(prev => [...prev, ingredient])
          : setIngredientItems(prev => [...prev, ingredient]);
        setMessage(result.message);
        setMessageType('success');
      } else {
        setMessage('문제가 발생했습니다.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('서버 오류가 발생했습니다.');
      setMessageType('error');
    }

    reset({ ingredient: '' }); // 입력창 초기화
  };

  // ✅ 재료 삭제 버튼 클릭 시 호출
  const handleDelete = async (item, isSeasoning) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch('http://localhost:5000/fridge/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          item_name: item,
          is_seasoning: isSeasoning,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message);
        setMessageType('success');
        isSeasoning
          ? setSeasoningItems(prev => prev.filter(i => i !== item))
          : setIngredientItems(prev => prev.filter(i => i !== item));
      } else {
        setMessage(result.error || '삭제 실패');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('삭제 중 오류 발생');
      setMessageType('error');
    }

    reset({ ingredient: '' });
  };

  return (
    <View style={styles.container}>
      <HeaderBar />
      <Text style={styles.title}>🥕 나의 냉장고</Text>

      {/* ✅ 메시지 출력 영역 */}
      {message !== '' && (
        <Text style={[styles.message, messageType === 'error' ? styles.error : styles.success]}>
          {message}
        </Text>
      )}

      {/* ✅ 재료 / 조미료 토글 버튼 */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, type === 'ingredient' && styles.toggleSelected]}
          onPress={() => setType('ingredient')}
        >
          <Text style={type === 'ingredient' ? styles.toggleTextActive : styles.toggleText}>재료</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, type === 'seasoning' && styles.toggleSelected]}
          onPress={() => setType('seasoning')}
        >
          <Text style={type === 'seasoning' ? styles.toggleTextActive : styles.toggleText}>조미료</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ 입력창 + 추가 버튼 */}
      <View style={styles.inputRow}>
        <Controller
          control={control}
          name="ingredient"
          rules={{ required: true }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="재료명을 입력해주세요"
              style={styles.input}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        <Button title="추가" onPress={handleSubmit(onSubmit)} />
      </View>

      {/* ✅ 재료/조미료 리스트 */}
      <View style={styles.gridContainer}>
        <View style={styles.gridColumn}>
          <Text style={styles.gridTitle}>🥬 재료</Text>
          {ingredientItems.map((item, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.gridItem}>{item}</Text>
              <TouchableOpacity onPress={() => handleDelete(item, false)}>
                <Text style={styles.delete}>✖</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.gridColumn}>
          <Text style={styles.gridTitle}>🧂 조미료</Text>
          {seasoningItems.map((item, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.gridItem}>{item}</Text>
              <TouchableOpacity onPress={() => handleDelete(item, true)}>
                <Text style={styles.delete}>✖</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <FooterBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, marginBottom: 10, marginTop: 30 },

  message: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 12,
  },
  success: { color: 'green' },
  error: { color: 'red' },

  toggleRow: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'center',
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 5,
    borderRadius: 6,
  },
  toggleSelected: {
    backgroundColor: '#9ae87f',
    borderColor: '#9ae87f',
  },
  toggleText: { color: '#555' },
  toggleTextActive: { color: '#fff', fontWeight: 'bold' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginRight: 10,
  },

  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  gridColumn: {
    flex: 1,
    paddingHorizontal: 10,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  gridItem: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  delete: {
    color: 'red',
    paddingHorizontal: 8,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
});
