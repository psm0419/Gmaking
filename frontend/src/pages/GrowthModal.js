import React from 'react';
import { createPortal } from 'react-dom';

/**
 * 캐릭터 성장 확인 및 상태를 보여주는 모달 컴포넌트
 * @param {{open: boolean, characterName: string, incubatorCount: number, isGrowing: boolean, onConfirm: () => void, onClose: () => void}} props
 */
export default function GrowthModal({
    open,
    characterName,
    incubatorCount,
    isGrowing,
    onConfirm,
    onClose,
}) {
    if (!open) return null;

    const disabled = isGrowing || incubatorCount <= 0;

    const renderContent = () => {
        if (isGrowing) {
            return (
                <div className="text-center p-6">
                    <svg className="animate-spin h-8 w-8 text-[#FFC700] mx-auto mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-white text-lg font-semibold">
                        {characterName} 성장 작업 요청 중...
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        잠시만 기다려 주세요. (백엔드 작업 중)
                    </p>
                </div>
            );
        }

        return (
            <>
                <h3 className="text-xl font-bold text-white mb-4">캐릭터 성장 확인</h3>
                <p className="text-gray-300 mb-6">
                    <span className="font-semibold text-[#FFC700]">{characterName}</span>을(를) 다음 단계로 성장시키시겠습니까?
                    이 작업은 부화권 <span className="font-bold text-red-400">1개</span>를 소모합니다.
                </p>

                <div className="flex justify-between items-center bg-gray-700 p-3 rounded-lg mb-6">
                    <span className="text-gray-300 font-medium">현재 보유 부화권:</span>
                    <span className="text-2xl font-extrabold text-[#FFC700]">{incubatorCount} 🎟️</span>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isGrowing}
                        className="px-5 py-2 rounded-lg text-white bg-gray-600 hover:bg-gray-500 transition disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={disabled}
                        className={`px-5 py-2 rounded-lg font-bold transition
                            ${disabled 
                                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                : 'bg-[#FF8C00] text-white hover:bg-[#E07B00]'
                            }`}
                    >
                        {incubatorCount <= 0 ? "부화권 부족" : "성장 시작"}
                    </button>
                </div>
            </>
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm border border-[#FFC700]/50" 
                onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫히지 않게
            >
                {renderContent()}
            </div>
        </div>,
        document.body
    );
}