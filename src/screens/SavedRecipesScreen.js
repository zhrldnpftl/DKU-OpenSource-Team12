import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeaderBar from '../components/HeaderBar';
import FooterBar from '../components/FooterBar';
import Toast from 'react-native-toast-message';

export default function SavedRecipesScreen() {
  const [search, setSearch] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedRecipes = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          console.error('❌ userId가 없습니다.');
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:5000/recipes/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });

        const data = await response.json();

        if (response.ok) {
          setRecipes(
            data.recipes.map(item => ({
              id: item.recipe_id,
              name: item.title,
              url: item.url,
              ingredients: item.ingredients,
              category: item.category,
              time: item.time,
              level: item.level,
            }))
          );
        } else {
          Toast.show({
            type: 'error',
            text1: '레시피 불러오기 실패',
            text2: data.error || '레시피를 불러올 수 없습니다.',
          });
        }
      } catch (error) {
        console.error('❌ 서버 오류:', error);
        Toast.show({
          type: 'error',
          text1: '서버 오류',
          text2: '서버에 연결할 수 없습니다.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSavedRecipes();
  }, []);

  const formatIngredients = (ingredientString) => {
    if (!ingredientString) return '';
    return ingredientString
      .replace(/[\x07]/g, '')
      .split('|')
      .map(s => s.trim())
      .filter(Boolean)
      .reduce((result, ing, i) => {
        const lineIndex = Math.floor(i / 5);
        if (!result[lineIndex]) result[lineIndex] = [];
        result[lineIndex].push(ing);
        return result;
      }, [])
      .map(group => group.join(', '))
      .join('\n');
  };

  const filtered = recipes.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const removeRecipe = async (recipeId, recipeName) => {
    try {
      const userId = await AsyncStorage.getItem('userId');

      const response = await fetch('http://localhost:5000/recipes/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, recipe_id: recipeId }),
      });

      const data = await response.json();

      if (response.ok) {
        setRecipes(prev => prev.filter(item => item.id !== recipeId));
        Toast.show({
          type: 'success',
          text1: '레시피 삭제됨',
          text2: data.message || '레시피가 삭제되었습니다.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: '삭제 실패',
          text2: data.error || '삭제에 실패했습니다.',
        });
      }
    } catch (error) {
      console.error('❌ 삭제 오류:', error);
      Toast.show({
        type: 'error',
        text1: '서버 오류',
        text2: '서버에 연결할 수 없습니다.',
      });
    }
  };

  const confirmDelete = (recipeId, recipeName) => {
    removeRecipe(recipeId, recipeName);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderBar />
        <Text style={styles.loadingText}>로딩 중...</Text>
        <FooterBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar />
      <Text style={styles.title}>⭐ 저장된 레시피</Text>

      <TextInput
        placeholder="레시피 이름 검색"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {filtered.length === 0 ? (
        <Text style={styles.emptyText}>
          {recipes.length === 0 ? '저장된 레시피가 없습니다.' : '검색 결과가 없습니다.'}
        </Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity onPress={() => Linking.openURL(item.url)}>
                <Text style={styles.recipeName}>{item.name}</Text>
              </TouchableOpacity>
              <Text style={styles.detailText}>
                🧂 재료: {'\n'}{formatIngredients(item.ingredients)}
              </Text>
              <Text style={styles.detailText}>📂 분류: {item.category}</Text>
              <Text style={styles.detailText}>⏱️ 시간: {item.time} </Text>
              <Text style={styles.detailText}>📶 난이도: {item.level}</Text>
              <TouchableOpacity
                onPress={() => confirmDelete(item.id, item.name)}
                style={styles.deleteButton}
              >
                <Text style={styles.delete}>삭제</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      <FooterBar />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 16,
    textAlign: 'center',
    color: '#9ae87f',
  },
  search: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 50,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    fontStyle: 'italic',
    marginTop: 30,
    fontSize: 16,
  },
  card: {
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    backgroundColor: '#fdfdfd',
  },
  recipeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e78b7',
    textDecorationLine: 'underline',
  },
  detailText: {
    fontSize: 13,
    color: '#555',
    marginTop: 6,
  },
  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  delete: {
    color: '#e53935',
    fontWeight: '600',
    fontSize: 14,
  },
});