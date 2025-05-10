
/*
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
  role?: string;
  isAdmin?: boolean;
  teamId?: number;
}
*/

import { WorkspaceStatus, UserStatus } from '@/models/system/types';
export interface IUserInfo {
  id: number;
  username: string;
  email: string;
  phone: string;
  roleType: string;
  roleName: string;
  isCustomRole: boolean;
  status: UserStatus;
  workspace: {
    id: number;
    name: string;
    status: WorkspaceStatus;
  };
  lastLoginAt?: string;
  role?: string;
  isAdmin?: boolean;
  teamId?: number;
}       
