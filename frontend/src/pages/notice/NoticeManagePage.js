import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import { getNoticeDetail, createNotice, updateNotice } from '../../api/notice/noticeApi';

const NoticeManagePage = () => {
    const navigate = useNavigate();

    const { noticeId } = useParams();
    const { user, token, isLoggedIn } = useAuth();

    const isEditMode = !!noticeId;
    const IS_ADMIN = user && user.role === 'ADMIN';

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // 1. 접근 권한 확인 및 리다이렉션
    useEffect(() => {
        if (isInitialLoading && !isLoggedIn) {
            alert('로그인 후 이용 가능합니다.');
            navigate('/login');
            return;
        }
        if (isInitialLoading && !IS_ADMIN) {
            alert('공지 관리 페이지는 관리자만 접근 가능합니다.');
            navigate('/notice');
        }
        setIsInitialLoading(false);
    }, [isLoggedIn, IS_ADMIN, navigate, isInitialLoading]);

    // 수정 시 기존 데이터 로드
    useEffect(() => {
        if (isEditMode && IS_ADMIN) {
            const fetchNoticeData = async () => {
                try {
                    const data = await getNoticeDetail(noticeId);
                    setTitle(data.noticeTitle);
                    setContent(data.noticeContent);
                    setIsPinned(data.isPinned || false);
                } catch (error) {
                    console.error('공지사항 로드 실패:', error);
                    alert('공지사항 정보를 불러오는 데 실패했습니다.');
                    navigate('/notice');
                }
            };
            fetchNoticeData();
        }
    }, [isEditMode, noticeId, IS_ADMIN, navigate]);


    // 3. 등록/수정
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 모두 입력해 주세요.');
            return;
        }

        if (!token) {
            alert("인증 정보가 없습니다. 다시 로그인해 주세요.");
            return;
        }

        const payload = {
            noticeTitle: title,
            noticeContent: content,
            isPinned: isPinned,
        };

        setIsLoading(true);

        try {
            if (isEditMode) {
                await updateNotice(noticeId, payload, token);
                alert('공지사항이 성공적으로 수정되었습니다.');
            } else {
                await createNotice(payload, token);
                alert('공지사항이 성공적으로 등록되었습니다.');
            }

            navigate('/notice');

        } catch (error) {
            console.error('공지사항 처리 실패:', error);
            const message = error.response?.data?.message || (isEditMode ? '수정' : '등록') + ' 중 오류가 발생했습니다.';
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
            <Header />
            <main className="flex-grow w-full max-w-4xl mx-auto px-4 pt-[1.3rem] flex flex-col min-h-0">
                <h1 className="text-3xl font-bold mb-6 text-yellow-400 border-b border-gray-700 pb-2 flex-shrink-0">
                    {isEditMode ? '공지사항 수정' : '새 공지 등록'}
                </h1>

                {/* 권한 확인이 완료되지 않았거나 로딩 중일 때 */}
                {isInitialLoading || !IS_ADMIN || isLoading ? (
                    <div className="text-center p-20 text-gray-400 flex-grow">
                        {isLoading ? '처리 중...' : '권한 확인 중...'}
                    </div>
                ) : (
                    <div className="flex-grow min-h-0"> 
                        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 space-y-6">                        {/* 제목 입력 */}
                            <div className="flex-shrink-0">
                                <label htmlFor="title" className="block text-lg font-medium text-white mb-2">제목</label>
                                <input
                                    id="title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
                                    placeholder="공지사항 제목을 입력하세요."
                                    required
                                />
                            </div>

                            {/* 내용 입력 */}
                            <div>
                                <label htmlFor="content" className="block text-lg font-medium text-white mb-2">내용</label>
                                <textarea
                                    id="content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows="15"
                                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
                                    placeholder="공지 내용을 입력하세요."
                                    required
                                />
                            </div>

                            {/* 상단 고정 체크박스 */}
                            <div className="flex items-center flex-shrink-0">
                                <input
                                    id="isPinned"
                                    type="checkbox"
                                    checked={isPinned}
                                    onChange={(e) => setIsPinned(e.target.checked)}
                                    className="w-5 h-5 text-yellow-400 bg-gray-700 border-gray-600 rounded focus:ring-yellow-400"
                                />
                                <label htmlFor="isPinned" className="ml-3 text-lg text-white">
                                    상단 고정 (목록 최상단에 항상 노출)
                                </label>
                            </div>

                            {/* 제출 버튼 */}
                            <div className="pt-4 flex-shrink-0">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg shadow-md hover:bg-yellow-500 transition disabled:bg-gray-600 disabled:text-gray-400"
                                >
                                    {isLoading ? '처리 중...' : (isEditMode ? '수정 완료' : '공지 등록')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
};

export default NoticeManagePage;