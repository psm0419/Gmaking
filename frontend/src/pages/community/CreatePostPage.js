import React, { useState, useEffect } from 'react';
import { Send, FileText, Tag, ArrowLeft } from 'lucide-react'; 
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// API 기본 URL 설정 (게시글 생성 API 엔드포인트)
const API_CREATE_POST_URL = 'http://localhost:8080/community';

// 카테고리 목록 및 서버 코드 매핑
const CATEGORIES = [
    { name: '자유 게시판', code: 'FREE' },
    { name: '질문/답변', code: 'QNA' },
    { name: '팁/정보', code: 'TIP' },
];

const CreatePostPage = () => {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [categoryCode, setCategoryCode] = useState('FREE');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionMessage, setSubmissionMessage] = useState(null);

    // 스크롤바 숨김 처리 (ShopPage와 동일)
    useEffect(() => {
        document.documentElement.classList.add("no-scrollbar");
        document.body.classList.add("no-scrollbar");
        return () => {
            document.documentElement.classList.remove("no-scrollbar");
            document.body.classList.remove("no-scrollbar");
        };
    }, []);

    const handleGoBack = () => {
        navigate('/community');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmissionMessage(null);

        if (isLoading) {
            setSubmissionMessage({ type: 'error', text: '사용자 정보를 로딩 중입니다. 잠시 후 다시 시도해 주세요.' });
            return;
        }

        if (!user || !user.userId) {
            setSubmissionMessage({ type: 'error', text: '로그인된 사용자 정보가 없어 게시글을 등록할 수 없습니다.' });
            return;
        }

        if (!title.trim() || !content.trim()) {
            setSubmissionMessage({ type: 'error', text: '제목과 내용을 모두 입력해 주세요.' });
            return;
        }

        setIsSubmitting(true);

        const token = localStorage.getItem('gmaking_token');

        if (!token) {
            setIsSubmitting(false);
            setSubmissionMessage({ type: 'error', text: '인증 토큰을 찾을 수 없습니다. 다시 로그인해 주세요.' });
            return;
        }

        console.log("-----------------------------------------");
        console.log("⭐️ [Client Log] 게시글 등록 요청 시작 (순수 텍스트)");
        console.log(`User ID: ${user.userId}`);
        console.log(`Token Found: ${token ? 'Yes' : 'No'}`);
        console.log("-----------------------------------------");

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('category', categoryCode);

        console.log("⭐️ [Client Log] FormData Content:");
        console.log(`- title: ${title}`);
        console.log(`- content: ${content.substring(0, Math.min(content.length, 30))}...`);
        console.log(`- categoryCode: ${categoryCode}`);
        for (let [key, value] of formData.entries()) {
            console.log(`- FormData item: ${key}: ${value instanceof File ? value.name : value}`);
        }
        console.log("-----------------------------------------");

        try {
            const response = await fetch(API_CREATE_POST_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            console.log(`⭐️ [Client Log] 서버 응답 상태 코드: ${response.status}`);

            if (response.ok) {
                const responseText = await response.text();
                console.log("⭐️ [Client Log] 게시글 등록 성공 응답 데이터:", responseText);

                setSubmissionMessage({
                    type: 'success',
                    text: `게시글이 성공적으로 등록되었습니다. 게시판으로 이동합니다.`
                });

                setTitle('');
                setContent('');
                setCategoryCode('FREE');

                setTimeout(() => {
                    navigate('/community');
                }, 1000);
            } else {
                let errorText = await response.text();
                console.error("❌ [Client Log] 게시글 등록 실패 응답 본문:", errorText);

                if (response.status === 401 || response.status === 403) {
                    errorText = '세션이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요. (인증 오류)';
                } else {
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorText = errorJson.message || errorJson.error || `게시글 등록에 실패했습니다. (상태 코드: ${response.status})`;
                    } catch {
                        errorText = errorText || `게시글 등록에 실패했습니다. (상태 코드: ${response.status})`;
                    }
                }

                throw new Error(errorText);
            }
        } catch (error) {
            console.error('게시글 등록 중 오류 발생:', error);
            setSubmissionMessage({
                type: 'error',
                text: error.message || '게시글 등록 중 알 수 없는 오류가 발생했습니다.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isButtonDisabled = isSubmitting || !user || isLoading;
    const authorName = isLoading ? '로딩 중...' : (user?.userNickname || '로그인 필요');

    return (
        <div className="min-h-screen flex flex-col bg-gray-900 overflow-hidden">
            <Header />

            <main className="w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
                {/* 페이지 제목 */}
                <div className="mb-8 border-b border-gray-700 pb-4">
                    <h1 className="text-4xl font-extrabold text-yellow-400 flex items-center">
                        <FileText className="w-8 h-8 mr-3" />
                        게시글 작성 
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

                {/* 폼 - 내부 스크롤 추가 */}
                <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 space-y-6 flex-1 overflow-y-auto">
                    {/* 카테고리 선택 드롭다운 */}
                    <div>
                        <label htmlFor="category" className="block text-lg font-medium text-gray-300 mb-2 flex items-center">
                            <Tag className="w-5 h-5 mr-2 text-red-400" /> 카테고리
                        </label>
                        <div className="relative">
                            <select
                                id="category"
                                value={categoryCode}
                                onChange={(e) => setCategoryCode(e.target.value)}
                                className="w-full appearance-none p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none pr-10"
                                required
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.code} value={cat.code}>{cat.name}</option>
                                ))}
                            </select>
                            {/* 커스텀 화살표 */}
                            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </span>
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
                            placeholder="여기에 게시할 내용을 작성하세요."
                            className="w-full p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none resize-none"
                            required
                        ></textarea>
                    </div>

                    {/* 작성자 정보 */}
                    <div className="text-right text-sm text-gray-500 pt-2 border-t border-gray-700">
                        작성자: {authorName}
                    </div>

                    {/* 버튼 그룹: 등록 버튼과 뒤로가기 버튼 */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={handleGoBack}
                            disabled={isSubmitting}
                            className={`w-1/3 flex items-center justify-center py-3 text-xl font-bold rounded-lg shadow-lg transition duration-300 ${
                                isSubmitting
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                        >
                            <ArrowLeft className="w-6 h-6 mr-2" />
                            취소/뒤로가기
                        </button>

                        <button
                            type="submit"
                            disabled={isButtonDisabled}
                            className={`w-2/3 flex items-center justify-center py-3 text-xl font-bold rounded-lg shadow-lg transition duration-300 ${
                                isButtonDisabled
                                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                    : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="mr-2">등록 중...</span>
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
                    </div>
                </form>
            </main>

            <Footer />
        </div>
    );
};

export default CreatePostPage;