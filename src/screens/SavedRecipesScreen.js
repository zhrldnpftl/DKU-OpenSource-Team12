import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function SavedRecipesScreen() {
  const [search, setSearch] = useState('');
  const [recipes, setRecipes] = useState([]); // 아직 백엔드 없으므로 빈 배열

  const filtered = recipes.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const removeRecipe = (name) => {
    setRecipes(prev => prev.filter(item => item.name !== name));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⭐ 저장된 레시피</Text>

      <TextInput
        placeholder="레시피 이름 검색"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {filtered.length === 0 ? (
        <Text style={styles.emptyText}>저장된 레시피가 없습니다.</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.recipeName}>{item.name}</Text>
              <TouchableOpacity onPress={() => removeRecipe(item.name)}>
                <Text style={styles.delete}>삭제</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 50,
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
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    fontStyle: 'italic',
    marginTop: 30,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  recipeName: {
    fontSize: 16,
    flex: 1,
  },
  delete: {
    color: '#e53935',
    fontWeight: '600',
  },
});
