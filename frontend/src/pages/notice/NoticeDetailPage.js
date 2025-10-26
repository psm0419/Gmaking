import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Eye, User, Edit, Trash2, List } from 'lucide-react';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { getNoticeDetail, deleteNotice } from '../../api/notice/noticeApi'; // ⭐️ API 호출 함수 import

const NoticeDetailPage = () => {
    const navigate = useNavigate();

    const { noticeId } = useParams();
    const { user, token } = useAuth();

    const [notice, setNotice] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const IS_ADMIN = user && user.role === 'ADMIN';

    const noticeContainerRef = useRef(null);

    useEffect(() => {
        const handleWheel = (e) => {
            const container = noticeContainerRef.current;
            if (!container) return;

            // 기본 스크롤 막기
            e.preventDefault();

            // 내부 스크롤로 전달
            container.scrollTop += e.deltaY;
        };

        window.addEventListener("wheel", handleWheel, { passive: false });
        return () => window.removeEventListener("wheel", handleWheel);
    }, []);

    // 공지사항 상세
    useEffect(() => {
        const fetchNoticeDetail = async () => {
            setIsLoading(true);
            try {
                const data = await getNoticeDetail(noticeId);
                setNotice(data);
                setError(null);
            } catch (err) {
                console.error("공지사항 상세 로드 실패:", err);
                setError('요청하신 공지사항을 찾을 수 없습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        if (noticeId) {
            fetchNoticeDetail();
        }
    }, [noticeId]);

    // 공지사항 삭제 (관리자 전용)
    const handleDelete = async () => {
        if (!IS_ADMIN || !window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
            return;
        }

        if (!token) {
            alert("인증 정보가 없습니다. 다시 로그인해 주세요.");
            return;
        }

        try {
            await deleteNotice(noticeId, token);

            alert('공지사항이 성공적으로 삭제되었습니다.');
            navigate('/notice');
        } catch (err) {
            console.error("공지사항 삭제 실패:", err);
            const message = err.response?.data?.message || '공지사항 삭제에 실패했습니다.';
            alert(message);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center">
                <p className="text-xl text-yellow-400">공지사항을 불러오는 중...</p>
            </div>
        );
    }

    if (error || !notice) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center">
                <p className="text-xl text-red-400">{error || '공지사항 정보가 없습니다.'}</p>
                <button
                    onClick={() => navigate('/notice')}
                    className="mt-6 px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition flex items-center"
                >
                    <List className="w-5 h-5 mr-2" />
                    목록으로 돌아가기
                </button>
            </div>
        );
    }

    const formattedDate = new Date(notice.createdDate).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="h-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
            <Header />
            <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col min-h-0">

                <div className="bg-slate-800 p-6 sm:p-10 rounded-xl shadow-2xl border border-slate-700 flex-grow flex flex-col min-h-0">
                    <div className="border-b border-slate-700 pb-4 mb-6 flex-shrink-0">

                        <div className="flex items-center space-x-3 mb-2">
                            {notice.isPinned && (
                                <span className="inline-block px-3 py-1 text-sm font-bold rounded-full text-white bg-red-600">
                                    📌 상단 공지
                                </span>
                            )}
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-yellow-400">
                                {notice.noticeTitle}
                            </h1>
                        </div>

                        {/* 작성자, 날짜, 조회수 정보 */}
                        <div className="flex flex-wrap items-center text-sm text-slate-400 mt-2 space-x-4 sm:space-x-6">
                            <span className="flex items-center">
                                <User className="w-4 h-4 mr-1 text-slate-500" />
                                {notice.createdBy === 'admin' ? '관리자' : notice.createdBy}
                            </span>
                            <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1 text-slate-500" />
                                {formattedDate}
                            </span>
                            <span className="flex items-center">
                                <Eye className="w-4 h-4 mr-1 text-slate-500" />
                                {notice.noticeViewCount || 0}
                            </span>
                        </div>
                    </div>

                    <div
                        ref={noticeContainerRef}
                        className="prose prose-invert max-w-none text-lg leading-relaxed whitespace-pre-wrap text-slate-200 break-words flex-grow overflow-y-auto no-scrollbar"
                    >
                        {notice.noticeContent}
                    </div>
                </div>

                <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-700 flex-shrink-0">

                    <button
                        onClick={() => navigate('/notice')}
                        className="px-6 py-3 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition flex items-center"
                    >
                        <List className="w-5 h-5 mr-2" />
                        목록으로
                    </button>

                    {IS_ADMIN && (
                        <div className="flex space-x-3">
                            <button
                                onClick={() => navigate(`/admin/notice/${noticeId}/edit`)}
                                className="px-6 py-3 bg-indigo-700 text-white font-bold rounded-lg hover:bg-indigo-800 transition flex items-center shadow-md"
                            >
                                <Edit className="w-5 h-5 mr-2" />
                                수정
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition flex items-center shadow-md"
                            >
                                <Trash2 className="w-5 h-5 mr-2" />
                                삭제
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default NoticeDetailPage;