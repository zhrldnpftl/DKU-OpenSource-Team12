import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeaderBar from '../components/HeaderBar';
import FooterBar from '../components/FooterBar';
import Toast from 'react-native-toast-message';

export default function ChatbotScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef();
  const [favoritedIds, setFavoritedIds] = useState([]);
  const [userName, setUserName] = useState(null);
  const [userId, setUserId] = useState(null);

  // ✅ Rasa 슬롯에 user_id를 설정하는 intent 메시지 전송 함수
  const sendUserIdIntent = async (storedUserId) => {
    if (!storedUserId) return;

    try {
      const response = await fetch("http://localhost:5005/webhooks/rest/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: storedUserId,
          message: `/inform_user_id{"user_id": "${storedUserId}"}`,
        }),
      });

      const data = await response.json();
      console.log("🪪 user_id intent 전송 결과:", data);
    } catch (error) {
      console.error("❌ user_id intent 전송 오류:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const name = await AsyncStorage.getItem('userName');
        const id = await AsyncStorage.getItem('userId');
        const userId = await AsyncStorage.getItem('userId');

        console.log("🔍 저장된 사용자 정보:", { name, id, userId });

        setUserName(name);
        setUserId(id || userId);

        // ✅ Rasa 슬롯에 user_id 전달
        await sendUserIdIntent(id || userId);

        setMessages([
          {
            id: '1',
            text: name ? `${name}님, 안녕하세요! 무엇을 도와드릴까요?` : `안녕하세요! 무엇을 도와드릴까요?`,
            isUser: false,
          },
        ]);
      } catch (error) {
        console.error("초기화 오류:", error);
      }
    };
    init();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);

    const currentInput = input;
    setInput('');

    // 🔍 입력 패턴 분석을 위한 로깅
    console.log("🎯 사용자 입력 분석:", {
      input: currentInput,
      length: currentInput.length,
      hasSpecialChars: /[^가-힣a-zA-Z0-9\s]/.test(currentInput),
      keywords: ['추천', '레시피', '냉장고', '재료'].filter(keyword => currentInput.includes(keyword)),
      timestamp: new Date().toISOString()
    });


    try {
      const storedUserId = userId || await AsyncStorage.getItem("userId");
      console.log("📦 사용할 userId:", storedUserId);

      const requestData = {
        sender: storedUserId || "default",
        message: currentInput,
        metadata: {
          user_id: storedUserId
        }
      };

      console.log("📤 Rasa 서버로 전송할 데이터:", requestData);

      const response = await fetch("http://localhost:5005/webhooks/rest/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      console.log("🌐 Rasa 서버 응답 상태:", response.status);
      console.log("🌐 Rasa 서버 응답 헤더:", response.headers);

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("서버 응답이 JSON 형식이 아닙니다");
      }

      const data = await response.json();
      console.log("📨 Rasa 응답 데이터:", data);
      console.log("📨 응답 데이터 타입:", typeof data);
      console.log("📨 응답 데이터 길이:", Array.isArray(data) ? data.length : 'N/A');
      // 🔍 응답 패턴 분석
      console.log("📊 응답 분석:", {
        input: currentInput,
        responseLength: Array.isArray(data) ? data.length : 'N/A',
        isEmpty: !Array.isArray(data) || data.length === 0,
        timestamp: new Date().toISOString()
      });

      if (!Array.isArray(data) || data.length === 0) {
        console.warn("⚠️ Rasa 서버에서 빈 응답을 받았습니다");

        console.log("🔍 Rasa 서버 상태 확인 중...");
        const healthCheck = await fetch("http://localhost:5005/status");
        const healthData = await healthCheck.json();
        console.log("🏥 Rasa 서버 상태:", healthData);

        const fallback = {
          id: Date.now().toString(),
          text: "죄송합니다. 서버에서 응답을 받지 못했어요 😢 (빈 응답)",
          isUser: false,
        };
        setMessages(prev => [...prev, fallback]);
        return;
      }

      const newMessages = data.map((msg, index) => {
        console.log(`📋 메시지 ${index}:`, msg);

        if (msg.custom && msg.custom.type === 'recipe') {
          return {
            id: Date.now().toString() + index,
            type: 'recipe',
            title: msg.custom.title,
            ingredients: msg.custom.ingredients,
            instructions: msg.custom.instructions,
            url: msg.custom.url,
            rcp_sno: msg.custom.rcp_sno,
          };
        }

        return {
          id: Date.now().toString() + index,
          text: msg.text || "응답 텍스트가 없습니다",
          isUser: false,
        };
      });

      setMessages(prev => [...prev, ...newMessages]);

    } catch (error) {
      console.error("❌ Rasa 서버 통신 오류:", error);
      console.error("❌ 오류 상세:", error.message);
      console.error("❌ 오류 스택:", error.stack);

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: `❌ 서버 오류: ${error.message}`,
          isUser: false,
        },
      ]);
    }
  };

  const renderItem = ({ item }) => {
    if (item.type === 'recipe') {
      const isFavorited = favoritedIds.includes(item.id);
      return (
        <View style={[styles.messageContainer, styles.recipeBox]}>
          <TouchableOpacity
            onPress={() => handleFavorite(item)}
            style={styles.starIcon}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18, color: isFavorited ? '#FFD700' : '#ccc' }}>⭐</Text>
          </TouchableOpacity>

          <Text style={styles.botText}>📸 <Text style={{ fontWeight: 'bold' }}>{item.title}</Text></Text>
          <Text style={styles.botText}>📋 재료: {item.ingredients}</Text>
          <Text style={styles.botText}>👨‍🍳 조리법: {item.instructions}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(item.url)}>
            <Text style={[styles.botText, { color: 'blue', textDecorationLine: 'underline' }]}>
              🔗 자세히 보기
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          item.isUser ? styles.userMessage : styles.botMessage,
        ]}
      >
        <Text style={item.isUser ? styles.userText : styles.botText}>
          {item.text}
        </Text>
      </View>
    );
  };

  const handleFavorite = async (recipe) => {
    try {
      const userId = userId || await AsyncStorage.getItem("userId");

      if (!userId) {
        alert("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
        return;
      }

      console.log("💾 즐겨찾기 저장 시도:", { userId, recipe });

      const response = await fetch("http://localhost:5000/recipes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          recipe_title: recipe.title,
          recipe_url: recipe.url,
          rcp_sno: recipe.rcp_sno,
        }),
      });

      const result = await response.json();
      console.log("💾 즐겨찾기 저장 결과:", result);

      if (response.ok) {
        setFavoritedIds(prev => [...prev, recipe.id]);
        Toast.show({
          type: 'success',
          text1: '⭐ 즐겨찾기 완료!',
          position: 'bottom',
          visibilityTime: 2000,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: '저장 실패',
          text2: result.error || '알 수 없는 오류',
          position: 'bottom',
        });
      }

    } catch (err) {
      console.error("❌ 즐겨찾기 저장 오류:", err);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar />
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="메시지를 입력하세요..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>전송</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <FooterBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  chatArea: { flex: 1, justifyContent: 'space-between' },
  messagesList: { paddingVertical: 20, paddingHorizontal: 16 },
  messageContainer: { maxWidth: '80%', marginVertical: 6, padding: 12, borderRadius: 12 },
  userMessage: { backgroundColor: '#9ae87f', alignSelf: 'flex-end', borderBottomRightRadius: 0 },
  botMessage: { backgroundColor: '#eee', alignSelf: 'flex-start', borderBottomLeftRadius: 0 },
  recipeBox: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative',
    padding: 10,
    width: '90%',
    overflow: 'visible', // 명시적으로 추가해도 좋음
  },
  userText: { color: '#fff' },
  botText: { color: '#333' },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#ddd', alignItems: 'center', backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 16, marginRight: 8 },
  sendButton: { backgroundColor: '#9ae87f', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  sendButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  starIcon: {
    position: 'absolute',
    top: 4,
    right: 8,
    zIndex: 10,
    padding: 6, // 클릭 가능한 영역 확대
  },
});
