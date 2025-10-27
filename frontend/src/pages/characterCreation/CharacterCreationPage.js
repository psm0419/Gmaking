import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Wand2, RefreshCw, CheckCircle, AlertTriangle, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { generateCharacterPreview, finalizeCharacter } from '../../api/characterCreation/characterCreationApi';

const CharacterCreationPage = () => {
    const navigate = useNavigate();
    const { setCharacterCreated, setToken, token, applyNewToken } = useAuth();
    const [imageFile, setImageFile] = useState(null);
    const [characterName, setCharacterName] = useState('');

    // 'pending', 'generating', 'preview', 'finalizing', 'completed', 'error'
    const [status, setStatus] = useState('pending');
    const [generatedImage, setGeneratedImage] = useState(null);
    const [predictedAnimal, setPredictedAnimal] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    // 미리보기/재생성 횟수 (최대 3회)
    const [previewCount, setPreviewCount] = useState(0);
    // 사용자 추가 프롬프트
    const [userPrompt, setUserPrompt] = useState('');
    const [previewData, setPreviewData] = useState(null);


    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setStatus('pending');
            setErrorMessage('');

            // 파일 미리보기 로직
            const reader = new FileReader();
            reader.onloadend = () => setGeneratedImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();

        // 입력 유효성 검사
        if (!imageFile || characterName.trim() === '') {
            alert('이미지와 캐릭터 이름이 필요합니다.');
            return;
        }

        // 미리보기 횟수 제한 체크 (3회 초과 시 재생성 불가)
        if (previewCount >= 3 && status === 'preview') {
            setErrorMessage('이미지 미리보기는 최대 3회만 가능합니다. 최종 확정해주세요.');
            return;
        }

        setStatus('generating');
        setErrorMessage('');

        try {
            // generateCharacterPreview API 호출
            const response = await generateCharacterPreview(imageFile, characterName, token, userPrompt);

            // 응답 데이터 임시 저장
            setPreviewData({
                characterName: response.characterName,
                imageUrl: response.imageUrl,
                predictedAnimal: response.predictedAnimal
            });

            // 응답으로 받은 이미지 URL로 미리보기 업데이트
            setGeneratedImage(response.imageUrl);
            setPredictedAnimal(response.predictedAnimal);
            setStatus('preview');
            setPreviewCount(prev => prev + 1); // 미리보기 횟수 증가

        } catch (error) {
            console.error("캐릭터 생성 미리보기 중 오류:", error);
            setErrorMessage(error.message || '캐릭터 생성 미리보기 중 알 수 없는 오류가 발생했습니다.');
            setStatus('error');
        }
    };

    // 캐릭터 최종 확정 처리 (Finalize)
    const handleFinalize = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!characterName.trim() || !generatedImage || status !== 'preview') {
            setErrorMessage('캐릭터 이름 입력과 이미지 생성을 먼저 완료해야 합니다.');
            return;
        }

        // 로딩 상태
        setStatus('finalizing');

        try {
            const finalCharacterData = {
                characterName: characterName,
                imageUrl: generatedImage,
                predictedAnimal: predictedAnimal,
            };

            // 최종 확정 API 호출
            const response = await finalizeCharacter(finalCharacterData, token);

            if (response.newToken) {
                applyNewToken(response.newToken);
            }

            // 최종 상태 변경 및 완료 메시지
            setStatus('completed');
            // navigate('/');

        } catch (error) {
            console.error('캐릭터 최종 확정 중 오류:', error);

            let displayMessage = '캐릭터 최종 확정 실패: 다시 시도해 주세요.';

            if (error.response && error.response.data && error.response.data.errorMessage) {
                displayMessage = error.response.data.errorMessage;
            } else if (error.message) {
                if (error.message.includes('Duplicate entry')) {
                    displayMessage = `캐릭터 이름 '${characterName}'(이)가 이미 존재합니다. 다른 이름을 사용해주세요.`;
                } else {
                    displayMessage = error.message;
                }
            }

            setErrorMessage(displayMessage);
            setStatus('preview');
        }
    };

    const handleGoToGame = useCallback(() => {
        navigate('/');
    }, [navigate]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-900">
            <Header />
            <main className="flex-grow p-4 sm:p-8 flex items-center justify-center">
                <form onSubmit={handleGenerate} className="w-full max-w-4xl bg-gray-800 p-6 sm:p-10 rounded-2xl shadow-2xl space-y-8 text-white">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-yellow-400">나만의 캐릭터 만들기</h2>
                    <p className="text-center text-gray-400">동물 이미지를 기반으로 AI가 캐릭터를 생성해 드립니다.</p>

                    {/* 이미지 및 이름 입력 영역 */}
                    <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8">

                        {/* 이미지 업로드 */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2">1. 기반 이미지 업로드</label>
                            <div
                                className={`h-48 flex flex-col items-center justify-center border-4 border-dashed rounded-xl transition duration-300 cursor-pointer 
                                    ${imageFile ? 'border-green-500 bg-gray-700' : 'border-gray-600 hover:border-blue-500 hover:bg-gray-700'}`}
                                onClick={() => document.getElementById('image-upload').click()}
                            >
                                {/* generatedImage는 GCS URL 또는 파일 리더 URL (로컬 미리보기) */}
                                {generatedImage && status !== 'error' ? (
                                    <img
                                        src={generatedImage}
                                        alt="미리보기 이미지"
                                        className="max-h-full max-w-full object-contain p-2 rounded-xl"
                                    />
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <p className="text-gray-400 text-center">클릭하여 곰, 독수리, 펭귄, 거북이 이미지 업로드 (jpg, png)</p>
                                    </>
                                )}
                                <input
                                    type="file"
                                    id="image-upload"
                                    accept="image/png, image/jpeg"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    disabled={status === 'generating' || status === 'finalizing' || status === 'completed'}
                                />
                            </div>
                        </div>

                        {/* 캐릭터 이름 입력 */}
                        <div className="flex-1 flex flex-col justify-center">
                            <label htmlFor="characterName" className="block text-sm font-medium mb-2">2. 캐릭터 이름 입력</label>
                            <input
                                id="characterName"
                                type="text"
                                placeholder="예: 용감한 펭귄"
                                value={characterName}
                                onChange={(e) => setCharacterName(e.target.value)}
                                disabled={status === 'generating' || status === 'finalizing' || status === 'completed'}
                                className="p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                            />

                            {/* 추가 프롬프트 입력창 */}
                            <label htmlFor="userPrompt" className="block text-sm font-medium mt-4 mb-2">3. 추가 프롬프트 (선택)</label>
                            <input
                                id="userPrompt"
                                type="text"
                                placeholder="예: 마법사 옷을 입혀주세요"
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                disabled={status === 'generating' || status === 'finalizing' || status === 'completed'}
                                className="p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* 상태 및 버튼 영역 */}
                    <div className="mt-8">
                        {/* 에러 메시지 */}
                        {errorMessage && (
                            <div className="bg-red-900 border border-red-500 p-3 rounded-lg flex items-center mb-4">
                                <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                                <p className="text-red-400 text-sm">{errorMessage}</p>
                            </div>
                        )}

                        {/* 미리보기 / 재생성 / 최종 확정 버튼 */}
                        <div className="flex flex-col space-y-4">

                            {/* 미리보기 / 재생성 버튼 */}
                            {(status === 'pending' || status === 'error' || status === 'preview') && status !== 'completed' && (
                                <button
                                    type="submit" // 폼 제출 (handleGenerate 호출)
                                    disabled={!imageFile || characterName.trim() === '' || previewCount >= 3 && status === 'preview'}
                                    className={`w-full py-3 text-xl font-bold rounded-lg shadow-lg transition duration-300 flex items-center justify-center 
                                        ${previewCount >= 3 && status === 'preview'
                                            ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-[1.01]'
                                        }`}
                                >
                                    {previewCount === 0 ? (
                                        <>
                                            <Wand2 className="w-6 h-6 mr-3" />
                                            캐릭터 생성 미리보기
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-6 h-6 mr-3" />
                                            재생성 시도 ({previewCount}/3)
                                        </>
                                    )}
                                </button>
                            )}

                            {/* 로딩 중 상태 표시 */}
                            {(status === 'generating' || status === 'finalizing') && (
                                <div className="w-full py-3 text-xl font-bold rounded-lg shadow-lg transition duration-300 flex items-center justify-center bg-gray-600 text-white">
                                    <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
                                    {status === 'generating' ? 'AI 캐릭터 생성 중...' : '최종 확정 중...'}
                                </div>
                            )}

                            {/* 최종 확정 버튼 (미리보기 상태일 때만 표시) */}
                            {status === 'preview' && (
                                <button
                                    type="button"
                                    onClick={handleFinalize} // 최종 확정 함수 호출
                                    className="w-full py-3 text-xl font-bold rounded-lg shadow-lg transition duration-300 flex items-center justify-center bg-green-500 text-white hover:bg-green-600 transform hover:scale-[1.01] mt-4"
                                >
                                    <CheckCircle className="w-6 h-6 mr-3" />
                                    이 캐릭터로 최종 확정
                                </button>
                            )}
                        </div>

                        {/* 미리보기 횟수 안내 */}
                        {status === 'preview' && previewCount < 3 && (
                            <p className="text-sm text-yellow-400 mt-3 text-center">
                                재생성 기회가 **{3 - previewCount}번** 남았습니다. 마음에 드는 캐릭터로 확정해주세요.
                            </p>
                        )}
                        {status === 'preview' && previewCount >= 3 && (
                            <p className="text-sm text-red-400 mt-3 text-center font-bold">
                                재생성 기회를 모두 사용했습니다. 이 캐릭터로 **최종 확정**해주세요.
                            </p>
                        )}

                        {/* 캐릭터 생성 완료 메시지 */}
                        {status === 'completed' && (
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <Trophy className="w-12 h-12 text-green-400" />
                                <h3 className="text-3xl font-bold text-green-400">캐릭터 생성 완료!</h3>
                                <p className="text-lg text-gray-300">{characterName}와 함께 모험을 시작해 보세요.</p>
                                <button
                                    type="button"
                                    onClick={handleGoToGame}
                                    className="w-full sm:w-2/3 lg:w-1/2 mx-auto py-3 text-xl font-bold rounded-lg shadow-lg transition duration-300 flex items-center justify-center bg-green-500 text-white hover:bg-green-600 transform hover:scale-[1.02]"
                                >
                                    <Trophy className="w-6 h-6 mr-3" />
                                    {characterName ? `${characterName}와 함께 게임하러 가기` : '게임하러 가기'}
                                </button>
                            </div>
                        )}
                    </div>
                </form>
            </main>
            <Footer />
        </div>
    );
};

export default CharacterCreationPage;