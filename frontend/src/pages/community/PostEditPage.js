import React, { useEffect, useState, useCallback, useContext } from 'react';
//                                                  ^^^^^^^^^ useContext 추가
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header'; 
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext'; 

const API_BASE_URL = 'http://localhost:8080/community';

const CATEGORIES = [
    { code: 'FREE', name: '자유게시판' },
    { code: 'INFO', name: '정보 공유' },
    { code: 'QNA', name: '질문/답변' },
];

const PostEditPage = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    
    const { token } = useAuth(); 
    
    const [formState, setFormState] = useState({
        title: '',
        content: '',
        categoryCode: 'FREE',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) {
            alert("로그인이 필요합니다.");
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
                console.error("Fetch Error:", err);
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
            alert("제목과 내용을 모두 입력해주세요.");
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

    if (loading) return <div className="text-center p-8">게시글 정보를 불러오는 중...</div>;
    if (error && loading === false) return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center pt-20">
            <div className="text-red-500 p-8 bg-gray-800 rounded-lg shadow-xl">오류: {error}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
            <Header /> 
            <header className="bg-gray-800 shadow-lg py-4 border-b border-gray-700">
                <div className="max-w-6xl mx-auto px-4 text-2xl font-bold text-yellow-500">
                    게시글 수정 페이지
                </div>
            </header>

            <main className="w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
                <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full">
                    <h2 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-4 text-yellow-400">게시글 수정</h2>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label htmlFor="categoryCode" className="block text-sm font-medium text-gray-300 mb-2">카테고리</label>
                            <select
                                id="categoryCode"
                                name="categoryCode"
                                value={formState.categoryCode}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition duration-150"
                                required
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat.code} value={cat.code}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="mb-6">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">제목</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formState.title}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition duration-150"
                                required
                            />
                        </div>
                        
                        <div className="mb-8">
                            <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">내용</label>
                            <textarea
                                id="content"
                                name="content"
                                value={formState.content}
                                onChange={handleChange}
                                rows="12"
                                className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 resize-none transition duration-150"
                                required
                            />
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => navigate(-1)} 
                                className="px-6 py-2 text-white bg-gray-600 rounded-lg font-semibold hover:bg-gray-500 transition duration-150 shadow-md"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 text-gray-900 bg-yellow-500 rounded-lg font-bold hover:bg-yellow-400 transition duration-150 shadow-md"
                            >
                                수정 완료
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <Footer />
            <footer className="bg-gray-800 py-4 mt-8 border-t border-gray-700">
                <div className="max-w-6xl mx-auto px-4 text-center text-gray-400 text-sm">
                    &copy; 2025 커뮤니티.
                </div>
            </footer>
        </div>
    );
};

export default PostEditPage;