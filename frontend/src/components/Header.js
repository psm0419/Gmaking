import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { LogOut, User, Zap, Bell, ShoppingCart, Award, MessageSquare, LifeBuoy, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
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
        { name: '전투', icon: LifeBuoy, link: 'pve/maps' },
    ];

    // 회원 탈퇴 핸들러
    const handleWithdraw = () => {
        if (!user) {
            alert("로그인 상태가 아닙니다.");
        }

        if (window.confirm("정말 계정 탈퇴를 진행하시겠습니까?")) {
            navigate('/withdraw');
        }
    };

    return (
        <header className="bg-gray-800 shadow-xl sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                
                {/* 1-1. 로고/사이트 이름 */}
                <Link to="/" className="flex items-center space-x-2 group">
                        <Zap className="w-8 h-8 text-yellow-400 group-hover:text-yellow-500 transition" />
                        <h1 className="text-3xl font-extrabold text-white tracking-wider group-hover:text-yellow-400 transition duration-200">
                            겜만중
                        </h1>
                </Link>
                
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
                        {/* onClick={() => navigate('/my_page')} 임시추가 마이페이지 연결 */}
                        <span onClick={() => navigate('/my_page')} className={`text-lg font-semibold ${roleColor} flex items-center`}>
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
                        {/* --- 회원 탈퇴 버튼 --- */}
                        <button
                            onClick={handleWithdraw}
                            className="text-sm px-3 py-1.5 bg-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-700 transition duration-200 flex items-center"
                        >
                            <XCircle className="w-4 h-4 mr-1.5" />
                            탈퇴
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