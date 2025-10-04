import React from 'react';
import { LogOut, User, Zap, Bell, ShoppingCart, Award, MessageSquare, LifeBuoy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
    const { user, logout } = useAuth();
    
    // 표시될 사용자 이름/닉네임
    const displayName = user?.userNickname || user?.userName || user?.userId;
    const roleColor = user?.role === 'ADMIN' ? 'text-red-400' : 'text-yellow-400';

    // 카테고리 메뉴 항목
    const categories = [
        { name: '공지사항', icon: Bell, link: '#' },
        { name: '상점', icon: ShoppingCart, link: '#' },
        { name: '랭킹', icon: Award, link: '#' },
        { name: '커뮤니티', icon: MessageSquare, link: '#' },
        { name: '고객지원', icon: LifeBuoy, link: '#' },
    ];

    return (
        <header className="bg-gray-800 shadow-xl sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                
                {/* 1-1. 로고/사이트 이름 */}
                <h1 className="text-3xl font-extrabold text-yellow-400 flex items-center">
                    <Zap className="w-8 h-8 mr-2" />
                    겜만중
                </h1>
                
                {/* 1-2. 카테고리 메뉴 */}
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

                {/* 1-3. 사용자 정보 및 로그아웃 */}
                {user ? (
                    <div className="flex items-center space-x-4">
                        <span className={`text-lg font-semibold ${roleColor} flex items-center`}>
                            <User className="w-5 h-5 mr-2" />
                            {displayName}
                        </span>
                        <button
                            onClick={logout}
                            className="px-3 py-1.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition duration-200 flex items-center"
                        >
                            <LogOut className="w-4 h-4 mr-1.5" />
                            로그아웃
                        </button>
                    </div>
                ) : (
                    // 로그아웃 상태일 때 로그인 페이지로 가는 버튼 등을 여기에 추가할 수 있습니다.
                    <a href="/login" className="px-3 py-1.5 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition">
                        로그인
                    </a>
                )}
            </div>
        </header>
    );
};

export default Header;