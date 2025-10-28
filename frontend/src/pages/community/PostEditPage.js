import React, { useEffect, useState, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { FileText, Tag, ArrowLeft } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/community';

const CATEGORIES = [
    { code: 'FREE', name: '자유게시판' },
    { code: 'INFO', name: '정보 공유' },
    { code: 'QNA', name: '질문/답변' },
];

const PostEditPage = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { token, user, isLoading } = useAuth(); // user와 isLoading 유지

    const [formState, setFormState] = useState({
        title: '',
        content: '',
        categoryCode: 'FREE',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 스크롤바 숨김 처리 (CreatePostPage와 동일)
    useEffect(() => {
        document.documentElement.classList.add("no-scrollbar");
        document.body.classList.add("no-scrollbar");
        return () => {
            document.documentElement.classList.remove("no-scrollbar");
            document.body.classList.remove("no-scrollbar");
        };
    }, []);

    useEffect(() => {
        if (!token) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        const fetchPost = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/${postId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('게시글 정보를 불러오지 못했습니다. 권한을 확인하세요.');
                }

                const data = await response.json();

                setFormState({
                    title: data.title || '',
                    content: data.content || '',
                    categoryCode: data.categoryCode || 'FREE',
                });
            } catch (err) {
                console.error('Fetch Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (postId) {
            fetchPost();
        }
    }, [postId, token, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formState.title.trim() || !formState.content.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        const queryParams = new URLSearchParams({
            title: formState.title,
            content: formState.content,
            category: formState.categoryCode,
        }).toString();

        try {
            const response = await fetch(
                `${API_BASE_URL}/${postId}?${queryParams}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const responseText = await response.text();

            if (response.ok) {
                alert('게시글이 성공적으로 수정되었습니다.');
                navigate(`/community/${postId}`);
            } else if (response.status === 403) {
                alert(`수정 권한이 없습니다. (${responseText})`);
            } else {
                alert(`게시글 수정 실패: ${responseText}`);
            }
        } catch (err) {
            console.error('API 호출 오류:', err);
            alert('네트워크 오류가 발생했습니다.');
        }
    };

    const isButtonDisabled = loading || isLoading || !token; // 버튼 비활성화 로직 유지
    const authorName = isLoading ? '로딩 중...' : (user?.userNickname || '로그인 필요');

    if (loading) return <div className="text-center p-8 text-white">게시글 정보를 불러오는 중...</div>;
    if (error && loading === false) return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center pt-20">
            <div className="text-red-500 p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">오류: {error}</div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-900 overflow-hidden">
            <Header />
            <main className="w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
                {/* 페이지 제목 */}
                <div className="mb-8 border-b border-gray-700 pb-4">
                    <h1 className="text-4xl font-extrabold text-yellow-400 flex items-center">
                        <FileText className="w-8 h-8 mr-3" />
                        게시글 수정
                    </h1>
                    <p className="text-gray-400 mt-2">커뮤니티 가이드라인을 준수하여 깨끗한 게시판 문화를 만들어주세요.</p>
                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 space-y-6 flex-1 overflow-x-hidden">
                    {/* 카테고리 선택 드롭다운 */}
                    <div>
                        <label htmlFor="categoryCode" className="block text-lg font-medium text-gray-300 mb-2 flex items-center">
                            <Tag className="w-5 h-5 mr-2 text-red-400" /> 카테고리
                        </label>
                        <div className="relative">
                            <select
                                id="categoryCode"
                                name="categoryCode"
                                value={formState.categoryCode}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none pr-10 appearance-none" // appearance-auto 대신 appearance-none 복원
                            >
                                {CATEGORIES.map(cat => (
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
                            name="title"
                            value={formState.title}
                            onChange={handleChange}
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
                            name="content"
                            value={formState.content}
                            onChange={handleChange}
                            rows="10"
                            placeholder="여기에 게시할 내용을 작성하세요."
                            className="w-full p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none resize-y"
                            required
                        ></textarea>
                    </div>

                    {/* 작성자 정보 */}
                    <div className="text-right text-sm text-gray-500 pt-2 border-t border-gray-700">
                        작성자: {authorName}
                    </div>

                    {/* 버튼 그룹 */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            disabled={isButtonDisabled}
                            className={`w-1/3 flex items-center justify-center py-3 text-xl font-bold rounded-lg shadow-lg transition duration-300 ${
                                isButtonDisabled
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
                            게시글 수정
                        </button>
                    </div>
                </form>
            </main>

            <Footer />
        </div>
    );
};

export default PostEditPage;