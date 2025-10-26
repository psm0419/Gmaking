import React, { useCallback} from 'react';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { startCharacterGeneration } from '../../api/characterCreation/characterCreationApi';

const UserCharacterSummary = ({ displayName, characterImageUrl, incubatorCount, isAdFree, characterCount }) => {
    const navigate = useNavigate(); 

    const { user, token, applyNewToken } = useAuth();

    const adFreeBadge = isAdFree 
        ? <span className="text-xs font-bold text-green-400 ml-2">(AD-FREE)</span>
        : null;

    const handleStartNewCharacter = useCallback(async () => {
        const currentCount = user?.incubatorCount || 0;
        
        // 부화권 1개 미만일 경우 예외 처리
        if (currentCount <= 0) {
            alert('캐릭터 추가 생성을 시작할 수 없습니다. 부화권 수량이 부족합니다.');
            return;
        }

        // 사용자에게 확인 요청
        const isConfirmed = window.confirm(
            `캐릭터 추가 생성을 시작하시겠습니까?\n\n이 작업으로 부화권이 1개 감소됩니다. (현재 ${currentCount}개)`
        );

        if (!isConfirmed) {
            return; // 취소
        }

        try {
            // 부화권 차감 API 호출
            const result = await startCharacterGeneration(token);

            if (result.errorMessage) {
                alert(`캐릭터 추가 생성 시작 실패: ${result.errorMessage}`);
                return;
            }

            if (result.newToken) {
                applyNewToken(result.newToken); 
            }
            
            navigate('/create-character');

        } catch (error) {
            console.error('캐릭터 추가 생성 시작 처리 중 오류 발생:', error);
            alert('캐릭터 추가 생성 시작 중 알 수 없는 서버 오류가 발생했습니다.');
        }

    }, [navigate, token, applyNewToken, user]);

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border-2 border-yellow-400">
            <div className="text-center">
                <div className="mx-auto w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-3 border-4 border-yellow-500 overflow-hidden">
                    {characterImageUrl ? (
                        <img
                            src={characterImageUrl}
                            alt="사용자 캐릭터"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User className="w-12 h-12 text-yellow-400" />
                    )}
                </div>
                <h3 className="text-3xl font-extrabold text-white mb-1">
                    {displayName}
                    {adFreeBadge}
                </h3>

                <div className="text-left bg-gray-700 p-4 rounded-lg space-y-2 text-sm text-gray-300 mt-4">
                    <p>보유 부화권: {incubatorCount.toLocaleString()}개</p> 
                    <p>캐릭터 수: {characterCount}개</p>
                </div>
                
                <button
                    className="mt-4 w-full py-2 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition"
                    onClick={() => navigate('/my-page')}
                >
                    내 정보 보기
                </button>
                <button
                    className="mt-4 w-full py-2 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 transition"
                    onClick={handleStartNewCharacter}
                >
                    캐릭터 추가 생성
                </button>
            </div>
        </div>
    );
};

export default UserCharacterSummary;