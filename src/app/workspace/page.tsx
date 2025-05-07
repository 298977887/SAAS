/**
 * 工作空间页面
 * 作者: 阿瑞
 * 功能: 提供用户工作空间界面和管理，使用毛玻璃UI效果
 * 布局: 使用侧边栏布局，左侧为导航和用户信息，右侧为主工作区
 * 版本: 3.1
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUserInfo, useUserActions, useIsAuthenticated, useAccessToken } from '@/store/userStore';
import { useThemeMode } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';
import { SystemRoleType } from '@/models/system/types';
import AddMemberModal from '@/components/AddMemberModal';
import InviteModal from '@/components/InviteModal';

/**
 * 团队数据接口
 */
interface Team {
  id: number;
  teamCode: string;
  name: string;
  status: number;
}

/**
 * 成员数据接口
 */
interface Member {
  id: number;
  username: string;
  email: string;
  roleType: string;
  roleName: string;
  isCustomRole: boolean;
  status: number;
}

/**
 * 工作空间页面组件
 */
export default function WorkspacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userInfo = useUserInfo();
  const accessToken = useAccessToken();
  const isAuthenticated = useIsAuthenticated();
  const { logout, fetchAndSetUserInfo } = useUserActions();
  const themeMode = useThemeMode();
  
  // 计算当前是否是深色模式
  const isDarkMode = themeMode === ThemeMode.Dark;
  
  // 团队和成员列表数据状态
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState({
    teams: true,
    members: true
  });
  const [activeTeam, setActiveTeam] = useState<number | null>(null);

  // 模态窗口状态
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  /**
   * 未登录用户重定向
   */
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // 如果已登录但工作空间信息不完整，则获取最新信息
    if (!userInfo.workspace?.name) {
      fetchAndSetUserInfo();
    }
    
    // 获取团队和成员数据
    fetchWorkspaceData();
  }, [isAuthenticated, router, userInfo.workspace?.name, fetchAndSetUserInfo]);

  /**
   * 监听URL参数变化，当有refresh参数时刷新数据
   */
  useEffect(() => {
    const refresh = searchParams.get('refresh');
    if (refresh && isAuthenticated && userInfo.workspace?.id) {
      console.log('检测到刷新参数，重新获取数据');
      fetchWorkspaceData();
    }
  }, [searchParams, isAuthenticated, userInfo.workspace?.id]);

  /**
   * 获取工作空间数据
   * 包括团队列表和成员列表
   */
  const fetchWorkspaceData = async () => {
    if (!userInfo.workspace?.id) return;

    // 获取Token
    const token = localStorage.getItem('saas-user-storage') 
      ? JSON.parse(localStorage.getItem('saas-user-storage') || '{}').accessToken 
      : '';
    
    console.log('工作空间数据获取开始，使用Token:', token ? token.substring(0, 10) + '...' : '无');
    
    try {
      // 获取团队列表
      setIsLoading(prev => ({ ...prev, teams: true }));
      console.log('开始获取团队列表, 工作空间ID:', userInfo.workspace?.id);
      
      const teamsResponse = await fetch(`/api/workspace/teams?workspaceId=${userInfo.workspace?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('团队列表响应状态:', teamsResponse.status, teamsResponse.ok);
      
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        console.log('获取到的团队数据:', teamsData);
        setTeams(teamsData.teams || []);
        // 默认选中第一个团队
        if (teamsData.teams && teamsData.teams.length > 0) {
          setActiveTeam(teamsData.teams[0].id);
        }
      } else {
        // 尝试读取错误消息
        const errorData = await teamsResponse.json().catch(_e => ({ error: '无法解析错误响应' }));
        console.error('获取团队列表失败, 状态码:', teamsResponse.status, '错误:', errorData);
      }
    } catch (error) {
      console.error('获取团队列表失败:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, teams: false }));
    }
    
    try {
      // 获取成员列表
      setIsLoading(prev => ({ ...prev, members: true }));
      console.log('开始获取成员列表, 工作空间ID:', userInfo.workspace?.id);
      
      // 增加验证Token是否存在
      const token = localStorage.getItem('saas-user-storage') 
        ? JSON.parse(localStorage.getItem('saas-user-storage') || '{}').accessToken 
        : '';
      
      console.log('使用的Token:', token ? token.substring(0, 10) + '...' : '无');
      
      const membersResponse = await fetch(`/api/workspace/members?workspaceId=${userInfo.workspace?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('成员列表响应状态:', membersResponse.status, membersResponse.ok);
      
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        console.log('获取到的成员数据:', membersData);
        setMembers(membersData.members || []);
      } else {
        // 尝试读取错误消息
        const errorData = await membersResponse.json().catch(_e => ({ error: '无法解析错误响应' }));
        console.error('获取成员列表失败, 状态码:', membersResponse.status, '错误:', errorData);
      }
    } catch (error) {
      console.error('获取成员列表失败:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, members: false }));
    }
  };

  /**
   * 处理用户注销
   */
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  /**
   * 打开添加成员弹窗
   */
  const handleAddMember = () => {
    setIsAddMemberModalOpen(true);
  };
  
  /**
   * 打开邀请注册弹窗
   */
  const handleInvite = () => {
    setIsInviteModalOpen(true);
  };
  
  /**
   * 处理团队点击
   */
  const handleTeamClick = (teamId: number) => {
    // 找到对应的团队对象
    const team = teams.find(t => t.id === teamId);
    setActiveTeam(teamId);
    // 使用teamCode作为导航标识符，提高安全性
    if (team) {
      router.push(`/team/${team.teamCode}`);
    }
  };

  // 未登录或加载中时显示加载状态
  if (!isAuthenticated || !userInfo.username) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>加载工作空间...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 动态背景元素 */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -left-10 w-[800px] h-[800px] bg-purple-500/8 rounded-full filter blur-[120px] opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] -right-10 w-[700px] h-[700px] bg-blue-500/10 rounded-full filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute -bottom-20 left-[15%] w-[850px] h-[850px] bg-teal-400/8 rounded-full filter blur-[120px] opacity-60 animate-blob animation-delay-2000"></div>
      </div>
      
      {/* 装饰小球元素 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-4 h-4 rounded-full bg-accent-teal/60 animate-float"></div>
        <div className="absolute top-[30%] right-[15%] w-3 h-3 rounded-full bg-accent-purple/50 animate-float animation-delay-2000"></div>
        <div className="absolute bottom-[25%] left-[20%] w-4 h-4 rounded-full bg-accent-blue/50 animate-float animation-delay-4000"></div>
      </div>
      
      {/* 主布局 - 采用侧边栏布局 */}
      <div className="flex h-screen relative z-10">
        {/* 侧边栏导航 */}
        <aside className={`w-64 flex-shrink-0 h-screen overflow-y-auto fixed left-0 top-0 ${isDarkMode ? 'glass-card-dark' : 'glass-card'} border-r ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} shadow-lg`}>
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col items-center">

            <h1 className={`text-xl font-bold truncate text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {userInfo.workspace?.name || '我的工作空间'}
            </h1>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>工作空间管理</p>
          </div>
          
          {/* 用户信息 */}
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-blue-500/30 to-purple-500/30' : 'bg-gradient-to-br from-blue-100 to-purple-100'}`}>
                <span className={`text-base font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                  {userInfo.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{userInfo.username}</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {userInfo.roleName}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-2 border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className={`flex justify-between text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="text-xs">邮箱:</span>
                <span className="font-medium text-xs truncate ml-2">{userInfo.email}</span>
              </div>
              <div className={`flex justify-between text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="text-xs">上次登录:</span>
                <span className="font-medium text-xs">
                  {userInfo.lastLoginAt 
                    ? new Date(userInfo.lastLoginAt).toLocaleString('zh-CN', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) 
                    : '首次登录'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
            >
              <span className="text-sm">退出登录</span>
            </button>
          </div>
          
          {/* 团队列表 */}
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>我的团队</h2>
              <Link
                href="/workspace/create-team"
                className={`text-xs p-1.5 rounded-md ${isDarkMode ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} transition-colors`}
              >
                <span className="inline-block">+&nbsp;创建</span>
              </Link>
            </div>
            
            {isLoading.teams ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
              </div>
            ) : teams.length === 0 ? (
              <div className={`text-center p-5 ${isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50'} rounded-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                <p>暂无团队</p>
                <Link href="/workspace/create-team" className="btn-primary inline-block mt-2 text-xs px-2 py-1">
                  创建团队
                </Link>
              </div>
            ) : (
              <div className={`${isDarkMode ? 'bg-gray-800/20' : 'bg-gray-50'} rounded-lg p-2`}>
                <ul className="space-y-2">
                  {teams.map(team => (
                    <li 
                      key={team.id}
                      onClick={() => handleTeamClick(team.id)}
                      className={`p-2.5 rounded-lg cursor-pointer transition-colors ${
                        activeTeam === team.id 
                          ? (isDarkMode ? 'bg-blue-900/40 border-l-4 border-blue-500' : 'bg-blue-100 border-l-4 border-blue-500') 
                          : (isDarkMode ? 'hover:bg-gray-700/40' : 'hover:bg-gray-200/70')
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`block font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{team.name}</span>
                          <span className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ID: {team.teamCode}</span>
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            team.status === 1 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {team.status === 1 ? '正常' : '停用'}
                          </span>
                          <svg 
                            className={`ml-2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
        
        {/* 主内容区 */}
        <div className="flex-1 ml-64">
          {/* 顶部导航栏 - 调整宽度与边距，与下方内容保持一致 */}
          <header className="sticky top-0 z-10 p-6">
            <div className={`${isDarkMode ? 'glass-card-dark' : 'glass-card'} rounded-lg h-16 flex items-center justify-center shadow-sm`}>
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>工作空间概览</h2>
            </div>
          </header>
          
          {/* 主体内容 */}
          <main className="p-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className={`${isDarkMode ? 'glass-card-dark' : 'glass-card'} p-4 rounded-lg`}>
                <h3 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>团队总数</h3>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{teams.length}</p>
              </div>
              <div className={`${isDarkMode ? 'glass-card-dark' : 'glass-card'} p-4 rounded-lg`}>
                <h3 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>成员总数</h3>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{members.length}</p>
              </div>
              <div className={`${isDarkMode ? 'glass-card-dark' : 'glass-card'} p-4 rounded-lg`}>
                <h3 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>活跃状态</h3>
                <p className={`text-2xl font-bold text-green-500`}>在线</p>
              </div>
            </div>
            
            {/* 成员列表卡片 */}
            <div className={`${isDarkMode ? 'glass-card-dark' : 'glass-card'} rounded-lg overflow-hidden`}>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>工作空间成员</h2>
                {userInfo.roleType === SystemRoleType.ADMIN && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleAddMember} 
                      className="btn-secondary text-sm px-3 py-1"
                    >
                      添加成员
                    </button>
                    <button 
                      onClick={handleInvite} 
                      className="btn-primary text-sm px-3 py-1"
                    >
                      邀请注册
                    </button>
                  </div>
                )}
              </div>
              
              {isLoading.members ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                </div>
              ) : members.length === 0 ? (
                <div className={`text-center p-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>工作空间暂无其他成员</p>
                  {userInfo.roleType === SystemRoleType.ADMIN && (
                    <button onClick={handleInvite} className="btn-primary mt-4 text-sm">
                      邀请成员加入
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className={isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50'}>
                      <tr>
                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                          用户名
                        </th>
                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                          邮箱
                        </th>
                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                          角色
                        </th>
                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                          状态
                        </th>
                        {userInfo.roleType === SystemRoleType.ADMIN && (
                          <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                            操作
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className={`${isDarkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}`}>
                      {members.map((member) => (
                        <tr key={member.id} className={isDarkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {member.username} {member.id === userInfo.id && <span className="text-xs text-blue-500">(你)</span>}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {member.email}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {member.roleName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              member.status === 1 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {member.status === 1 ? '已启用' : '已禁用'}
                            </span>
                          </td>
                          {userInfo.roleType === SystemRoleType.ADMIN && (
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {member.id !== userInfo.id && (
                                <Link href={`/workspace/edit-member/${member.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                  编辑
                                </Link>
                              )}
                              {member.id !== userInfo.id && member.roleType !== SystemRoleType.ADMIN && (
                                <button className="text-red-600 hover:text-red-900">
                                  {member.status === 1 ? '禁用' : '启用'}
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      
      {/* 添加成员模态窗口 */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        workspaceId={userInfo.workspace?.id || 0}
        accessToken={accessToken || ''}
        refreshMembers={fetchWorkspaceData}
        themeMode={themeMode}
      />

      {/* 邀请注册模态窗口 */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        workspaceId={userInfo.workspace?.id || 0}
        accessToken={accessToken || ''}
        themeMode={themeMode}
      />
    </div>
  );
} 