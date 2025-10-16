import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Wand2, RefreshCw, CheckCircle, AlertTriangle, Trophy } from 'lucide-react'; 
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';


const API_BASE_URL = 'http://localhost:8080'; 

const CharacterCreationPage = () => {
    const navigate = useNavigate();
    const { setCharacterCreated } = useAuth();
    const [imageFile, setImageFile] = useState(null);
    const [characterName, setCharacterName] = useState('');
    const [status, setStatus] = useState('pending');
    const [generatedImage, setGeneratedImage] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

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
        
        // 입력 유효성 검사 (이미지 파일과 캐릭터 이름만 확인)
        if (!imageFile || characterName.trim() === '') {
            alert('이미지를 첨부하고 캐릭터 이름을 입력해주세요.'); 
            return;
        }

        // JWT 토큰 확인
        const token = localStorage.getItem('gmaking_token');
        if (!token) {
            alert('로그인이 필요합니다. (JWT 토큰 없음)');
            setStatus('error');
            setErrorMessage('로그인 토큰이 없어 요청을 보낼 수 없습니다.');
            return;
        }

        setStatus('generating');
        setErrorMessage('');
        setGeneratedImage(null);

        // FormData 구성 
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('characterName', characterName);
        
        try {
            // 백엔드 API 호출 (URL은 그대로 유지)
            const response = await fetch(`${API_BASE_URL}/api/character/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`, 
                },
                body: formData, 
            });
            
            // 오류 응답 처리
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: '알 수 없는 서버 오류' }));
                throw new Error(`캐릭터 생성 실패: ${errorData.message || response.statusText}`);
            }

            // 성공 응답
            const result = await response.json();
            
            console.log('AI 캐릭터 생성 성공:', result);
            
            setStatus('success');
            setGeneratedImage(result.imageUrl); 
            setCharacterCreated(result.imageUrl); 

            alert(`캐릭터 '${characterName}' 생성이 완료되었습니다!`);
            
        } catch (error) {
            console.error('API 호출 중 오류 발생:', error.message);
            setStatus('error');
            setErrorMessage(error.message);

            if (imageFile) {
                const reader = new FileReader();
                reader.onloadend = () => setGeneratedImage(reader.result);
                reader.readAsDataURL(imageFile);
            }
        }
    };

    const handleGoToGame = useCallback(() => {
        navigate('/');
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
            <Header />
            
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-yellow-400 flex items-center justify-center mb-3">
                        <Wand2 className="w-10 h-10 mr-3" />
                        AI 기반 캐릭터 생성
                    </h1>
                    <p className="text-gray-400 text-lg">
                        자신의 이미지로 기반을 만들고, AI가 자동으로 스타일을 입혀 캐릭터를 만드세요.
                    </p>
                </div>

                <form onSubmit={handleGenerate} className="bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6">
                    
                    {/* 0. 캐릭터 이름 입력 */}
                    <div className="border-b border-gray-700 pb-6">
                        <label htmlFor="name-input" className="block text-xl font-bold text-white mb-3">0. 캐릭터 이름</label>
                        <input
                            id="name-input"
                            type="text"
                            value={characterName}
                            onChange={(e) => setCharacterName(e.target.value)}
                            placeholder="캐릭터 이름을 입력하세요 (예: 불꽃 기사)"
                            className="w-full p-4 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition"
                            required
                        />
                    </div>
                    
                    {/* 1. 이미지 첨부 (ControlNet Input) */}
                    <div className="border-b border-gray-700 pb-6">
                        <label className="block text-xl font-bold text-white mb-3">1. 기반 이미지 첨부 (AI가 스타일 자동 결정)</label>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition border-gray-600">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-yellow-400" />
                                    <p className="mb-2 text-sm text-gray-400">
                                        <span className="font-semibold">클릭하여 업로드</span>하거나 드래그하세요.
                                    </p>
                                    <p className="text-xs text-gray-500">JPG, PNG (최대 5MB)</p>
                                    {imageFile && <p className="mt-2 text-yellow-400">첨부된 파일: {imageFile.name}</p>}
                                </div>
                                <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>

                    {/* 2. 생성 버튼 및 상태 (기존 3번) */}
                    <div>
                        <button
                            type="submit"
                            disabled={status === 'generating'}
                            className={`w-full py-3 text-xl font-bold rounded-lg shadow-md transition duration-200 flex items-center justify-center ${
                                status === 'generating'
                                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                : 'bg-yellow-500 text-gray-900 hover:bg-yellow-600'
                            }`}
                        >
                            {status === 'generating' ? (
                                <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                            ) : (
                                <Wand2 className="w-5 h-5 mr-3" />
                            )}
                            {status === 'generating' ? 'AI가 캐릭터를 생성 중입니다...' : '캐릭터 생성 요청'}
                        </button>
                    </div>

                    {/* 3. 에러 메시지 표시 */}
                    {status === 'error' && errorMessage && (
                            <div className="p-4 bg-red-800 text-white rounded-lg flex items-center">
                                <AlertTriangle className="w-6 h-6 mr-3 text-red-300" />
                                <p className="font-semibold">오류 발생: {errorMessage}</p>
                            </div>
                    )}

                    {/* 4. 결과 미리보기 */}
                    {(generatedImage || status === 'success') && (
                            <div className="pt-6 border-t border-gray-700 text-center">
                                {status === 'success' ? (
                                    <>
                                        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                                        <h3 className="text-2xl font-bold text-green-400 mb-4">캐릭터 생성 완료!</h3>
                                        <img
                                            src={generatedImage}
                                            alt={"생성된 캐릭터"}
                                            className="mx-auto rounded-xl border-4 border-yellow-400 shadow-2xl mb-6"
                                            style={{ maxWidth: '300px', maxHeight: '300px', objectFit: 'contain' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleGoToGame}
                                            className="w-full sm:w-2/3 lg:w-2/3 mx-auto py-3 text-xl font-bold rounded-lg shadow-lg transition duration-300 flex items-center justify-center bg-green-500 text-white hover:bg-green-600 transform hover:scale-[1.02]"
                                        >
                                            <Trophy className="w-6 h-6 mr-3" />
                                            {characterName ? `${characterName}와 함께 게임하러 가기` : '게임하러 가기'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-2xl font-bold text-white mb-4">기반 이미지 미리보기</h3>
                                        <img
                                            src={generatedImage}
                                            alt={"첨부된 기반 이미지"}
                                            className="mx-auto rounded-xl border-4 border-gray-600 shadow-xl"
                                            style={{ maxWidth: '300px', maxHeight: '300px', objectFit: 'contain' }}
                                        />
                                    </>
                                )}
                                
                            </div>
                    )}
                </form>

            </main>
            <Footer />
        </div>
    );
};

export default CharacterCreationPage;