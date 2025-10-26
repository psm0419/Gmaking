import React, { useCallback} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Bot, User, Gamepad2, Bell, ShoppingCart, Award, MessageSquare, Swords, Scroll, Egg, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { startCharacterGeneration } from '../api/characterCreation/characterCreationApi';

const Header = ({ onInfoClick }) => {
    // isLoggedIn 상태를 추가로 가져옵니다.
    const { user, logout, isLoggedIn, isLoading, token, applyNewToken } = useAuth();
    const navigate = useNavigate();

    // 표시될 사용자 이름/닉네임
    const displayName = user?.userNickname || user?.userName || user?.userId;
    const roleColor = user?.role === 'ADMIN' ? 'text-red-400' : 'text-yellow-400';

    const isAdmin = user?.role === 'ADMIN';
    const userProfilePath = isAdmin ? '/admin' : '/my-page';

    const handleProfileClick = () => {
        navigate(userProfilePath);
    };

    const handleCharacterCreationStart = useCallback(async (e) => {
        e.preventDefault(); 

        // 1. 로그인 상태 체크
        if (!isLoggedIn || !token || !user) {
            alert('캐릭터 뽑기를 시작하려면 먼저 로그인해야 합니다.');
            navigate('/login');
            return;
        }

        const currentCount = user?.incubatorCount || 0;
        
        // 2. 부화권 1개 미만일 경우 예외 처리
        if (currentCount <= 0) {
            alert('캐릭터 뽑기를 시작할 수 없습니다. 부화권 수량이 부족합니다.');
            return;
        }

        // 3. 사용자에게 확인 요청
        const isConfirmed = window.confirm(
            `캐릭터 뽑기를 시작하시겠습니까?\n\n이 작업으로 부화권이 1개 감소됩니다. (현재 ${currentCount}개)`
        );

        if (!isConfirmed) {
            return; // 취소
        }

        try {
            // 4. 부화권 차감 API 호출
            const result = await startCharacterGeneration(token);

            if (result.errorMessage) {
                alert(`캐릭터 뽑기 시작 실패: ${result.errorMessage}`);
                return;
            }

            // 5. 새 토큰 적용 및 페이지 이동
            if (result.newToken) {
                applyNewToken(result.newToken);
            }
            
            navigate('/create-character'); // 캐릭터 생성 페이지로 이동

        } catch (error) {
            console.error('캐릭터 뽑기 시작 처리 중 오류 발생:', error);
            alert('캐릭터 뽑기 시작 중 알 수 없는 서버 오류가 발생했습니다.');
        }

    }, [navigate, isLoggedIn, token, applyNewToken, user]);

    // 카테고리 메뉴 항목
    const categories = [
        { name: '공지사항', icon: Bell, link: '/notice' },
        { name: '상점', icon: ShoppingCart, link: '/shop' },
        { name: '랭킹', icon: Award, link: '/ranking' },
        { name: '커뮤니티', icon: MessageSquare, link: '/community' },
        { name: '캐릭터 뽑기', icon: Egg, link: '/create-character', handler: handleCharacterCreationStart },
        { name: '게임', icon: Swords, link: '/battlemode' },
        { name: '로그', icon: Scroll, link: '/logs' },
        { name: '채팅', icon: Bot, link: '/chat-entry'},
    ];


    if (isLoading) {
        return (
            <header className="bg-gray-800 shadow-xl sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    {/* 로고/사이트 이름 */}
                    <Link
                        to="/"
                        className="flex items-center space-x-2"
                    >
                        <Gamepad2 className="w-8 h-8 text-yellow-400 transform -rotate-6" />
                        <Link
                            to="/"
                            className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-yellow-700 animate-float"
                            style={{
                                textShadow: '0 4px 6px rgba(0, 0, 0, 0.4)',
                                textDecoration: 'none'
                            }}
                        >
                            겜만중
                        </Link>
                    </Link>

                    {/* 카테고리 메뉴 - 로딩 중에도 유지 */}
                    <nav className="hidden md:flex space-x-6">
                        {categories.map((item) => (
                            <div key={item.name} className="text-gray-500 font-semibold flex items-center">
                                <item.icon className="w-5 h-5 mr-1" />
                                {item.name}
                            </div>
                        ))}
                    </nav>

                    {/* 로딩 표시 - 버튼 자리에 스켈레톤 UI를 표시합니다. */}
                    <div className="h-8 w-24 bg-gray-700 rounded-lg animate-pulse"></div>
                </div>
            </header>
        );
    }


    return (
        <header className="bg-gray-800 shadow-xl sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">

                {/* 로고/사이트 이름 */}
                <Link
                    to="/"
                    className="flex items-center space-x-2"
                >
                    <Gamepad2
                        className="w-8 h-8 text-yellow-400 transform -rotate-6"
                    />
                    <h1
                        className="text-3xl font-extrabold tracking-wider 
                   text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 to-sky-300 
                   animate-float" 
                        style={{
                            textDecoration: 'none',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)'
                        }}
                    >
                        겜만중
                    </h1>
                </Link>

                {/* 카테고리 메뉴 */}
                <nav className="hidden md:flex space-x-6">
                    {categories.map((item) => (
                        <Link
                            key={item.name}
                            to={item.link}
                            onClick={item.handler ? item.handler : null}
                            className="text-gray-300 hover:text-yellow-400 font-semibold transition duration-200 flex items-center"
                        >
                            <item.icon className="w-5 h-5 mr-1" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* 우측: i 버튼 + 사용자 영역 */}
                <div className="flex items-center space-x-3">
                    {/* AI 사용안내 버튼 */}
                    <img
                        src={process.env.PUBLIC_URL + "/images/InfoIcon.png"}
                        alt="도우미 열기"
                        onClick={() =>
                            onInfoClick ? onInfoClick() : window.dispatchEvent(new Event('assistant:toggle'))
                        }
                        className="w-9 h-9 object-cover
                        cursor-pointer hover:ring-yellow-400 hover:scale-105 transition duration-200"
                    />

                    {/* 사용자 정보 및 로그아웃 */}
                    {isLoggedIn ? (
                        <div className="flex items-center space-x-4">
                            {user && (
                                <span 
                                    onClick={handleProfileClick}
                                    className={`text-lg font-semibold ${roleColor} flex items-center cursor-pointer`} 
                                >
                                    <User className="w-5 h-5 mr-2" />
                                    {displayName}
                                </span>
                            )}
                            <button
                                // 로그아웃 후 navigate를 통해 로그인 페이지로 이동합니다.
                                onClick={() => {
                                    logout();
                                    navigate('/');
                                }}
                                className="px-3 py-1.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition duration-200 flex items-center"
                            >
                                <LogOut className="w-4 h-4 mr-1.5" />
                                로그아웃
                            </button>
                        </div>
                    ) : (
                        // 로그아웃 상태일 때 로그인 페이지로 가는 버튼
                        <Link to="/login" className="px-3 py-1.5 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition">
                            로그인
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;