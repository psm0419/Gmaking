import React, {useCallback} from 'react';
import { Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CharacterCreationPrompt = () => {
    const navigate = useNavigate();

    const { user, token } = useAuth();

    const handleStartCharacterCreation = useCallback(async () => {
        if (!token || !user) {
            alert('캐릭터 생성을 시작하려면 먼저 로그인해야 합니다.');
            navigate('/login'); 
        return;
        }
    }, [navigate, token, user]);

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
                    onClick={handleStartCharacterCreation} 
                    className="mt-4 w-full py-3 bg-red-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-red-700 transition"
                >
                    캐릭터 생성
                </button>
            </div>
        </div>
    );
};

export default CharacterCreationPrompt;