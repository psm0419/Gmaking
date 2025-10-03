import React, { useState } from 'react';
import { Upload, Wand2, RefreshCw, CheckCircle } from 'lucide-react';
import Header from './common/Header';
import Footer from './common/Footer';

const CharacterCreationPage = () => {
    const [imageFile, setImageFile] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState('pending');
    const [generatedImage, setGeneratedImage] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setStatus('pending'); // 파일이 변경되면 상태 초기화

            // 파일 미리보기 로직
            const reader = new FileReader();
            reader.onloadend = () => setGeneratedImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        
        if (!imageFile || prompt.trim() === '') {
            alert('이미지를 첨부하고 원하는 스타일을 입력해주세요.');
            return;
        }

        setStatus('generating');

        // [핵심 로직 자리]
        // 1. 이미지 업로드: 백엔드 API에 imageFile 전송
        // 2. 백엔드 처리:
        //    a. CNN 기반 이미지 분류 모델 적용
        //    b. 결과 및 prompt를 Stable Diffusion/ControlNet API에 전송
        //    c. 최종 캐릭터 이미지 반환
        //
        // **현재는 더미 로직입니다. 5초 후 성공 상태로 전환**
        console.log('--- AI 캐릭터 생성 요청 시작 ---');
        console.log('첨부 이미지:', imageFile.name);
        console.log('생성 프롬프트:', prompt);

        await new Promise(resolve => setTimeout(resolve, 5000)); 
        
        setStatus('success');
        setGeneratedImage('https://source.unsplash.com/random/500x500/?fantasy,character,portrait'); // 더미 생성 이미지
    };

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
                        자신의 이미지와 원하는 스타일을 입력하여 세상에 하나뿐인 캐릭터를 만드세요.
                    </p>
                </div>

                <form onSubmit={handleGenerate} className="bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6">
                    
                    {/* 1. 이미지 첨부 (ControlNet Input) */}
                    <div className="border-b border-gray-700 pb-6">
                        <label className="block text-xl font-bold text-white mb-3">1. 기반 이미지 첨부</label>
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

                    {/* 2. 스타일 프롬프트 (Stable Diffusion Prompt) */}
                    <div className="border-b border-gray-700 pb-6">
                        <label htmlFor="prompt-input" className="block text-xl font-bold text-white mb-3">2. 캐릭터 스타일 입력</label>
                        <textarea
                            id="prompt-input"
                            rows="4"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="예: '갑옷을 입은 강력한 기사, 판타지 아트 스타일, 아름다운 조명, 4K'"
                            className="w-full p-4 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition"
                            required
                        />
                    </div>
                    
                    {/* 3. 생성 버튼 및 상태 */}
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

                    {/* 4. 결과 미리보기 */}
                    {generatedImage && status === 'success' && (
                        <div className="pt-6 border-t border-gray-700 text-center">
                            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                            <h3 className="text-2xl font-bold text-green-400 mb-4">캐릭터 생성 완료!</h3>
                            <img 
                                src={generatedImage} 
                                alt="생성된 캐릭터" 
                                className="mx-auto rounded-xl border-4 border-yellow-400 shadow-2xl"
                                style={{ maxWidth: '300px' }}
                            />
                            {/* 실제 구현 시, DB에 캐릭터를 저장하고 HomePage로 리다이렉트하는 버튼 추가 */}
                            <button 
                                onClick={() => alert('캐릭터 저장 로직 구현 예정')} 
                                className="mt-4 px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
                            >
                                게임 시작하기
                            </button>
                        </div>
                    )}
                </form>

            </main>
            <Footer />
        </div>
    );
};

export default CharacterCreationPage;