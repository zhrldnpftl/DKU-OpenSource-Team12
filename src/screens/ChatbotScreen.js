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
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeaderBar from '../components/HeaderBar';
import FooterBar from '../components/FooterBar';
import Toast from 'react-native-toast-message';

// 봇 아바타 이미지 로드 (assets 폴더에 fridge-bot.png 복사해 두세요)
const BOT_AVATAR = require('../../assets/fridge-bot.png');

export default function ChatbotScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef();
  const [favoritedIds, setFavoritedIds] = useState([]);
  const [userName, setUserName] = useState(null);
  const [userId, setUserId] = useState(null);

  // -- 사용자 ID 슬롯 전송 함수, 초기 메시지 세팅 --
  const sendUserIdIntent = async storedUserId => {
    if (!storedUserId) return;
    try {
      await fetch("http://localhost:5005/webhooks/rest/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: storedUserId,
          message: `/inform_user_id{"user_id": "${storedUserId}"}`,
        }),
      });
    } catch (error) {
      console.error("❌ user_id intent 전송 오류:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const name = await AsyncStorage.getItem('userName');
        const id   = await AsyncStorage.getItem('userId');
        setUserName(name);
        setUserId(id);
        await sendUserIdIntent(id);
        // 첫 인사 메시지
        setMessages([
          {
            id: '1',
            text: name
              ? `${name}님, 안녕하세요! 무엇을 도와드릴까요?`
              : `안녕하세요! 무엇을 도와드릴까요?`,
            isUser: false,
          },
        ]);
      } catch (error) {
        console.error("초기화 오류:", error);
      }
    };
    init();
  }, []);

  // -- 메시지 전송 핸들러 --
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { id: Date.now().toString(), text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    try {
      const storedUserId = userId || (await AsyncStorage.getItem("userId"));
      const requestData = { sender: storedUserId || "default", message: currentInput };
      const response = await fetch("http://localhost:5005/webhooks/rest/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setMessages(prev => [
          ...prev,
          { id: Date.now().toString(), text: "죄송합니다. 서버에서 응답을 받지 못했어요 😢", isUser: false },
        ]);
        return;
      }

      const newMessages = data.map((msg, idx) => {
        if (msg.custom && msg.custom.type === 'recipe') {
          return {
            id: Date.now().toString() + idx,
            type: 'recipe',
            title: msg.custom.title,
            ingredients: msg.custom.ingredients,
            instructions: msg.custom.instructions,
            url: msg.custom.url,
            rcp_sno: msg.custom.rcp_sno,
            isUser: false,
          };
        }
        return {
          id: Date.now().toString() + idx,
          text: msg.text || "응답 텍스트가 없습니다",
          isUser: false,
        };
      });

      setMessages(prev => [...prev, ...newMessages]);
    } catch (error) {
      console.error("❌ Rasa 서버 통신 오류:", error);
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), text: `❌ 서버 오류: ${error.message}`, isUser: false },
      ]);
    }
  };

  // -- 렌더링: FlatList item --
  const renderItem = ({ item }) => {
    // 봇 메시지 전용 래퍼 (아바타 + 말풍선)
    const BotRow = ({ children }) => (
      <View style={styles.botRow}>
        <Image source={BOT_AVATAR} style={styles.avatar} />
        <View style={styles.messageContainer}>{children}</View>
      </View>
    );

    // 레시피 카드
    if (item.type === 'recipe') {
      const isFav = favoritedIds.includes(item.id);
      return (
        <BotRow>
          <TouchableOpacity onPress={() => handleFavorite(item)} style={styles.starIcon}>
            <Text style={{ fontSize: 18, color: isFav ? '#FFD700' : '#ccc' }}>⭐</Text>
          </TouchableOpacity>
          <Text style={styles.botText}>📸 <Text style={{ fontWeight: 'bold' }}>{item.title}</Text></Text>
          <Text style={styles.botText}>📋 재료: {item.ingredients}</Text>
          <Text style={styles.botText}>👨‍🍳 조리법: {item.instructions}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(item.url)}>
            <Text style={[styles.botText, styles.linkText]}>🔗 자세히 보기</Text>
          </TouchableOpacity>
        </BotRow>
      );
    }

    // 일반 메시지
    if (item.isUser) {
      return (
        <View style={[styles.messageContainer, styles.userMessage]}>
          <Text style={styles.userText}>{item.text}</Text>
        </View>
      );
    } else {
      return (
        <BotRow>
          <Text style={styles.botText}>{item.text}</Text>
        </BotRow>
      );
    }
  };

  // -- 즐겨찾기 핸들러 --
  const handleFavorite = async recipe => {
    try {
      const uid = userId || (await AsyncStorage.getItem("userId"));
      if (!uid) return alert("사용자 정보를 찾을 수 없습니다.");
      const res = await fetch("http://localhost:5000/recipes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: uid,
          recipe_title: recipe.title,
          recipe_url: recipe.url,
          rcp_sno: recipe.rcp_sno,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setFavoritedIds(prev => [...prev, recipe.id]);
        Toast.show({ type: 'success', text1: '⭐ 즐겨찾기 완료!', position: 'bottom', visibilityTime: 2000 });
      } else {
        Toast.show({ type: 'error', text1: '저장 실패', text2: result.error, position: 'bottom' });
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
  messageContainer: { 
    maxWidth: '80%', 
    marginVertical: 6, 
    padding: 12, 
    borderRadius: 12,
    backgroundColor: '#eee'
  },
  userMessage: { 
    backgroundColor: '#9ae87f', 
    alignSelf: 'flex-end', 
    borderBottomRightRadius: 0 
  },
  botRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
    paddingHorizontal: 8
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8
  },
  userText: { color: '#fff' },
  botText: { color: '#333' },
  recipeBox: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    width: '90%',
    borderRadius: 12
  },
  linkText: {
    color: 'blue',
    textDecorationLine: 'underline'
  },
  inputContainer: { 
    flexDirection: 'row', 
    padding: 10, 
    borderTopWidth: 1, 
    borderColor: '#ddd', 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  },
  input: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    fontSize: 16, 
    marginRight: 8 
  },
  sendButton: { 
    backgroundColor: '#9ae87f', 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 20 
  },
  sendButtonText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 16 
  },
  starIcon: {
    position: 'absolute',
    top: 4,
    right: 8,
    zIndex: 10,
    padding: 6, // 클릭 영역 확대
  },
});
