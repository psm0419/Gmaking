import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Bot, DollarSign, Archive, Package, MessageSquare, AlertTriangle, Skull } from 'lucide-react'; 
import Header from '../../components/Header';
import UserManagementTab from './UserManagementTab';
import CharacterManagementTab from './CharacterManagementTab';
import PurchaseManagementTab from './PurchaseManagementTab';
import InventoryManagementTab from './InventoryManagementTab';
import ProductManagementTab from './ProductManagementTab';
import CommunityPostManagementTab from './CommunityPostManagementTab';
import ReportManagementTab from './ReportManagementTab';
import MonsterManagementTab from './MonsterManagementTab';

const TabButton = ({ isActive, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center px-4 py-2 text-lg font-semibold transition duration-200 
            ${isActive
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
    >
        {icon}
        {label}
    </button>
);


const AdminPage = () => {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');
    const [error, setError] = useState(null); 
    const [userRefreshKey, setUserRefreshKey] = useState(0); 
    
    const handleUserRefresh = useCallback(() => {
        setUserRefreshKey(prev => prev + 1);
    }, []);

    useEffect(() => {
        if (!isLoading && user?.role !== 'ADMIN') {
            setError('접근 권한이 없습니다. 관리자 계정으로 로그인해야 합니다.');
            if(user) navigate('/'); 
        }
    }, [isLoading, user, navigate]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };
    
    const renderContent = () => {
        switch (activeTab) {
            case 'users':
                return <UserManagementTab refreshTrigger={userRefreshKey} />;
            case 'inventory':
                return <InventoryManagementTab onUserRefresh={handleUserRefresh} />;
            case 'purchases':
                return <PurchaseManagementTab />;
            case 'characters':
                return <CharacterManagementTab />;
            case 'products':
                return <ProductManagementTab />;
            case 'posts': 
                return <CommunityPostManagementTab />;
            case 'reports':
                return <ReportManagementTab />;
            case 'monsters':
                return <MonsterManagementTab />;
            default:
                return null;
        }
    };


    // 로딩/에러 상태 UI
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
                <p className="text-xl text-yellow-400">관리자 페이지 로딩 중...</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
                <p className="text-xl text-red-500">❌ 전역 오류: {error}</p>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Header />
            <div className="max-w-7xl mx-auto p-5 shadow-xl rounded-xl mt-5">
                <h1 className="text-3xl font-bold mb-6 text-yellow-400 border-b border-yellow-400 pb-2 flex items-center">
                    <Users className="w-7 h-7 mr-2" /> 관리자 대시보드
                </h1>

                {/* 탭 네비게이션 */}
                <div className="flex border-b border-gray-700 mb-6 space-x-2">
                    <TabButton 
                        isActive={activeTab === 'users'} 
                        onClick={() => handleTabChange('users')}
                        icon={<Users className="w-5 h-5 mr-2" />}
                        label={`사용자 관리`} 
                    />
                    <TabButton 
                        isActive={activeTab === 'inventory'} 
                        onClick={() => handleTabChange('inventory')}
                        icon={<Archive className="w-5 h-5 mr-2" />}
                        label={`인벤토리`}
                    />
                    <TabButton 
                        isActive={activeTab === 'purchases'} 
                        onClick={() => handleTabChange('purchases')}
                        icon={<DollarSign className="w-5 h-5 mr-2" />}
                        label={`구매 내역`}
                    />
                    <TabButton 
                        isActive={activeTab === 'characters'} 
                        onClick={() => handleTabChange('characters')}
                        icon={<Bot className="w-5 h-5 mr-2" />}
                        label={`캐릭터 관리`}
                    />
                    <TabButton 
                        isActive={activeTab === 'products'} 
                        onClick={() => handleTabChange('products')}
                        icon={<Package className="w-5 h-5 mr-2" />}
                        label={`상품 관리`}
                    />
                    <TabButton 
                        isActive={activeTab === 'posts'} 
                        onClick={() => handleTabChange('posts')}
                        icon={<MessageSquare className="w-5 h-5 mr-2" />}
                        label={`게시글 관리`}
                    />
                    <TabButton 
                        isActive={activeTab === 'reports'} 
                        onClick={() => handleTabChange('reports')}
                        icon={<AlertTriangle className="w-5 h-5 mr-2" />}
                        label={`신고 관리`}
                    />
                    <TabButton
                        isActive={activeTab === 'monsters'} 
                        onClick={() => handleTabChange('monsters')}
                        icon={<Skull className="w-5 h-5 mr-2" />}
                        label={`몬스터 관리`}
                    />
                </div>

                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;