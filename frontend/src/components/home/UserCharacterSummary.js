import React from 'react';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserCharacterSummary = ({ user, displayName, characterImageUrl, incubatorCount, isAdFree, characterCount }) => {
    const navigate = useNavigate(); 

    const adFreeBadge = isAdFree 
        ? <span className="text-xs font-bold text-green-400 ml-2">(AD-FREE)</span>
        : null;

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
                    onClick={() => navigate('/create-character')}
                >
                    캐릭터 추가 생성
                </button>
            </div>
        </div>
    );
};

export default UserCharacterSummary;