import React, {useCallback} from 'react';
import { Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { startCharacterGeneration } from '../../api/characterCreation/characterCreationApi';

const CharacterCreationPrompt = () => {
    const navigate = useNavigate();

    const { user, isLoggedIn, isLoading, token, applyNewToken } = useAuth();

    const handleCharacterCreationStart = useCallback(async (e) => {
            e.preventDefault(); 
    
            // 1. 로그인 상태 체크
            if (!isLoggedIn || !token || !user) {
                alert('캐릭터 뽑기를 시작하려면 먼저 로그인해야 합니다.');
                navigate('/login');
                return;
            }
    
            const currentCount = user?.incubatorCount || 0;
            
            // 2. 부화권 1개 미만일 경우 예외 처리
            if (currentCount <= 0) {
                alert('캐릭터 뽑기를 시작할 수 없습니다. 부화권 수량이 부족합니다.');
                return;
            }
    
            // 3. 사용자에게 확인 요청
            const isConfirmed = window.confirm(
                `캐릭터 뽑기를 시작하시겠습니까?\n\n이 작업으로 부화권이 1개 감소됩니다. (현재 ${currentCount}개)`
            );
    
            if (!isConfirmed) {
                return; // 취소
            }
    
            try {
                // 4. 부화권 차감 API 호출
                const result = await startCharacterGeneration(token);
    
                if (result.errorMessage) {
                    alert(`캐릭터 뽑기 시작 실패: ${result.errorMessage}`);
                    return;
                }
    
                // 5. 새 토큰 적용 및 페이지 이동
                if (result.newToken) {
                    applyNewToken(result.newToken);
                }
                
                navigate('/create-character'); // 캐릭터 생성 페이지로 이동
    
            } catch (error) {
                console.error('캐릭터 뽑기 시작 처리 중 오류 발생:', error);
                alert('캐릭터 뽑기 시작 중 알 수 없는 서버 오류가 발생했습니다.');
            }
    
        }, [navigate, isLoggedIn, token, applyNewToken, user]);

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border-2 border-red-500 transform transition duration-500 hover:scale-105">
            <div className="text-center">
                <Wand2 className="mx-auto w-16 h-16 text-red-400 mb-4 animate-bounce" />
                <h3 className="text-3xl font-extrabold text-white mb-20">
                    캐릭터가 없습니다!
                </h3>
                <p className="text-md text-gray-400 mb-8">
                    AI 기반 캐릭터 생성을 시작하고 게임에 접속하세요.
                </p>

                <button
                    onClick={handleCharacterCreationStart} 
                    className="mt-4 w-full py-3 bg-red-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-red-700 transition"
                >
                    캐릭터 생성
                </button>
            </div>
        </div>
    );
};

export default CharacterCreationPrompt;