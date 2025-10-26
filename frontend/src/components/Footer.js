import React from 'react';
import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="mt-16 py-10 bg-gray-900 text-gray-400 text-sm border-t border-gray-700">
            <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 text-left">

                {/* 1. 서비스 소개 */}
                <div>
                    <h4 className="text-gray-200 font-semibold mb-3">겜만중 소개</h4>
                    <ul className="space-y-2">
                        <li><Link to="/about" className="hover:text-white">플랫폼 개요</Link></li>
                        <li><Link to="/team" className="hover:text-white">개발자 소개</Link></li>
                        <li><Link to="/notice" className="hover:text-white">공지사항</Link></li>
                    </ul>
                </div>

                {/* 2. 이용 안내 */}
                <div>
                    <h4 className="text-gray-200 font-semibold mb-3">이용 안내</h4>
                    <ul className="space-y-2">
                        <li><Link to="/guide" className="hover:text-white">이용 가이드</Link></li>
                        <li><Link to="/faq" className="hover:text-white">자주 묻는 질문</Link></li>
                    </ul>
                </div>

                {/* 3. 정책 정보 */}
                <div>
                    <h4 className="text-gray-200 font-semibold mb-3">정책</h4>
                    <ul className="space-y-2">
                        <li><Link to="/terms" className="hover:text-white">이용약관</Link></li>
                        <li><Link to="/privacy" className="hover:text-white">개인정보처리방침</Link></li>
                        <li><Link to="/license" className="hover:text-white">오픈소스 라이선스</Link></li>
                    </ul>
                </div>

                {/* 4. 연락처 및 SNS */}
                <div>
                    <h4 className="text-gray-200 font-semibold mb-3">문의 및 소셜</h4>
                    <ul className="space-y-2">
                        <li>이메일: support@gmaking.com</li>
                        <li>전화: 010-1234-5678</li>
                        <li className="flex space-x-3 mt-2">
                            <a
                                href="https://github.com/psm0419/Gmaking"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-white"
                            >
                                GitHub
                            </a>
                            <a
                                href="https://www.notion.so/a7add19eacaa421892bc570f0c970733"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-white"
                            >
                                Notion
                            </a>
                            <a
                                href="https://discord.gg/xR6mhfz6"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-white"
                            >
                                Discord
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            {/* 저작권 표시 */}
            <div className="mt-10 text-center text-gray-500 border-t border-gray-700 pt-4">
                <p>© 2025 겜만중 (Gmaking). All Rights Reserved.</p>
                <p>AI 기반 체험형 게임 플랫폼 | React & Spring 기반 개발</p>
            </div>
        </footer>
    );
};

export default Footer;
