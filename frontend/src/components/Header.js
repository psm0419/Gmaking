import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { LogOut, User, Zap, Bell, ShoppingCart, Award, MessageSquare, LifeBuoy, Swords, Footprints, Scroll } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
    // isLoggedIn 상태를 추가로 가져옵니다.
    const { user, logout, isLoggedIn, isLoading} = useAuth();
    const navigate = useNavigate();
    
    // 표시될 사용자 이름/닉네임
    const displayName = user?.userNickname || user?.userName || user?.userId;
    const roleColor = user?.role === 'ADMIN' ? 'text-red-400' : 'text-yellow-400';

    // 카테고리 메뉴 항목
    const categories = [
        { name: '공지사항', icon: Bell, link: '#' },
        { name: '상점', icon: ShoppingCart, link: '/shop' },
        { name: '랭킹', icon: Award, link: 'ranking' },
        { name: '커뮤니티', icon: MessageSquare, link: '/community' },        
        { name: 'PVE', icon: Footprints, link: 'pve/maps' },
        { name: 'PVP', icon: Swords, link: 'pvp/match' },
        { name: '로그', icon: Scroll, link: 'logs' },
        { name: '고객지원', icon: LifeBuoy, link: '#' },
    ];

    if (isLoading) {
        return (
            <header className="bg-gray-800 shadow-xl sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    {/* 로고/사이트 이름 */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <Zap className="w-8 h-8 text-yellow-400" />
                        <h1 className="text-3xl font-extrabold text-white tracking-wider">겜만중</h1>
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
                <Link to="/" className="flex items-center space-x-2 group">
                        <Zap className="w-8 h-8 text-yellow-400 group-hover:text-yellow-500 transition" />
                        <h1 className="text-3xl font-extrabold text-white tracking-wider group-hover:text-yellow-400 transition duration-200">
                            겜만중
                        </h1>
                </Link>
                
                {/* 카테고리 메뉴 */}
                <nav className="hidden md:flex space-x-6">
                    {categories.map((item) => (
                        <a 
                            key={item.name} 
                            href={item.link}
                            className="text-gray-300 hover:text-yellow-400 font-semibold transition duration-200 flex items-center"
                        >
                            <item.icon className="w-5 h-5 mr-1" />
                            {item.name}
                        </a>
                    ))}
                </nav>

                {/* 사용자 정보 및 로그아웃 */}
                {isLoggedIn ? (
                    <div className="flex items-center space-x-4">
                        {user && (
                            <span onClick={() => navigate('/my-page')} className={`text-lg font-semibold ${roleColor} flex items-center`}>
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
                    <a href="/login" className="px-3 py-1.5 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition">
                        로그인
                    </a>
                )}
            </div>
        </header>
    );
};

export default Header;