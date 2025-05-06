/**
 * 应用中间件
 * 作者: 阿瑞
 * 功能: 保护需要登录才能访问的路由
 * 版本: 2.2
 * 
 * 注意: 本文件目前是自包含实现，未来可拆分为:
 * 1. @/config/auth - 认证配置
 * 2. @/lib/logger - 日志工具
 * 3. @/middleware/utils - 中间件工具函数
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthUtils } from '@/lib/auth';

// ===================== 临时内联配置和工具 =====================
// TODO: 未来应迁移到 @/config/auth
type AuthConfig = {
  publicRoutes: string[];
  clientSideAuthPaths: string[];
  staticAssetRoutes: string[];
  publicPrefixes: string[]; // 新增：公开前缀路径
  apiPrefix: string;
};

const authConfig: AuthConfig = {
  publicRoutes: [
    '/',
    '/login',
    '/register',
    '/reset-password',
    '/workspace/public'
  ],
  clientSideAuthPaths: ['/workspace'],
  staticAssetRoutes: [
    '/_next/',
    '/fonts/',
    '/images/',
    '/Browser/',
    '/favicon.ico'
  ],
  publicPrefixes: [
    '/public/',
    '/test/',
    '/api/'
  ],
  apiPrefix: '/api/'
};

// TODO: 未来应迁移到 @/lib/logger
const logger = {
  debug: (message: string, metadata?: Record<string, unknown>) => 
    process.env.NODE_ENV === 'development' && console.debug(`[DEBUG] ${message}`, metadata),
  info: (message: string, metadata?: Record<string, unknown>) => 
    console.log(`[INFO] ${message}`, metadata),
  warn: (message: string, metadata?: Record<string, unknown>) => 
    console.warn(`[WARN] ${message}`, metadata),
  error: (message: string, metadata?: Record<string, unknown>) => 
    console.error(`[ERROR] ${message}`, metadata)
};

// ===================== 工具函数 =====================
// TODO: 未来可迁移到 @/middleware/utils

/**
 * 检查是否为公开路径
 */
function isPublicPath(pathname: string): boolean {
  // 检查是否为完全匹配的公开路由
  if (authConfig.publicRoutes.some(
    (route: string) => pathname === route || pathname.startsWith(`${route}/`)
  )) {
    return true;
  }
  
  // 检查是否为公开前缀路径
  if (authConfig.publicPrefixes.some(
    (prefix: string) => pathname.startsWith(prefix)
  )) {
    return true;
  }
  
  return false;
}

/**
 * 处理未认证请求
 */
function handleUnauthenticated(
  request: NextRequest,
  isApiRequest: boolean,
  pathname: string
): NextResponse {
  // 客户端处理的特殊路径
  if (authConfig.clientSideAuthPaths.some(
    (path: string) => pathname.startsWith(path))
  ) {
    logger.debug('客户端认证路径', { pathname });
    return NextResponse.next();
  }

  if (isApiRequest) {
    logger.warn('API请求未授权', { pathname });
    return NextResponse.json(
      { error: '未授权访问' },
      { status: 401 }
    );
  }

  logger.info('重定向到登录页', { pathname });
  return NextResponse.redirect(new URL('/login', request.url));
}

/**
 * 处理无效令牌
 */
function handleInvalidToken(
  isApiRequest: boolean,
  request: NextRequest
): NextResponse {
  const response = isApiRequest
    ? NextResponse.json(
        { error: '无效的访问令牌' }, 
        { status: 401 }
      )
    : NextResponse.redirect(new URL('/login', request.url));

  // 安全清除cookie
  response.cookies.set('token', '', {
    maxAge: -1,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });

  return response;
}

// ===================== 主中间件逻辑 =====================
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  logger.debug('处理请求路径', { pathname });

  // 静态资源直接放行
  if (authConfig.staticAssetRoutes.some(
    (route: string) => pathname.startsWith(route) || pathname === route.replace(/\/$/, '')
  )) {
    return NextResponse.next();
  }

  // 公开路径处理
  if (isPublicPath(pathname)) {
    logger.debug('公开路径访问', { pathname });
    return NextResponse.next();
  }

  // 获取令牌
  const token = request.cookies.get('token')?.value || 
    request.headers.get('Authorization')?.split(' ')[1];

  // 未认证处理
  if (!token) {
    return handleUnauthenticated(
      request,
      pathname.startsWith(authConfig.apiPrefix),
      pathname
    );
  }

  // 验证令牌
  try {
    AuthUtils.verifyToken(token);
    logger.debug('令牌验证通过', { pathname });
    return NextResponse.next();
  } catch (error) {
    logger.error('令牌验证失败', { error, pathname });
    return handleInvalidToken(
      pathname.startsWith(authConfig.apiPrefix),
      request
    );
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};