import React, { useState, useEffect } from 'react';
import { ChevronLeft, User, ThumbsUp, Eye, MessageSquare, Edit, Trash2, Save, X, Tag } from 'lucide-react'; 
import Header from '../components/Header'; 
import Footer from '../components/Footer';
// import { useParams, useNavigate } from 'react-router-dom'; // 라우팅 훅 사용 불가 (주석 처리)

// 가상의 게시글 목록을 localStorage에서 가져오는 함수
const getPosts = () => {
    const storedPosts = localStorage.getItem('mockPosts');
    
    // 로컬 스토리지가 비어있을 경우 초기 더미 데이터 설정
    if (!storedPosts) {
        const initialPosts = [{
            postId: 1,
            category: '자유 게시판',
            title: 'AI 캐릭터 커스터마이징 기능 써보신 분 후기좀 (샘플)',
            content: `안녕하세요! 이번에 새로 업데이트된 AI 기반 캐릭터 커스터마이징 기능을 사용해봤습니다. 
솔직히 기대 이상이네요. 몇 가지 키워드(예: '사이버펑크 사무라이', '판타지 엘프 궁수')만 입력했는데도,
정말 디테일하고 멋진 결과물을 만들어줘서 깜짝 놀랐습니다.

다만 아쉬운 점은, 가끔 미묘하게 인체 비율이 이상하게 나오는 경우가 있다는 것?
이 부분만 개선되면 정말 완벽할 것 같습니다. 다들 한 번씩 꼭 사용해보세요!
`,
            author: '겜돌이99',
            authorId: 'user123',
            views: 1245,
            likes: 120,
            commentsCount: 45,
            createdDate: new Date().toISOString().split('T')[0],
            imageUrls: [
                'https://placehold.co/400x250/374151/FFFFFF?text=AI+Character+Image+1',
                'https://placehold.co/400x250/374151/FFFFFF?text=AI+Character+Image+2'
            ]
        }];
        savePosts(initialPosts);
        return initialPosts;
    }
    return JSON.parse(storedPosts);
};

// 가상의 게시글 목록을 localStorage에 저장하는 함수
const savePosts = (posts) => {
    localStorage.setItem('mockPosts', JSON.stringify(posts));
};

// 댓글 더미 데이터 (댓글 기능은 상세 구현하지 않음)
const dummyComments = [
    { id: 101, author: '댓글왕', content: '저도 해봤는데 진짜 신세계예요! 특히 머리카락 디테일이 미쳤습니다.', date: '2025.10.14' },
    { id: 102, author: '금손이네', content: '저는 커스터마이징이 어려워서 늘 기본 모델만 썼는데, 이제 저도 금손이 될 수 있겠네요 ㅠㅠ', date: '2025.10.14' },
    { id: 103, author: '운영자봇', content: '좋은 후기 감사합니다! 말씀해주신 인체 비율 관련 버그는 현재 수정 작업 중에 있습니다. 이용에 불편을 드려 죄송합니다.', date: '2025.10.14' },
];

const CommentItem = ({ comment }) => (
    <div className="border-b border-gray-700 p-4 bg-gray-750">
        <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-yellow-400">{comment.author}</span>
            <span className="text-xs text-gray-500">{comment.date}</span>
        </div>
        <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
    </div>
);

const categories = ['자유 게시판', '질문/답변', '팁/정보', '거래'];

// ===== 3. 커스텀 모달 컴포넌트 (alert/confirm 대체) =====

const Modal = ({ isOpen, title, message, onConfirm, onCancel, type = 'confirm' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full border border-gray-700">
                <div className="p-5 border-b border-gray-700">
                    <h3 className={`text-xl font-bold ${type === 'alert' ? 'text-yellow-400' : 'text-red-500'}`}>{title}</h3>
                </div>
                <div className="p-5">
                    <p className="text-gray-300 whitespace-pre-wrap">{message}</p>
                </div>
                <div className={`p-4 flex ${type === 'confirm' ? 'justify-between' : 'justify-center'} border-t border-gray-700`}>
                    {type === 'confirm' && (
                        <button 
                            onClick={onCancel} 
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                        >
                            취소
                        </button>
                    )}
                    <button 
                        onClick={onConfirm} 
                        className={`px-4 py-2 font-bold rounded-lg transition ${
                            type === 'confirm' 
                            ? 'bg-red-600 text-white hover:bg-red-700' 
                            : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                        }`}
                    >
                        {type === 'confirm' ? '확인' : '닫기'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// ===== 4. 메인 게시글 상세 컴포넌트 =====

// PostDetailPage는 더 이상 useParams를 사용하지 않고 postId를 props로 받습니다.
const PostDetailPage = ({ postId: propPostId }) => {
    // 라우팅 환경이 아니므로, propPostId가 없으면 임시로 postId 1을 사용합니다.
    const currentPostId = propPostId ? Number(propPostId) : 1; 

    // 게시글 데이터 및 상태
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    // 수정 모드 상태
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editCategory, setEditCategory] = useState('');

    // 댓글 상태
    const [newComment, setNewComment] = useState('');
    
    // 모달 상태
    const [modal, setModal] = useState({ 
        isOpen: false, 
        type: 'confirm', 
        title: '', 
        message: '', 
        onConfirm: null, 
        onCancel: null 
    });

    // 데이터를 localStorage에서 로드하는 useEffect
    useEffect(() => {
        const loadPost = () => {
            const storedPosts = getPosts();
            // postId는 URL에서 string으로 오므로 Number로 변환
            const foundPost = storedPosts.find(p => p.postId === currentPostId); 

            if (foundPost) {
                setPost(foundPost);
                setLikesCount(foundPost.likes);
                // 수정 상태 초기화
                setEditTitle(foundPost.title);
                setEditContent(foundPost.content);
                setEditCategory(foundPost.category);
            } else {
                setPost(null);
            }
            setLoading(false);
        };
        loadPost();
    }, [currentPostId]); // propPostId 대신 currentPostId를 사용

    // 목록으로 돌아가기 (라우팅이 없으므로 console.log로 대체)
    const navigateToList = () => {
        console.log("라우팅 환경이 아니므로 목록 페이지로의 이동을 시뮬레이션합니다. (실제 배포 환경에서는 navigate('/community') 사용)");
        // alert("목록으로 돌아가는 기능을 시뮬레이션합니다."); // alert 대신 커스텀 모달 사용을 선호하여 제거
    };

    // 좋아요(추천) 핸들러
    const handleLike = () => {
        // 실제로는 서버에 요청을 보내야 함
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
        setIsLiked(prev => !prev);
        console.log(`게시글 ${currentPostId} 좋아요 상태 변경: ${isLiked ? '취소' : '추가'}`);
    };

    // 신고 버튼 핸들러 (커스텀 모달 사용)
    const handleReport = () => {
        setModal({
            isOpen: true,
            type: 'confirm',
            title: '게시글 신고 확인',
            message: "이 게시글을 신고하시겠습니까? 허위 신고 시 제재를 받을 수 있습니다.",
            onConfirm: () => {
                console.log(`게시글 ${currentPostId} 신고 접수`);
                setModal({ 
                    isOpen: true, 
                    type: 'alert', 
                    title: '신고 완료',
                    message: '게시글이 신고 접수되었습니다. 감사합니다.',
                    onConfirm: () => setModal({ isOpen: false, onConfirm: null, onCancel: null })
                });
            },
            onCancel: () => setModal({ isOpen: false, onConfirm: null, onCancel: null }),
        });
    };

    // 수정 모드 진입/취소
    const handleEditToggle = (editMode) => {
        if (!editMode) { // 수정 취소 시
            // 기존 값으로 복원
            setEditTitle(post.title);
            setEditContent(post.content);
            setEditCategory(post.category);
        }
        setIsEditing(editMode);
    };

    // 수정 내용 저장 핸들러
    const handleSaveEdit = () => {
        if (!editTitle.trim() || !editContent.trim()) {
            setModal({
                isOpen: true,
                type: 'alert',
                title: '입력 오류',
                message: '제목과 내용을 모두 입력해 주세요.',
                onConfirm: () => setModal({ isOpen: false })
            });
            return;
        }

        const currentPosts = getPosts();
        const postIndex = currentPosts.findIndex(p => p.postId === currentPostId);

        if (postIndex > -1) {
            const updatedPost = {
                ...currentPosts[postIndex],
                title: editTitle,
                content: editContent,
                category: editCategory,
                // 좋아요 카운트는 로컬 상태를 반영
                likes: likesCount 
            };
            
            currentPosts[postIndex] = updatedPost;
            savePosts(currentPosts);
            
            // UI 업데이트 및 모드 전환 (수정 후에도 이 게시물에 남아있음)
            setPost(updatedPost);
            setIsEditing(false);

            setModal({
                isOpen: true,
                type: 'alert',
                title: '수정 완료',
                message: '게시글이 성공적으로 수정되었습니다.',
                onConfirm: () => setModal({ isOpen: false })
            });
            
            console.log(`게시글 ${currentPostId} 수정 완료 및 LocalStorage 업데이트`);
        }
    };
    
    // 게시글 삭제 핸들러 (커스텀 모달 사용)
    const handleDelete = () => {
        setModal({
            isOpen: true,
            type: 'confirm',
            title: '게시글 삭제 확인',
            message: "정말로 이 게시글을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.",
            onConfirm: () => {
                const currentPosts = getPosts();
                const updatedPosts = currentPosts.filter(p => p.postId !== currentPostId);
                savePosts(updatedPosts);
                
                // 삭제 완료 모달을 표시하고, 모달이 닫히면 post 상태를 null로 설정하여
                // "게시글을 찾을 수 없음" 화면으로 전환 (목록 이동 시뮬레이션)
                setModal({ 
                    isOpen: true, 
                    type: 'alert', 
                    title: '삭제 완료',
                    message: '게시글이 성공적으로 삭제되었습니다. 이제 목록으로 돌아갑니다.',
                    onConfirm: () => {
                        setModal({ isOpen: false });
                        setPost(null); 
                        console.log(`게시글 ${currentPostId} 삭제 완료 및 화면 전환`);
                    }
                });
            },
            onCancel: () => setModal({ isOpen: false }),
        });
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-900 text-white p-20 text-center">게시글을 불러오는 중...</div>;
    }

    if (!post) {
        return <div className="min-h-screen bg-gray-900 text-white p-20 text-center">게시글을 찾을 수 없습니다.</div>;
    }
    
    // 임시로 true 설정 (실제로는 `user?.userId === post.authorId` 등으로 확인)
    const isAuthor = true; 

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
            <Header />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
                
                <Modal {...modal} />

                {/* 뒤로가기 버튼 */}
                <button 
                    onClick={navigateToList} 
                    className="flex items-center text-yellow-400 hover:text-yellow-500 mb-6 transition"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    목록으로 돌아가기
                </button>

                {/* 게시글 영역 */}
                <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 mb-8">
                    
                    {/* 제목 및 정보 헤더 (View Mode / Edit Mode) */}
                    <div className="p-6 border-b-2 border-yellow-400">
                        <div className="flex items-start justify-between mb-4">
                            
                            {isEditing ? (
                                <select
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                    className="px-3 py-1 text-sm font-bold rounded-full bg-gray-700 text-yellow-400 border border-gray-600 outline-none"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="inline-block px-3 py-1 text-sm font-bold rounded-full bg-red-600 text-white">
                                    {post.category}
                                </span>
                            )}

                            {isAuthor && (
                                <div className="flex space-x-3">
                                    {isEditing ? (
                                        <>
                                            <button 
                                                onClick={handleSaveEdit} 
                                                className="text-yellow-400 hover:text-yellow-500 flex items-center text-sm transition"
                                            >
                                                <Save className="w-4 h-4 mr-1" /> 저장
                                            </button>
                                            <button 
                                                onClick={() => handleEditToggle(false)} 
                                                className="text-gray-400 hover:text-red-400 flex items-center text-sm transition"
                                            >
                                                <X className="w-4 h-4 mr-1" /> 취소
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => handleEditToggle(true)} 
                                                className="text-gray-400 hover:text-yellow-400 flex items-center text-sm transition"
                                            >
                                                <Edit className="w-4 h-4 mr-1" /> 수정
                                            </button>
                                            <button 
                                                onClick={handleDelete} 
                                                className="text-gray-400 hover:text-red-400 flex items-center text-sm transition"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" /> 삭제
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 제목 */}
                        {isEditing ? (
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="제목을 입력하세요"
                                className="w-full text-3xl font-extrabold text-white bg-gray-700 p-2 rounded-lg outline-none border border-gray-600 focus:border-yellow-400"
                            />
                        ) : (
                            <h1 className="text-3xl font-extrabold text-white mb-4">{post.title}</h1>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-400 border-t border-gray-700 pt-3">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                    <User className="w-4 h-4 mr-1 text-gray-500" />
                                    <span>{post.author}</span>
                                </div>
                                <span>|</span>
                                <span>작성일: {new Date(post.createdDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center"><Eye className="w-4 h-4 mr-1 text-gray-500" /> {post.views}</div>
                                <div className="flex items-center"><ThumbsUp className="w-4 h-4 mr-1 text-gray-500" /> {post.likes}</div>
                                <div className="flex items-center"><MessageSquare className="w-4 h-4 mr-1 text-gray-500" /> {post.commentsCount}</div>
                            </div>
                        </div>
                    </div>

                    {/* 게시글 본문 */}
                    <div className="p-6">
                        {isEditing ? (
                            <textarea
                                rows="15"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                placeholder="내용을 입력하세요"
                                className="w-full text-lg text-gray-300 bg-gray-700 p-4 rounded-lg outline-none border border-gray-600 focus:border-yellow-400 resize-none"
                            />
                        ) : (
                            <div className="text-lg text-gray-300 min-h-[300px] whitespace-pre-wrap leading-relaxed">
                                {post.content}
                                {/* 이미지 표시 (임시 URL 사용) */}
                                {post.imageUrls && post.imageUrls.length > 0 && (
                                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {post.imageUrls.map((url, index) => (
                                            <img 
                                                key={index}
                                                src={url}
                                                alt={`첨부 이미지 ${index + 1}`}
                                                className="w-full rounded-lg shadow-md object-cover border border-gray-700"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* 좋아요/신고 버튼 영역 (수정 모드일 때는 숨김) */}
                {!isEditing && (
                    <div className="flex justify-between items-center py-4 px-6 mb-8 bg-gray-800 rounded-xl border border-gray-700">
                        
                        {/* 좋아요 버튼*/}
                        <button
                            onClick={handleLike}
                            className={`flex items-center text-lg font-bold px-6 py-2 rounded-full transition duration-200 
                                ${isLiked ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-700 text-yellow-400 hover:bg-gray-600'}`
                            }
                        >
                            <ThumbsUp className={`w-5 h-5 mr-2 ${isLiked ? 'fill-white' : 'fill-none'}`} />
                            추천 ({likesCount})
                        </button>

                        {/* 신고 버튼 */}
                        <button
                            onClick={handleReport}
                            className="flex items-center text-sm px-4 py-2 text-gray-400 border border-gray-600 rounded-lg hover:bg-gray-700 hover:text-red-400 transition"
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            신고
                        </button>
                    </div>
                )}
                
                {/* 댓글 섹션 */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
                    <h2 className="text-2xl font-bold mb-4 text-yellow-400">
                        댓글 ({dummyComments.length})
                    </h2>

                    {/* 댓글 입력 필드 */}
                    <div className="mb-6 border-b border-gray-700 pb-4">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="여기에 댓글을 작성하세요."
                            rows="4"
                            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none resize-none"
                        />
                        <button
                            onClick={() => console.log('댓글 등록:', newComment)}
                            className="mt-2 px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition float-right"
                        >
                            댓글 등록
                        </button>
                        <div className="clearfix"></div>
                    </div>

                    {/* 댓글 리스트 */}
                    <div className="space-y-4 pt-4">
                        {dummyComments.map(comment => (
                            <CommentItem key={comment.id} comment={comment} />
                        ))}
                    </div>
                </div>
                
            </main>
            
            <Footer />
        </div>
    );
};

export default PostDetailPage;