import React, { useState } from 'react';
import { Send, FileText, ChevronDown, Tag, Image, X, Upload } from 'lucide-react';
import Header from '../components/Header'; // 기존 구조로 복원
import Footer from '../components/Footer'; // 기존 구조로 복원
import { useAuth } from '../context/AuthContext'; // 기존 구조로 복원
import { useNavigate } from 'react-router-dom';

// API 기본 URL 설정 (게시글 생성 API 엔드포인트)
const API_CREATE_POST_URL = 'http://localhost:8080/community';

const CreatePostPage = () => {
    // AuthContext의 user, isLoading을 사용합니다.
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('자유 게시판');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 첨부된 이미지 파일 객체 목록 상태
    const [imageFiles, setImageFiles] = useState([]);

    // 제출 결과 메시지 상태(성공/오류 알림용)
    const [submissionMessage, setSubmissionMessage] = useState(null);
    
    // 카테고리 목록
    const categories = ['자유 게시판', '질문/답변', '팁/정보', '거래'];

    // 이미지 파일 변경 처리
    const handleImageChange = (e) =>{
        const selectedFiles = Array.from(e.target.files);
        const newFiles = [...imageFiles, ...selectedFiles];

        // 최대 5개 파일 제한
        if(newFiles.length > 5){
            setSubmissionMessage({ type: 'error', text: '이미지는 최대 5개까지 첨부할 수 있습니다.'});
            setImageFiles(newFiles.slice(0,5));
        } else{
            setSubmissionMessage(null);
            setImageFiles(newFiles);
        }

        e.target.value = null;
    };

    // 이미지 파일 제거 처리
    const handleRemoveImage = (indexToRemove) => {
        URL.revokeObjectURL(imageFiles[indexToRemove]);
        setImageFiles(imageFiles.filter((_, index) => index !== indexToRemove));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmissionMessage(null);
        
        // 1. 사용자 및 제목/내용 검증
        // isLoading 상태를 추가로 확인합니다.
        if (isLoading) {
            setSubmissionMessage({ type: 'error', text: '사용자 정보를 로딩 중입니다. 잠시 후 다시 시도해 주세요.' });
            return;
        }

        if(!user || !user.userId){
            setSubmissionMessage({ type: 'error', text: '로그인된 사용자 정보가 없어 게시글을 등록할 수 없습니다.' });
            return;
        }
        
        if (!title.trim() || !content.trim()) {
            setSubmissionMessage({ type: 'error', text: '제목과 내용을 모두 입력해 주세요.' });
            return;
        }

        setIsSubmitting(true);

        // 2. JWT 토큰 가져오기 
        const token = localStorage.getItem('gmaking_token');
        
        if (!token) {
            setIsSubmitting(false);
            setSubmissionMessage({ type: 'error', text: '인증 토큰을 찾을 수 없습니다. 다시 로그인해 주세요.' });
            return;
        }
        
        // ⭐️ [Client Log 1] 요청 전송 전 사용자 ID 및 토큰 존재 여부 확인
        console.log("-----------------------------------------");
        console.log("⭐️ [Client Log] 게시글 등록 요청 시작");
        console.log(`User ID: ${user.userId}`);
        console.log(`Token Found: ${token ? 'Yes' : 'No'}`);
        console.log("-----------------------------------------");


        // 3. FormData 객체 생성 및 데이터 추가
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('category', category);
        // 서버에서 JWT를 통해 인증된 사용자 ID를 사용하므로, 
        // 클라이언트에서 authorId를 명시적으로 보내는 것은 보안상 권장되지 않으므로 제거합니다.
        // formData.append('authorId', user.userId); 
        
        imageFiles.forEach((file) => {
            formData.append('files', file);
        });

        // ⭐️ [Client Log 2] FormData에 담긴 데이터 확인
        console.log("⭐️ [Client Log] FormData Content:");
        console.log(`- title: ${title}`);
        console.log(`- content: ${content.substring(0, Math.min(content.length, 30))}...`);
        console.log(`- files count: ${imageFiles.length}`);
        
        for (let [key, value] of formData.entries()) {
            console.log(`- FormData item: ${key}: ${value instanceof File ? value.name : value}`);
        }
        console.log("-----------------------------------------");

        try{
            const response = await fetch(API_CREATE_POST_URL, {
                method: 'POST',
                // ⭐️ Authorization 헤더 추가 (가장 중요)
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });
            
            // ⭐️ [Client Log 3] 서버 응답 상태 확인
            console.log(`⭐️ [Client Log] 서버 응답 상태 코드: ${response.status}`);
            
            if(response.ok){
                const responseData = await response.json();
                console.log("⭐️ [Client Log] 게시글 등록 성공 응답 데이터:", responseData);

                setSubmissionMessage({
                    type: 'success',
                    text: `게시글이 성공적으로 등록되었습니다. 게시판으로 이동합니다.`
                });

                // 상태 초기화
                setTitle('');
                setContent('');
                setCategory('자유 게시판');
                setImageFiles([]);

                // 1초 후 게시글 목록 페이지로 이동
                setTimeout(() => {
                    navigate('/community');
                }, 1000);

            } else {
                // 서버 에러 처리 (401 Unauthorized, 403 Forbidden 포함)
                let errorText = await response.text();
                
                // ⭐️ [Client Log 4] 실패 시 응답 본문 확인
                console.error("❌ [Client Log] 게시글 등록 실패 응답 본문:", errorText);
                
                if (response.status === 401 || response.status === 403) {
                    errorText = '세션이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요. (인증 오류)';
                } else {
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorText = errorJson.message || errorText;
                    } catch (e) {
                        // JSON이 아닐 경우 텍스트 그대로 사용
                    }
                }
                
                throw new Error(errorText || `게시글 등록에 실패했습니다. (상태 코드: ${response.status})`);
            }
        } catch(error) {
            console.error('게시글 등록 중 오류 발생:', error);
            setSubmissionMessage({
                type: 'error',
                text: error.message || '게시글 등록 중 알 수 없는 오류가 발생했습니다.'
            });
        } finally{
            setIsSubmitting(false);
        }
    };

    // 이미지 파일을 미리보기 URL로 변환하는 함수
    const getPreviewUrl = (file) => URL.createObjectURL(file);

    // 로딩 중이거나 사용자가 없을 때 버튼을 비활성화/표시
    const isButtonDisabled = isSubmitting || !user || isLoading;
    const authorName = isLoading ? '로딩 중...' : (user?.userNickname || '로그인 필요');


    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
            <Header />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
                
                {/* 페이지 제목 */}
                <div className="mb-8 border-b border-gray-700 pb-4">
                    <h1 className="text-4xl font-extrabold text-yellow-400 flex items-center">
                        <FileText className="w-8 h-8 mr-3" />
                        새 게시글 작성
                    </h1>
                    <p className="text-gray-400 mt-2">커뮤니티 가이드라인을 준수하여 깨끗한 게시판 문화를 만들어주세요.</p>
                </div>
                
                {/* 알림 메시지 UI */}
                {submissionMessage && (
                    <div className={`p-4 mb-4 rounded-lg font-medium ${
                        submissionMessage.type === 'success' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                        {submissionMessage.text}
                    </div>
                )}


                <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 space-y-6">
                    
                    {/* 카테고리 선택 드롭다운 */}
                    <div>
                        <label htmlFor="category" className="block text-lg font-medium text-gray-300 mb-2 flex items-center">
                            <Tag className="w-5 h-5 mr-2 text-red-400" /> 카테고리
                        </label>
                        <div className="relative">
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full appearance-none p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none pr-10"
                                required
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* 제목 입력 필드 */}
                    <div>
                        <label htmlFor="title" className="block text-lg font-medium text-gray-300 mb-2">
                            제목
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="게시글의 제목을 입력하세요 (최대 100자)"
                            maxLength={100}
                            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
                            required
                        />
                    </div>

                    {/* 내용 입력 필드 */}
                    <div>
                        <label htmlFor="content" className="block text-lg font-medium text-gray-300 mb-2">
                            내용
                        </label>
                        <textarea
                            id="content"
                            rows="10" 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="여기에 게시할 내용을 작성하세요. (HTML 태그 사용 불가)"
                            className="w-full p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none resize-none"
                            required
                        ></textarea>
                    </div>

                    {/* 이미지 첨부 섹션 */}
                    <div className="pt-4 border-t border-gray-700">
                        <label className="block text-lg font-medium text-gray-300 mb-2 flex items-center">
                            <Image className="w-5 h-5 mr-2 text-blue-400" /> 이미지 첨부 ({imageFiles.length}/5)
                        </label>
                        
                        {/* 파일 선택 버튼 */}
                        <label htmlFor="image-upload" className={`w-full flex items-center justify-center p-3 text-base font-medium rounded-lg border-2 border-dashed transition duration-300 cursor-pointer ${
                            imageFiles.length >= 5 
                                ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-700 border-blue-500 text-blue-400 hover:bg-gray-600'
                        }`}>
                            <Upload className="w-5 h-5 mr-2" />
                            {imageFiles.length < 5 ? "파일 선택 (최대 5개)" : "첨부 제한 개수 초과"}
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                disabled={imageFiles.length >= 5}
                                className="hidden"
                            />
                        </label>

                        {/* 첨부된 이미지 미리보기 목록 */}
                        {imageFiles.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
                                {imageFiles.map((file, index) => (
                                    <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-500 shadow-md">
                                        <img
                                            src={getPreviewUrl(file)}
                                            alt={`첨부 이미지 ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 p-1 rounded-full text-white transition duration-200"
                                            aria-label={`이미지 ${index + 1} 삭제`}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 작성자 정보 */}
                    <div className="text-right text-sm text-gray-500 pt-2 border-t border-gray-700">
                        작성자: {authorName}
                    </div>

                    {/* 제출 버튼 */}
                    <button
                        type="submit"
                        disabled={isButtonDisabled}
                        className={`w-full flex items-center justify-center py-3 text-xl font-bold rounded-lg shadow-lg transition duration-300 ${
                            isButtonDisabled
                                ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                                : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="mr-2">등록 중...</span>
                                {/* 로딩 스피너 */}
                                <svg className="animate-spin h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </>
                        ) : (
                            <>
                                <Send className="w-6 h-6 mr-2" />
                                게시글 등록
                            </>
                        )}
                    </button>
                </form>

            </main>
            
            <Footer />
        </div>
    );
};

export default CreatePostPage;