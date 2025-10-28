// GrowthResultModal.js
import React from 'react';
import { createPortal } from 'react-dom';

function GrowthResultModal({ currentCharacter, growthResult, onClose }) {
    if (!currentCharacter || !growthResult) return null;

    // 성장 후 이미지 (Base64 -> Data URL 변환)
    const newImageSrc = `data:image/png;base64,${growthResult.image_base64}`;
    // 성장 전 이미지 (기존 URL 사용)
    const oldImageSrc = currentCharacter.imageUrl;

    return createPortal(
        <div className="fixed inset-0 z-[1001] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 w-full max-w-2xl shadow-2xl transition-all duration-300">
                
                <h3 className="text-3xl font-extrabold text-emerald-400 text-center mb-10">
                     {currentCharacter.name}의 새로운 모습 
                </h3>

                {/* 이미지 비교 섹션 */}
                <div className="flex justify-center items-center gap-12 p-6 rounded-lg bg-gray-900 border border-gray-700">
                    
                    {/* 성장 전 (Old Image) */}
                    <div className="flex flex-col items-center">
                        <span className="text-gray-400 text-xl font-semibold mb-3">
                            성장 전
                        </span>
                        <div className="w-40 h-40 bg-gray-700 rounded-lg flex items-center justify-center p-3 border-2 border-yellow-500">
                            <img 
                                src={oldImageSrc} 
                                alt={`${currentCharacter.name} (성장 전)`} 
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                    </div>

                    {/* 화살표 */}
                    <div className="text-5xl text-emerald-400 font-black">
                        <span className="animate-pulse">→</span>
                    </div>

                    {/* 성장 후 (New Image) */}
                    <div className="flex flex-col items-center">
                        <span className="text-emerald-400 text-xl font-bold mb-3">
                            성장 후
                        </span>
                        <div className="w-40 h-40 bg-emerald-500 rounded-lg flex items-center justify-center p-3 border-4 border-emerald-300 shadow-lg">
                            <img 
                                src={newImageSrc} 
                                alt={`${currentCharacter.name} (성장 후)`} 
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-center mt-10">
                    <button
                        onClick={onClose} 
                        className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-500 transition shadow-lg"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default GrowthResultModal;