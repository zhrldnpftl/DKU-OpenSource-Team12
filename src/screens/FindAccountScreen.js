import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HeaderBar from '../components/HeaderBar';
import FooterBar from '../components/FooterBar';

// 🧩 아이디/비밀번호 찾기 화면 컴포넌트 정의
export default function FindAccountScreen() {
  // 🔁 화면 이동을 위한 네비게이션 객체
  const navigation = useNavigation();

  // ✅ 아이디 찾기 관련 상태
  const [email, setEmail] = useState('');                 // 이메일 입력값
  const [foundId, setFoundId] = useState('');             // 찾은 아이디
  const [notFound, setNotFound] = useState(false);        // 아이디를 못 찾은 경우 표시용

  // ✅ 비밀번호 재설정 관련 상태
  const [pwEmail, setPwEmail] = useState('');             // 이메일 입력값
  const [pwUserId, setPwUserId] = useState('');           // 사용자 ID 입력값
  const [pwResetStatus, setPwResetStatus] = useState(""); // 응답 메시지 상태


  // ✅ 로그인 화면으로 이동
  const goToLogin = () => navigation.navigate('Login');

  // ✅ 회원가입 화면으로 이동
  const goToSignUp = () => navigation.navigate('SignUp');

  // ✅ [1] 아이디 찾기 요청 처리
  const handleFindId = async () => {
    try {
      const response = await fetch(`http://localhost:5000/find-id/${email}`);
      const result = await response.json();

      if (!response.ok) {
        setNotFound(true);   // ❌ 실패 시 → 아이디 없음 처리
        setFoundId('');
        return;
      }

      setFoundId(result.user_id); // ✅ 성공 시 → 아이디 저장
      setNotFound(false);
    } catch (error) {
      Alert.alert('서버 오류', '서버에 연결할 수 없습니다.');   // ⚠️ 네트워크 에러
    }
  };

  // ✅ [2] 비밀번호 재설정 요청 처리
  const handleResetPassword = async () => {
    if (!pwEmail || !pwUserId) {
      setPwResetStatus("⚠️ 이메일과 아이디를 모두 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pwEmail,
          user_id: pwUserId,
        }),
      });

      const result = await response.json();
      console.log("비밀번호 재설정 result: ", result);

      // ❌ 다양한 실패 상황별 메시지 설정
      if (response.status === 404) {
        setPwResetStatus("해당 이메일로 가입된 정보가 없습니다.");
      } else if (response.status === 401) {
        setPwResetStatus("아이디가 일치하지 않습니다.");
      } else if (!response.ok) {
        setPwResetStatus(result.error || "문제가 발생했습니다.");
      } else {
        // ✅ 성공적으로 메일 전송 완료
        setPwResetStatus("✅ 임시 비밀번호가 이메일로 발송되었습니다.");
      }
    } catch (error) {
      setPwResetStatus("서버 오류: 연결에 실패했습니다.");
    }
  };


  return (
    <View style={styles.container}>
      <HeaderBar />           {/* 📌 상단 공통 헤더 */}
      {/* ✅ [1] 아이디 찾기 섹션 */}
      <Text style={styles.title}>아이디 찾기</Text>

      {/* 이메일 입력 필드 */}
      <Text style={styles.label}>이메일</Text>
      <TextInput
        style={styles.input}
        placeholder="가입한 이메일을 입력해주세요"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* ✅ 이메일 입력 후 아이디 찾기 버튼 → 성공 시 결과 or 실패 시 메시지 */}
      {foundId === '' && notFound === false ? (
        <TouchableOpacity style={styles.button} onPress={handleFindId}>
          <Text style={styles.buttonText}>아이디 찾기</Text>
        </TouchableOpacity>
      ) : foundId !== '' ? (
        <>
        {/* ✅ 아이디 찾기 성공 결과 */}
          <Text style={styles.resultText}>아이디 : {foundId}</Text>
          <TouchableOpacity style={styles.button} onPress={goToLogin}>
            <Text style={styles.buttonText}>로그인하러 가기</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
        {/* ❌ 아이디 찾기 실패 결과 */}
          <Text style={styles.notFoundText}>해당 이메일로 가입된 정보가 없습니다.</Text>
          <TouchableOpacity style={styles.button} onPress={handleFindId}>
            <Text style={styles.buttonText}>아이디 찾기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={goToSignUp}>
            <Text style={styles.buttonText}>회원가입 하러가기</Text>
          </TouchableOpacity>
        </>
      )}

      {/* 🔻 아이디 찾기와 비밀번호 재설정 구분선 */}
      <View style={styles.separator} />

      {/* 🟢 비밀번호 재설정 섹션 */}
      <Text style={styles.title}>비밀번호 재설정</Text>

      {/* 이메일 입력 */}
      <Text style={styles.label}>이메일</Text>
      <TextInput
        style={styles.input}
        placeholder="가입한 이메일을 입력해주세요"
        keyboardType="email-address"
        value={pwEmail}
        onChangeText={setPwEmail}
      />

      {/* 아이디 입력 */}
      <Text style={styles.label}>아이디</Text>
      <TextInput
        style={styles.input}
        placeholder="아이디를 입력해주세요"
        value={pwUserId}
        onChangeText={setPwUserId}
      />

      {/* 재설정 버튼 */}
      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>비밀번호 재설정 메일 보내기</Text>
      </TouchableOpacity>

      {/* ✅ 비밀번호 재설정 결과 메시지 표시 */}
      {pwResetStatus !== '' && (
        <>
          <Text
            style={[
              styles.resultText,
              pwResetStatus.includes("✅") ? styles.successText : styles.notFoundText
            ]}
          >
            {pwResetStatus}
          </Text>

          {/* ✅ 성공했을 때만 로그인 버튼 표시 */}
          {pwResetStatus.includes("✅") && (
            <TouchableOpacity style={styles.button} onPress={goToLogin}>
              <Text style={styles.buttonText}>로그인하러 가기</Text>
            </TouchableOpacity>
          )}
        </>
      )}
      <FooterBar />   {/* 📌 하단 공통 바 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#9ae87f',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  resultText: {
    marginTop: 20,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  notFoundText: {
    marginTop: 20,
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginVertical: 30,
  },
  successText: {
  marginTop: 20,
  fontSize: 14,
  color: 'blue',
  textAlign: 'center',
}
});
