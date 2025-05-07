/**
 * 团队数据钩子
 * 作者: 阿瑞
 * 功能: 提供团队数据的获取和管理功能
 * 版本: 1.0.0
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAccessToken, useUserInfo } from '@/store/userStore';

/**
 * 团队数据接口
 */
export interface Team {
  id: number;
  teamCode: string;
  name: string;
  dbHost: string;
  dbName: string;
  status: number;
  createdAt: string;
}

/**
 * 团队上下文状态接口
 */
interface TeamContextState {
  currentTeam: Team | null;
  teams: Team[];
  isLoading: boolean;
  error: string | null;
  fetchTeams: () => Promise<void>;
  setCurrentTeam: (team: Team) => void;
  switchTeam: (teamCode: string) => void;
}

// 创建团队上下文
const TeamContext = createContext<TeamContextState>({
  currentTeam: null,
  teams: [],
  isLoading: false,
  error: null,
  fetchTeams: async () => {},
  setCurrentTeam: () => {},
  switchTeam: () => {},
});

/**
 * 团队数据提供者
 */
export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const params = useParams();
  const accessToken = useAccessToken();
  const userInfo = useUserInfo();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  
  /**
   * 获取团队列表
   */
  const fetchTeams = useCallback(async () => {
    if (!accessToken || !userInfo.workspace?.id) return;
    
    // 如果已经加载过数据且有团队数据，不重复加载
    if (hasLoaded && teams.length > 0) {
      // 仅检查是否需要更新currentTeam
      const teamCodeFromParams = params?.teamCode as string;
      if (teamCodeFromParams && (!currentTeam || currentTeam.teamCode !== teamCodeFromParams)) {
        const teamFromParams = teams.find(t => t.teamCode === teamCodeFromParams);
        if (teamFromParams) {
          setCurrentTeam(teamFromParams);
        }
      }
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/workspace/teams?workspaceId=${userInfo.workspace.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('获取团队列表失败');
      }
      
      const data = await response.json();
      setTeams(data.teams || []);
      setHasLoaded(true);
      
      // 如果有团队，默认选中第一个
      if (data.teams && data.teams.length > 0 && !currentTeam) {
        // 检查URL中是否有特定团队Code
        const teamCodeFromParams = params?.teamCode as string;
        
        if (teamCodeFromParams) {
          const teamFromParams = data.teams.find((t: Team) => t.teamCode === teamCodeFromParams);
          if (teamFromParams) {
            setCurrentTeam(teamFromParams);
          } else {
            setCurrentTeam(data.teams[0]);
          }
        } else {
          setCurrentTeam(data.teams[0]);
        }
      }
    } catch (err) {
      console.error('获取团队列表失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, userInfo.workspace?.id, params, currentTeam, teams, hasLoaded]);
  
  /**
   * 切换当前选中的团队
   */
  const switchTeam = useCallback((teamCode: string) => {
    const team = teams.find(t => t.teamCode === teamCode);
    if (team) {
      setCurrentTeam(team);
      router.push(`/team/${teamCode}`);
    }
  }, [teams, router]);
  
  /**
   * 初始化加载团队数据
   */
  useEffect(() => {
    if (accessToken && userInfo.workspace?.id) {
      fetchTeams();
    }
  }, [accessToken, userInfo.workspace?.id, fetchTeams]);
  
  /**
   * 监听URL参数变化
   */
  useEffect(() => {
    const teamCodeFromParams = params?.teamCode as string;
    
    if (teamCodeFromParams && teams.length > 0) {
      const teamFromParams = teams.find(t => t.teamCode === teamCodeFromParams);
      if (teamFromParams && (!currentTeam || currentTeam.teamCode !== teamCodeFromParams)) {
        setCurrentTeam(teamFromParams);
      }
    }
  }, [params, teams, currentTeam]);
  
  return (
    <TeamContext.Provider
      value={{
        currentTeam,
        teams,
        isLoading,
        error,
        fetchTeams,
        setCurrentTeam,
        switchTeam
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

/**
 * 团队数据钩子
 * 用于在组件中获取和管理团队数据
 */
export const useTeam = () => {
  const context = useContext(TeamContext);
  
  if (!context) {
    throw new Error('useTeam必须在TeamProvider内部使用');
  }
  
  return context;
}; 