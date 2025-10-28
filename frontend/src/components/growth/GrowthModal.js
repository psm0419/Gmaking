import React from 'react';
import { createPortal } from 'react-dom';

/**
 * 캐릭터 성장 확인 모달 (부화권 조건 제거)
 * @param {{
 *   open: boolean,
 *   characterName: string,
 *   isGrowing: boolean,
 *   currentGradeLabel: string,
 *   nextGradeLabel: string,
 *   requiredClearCount: number,
 *   currentClearCount: number,
 *   onConfirm: () => void,
 *   onClose: () => void
 * }} props
 */
export default function GrowthModal({
  open,
  characterName,
  isGrowing,
  currentGradeLabel,
  nextGradeLabel,
  requiredClearCount,
  currentClearCount,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  // 조건: 클리어 횟수만 체크
  const isClearConditionMet = currentClearCount >= requiredClearCount;
  const isMaxGrade = nextGradeLabel === "최대 단계";
  const canGrow = isClearConditionMet && !isGrowing;

  // 버튼 텍스트 결정
  const getButtonText = () => {
    if (isGrowing) return "진화 중...";
    if (isMaxGrade) return "최대 단계";
    if (!isClearConditionMet) return "클리어 부족";
    return "성장 시작";
  };

  const renderContent = () => {
    // 1. 로딩 중
    if (isGrowing) {
      return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[250px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FFC700] border-t-transparent mb-6"></div>
          <h3 className="text-2xl font-bold text-white mb-2">캐릭터 진화 중...</h3>
          <p className="text-gray-400 text-center whitespace-nowrap">
            AI가 새로운 외형을 디자인하고 있습니다.
            <br />
            <strong>잠시만 기다려 주세요</strong>
          </p>
        </div>
      );
    }

    // 2. 최대 단계
    if (isMaxGrade) {
      return (
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-4">최대 성장 단계</h3>
          <p className="text-gray-300 mb-6">
            <span className="font-semibold text-[#FFC700]">{characterName}</span>은(는) 이미 <strong>최대 단계</strong>입니다.
          </p>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg text-white bg-gray-600 hover:bg-gray-500 transition"
            >
              닫기
            </button>
          </div>
        </div>
      );
    }

    // 3. 일반 상태
    return (
      <>
        <h3 className="text-xl font-bold text-white mb-4">캐릭터 성장 확인</h3>
        <p className="text-gray-300 mb-6 text-center">
          <span className="font-semibold text-[#FFC700]">{characterName}</span>을(를) 성장시키시겠습니까?
          <br />
          성장 성공 시 스탯이 상승합니다.
        </p>

        {/* 클리어 조건 박스 */}
        <div className={`p-4 rounded-lg mb-6 border ${
          isClearConditionMet
            ? 'bg-green-900/50 border-green-600'
            : 'bg-red-900/50 border-red-600'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-white/90">스테이지 클리어</span>
            <span className={`text-xl font-extrabold ${
              isClearConditionMet ? 'text-green-400' : 'text-red-400'
            }`}>
              {currentClearCount} / {requiredClearCount}회
            </span>
          </div>
          {isClearConditionMet && (
            <p className="text-xs text-green-300 mt-1 text-right">조건 충족!</p>
          )}
        </div>

        {/* 버튼 영역 */}
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
            disabled={!canGrow}
            className={`px-5 py-2 rounded-lg font-bold transition shadow-md ${
              canGrow
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {getButtonText()}
          </button>
        </div>
      </>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm border border-[#FFC700]/50"
        onClick={(e) => e.stopPropagation()}
      >
        {renderContent()}
      </div>
    </div>,
    document.body
  );
}