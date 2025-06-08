// ✅ 필수 라이브러리 및 컴포넌트 임포트
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';                  // 🧩 입력 폼 관리 라이브러리
import AsyncStorage from '@react-native-async-storage/async-storage';   // 🔐 로컬 스토리지 사용
import { useFridgeStore } from '../stores/fridgeStore';                 // 📦 글로벌 상태관리 (Zustand)
import HeaderBar from '../components/HeaderBar';                        // 📌 상단 헤더
import FooterBar from '../components/FooterBar';                        // 📌 하단 푸터

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
      const timer = setTimeout(() => setMessage(''), 3000); // 3초 뒤 초기화
      return () => clearTimeout(timer);                     // 컴포넌트 언마운트 시 타이머 제거
    }
  }, [message]);

  // ✅ DB에서 현재 로그인한 유저의 냉장고 재료 불러오기
  useEffect(() => {
    const fetchFridgeItems = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');                          // 🔐 현재 사용자 ID 불러오기
        const response = await fetch(`http://localhost:5000/fridge/list/${userId}`);  // 🔁 DB에서 재료 목록 요청
        const result = await response.json();

        if (response.ok) {
          // 📂 응답에서 재료/조미료 분리하여 상태 저장
          const ingredients = result.items.filter(item => !item.is_seasoning).map(item => item.item_name);
          const seasonings = result.items.filter(item => item.is_seasoning).map(item => item.item_name);
          setIngredientItems(ingredients);
          setSeasoningItems(seasonings);
        }
      } catch (error) {
        console.error('서버 오류:', error);     // ❌ 네트워크 오류 로그
      }
    };
    fetchFridgeItems();
  }, []);

  // ✅ 재료 추가 버튼 클릭 시 호출
  const onSubmit = async ({ ingredient }) => {
    // ❌ 빈 값 예외처리
    if (!ingredient) return;

    // 현재 토글 상태 확인
    const isSeasoning = type === 'seasoning';

    try {
      const userId = await AsyncStorage.getItem('userId');                  // 🔐 사용자 ID
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
        setMessage(result.error);                                 // ⚠️ 중복 메시지
        setMessageType('error');
      } else if (response.ok) {
        addIngredient(ingredient);                                // ✅ 글로벌 상태 추가
        isSeasoning
          ? setSeasoningItems(prev => [...prev, ingredient])      // 조미료 리스트에 추가
          : setIngredientItems(prev => [...prev, ingredient]);    // 일반 재료에 추가
        setMessage(result.message);                               // ✅ 성공 메시지
        setMessageType('success');
      } else {
        setMessage('문제가 발생했습니다.');                       // ❌ 기타 서버 오류
        setMessageType('error');
      }
    } catch (error) {
      setMessage('서버 오류가 발생했습니다.');                    // ❌ 네트워크 오류
      setMessageType('error');
    }

    reset({ ingredient: '' });                                    // 입력 필드 초기화
  };

  // ✅ 재료 삭제 버튼 클릭 시 호출
  const handleDelete = async (item, isSeasoning) => {
    try {
      const userId = await AsyncStorage.getItem('userId');        // 🔐 사용자 ID
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
        setMessage(result.message);                               // ✅ 삭제 성공 메시지
        setMessageType('success');

        // ✅ 상태 업데이트: 해당 항목 제거
        isSeasoning
          ? setSeasoningItems(prev => prev.filter(i => i !== item))
          : setIngredientItems(prev => prev.filter(i => i !== item));
      } else {
        setMessage(result.error || '삭제 실패');                 // ❌ 삭제 실패
        setMessageType('error');
      }
    } catch (error) {
      setMessage('삭제 중 오류 발생');                            // ❌ 네트워크 오류
      setMessageType('error');
    }

    reset({ ingredient: '' });                                    // 입력창 초기화
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

      {/* ✅ 토글 버튼: 재료/조미료 선택 */}
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
        {/* ▶ 일반 재료 리스트 */}
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
        
        {/* ▶ 조미료 리스트 */}
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
