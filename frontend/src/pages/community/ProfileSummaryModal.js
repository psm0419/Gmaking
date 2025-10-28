import React from 'react';
import { XCircle, Trophy } from 'lucide-react';

const ProfileSummaryModal = ({ show, profileData, onClose }) => {
    if (!show || !profileData) return null;

    const profileImageUrl = profileData.characterImageUrl 
        ? profileData.characterImageUrl 
        : 'https://via.placeholder.com/150/000000/FFFFFF?text=No+Img'; 
        
    const userLevel = profileData.gradeId || 1;
    const totalClears = profileData.totalStageClears || 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex justify-center items-center p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-yellow-500 w-full max-w-sm transform transition-all duration-300 scale-100 opacity-100 relative"
                onClick={(e) => e.stopPropagation()} 
            >
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white transition">
                    <XCircle className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center">
                    <img src={profileImageUrl} alt="Profile" className="w-24 h-24 object-cover rounded-full border-4 border-yellow-500 mb-4 shadow-lg" />
                    <h3 className="text-2xl font-bold text-white mb-2">{profileData.userNickname}</h3>
                    <p className="text-md text-yellow-400 font-semibold mb-6">Lv. {userLevel}</p>
                    <div className="w-full space-y-3 p-4 bg-gray-700 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 flex items-center">
                                <Trophy className="w-4 h-4 mr-2 text-blue-400"/>총 클리어 스테이지 
                            </span>
                            <span className="text-lg font-bold text-white">{totalClears} 회</span>
                        </div>
                    </div>
                </div>
                <div className="mt-6 text-center">
                    <button onClick={onClose} className="w-full py-2 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-400 transition">
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSummaryModal;