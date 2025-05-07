/**
 * @author 阿瑞
 * @功能 私域管理系统首页 - 展示现代简约毛玻璃质感UI效果
 * @version 2.0.0
 */

"use client";

import { useState } from "react";
import { useThemeMode, useSettingActions } from "@/store/settingStore";
import { useIsAuthenticated } from "@/store/userStore";
import { ThemeMode } from "@/types/enum";
import Link from "next/link";
import { MdDarkMode, MdLightMode } from "react-icons/md";

/* 首页模块 - 展示毛玻璃UI效果和系统概览 */
export default function Home() {
  const [activeTab, setActiveTab] = useState<"features" | "stats" | "start">("features");
  // 使用zustand管理主题状态
  const themeMode = useThemeMode();
  const { toggleThemeMode } = useSettingActions();
  
  // 获取用户登录状态
  const isAuthenticated = useIsAuthenticated();
  
  // 计算当前是否是深色模式
  const isDarkMode = themeMode === ThemeMode.Dark;

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* 动态背景元素 - 使用大型柔和渐变气泡 */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -left-10 w-[800px] h-[800px] bg-purple-500/8 rounded-full filter blur-[120px] opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] -right-10 w-[700px] h-[700px] bg-blue-500/10 rounded-full filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute -bottom-20 left-[15%] w-[850px] h-[850px] bg-teal-400/8 rounded-full filter blur-[120px] opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[750px] h-[750px] bg-pink-400/8 rounded-full filter blur-[100px] opacity-60 animate-blob animation-delay-6000"></div>
      </div>
      
      {/* 装饰小球元素 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-6 h-6 rounded-full bg-accent-teal/60 animate-float"></div>
        <div className="absolute top-[30%] right-[15%] w-4 h-4 rounded-full bg-accent-purple/50 animate-float animation-delay-2000"></div>
        <div className="absolute bottom-[25%] left-[20%] w-5 h-5 rounded-full bg-accent-blue/50 animate-float animation-delay-4000"></div>
        <div className="absolute bottom-[15%] right-[25%] w-3 h-3 rounded-full bg-accent-pink/60 animate-float animation-delay-6000"></div>
      </div>
      
      {/* 页面内容 */}
      <div className="container max-w-7xl mx-auto px-4 py-20 relative z-10">
        {/* 顶部导航栏 - 毛玻璃效果 */}
        <header>
          <nav className="glass-nav mx-4 mt-4 px-8 py-4 flex items-center justify-between rounded-full">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[var(--text-primary)]'}`}>私域管理系统</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="nav-link">功能</a>
              <a href="#" className="nav-link">价格</a>
              <a href="#" className="nav-link">文档</a>
              <Link href="/test/ui" className="nav-link">UI组件</Link>
              <a href="#" className="nav-link">关于我们</a>
            </div>
            <div className="flex items-center space-x-5">
              {/* 主题切换按钮 - 使用图标 */}
              <button 
                onClick={toggleThemeMode}
                className="theme-toggle-btn flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                aria-label="切换主题"
              >
                {isDarkMode ? (
                  <MdLightMode className="text-xl text-yellow-300" />
                ) : (
                  <MdDarkMode className="text-xl text-indigo-600" />
                )}
              </button>
              
              {/* 根据登录状态显示不同的按钮 */}
              {isAuthenticated ? (
                <Link 
                  href="/workspace" 
                  className="nav-btn-primary"
                >
                  进入工作空间
                </Link>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link 
                    href="/login" 
                    className="nav-btn-secondary"
                  >
                    登录
                  </Link>
                  <Link 
                    href="/register" 
                    className="nav-btn-primary"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </header>

        {/* 主内容区 */}
        <section className="pt-40 pb-16">
          <div className="text-center mb-28">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="inline-block bg-gradient-to-r from-[var(--accent-teal)] via-[var(--accent-blue)] to-[var(--accent-purple)] animate-gradient bg-clip-text text-transparent">
                简化团队协作的
              </span>
              <br />
              <span className={isDarkMode ? 'text-white' : 'text-[var(--text-primary)]'}>SaaS管理平台</span>
            </h1>
            <p className={`text-xl max-w-3xl mx-auto mb-12 ${isDarkMode ? 'text-[rgba(255,255,255,0.8)]' : 'text-[var(--text-secondary)]'}`}>
              为多团队环境打造的高效管理系统，独立数据环境，统一管理界面
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <button className="btn-primary px-10 py-4 animate-pulse-slow">
                开始免费试用
              </button>
              <Link href="/test/ui" className="btn-secondary px-10 py-4">
                查看UI组件
              </Link>
            </div>
          </div>

          {/* 毛玻璃卡片区域 */}
          <div className={isDarkMode ? 'glass-card-dark p-8 mb-24' : 'glass-card p-8 mb-24'}>
            {/* 选项卡导航 */}
            <div className="flex space-x-4 mb-10 border-b border-white/5 pb-4">
              <button 
                onClick={() => setActiveTab("features")}
                className={`tab-button ${activeTab === "features" ? "active" : ""}`}
              >
                核心功能
              </button>
              <button 
                onClick={() => setActiveTab("stats")}
                className={`tab-button ${activeTab === "stats" ? "active" : ""}`}
              >
                统计数据
              </button>
              <button 
                onClick={() => setActiveTab("start")}
                className={`tab-button ${activeTab === "start" ? "active" : ""}`}
              >
                快速开始
              </button>
            </div>

            {/* 选项卡内容区域 */}
            <div className="p-6">
              {activeTab === "features" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* 功能卡片1 */}
                  <div className="feature-card">
                    <div className="icon-container">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                      </svg>
                    </div>
                    <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-[var(--text-primary)]'}`}>多团队隔离</h3>
                    <p className={isDarkMode ? 'text-[rgba(255,255,255,0.7)]' : 'text-[var(--text-secondary)]'}>数据库级别隔离架构，为每个团队提供独立安全的数据环境</p>
                  </div>

                  {/* 功能卡片2 */}
                  <div className="feature-card">
                    <div className="icon-container">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                      </svg>
                    </div>
                    <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-[var(--text-primary)]'}`}>实时数据分析</h3>
                    <p className={isDarkMode ? 'text-[rgba(255,255,255,0.7)]' : 'text-[var(--text-secondary)]'}>直观的数据可视化，帮助团队进行数据驱动决策</p>
                  </div>

                  {/* 功能卡片3 */}
                  <div className="feature-card">
                    <div className="icon-container">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>
                    </div>
                    <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-[var(--text-primary)]'}`}>安全认证</h3>
                    <p className={isDarkMode ? 'text-[rgba(255,255,255,0.7)]' : 'text-[var(--text-secondary)]'}>JWT与bcryptjs加密确保系统安全，多层次访问控制</p>
                  </div>
                </div>
              )}

              {activeTab === "stats" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* 数据统计卡片1 */}
                  <div className="stats-card">
                    <h4 className={`uppercase tracking-wider text-sm mb-2 ${isDarkMode ? 'text-[rgba(255,255,255,0.6)]' : 'text-[var(--text-tertiary)]'}`}>活跃用户</h4>
                    <div className="stats-number">12,543</div>
                    <div className="text-green-500 flex items-center text-lg font-medium">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                      </svg>
                      <span>↑ 23.6%</span>
                    </div>
                  </div>

                  {/* 数据统计卡片2 */}
                  <div className="stats-card">
                    <h4 className={`uppercase tracking-wider text-sm mb-2 ${isDarkMode ? 'text-[rgba(255,255,255,0.6)]' : 'text-[var(--text-tertiary)]'}`}>团队数量</h4>
                    <div className="stats-number">542</div>
                    <div className="text-green-500 flex items-center text-lg font-medium">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                      </svg>
                      <span>↑ 18.2%</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "start" && (
                <div className={isDarkMode ? 'glass-card-dark p-8' : 'glass-card p-8'}>
                  <div className="mb-8">
                    <h3 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-[var(--text-primary)]'}`}>快速开始使用</h3>
                    <p className={`mb-6 ${isDarkMode ? 'text-[rgba(255,255,255,0.7)]' : 'text-[var(--text-secondary)]'}`}>按照以下步骤开始使用私域管理系统</p>
                    <div className="space-y-6">
                      <div className="flex items-start">
                        <div className="step-number mr-4 flex-shrink-0">1</div>
                        <div>
                          <h4 className={`font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-[var(--text-primary)]'}`}>注册账户</h4>
                          <p className={isDarkMode ? 'text-[rgba(255,255,255,0.6)]' : 'text-[var(--text-tertiary)]'}>创建您的管理员账户，并设置团队信息</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="step-number mr-4 flex-shrink-0">2</div>
                        <div>
                          <h4 className={`font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-[var(--text-primary)]'}`}>邀请团队成员</h4>
                          <p className={isDarkMode ? 'text-[rgba(255,255,255,0.6)]' : 'text-[var(--text-tertiary)]'}>通过邮件链接邀请团队成员加入</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="step-number mr-4 flex-shrink-0">3</div>
                        <div>
                          <h4 className={`font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-[var(--text-primary)]'}`}>配置工作空间</h4>
                          <p className={isDarkMode ? 'text-[rgba(255,255,255,0.6)]' : 'text-[var(--text-tertiary)]'}>根据需求设置工作流程和权限</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="btn-primary w-full py-3">
                    立即开始
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 特色展示卡片 */}
          <div className="mb-24">
            <h2 className={`text-3xl font-bold text-center mb-14 ${isDarkMode ? 'text-white' : 'text-[var(--text-primary)]'}`}>探索更多功能</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* 特色卡片1 - 左侧 */}
              <div className={`rounded-3xl overflow-hidden ${isDarkMode ? 'glass-card-dark' : 'glass-card'}`}>
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-accent-orange/20 flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-[var(--accent-orange)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                      </svg>
                    </div>
                    <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-[var(--text-primary)]'}`}>数据可视化</h3>
                  </div>
                  <p className={`mb-6 ${isDarkMode ? 'text-[rgba(255,255,255,0.7)]' : 'text-[var(--text-secondary)]'}`}>
                    直观展现核心业务指标，支持自定义仪表盘和报表，帮助团队快速识别趋势和异常
                  </p>
                  <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 p-6 rounded-2xl">
                    <div className="flex justify-between mb-4">
                      <div className={`${isDarkMode ? 'text-white' : 'text-[var(--text-primary)]'}`}>月度增长</div>
                      <div className="text-[var(--accent-orange)]">+24.8%</div>
                    </div>
                    <div className="w-full bg-black/10 h-2 rounded-full mb-8">
                      <div className="bg-[var(--accent-orange)] h-2 rounded-full" style={{width: '68%'}}></div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 bg-white/20 rounded-xl"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 特色卡片2 - 右侧 */}
              <div className={`rounded-3xl overflow-hidden ${isDarkMode ? 'glass-card-dark' : 'glass-card'}`}>
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-accent-teal/20 flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-[var(--accent-teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                    </div>
                    <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-[var(--text-primary)]'}`}>团队协作</h3>
                  </div>
                  <p className={`mb-6 ${isDarkMode ? 'text-[rgba(255,255,255,0.7)]' : 'text-[var(--text-secondary)]'}`}>
                    集成消息、任务和日历功能，让团队成员保持同步，提高协作效率
                  </p>
                  <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 p-6 rounded-2xl">
                    <div className="flex flex-col space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-white/30 mr-3 flex-shrink-0"></div>
                          <div className="flex-1">
                            <div className="h-2 bg-white/30 rounded-full w-3/4 mb-1"></div>
                            <div className="h-2 bg-white/20 rounded-full w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 页脚 */}
        <footer className={isDarkMode ? 'glass-card-dark p-6 text-center' : 'glass-card p-6 text-center'}>
          <div className={`max-w-2xl mx-auto text-sm ${isDarkMode ? 'text-[rgba(255,255,255,0.6)]' : 'text-[var(--text-tertiary)]'}`}>
            © 2024 私域管理系统 | 使用现代前端技术栈构建 | TypeScript + Next.js + React + Tailwind CSS
          </div>
        </footer>
    </div>
    </main>
  );
}
