import React from 'react';
import { createPortal } from 'react-dom';

/**
 * 캐릭터 성장 확인 및 상태를 보여주는 모달 컴포넌트
 * @param {{
 *   open: boolean, 
 *   characterName: string, 
 *   incubatorCount: number, // 🚨 부화권 로직은 유지하되, 주 로직은 아님
 *   isGrowing: boolean,
 *   currentGradeLabel: string, // ✅ 현재 등급 레이블 (예: R)
 *   nextGradeLabel: string, // ✅ '다음 등급' 대신 '다음 단계'의 레이블
 *   requiredClearCount: number, // ✅ 요구 클리어 횟수 (예: 20)
 *   currentClearCount: number, // ✅ 현재 클리어 횟수 (예: 15)
 *   onConfirm: () => void, 
 *   onClose: () => void
 * }} props
 */
export default function GrowthModal({
    open,
    characterName,
    incubatorCount, 
    isGrowing,
    currentGradeLabel,
    nextGradeLabel,
    requiredClearCount,
    currentClearCount,
    onConfirm,
    onClose,
}) {
    if (!open) return null;

    const disabled = isGrowing; 
    
    // 성장 조건 충족 여부를 여기서 한번 더 확인 (UI 표시를 위함)
    const isConditionMet = currentClearCount >= requiredClearCount;
    const isMaxGrade = nextGradeLabel === "최대 단계";

    const renderContent = () => {
       if (isGrowing) {
            return (
                <div className="flex flex-col items-center justify-center p-8 min-h-[250px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FFC700] border-t-transparent mb-6"></div>
                    <h3 className="text-2xl font-bold text-white mb-2">캐릭터 진화 중...</h3>
                    <p className="text-gray-400 text-center whitespace-nowrap">
                        AI가 새로운 외형을 디자인하고 있습니다.
                        <br />
                        **잠시만 기다려 주세요**
                    </p>
                    {/* 로딩 중에는 모달을 닫을 수 없게 합니다 (UI만) */}
                </div>
            );
        }

        if (isMaxGrade) {
            return (
                <>
                    <h3 className="text-xl font-bold text-white mb-4">성장 불가</h3>
                    <p className="text-gray-300 mb-6">
                        <span className="font-semibold text-[#FFC700]">{characterName}</span>을(를) **다음 단계**로 성장시키시겠습니까?
                    </p>
                    <div className="flex justify-end">
                         <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-lg text-white bg-gray-600 hover:bg-gray-500 transition"
                        >
                            닫기
                        </button>
                    </div>
                </>
            );
        }

        return (
            <>
                <h3 className="text-xl font-bold text-white mb-4">캐릭터 성장 확인</h3>
                <p className="text-gray-300 mb-6">
                    <span className="font-semibold text-[#FFC700]">{characterName}</span>을(를) 성장시키시겠습니까?
                    <br/>성장에 성공하면 스탯이 추가됩니다.
                </p>
                
                {/* 성장 조건 표시 (부화권 대신 클리어 횟수를 강조) */}
               <div className={`p-4 rounded-lg mb-6 ${isConditionMet ? 'bg-green-900/50 border border-green-600' : 'bg-red-900/50 border border-red-600'}`}>
                    <span className="text-base font-semibold block mb-2 text-white/90">필수 성장 조건</span>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-medium">성장 요구 횟수:</span>
                        <span className={`text-xl font-extrabold ${isConditionMet ? 'text-green-400' : 'text-red-400'}`}>
                            {currentClearCount} / {requiredClearCount}회
                        </span>
                    </div>
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
                        disabled={disabled || !isConditionMet || incubatorCount <= 0}
                        className={`px-5 py-2 rounded-lg font-bold transition
                            ${(disabled || !isConditionMet || incubatorCount <= 0) 
                                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                : 'bg-[#FF8C00] text-white hover:bg-[#E07B00]'
                            }`}
                    >
                        {isConditionMet && incubatorCount > 0 ? "성장 시작" : "조건 미충족"}
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