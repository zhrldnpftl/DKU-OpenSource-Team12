import React from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useFridgeStore } from '../stores/fridgeStore';

export default function FridgeScreen() {
  const { ingredients, addIngredient, removeIngredient } = useFridgeStore();
  const { control, handleSubmit, reset } = useForm();

  const onSubmit = ({ ingredient }) => {
    if (!ingredient) return;
    addIngredient(ingredient);
    reset();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🥕 나의 냉장고</Text>

      <Controller
        control={control}
        name="ingredient"
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="재료 입력"
            style={styles.input}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      <Button title="추가" onPress={handleSubmit(onSubmit)} />

      <FlatList
        data={ingredients}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={styles.item} onPress={() => removeIngredient(item)}>
            {item} ✖
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 6
  },
  item: {
    padding: 10, fontSize: 16, borderBottomWidth: 1, borderColor: '#eee'
  }
});

// TODO: 카테고리별 재료 분류 기능 추가 예정
