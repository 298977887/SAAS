/**
 * @作者: 阿瑞
 * @功能: UI组件展示页面
 * @版本: 1.2.0
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Switch from '@/components/ui/Switch';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Tabs from '@/components/ui/Tabs';
import Progress from '@/components/ui/Progress';
import { NotificationPosition, NotificationContainer, NotificationProvider, useNotification } from '@/components/ui/Notification';
import { Icon } from '@iconify/react';
import { useThemeMode, useSettingActions } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';

// 组件导航配置
interface ComponentNavItem {
  id: string;
  name: string;
  icon: string;
}

const componentsNavConfig: ComponentNavItem[] = [
  { id: 'progress', name: '进度条', icon: 'lucide:bar-chart-2' },
  { id: 'button', name: '按钮', icon: 'lucide:click' },
  { id: 'card', name: '卡片', icon: 'lucide:layout' },
  { id: 'avatar', name: '头像', icon: 'lucide:user' },
  { id: 'tabs', name: '选项卡', icon: 'lucide:folder' },
  { id: 'modal', name: '模态框', icon: 'lucide:layers' },
  { id: 'input', name: '输入框', icon: 'lucide:type' },
  { id: 'switch', name: '开关', icon: 'lucide:toggle-left' },
  { id: 'badge', name: '徽章', icon: 'lucide:tag' },
  { id: 'notification', name: '通知', icon: 'lucide:bell' },
];

// 选项卡项目接口
interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

/**
 * UI组件展示页面
 * 展示所有创建的UI组件及其变体
 */
function UIShowcaseContent() {
  // 状态管理
  const [switchState, setSwitchState] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState('progress');
  
  // 引用
  const componentRefs = useRef<Record<string, HTMLElement | null>>({});
  
  // 使用全局主题状态
  const themeMode = useThemeMode();
  const { toggleThemeMode } = useSettingActions();
  const isDarkMode = themeMode === ThemeMode.Dark;

  // 获取通知API
  const notification = useNotification();
  
  // 通知位置状态
  const [notificationPosition, setNotificationPosition] = useState<NotificationPosition>('top-right');
  
  // 通知位置选项
  const positionOptions: Array<{value: NotificationPosition, label: string}> = [
    { value: 'top-right', label: '右上角' },
    { value: 'top-left', label: '左上角' },
    { value: 'bottom-right', label: '右下角' },
    { value: 'bottom-left', label: '左下角' },
    { value: 'top-center', label: '顶部居中' },
    { value: 'bottom-center', label: '底部居中' },
  ];
  
  // 显示不同类型的通知
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info') => {
    const titles = {
      success: '操作成功',
      error: '操作失败',
      warning: '警告提示',
      info: '消息通知',
    };
    
    const messages = {
      success: '您的操作已成功完成，数据已保存。',
      error: '操作过程中发生错误，请稍后重试。',
      warning: '此操作可能会导致数据丢失，请谨慎处理。',
      info: '您有3条新消息，点击查看详情。',
    };
    
    notification[type](messages[type], {
      title: titles[type],
      position: notificationPosition,
      duration: 5000,
    });
  };
  
  // 显示自定义操作的通知
  const showNotificationWithActions = () => {
    notification.info('确认删除此项目及所有相关数据吗？此操作无法撤销。', {
      title: '确认删除',
      position: notificationPosition,
      autoClose: false,
      actions: (
        <>
          <Button 
            size="xs" 
            variant="danger" 
            onClick={() => {
              notification.success('项目已删除', {
                position: notificationPosition,
              });
            }}
          >
            删除
          </Button>
          <Button 
            size="xs" 
            variant="secondary" 
            onClick={() => {
              notification.info('已取消删除操作', {
                position: notificationPosition,
              });
            }}
          >
            取消
          </Button>
        </>
      ),
    });
  };

  // 处理导航点击
  const handleNavClick = (id: string) => {
    setActiveComponent(id);
    const element = componentRefs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  // 设置组件引用
  const setComponentRef = (id: string) => (el: HTMLElement | null) => {
    componentRefs.current[id] = el;
  };

  // 选项卡示例数据
  const tabItems: TabItem[] = [
    {
      id: 'tab1',
      label: '选项卡一',
      icon: <Icon icon="lucide:home" className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>选项卡一内容</h3>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            这是选项卡一的内容区域，可以放置任何React组件。
          </p>
          <Button variant="primary" size="sm">操作按钮</Button>
        </div>
      ),
    },
    {
      id: 'tab2',
      label: '选项卡二',
      icon: <Icon icon="lucide:settings" className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>选项卡二内容</h3>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            这是选项卡二的内容区域，选项卡之间的内容会根据选择自动切换。
          </p>
          <div className="flex space-x-2">
            <Badge variant="success">成功</Badge>
            <Badge variant="warning">警告</Badge>
            <Badge variant="danger">错误</Badge>
          </div>
        </div>
      ),
    },
    {
      id: 'tab3',
      label: '选项卡三',
      icon: <Icon icon="lucide:users" className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>选项卡三内容</h3>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            这是选项卡三的内容区域，支持动画过渡效果。
          </p>
          <div className="flex space-x-3">
            <Avatar name="张三" status="online" />
            <Avatar name="李四" status="busy" />
            <Avatar name="王五" status="away" />
          </div>
        </div>
      ),
    },
  ];
  
  // 处理页面滚动，更新活动组件
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      // 找到当前视口中的组件
      let currentComponent = activeComponent;
      
      Object.entries(componentRefs.current).forEach(([id, ref]) => {
        if (ref) {
          const { offsetTop, offsetHeight } = ref;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            currentComponent = id;
          }
        }
      });
      
      if (currentComponent !== activeComponent) {
        setActiveComponent(currentComponent);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeComponent]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-slate-900 to-indigo-950' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-20 backdrop-blur-lg bg-white/70 dark:bg-slate-900/70 border-b border-gray-200 dark:border-gray-800/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            毛玻璃UI组件库
          </h1>
          
          <div className="flex items-center gap-3">
            <Button 
              size="sm"
              buttonStyle="ghost"
              icon={isDarkMode ? <Icon icon="lucide:sun" className="w-4 h-4" /> : <Icon icon="lucide:moon" className="w-4 h-4" />}
              onClick={toggleThemeMode}
            >
              {isDarkMode ? '亮色模式' : '暗色模式'}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row">
        {/* 侧边导航 */}
        <div className="md:w-64 md:min-h-screen md:sticky md:top-16 md:self-start p-4">
          <Card glassEffect="medium" className="overflow-hidden">
            <div className="py-2">
              <h2 className="text-lg font-semibold px-4 py-2 mb-2 border-b border-gray-200/30 dark:border-gray-700/30">
                组件导航
              </h2>
              <ul className="space-y-1">
                {componentsNavConfig.map((comp) => (
                  <li key={comp.id}>
                    <button
                      className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors
                        ${activeComponent === comp.id
                          ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 font-medium'
                          : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/30 text-gray-700 dark:text-gray-300'
                        }`}
                      onClick={() => handleNavClick(comp.id)}
                    >
                      <Icon icon={comp.icon} className="w-5 h-5 mr-3" />
                      {comp.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
        
        {/* 主内容区 */}
        <div className="flex-1 p-6 md:p-10">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              毛玻璃UI组件展示
            </h1>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
              基于毛玻璃设计风格的现代UI组件库，支持亮色和暗色主题，提供轻量、美观且高度可定制的组件。
            </p>
          </div>

          {/* 背景装饰元素 */}
          <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
            <div className={`absolute top-1/4 left-1/4 w-64 h-64 ${isDarkMode ? 'bg-blue-600/10' : 'bg-blue-400/20'} rounded-full blur-3xl`}></div>
            <div className={`absolute top-2/3 left-2/3 w-72 h-72 ${isDarkMode ? 'bg-purple-600/10' : 'bg-purple-400/20'} rounded-full blur-3xl`}></div>
            <div className={`absolute top-1/2 right-1/4 w-80 h-80 ${isDarkMode ? 'bg-pink-600/5' : 'bg-pink-400/10'} rounded-full blur-3xl`}></div>
          </div>

          <div className="max-w-4xl mx-auto space-y-16">
            {/* 进度条组件展示 */}
            <section id="progress" ref={setComponentRef('progress')}>
              <Card 
                title={
                  <div className="flex items-center">
                    <Icon icon={componentsNavConfig[0].icon} className="w-5 h-5 mr-2 text-blue-500" />
                    <span>进度条组件</span>
                  </div>
                }
                subtitle="支持多种风格、尺寸和形状的进度条"
                glassEffect="medium"
                className="overflow-hidden"
              >
                <div className="space-y-8">
                  {/* 基本进度条 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>基本用法</h3>
                    <div className="flex flex-col space-y-6">
                      <Progress value={25} showText />
                      <Progress value={50} showText />
                      <Progress value={75} showText />
                      <Progress value={100} showText />
                    </div>
                  </div>

                  {/* 进度条变体 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>进度条变体</h3>
                    <div className="flex flex-col space-y-6">
                      <Progress value={60} variant="primary" showText />
                      <Progress value={60} variant="secondary" showText />
                      <Progress value={60} variant="success" showText />
                      <Progress value={60} variant="danger" showText />
                      <Progress value={60} variant="warning" showText />
                      <Progress value={60} variant="info" showText />
                    </div>
                  </div>

                  {/* 进度条尺寸 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>进度条尺寸</h3>
                    <div className="flex flex-col space-y-6">
                      <Progress value={70} size="sm" />
                      <Progress value={70} size="md" />
                      <Progress value={70} size="lg" />
                    </div>
                  </div>

                  {/* 标签位置 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>标签位置</h3>
                    <div className="flex flex-col space-y-6">
                      <Progress value={65} showText labelPosition="top" label="顶部标签" />
                      <Progress value={65} showText labelPosition="right" label="右侧标签" />
                      <Progress value={65} showText labelPosition="bottom" label="底部标签" />
                      <Progress value={65} showText labelPosition="left" label="左侧标签" />
                      <Progress value={65} showText labelPosition="inside" size="lg" variant="success" />
                    </div>
                  </div>

                  {/* 进度条形状 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>进度条形状</h3>
                    <div className="flex flex-col space-y-6">
                      <Progress value={65} shape="rounded" showText />
                      <Progress value={65} shape="square" showText />
                      <Progress value={65} shape="pill" showText />
                    </div>
                  </div>

                  {/* 条纹进度条 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>条纹进度条</h3>
                    <div className="flex flex-col space-y-6">
                      <Progress value={45} striped showText />
                      <Progress value={45} striped animated showText />
                    </div>
                  </div>

                  {/* 自定义颜色 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>自定义颜色</h3>
                    <div className="flex flex-col space-y-6">
                      <Progress value={55} showText color="#8e6bff" backgroundColor="#8e6bff30" />
                      <Progress value={55} showText color="#ff66c2" backgroundColor="#ff66c230" />
                      <Progress value={55} showText color="#ff9640" backgroundColor="#ff964030" />
                    </div>
                  </div>

                  {/* 渐变进度条 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>渐变进度条</h3>
                    <div className="flex flex-col space-y-6">
                      <Progress 
                        value={80} 
                        showText
                        gradientFrom="#3b82f6" 
                        gradientTo="#8b5cf6" 
                      />
                      <Progress 
                        value={80} 
                        showText
                        gradientFrom="#06d7b2" 
                        gradientTo="#3b82f6" 
                      />
                      <Progress 
                        value={80} 
                        showText
                        gradientFrom="#f59e0b" 
                        gradientTo="#ef4444" 
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* 按钮组件展示 */}
            <section id="button" ref={setComponentRef('button')}>
              <Card 
                title={
                  <div className="flex items-center">
                    <Icon icon={componentsNavConfig[1].icon} className="w-5 h-5 mr-2 text-blue-500" />
                    <span>按钮组件</span>
                  </div>
                }
                subtitle="支持多种风格、尺寸和状态的按钮"
                glassEffect="medium"
                className="overflow-hidden"
              >
                <div className="space-y-8">
                  {/* 按钮变体 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>按钮变体</h3>
                    <div className="flex flex-wrap gap-4">
                      <Button variant="primary">主要按钮</Button>
                      <Button variant="secondary">次要按钮</Button>
                      <Button variant="success">成功按钮</Button>
                      <Button variant="danger">危险按钮</Button>
                      <Button variant="warning">警告按钮</Button>
                      <Button variant="info">信息按钮</Button>
                    </div>
                  </div>

                  {/* 按钮尺寸 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>按钮尺寸</h3>
                    <div className="flex flex-wrap gap-4 items-center">
                      <Button size="xs" variant="primary">超小尺寸</Button>
                      <Button size="sm" variant="primary">小尺寸</Button>
                      <Button size="md" variant="primary">中尺寸</Button>
                      <Button size="lg" variant="primary">大尺寸</Button>
                      <Button size="xl" variant="primary">超大尺寸</Button>
                    </div>
                  </div>
                  
                  {/* 按钮风格 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>按钮风格</h3>
                    <div className="flex flex-wrap gap-4">
                      <Button buttonStyle="solid" variant="primary">实心按钮</Button>
                      <Button buttonStyle="outline" variant="primary">轮廓按钮</Button>
                      <Button buttonStyle="ghost" variant="primary">幽灵按钮</Button>
                      <Button buttonStyle="link" variant="primary">链接按钮</Button>
                    </div>
                  </div>
                  
                  {/* 按钮形状 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>按钮形状</h3>
                    <div className="flex flex-wrap gap-4 items-center">
                      <Button shape="rounded" variant="primary">圆角按钮</Button>
                      <Button shape="square" variant="primary">方形按钮</Button>
                      <Button shape="pill" variant="primary">胶囊按钮</Button>
                      <Button shape="circle" variant="primary" icon={<Icon icon="lucide:plus" className="w-5 h-5" />} />
                    </div>
                  </div>

                  {/* 按钮状态 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>按钮状态</h3>
                    <div className="flex flex-wrap gap-4">
                      <Button isLoading variant="primary">加载中</Button>
                      <Button isLoading loadingText="提交中..." variant="success">提交</Button>
                      <Button disabled variant="primary">禁用状态</Button>
                      <Button active variant="primary">激活状态</Button>
                      <Button elevated variant="primary">阴影增强</Button>
                    </div>
                  </div>
                  
                  {/* 图标按钮 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>图标按钮</h3>
                    <div className="flex flex-wrap gap-4">
                      <Button 
                        icon={<Icon icon="lucide:heart" className="w-4 h-4" />} 
                        variant="primary"
                      >
                        左侧图标
                      </Button>
                      <Button 
                        icon={<Icon icon="lucide:arrow-right" className="w-4 h-4" />} 
                        iconPosition="right"
                        variant="primary"
                      >
                        右侧图标
                      </Button>
                      <Button 
                        icon={<Icon icon="lucide:home" className="w-4 h-4" />} 
                        rightIcon={<Icon icon="lucide:chevron-down" className="w-4 h-4" />} 
                        variant="primary"
                      >
                        双侧图标
                      </Button>
                      <Button 
                        fullWidth 
                        variant="primary" 
                        className="max-w-xs"
                      >
                        全宽按钮
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* 卡片组件展示 */}
            <section id="card" ref={setComponentRef('card')}>
              <Card 
                title={
                  <div className="flex items-center">
                    <Icon icon={componentsNavConfig[2].icon} className="w-6 h-6 mr-2 text-blue-500" />
                    <span>卡片组件</span>
                  </div>
                }
                subtitle="灵活的容器组件，支持多种展示效果"
                glassEffect="medium"
              >
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                  灵活的容器组件，支持多种展示效果
                </p>
              </Card>
            </section>

            {/* 头像组件展示 */}
            <section id="avatar" ref={setComponentRef('avatar')}>
              <Card 
                title={
                  <div className="flex items-center">
                    <Icon icon={componentsNavConfig[3].icon} className="w-5 h-5 mr-2 text-blue-500" />
                    <span>头像组件</span>
                  </div>
                }
                subtitle="支持图片、文字头像和状态指示器"
                glassEffect="medium"
              >
                <div className="space-y-8">
                  {/* 文字头像 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>文字头像</h3>
                    <div className="flex flex-wrap gap-6 items-center">
                      <Avatar name="张三" size="xs" />
                      <Avatar name="李四" size="sm" />
                      <Avatar name="王五" size="md" />
                      <Avatar name="赵六" size="lg" />
                      <Avatar name="钱七" size="xl" />
                    </div>
                  </div>

                  {/* 状态指示器 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>状态指示器</h3>
                    <div className="flex flex-wrap gap-6 items-center">
                      <Avatar name="在线用户" status="online" />
                      <Avatar name="离线用户" status="offline" />
                      <Avatar name="忙碌用户" status="busy" />
                      <Avatar name="离开用户" status="away" />
                    </div>
                  </div>

                  {/* 头像形状 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>头像形状</h3>
                    <div className="flex flex-wrap gap-6 items-center">
                      <Avatar name="圆形" shape="circle" />
                      <Avatar name="方形" shape="square" />
                      <Avatar name="圆角" shape="rounded" />
                    </div>
                  </div>

                  {/* 图片头像 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>图片头像</h3>
                    <div className="flex flex-wrap gap-6 items-center">
                      <Avatar src="https://randomuser.me/api/portraits/women/17.jpg" alt="女性头像" />
                      <Avatar src="https://randomuser.me/api/portraits/men/32.jpg" alt="男性头像" status="online" />
                      <Avatar name="备用文字" src="/invalid-url.jpg" bordered />
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* 选项卡组件展示 */}
            <section id="tabs" ref={setComponentRef('tabs')}>
              <Card 
                title={
                  <div className="flex items-center">
                    <Icon icon={componentsNavConfig[4].icon} className="w-5 h-5 mr-2 text-blue-500" />
                    <span>选项卡组件</span>
                  </div>
                }
                subtitle="支持多种样式和布局的内容切换组件"
                glassEffect="medium"
              >
                <div className="space-y-8">
                  {/* 默认选项卡 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>默认样式</h3>
                    <Tabs 
                      items={tabItems}
                      variant="default"
                    />
                  </div>

                  {/* 胶囊选项卡 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>胶囊样式</h3>
                    <Tabs 
                      items={tabItems}
                      variant="pills"
                    />
                  </div>

                  {/* 玻璃选项卡 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>玻璃样式</h3>
                    <Tabs 
                      items={tabItems}
                      variant="glass"
                    />
                  </div>

                  {/* 垂直选项卡 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>垂直布局</h3>
                    <Tabs 
                      items={tabItems}
                      variant="button"
                      orientation="vertical"
                    />
                  </div>
                </div>
              </Card>
            </section>

            {/* 模态框组件展示 */}
            <section id="modal" ref={setComponentRef('modal')}>
              <Card 
                title={
                  <div className="flex items-center">
                    <Icon icon={componentsNavConfig[5].icon} className="w-5 h-5 mr-2 text-blue-500" />
                    <span>模态框组件</span>
                  </div>
                }
                subtitle="可自定义的模态对话框"
                glassEffect="medium"
              >
                <div className="space-y-4">
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    模态对话框用于需要用户注意的临时内容，可以自定义标题、内容和页脚。
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      variant="primary"
                      onClick={() => setIsModalOpen(true)}
                      icon={<Icon icon="lucide:layout" className="w-4 h-4" />}
                    >
                      打开模态框
                    </Button>
                  </div>

                  {/* 模态框示例 */}
                  <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="毛玻璃效果模态框"
                    size="md"
                    footer={
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setIsModalOpen(false)}
                        >
                          取消
                        </Button>
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => setIsModalOpen(false)}
                        >
                          确认
                        </Button>
                      </div>
                    }
                  >
                    <div className="space-y-4">
                      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        这是一个模态框示例，展示了毛玻璃效果的模态对话框。
                      </p>
                      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        模态框可以包含任何内容，比如表单、确认信息或详细内容。
                      </p>
                      <div className="flex space-x-3 mt-4">
                        <Avatar name="张三" status="online" size="sm" />
                        <Avatar name="李四" status="busy" size="sm" />
                        <Avatar name="王五" status="away" size="sm" />
                      </div>
                    </div>
                  </Modal>
                </div>
              </Card>
            </section>

            {/* 输入框组件展示 */}
            <section id="input" ref={setComponentRef('input')}>
              <Card 
                title={
                  <div className="flex items-center">
                    <Icon icon={componentsNavConfig[6].icon} className="w-5 h-5 mr-2 text-blue-500" />
                    <span>输入框组件</span>
                  </div>
                }
                subtitle="支持多种尺寸和状态的输入框"
                glassEffect="medium"
              >
                <div className="space-y-8">
                  {/* 基本输入框 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                      label="标准输入框"
                      placeholder="请输入内容"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      fullWidth
                    />
                    
                    <Input 
                      label="禁用状态"
                      placeholder="不可编辑"
                      disabled
                      fullWidth
                    />
                  </div>

                  {/* 带图标输入框 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                      label="带左侧图标"
                      placeholder="搜索内容"
                      leftIcon={<Icon icon="lucide:search" />}
                      fullWidth
                    />
                    
                    <Input 
                      label="带右侧图标"
                      placeholder="请选择日期"
                      rightIcon={<Icon icon="lucide:calendar" />}
                      fullWidth
                    />
                  </div>

                  {/* 错误和帮助文本 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                      label="错误状态"
                      placeholder="请输入有效邮箱"
                      error="请输入有效的电子邮箱地址"
                      fullWidth
                    />
                    
                    <Input 
                      label="带帮助文本"
                      placeholder="请设置密码"
                      helperText="密码长度应不少于8个字符"
                      type="password"
                      fullWidth
                    />
                  </div>

                  {/* 输入框尺寸 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>输入框尺寸</h3>
                    <div className="flex flex-col space-y-4">
                      <Input 
                        size="sm"
                        placeholder="小尺寸输入框"
                      />
                      <Input 
                        size="md"
                        placeholder="中尺寸输入框"
                      />
                      <Input 
                        size="lg"
                        placeholder="大尺寸输入框"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* 开关组件展示 */}
            <section id="switch" ref={setComponentRef('switch')}>
              <Card 
                title={
                  <div className="flex items-center">
                    <Icon icon={componentsNavConfig[7].icon} className="w-5 h-5 mr-2 text-blue-500" />
                    <span>开关组件</span>
                  </div>
                }
                subtitle="用于切换设置的状态"
                glassEffect="medium"
              >
                <div className="space-y-8">
                  {/* 基本开关 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>基本用法</h3>
                    <div className="flex items-center space-x-8">
                      <Switch 
                        checked={switchState} 
                        onChange={setSwitchState}
                        label="开关状态"
                      />
                      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        当前状态: {switchState ? '开启' : '关闭'}
                      </p>
                    </div>
                  </div>

                  {/* 开关尺寸 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>开关尺寸</h3>
                    <div className="flex flex-wrap gap-8 items-center">
                      <Switch size="sm" label="小尺寸" />
                      <Switch size="md" label="中尺寸" />
                      <Switch size="lg" label="大尺寸" />
                    </div>
                  </div>

                  {/* 标签位置 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>标签位置</h3>
                    <div className="flex flex-wrap gap-8 items-center">
                      <Switch label="右侧标签" labelPosition="right" />
                      <Switch label="左侧标签" labelPosition="left" />
                    </div>
                  </div>

                  {/* 自定义颜色 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>自定义颜色</h3>
                    <div className="flex flex-wrap gap-8 items-center">
                      <Switch color="#8e6bff" checked label="紫色" />
                      <Switch color="#06d7b2" checked label="青色" />
                      <Switch color="#ff66c2" checked label="粉色" />
                      <Switch color="#ff9640" checked label="橙色" />
                    </div>
                  </div>

                  {/* 禁用状态 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>禁用状态</h3>
                    <div className="flex flex-wrap gap-8 items-center">
                      <Switch disabled label="禁用状态" />
                      <Switch disabled checked label="禁用状态(开启)" />
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* 徽章组件展示 */}
            <section id="badge" ref={setComponentRef('badge')}>
              <Card 
                title={
                  <div className="flex items-center">
                    <Icon icon={componentsNavConfig[8].icon} className="w-5 h-5 mr-2 text-blue-500" />
                    <span>徽章组件</span>
                  </div>
                }
                subtitle="用于状态标记和数量展示"
                glassEffect="medium"
              >
                <div className="space-y-8">
                  {/* 徽章变体 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>徽章变体</h3>
                    <div className="flex flex-wrap gap-4">
                      <Badge variant="primary">主要</Badge>
                      <Badge variant="secondary">次要</Badge>
                      <Badge variant="success">成功</Badge>
                      <Badge variant="danger">危险</Badge>
                      <Badge variant="warning">警告</Badge>
                      <Badge variant="info">信息</Badge>
                    </div>
                  </div>

                  {/* 徽章尺寸 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>徽章尺寸</h3>
                    <div className="flex flex-wrap gap-4 items-center">
                      <Badge size="sm" variant="primary">小尺寸</Badge>
                      <Badge size="md" variant="primary">中尺寸</Badge>
                      <Badge size="lg" variant="primary">大尺寸</Badge>
                    </div>
                  </div>

                  {/* 圆形徽章 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>圆形徽章</h3>
                    <div className="flex flex-wrap gap-4">
                      <Badge pill variant="primary">圆形徽章</Badge>
                      <Badge pill variant="success">99+</Badge>
                      <Badge pill variant="danger">新</Badge>
                      <Badge pill variant="warning">热门</Badge>
                    </div>
                  </div>

                  {/* 带点和图标徽章 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>带点和图标徽章</h3>
                    <div className="flex flex-wrap gap-4">
                      <Badge dot variant="primary">未读消息</Badge>
                      <Badge 
                        icon={<Icon icon="lucide:check" className="w-3.5 h-3.5" />} 
                        variant="success"
                      >
                        已完成
                      </Badge>
                      <Badge 
                        icon={<Icon icon="lucide:alert-circle" className="w-3.5 h-3.5" />} 
                        variant="warning"
                      >
                        注意事项
                      </Badge>
                      <Badge 
                        icon={<Icon icon="lucide:x" className="w-3.5 h-3.5" />} 
                        variant="danger"
                      >
                        已拒绝
                      </Badge>
                    </div>
                  </div>

                  {/* 可交互徽章 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>可交互徽章</h3>
                    <div className="flex flex-wrap gap-4">
                      <Badge 
                        onClick={() => alert('点击了徽章')} 
                        variant="primary"
                        bordered
                      >
                        点击我
                      </Badge>
                      <Badge 
                        onClick={() => alert('查看全部')} 
                        variant="info"
                        icon={<Icon icon="lucide:arrow-right" className="w-3.5 h-3.5" />}
                        bordered
                      >
                        查看全部
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* 通知组件展示 */}
            <section id="notification" ref={setComponentRef('notification')}>
              <Card 
                title={
                  <div className="flex items-center">
                    <Icon icon={componentsNavConfig[9].icon} className="w-5 h-5 mr-2 text-blue-500" />
                    <span>通知组件</span>
                  </div>
                }
                subtitle="毛玻璃效果通知提醒，支持多种类型和位置"
                glassEffect="medium"
              >
                <div className="space-y-8">
                  {/* 通知类型 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>通知类型</h3>
                    <div className="flex flex-wrap gap-4">
                      <Button 
                        variant="success" 
                        onClick={() => showNotification('success')}
                        icon={<Icon icon="lucide:check-circle" className="w-4 h-4" />}
                      >
                        成功通知
                      </Button>
                      <Button 
                        variant="danger" 
                        onClick={() => showNotification('error')}
                        icon={<Icon icon="lucide:x-circle" className="w-4 h-4" />}
                      >
                        错误通知
                      </Button>
                      <Button 
                        variant="warning" 
                        onClick={() => showNotification('warning')}
                        icon={<Icon icon="lucide:alert-triangle" className="w-4 h-4" />}
                      >
                        警告通知
                      </Button>
                      <Button 
                        variant="info" 
                        onClick={() => showNotification('info')}
                        icon={<Icon icon="lucide:info" className="w-4 h-4" />}
                      >
                        信息通知
                      </Button>
                    </div>
                  </div>

                  {/* 通知位置 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>通知位置</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {positionOptions.map(option => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`position-${option.value}`}
                            name="notificationPosition"
                            value={option.value}
                            checked={notificationPosition === option.value}
                            onChange={() => setNotificationPosition(option.value)}
                            className="w-4 h-4 text-blue-500"
                          />
                          <label 
                            htmlFor={`position-${option.value}`}
                            className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button 
                        variant="primary" 
                        onClick={() => showNotification('info')}
                      >
                        在选定位置显示通知
                      </Button>
                    </div>
                  </div>

                  {/* 自定义通知 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>自定义通知</h3>
                    <div className="flex flex-wrap gap-4">
                      <Button 
                        variant="primary" 
                        onClick={showNotificationWithActions}
                        icon={<Icon icon="lucide:alert-circle" className="w-4 h-4" />}
                      >
                        带操作的通知
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={() => {
                          notification.info('这是一个持续显示的通知，不会自动关闭', {
                            title: '持续通知',
                            position: notificationPosition,
                            autoClose: false,
                          });
                        }}
                      >
                        持续通知
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={() => {
                          notification.success('没有图标的通知样式', {
                            position: notificationPosition,
                            showIcon: false,
                          });
                        }}
                      >
                        无图标通知
                      </Button>
                    </div>
                  </div>

                  {/* 不同动画效果 */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>动画效果</h3>
                    <div className="flex flex-wrap gap-4">
                      <Button 
                        onClick={() => {
                          notification.info('默认滑动动画效果', {
                            position: notificationPosition,
                            animation: 'slide',
                          });
                        }}
                      >
                        滑动效果
                      </Button>
                      <Button 
                        onClick={() => {
                          notification.info('淡入淡出效果', {
                            position: notificationPosition,
                            animation: 'fade',
                          });
                        }}
                      >
                        淡入效果
                      </Button>
                      <Button 
                        onClick={() => {
                          notification.info('缩放效果', {
                            position: notificationPosition,
                            animation: 'zoom',
                          });
                        }}
                      >
                        缩放效果
                      </Button>
                      <Button 
                        onClick={() => {
                          notification.info('弹跳效果', {
                            position: notificationPosition,
                            animation: 'bounce',
                          });
                        }}
                      >
                        弹跳效果
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </section>
          </div>
        </div>
      </div>

      {/* 通知容器 - 用于显示通知 */}
      <NotificationContainer position="top-right" />
      <NotificationContainer position="top-left" />
      <NotificationContainer position="bottom-right" />
      <NotificationContainer position="bottom-left" />
      <NotificationContainer position="top-center" />
      <NotificationContainer position="bottom-center" />
    </div>
  );
}

/**
 * UI组件展示页面（包含NotificationProvider）
 */
export default function UIShowcasePage() {
  return (
    <NotificationProvider>
      <UIShowcaseContent />
    </NotificationProvider>
  );
}
