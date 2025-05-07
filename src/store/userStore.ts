/**
 * 用户状态管理模块
 * 作者: 阿瑞
 * 功能: 管理用户登录状态、权限和个人信息
 * 版本: 1.2
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WorkspaceStatus, UserStatus } from '@/models/system/types';

/**
 * 用户信息类型定义
 * 精简版的用户数据，移除敏感字段
 */
export interface IUserInfo {
  id: number;
  username: string;
  email: string;
  phone: string;
  roleType: string;         // 角色类型
  roleName: string;         // 角色显示名称
  isCustomRole: boolean;    // 是否为自定义角色
  status: UserStatus;
  workspace: {
    id: number;
    name: string;
    status: WorkspaceStatus;
  };
  lastLoginAt?: string;
}

/**
 * 用户存储状态类型定义
 */
type UserStore = {
  userInfo: Partial<IUserInfo>;
  accessToken: string;
  isAuthenticated: boolean;
  actions: {
    setUserInfo: (userInfo: IUserInfo) => void;
    setUserToken: (accessToken: string) => void;
    clearUserInfoAndToken: () => void;
    fetchAndSetUserInfo: () => Promise<void>;
    logout: () => Promise<void>;
  };
};

/**
 * 初始状态
 */
const initialState = {
  userInfo: {},
  accessToken: '',
  isAuthenticated: false,
};

/**
 * 创建用户状态管理存储
 * 使用zustand实现响应式状态管理
 */
export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      actions: {
        /**
         * 设置用户信息
         * @param userInfo 用户信息对象
         */
        setUserInfo: (userInfo: IUserInfo) => {
          set({
            userInfo,
            isAuthenticated: true,
          });
        },
        
        /**
         * 设置访问令牌
         * @param accessToken JWT访问令牌
         */
        setUserToken: (accessToken: string) => {
          set({
            accessToken,
            isAuthenticated: !!accessToken, // 确保令牌存在时设置为已认证
          });
        },
        
        /**
         * 清除用户信息和令牌
         * 用于用户注销或令牌失效
         */
        clearUserInfoAndToken: () => {
          set(initialState);
        },
        
        /**
         * 获取并设置用户信息
         * 从API获取最新的用户信息
         */
        fetchAndSetUserInfo: async () => {
          try {
            const { accessToken } = get();
            
            if (!accessToken) {
              console.error('获取用户信息失败: 未找到访问令牌');
              return;
            }
            
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            
            if (!response.ok) {
              throw new Error('获取用户信息请求失败');
            }
            
            const data = await response.json();
            get().actions.setUserInfo(data.user);
            
          } catch (error) {
            console.error('获取用户信息失败:', error);
            // 如果是授权错误，清除用户数据
            if ((error as any)?.message?.includes('401') || (error as any)?.message?.includes('授权')) {
              get().actions.clearUserInfoAndToken();
            }
          }
        },
        
        /**
         * 用户注销
         * 调用注销API并清除本地存储
         */
        logout: async () => {
          try {
            const { accessToken } = get();
            
            if (accessToken) {
              // 调用注销API
              await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              });
            }
          } catch (error) {
            console.error('注销失败:', error);
          } finally {
            // 无论API调用成功与否，都清除本地状态
            get().actions.clearUserInfoAndToken();
          }
        }
      }
    }),
    {
      name: 'saas-user-storage', // 存储的键名
      storage: createJSONStorage(() => localStorage), // 使用localStorage
      partialize: (state) => ({ 
        userInfo: state.userInfo, 
        accessToken: state.accessToken, 
        isAuthenticated: state.isAuthenticated 
      }), // 仅持久化这些字段
    }
  )
);

/**
 * 导出便捷访问器
 * 方便在组件中访问特定状态
 */
export const useUserActions = () => useUserStore((state) => state.actions);
export const useUserInfo = () => useUserStore((state) => state.userInfo);
export const useIsAuthenticated = () => useUserStore((state) => state.isAuthenticated);
export const useAccessToken = () => useUserStore((state) => state.accessToken);
