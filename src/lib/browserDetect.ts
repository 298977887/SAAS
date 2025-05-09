/**
 * @作者 阿瑞
 * @功能 浏览器检测工具函数
 * @版本 1.0.0
 */

// 浏览器信息接口
export interface BrowserInfo {
  name: string;          // 浏览器名称
  version: number;       // 浏览器版本
  isCompatible: boolean; // 是否兼容
  engine: string;        // 浏览器内核
  engineVersion: number; // 内核版本
}

/**
 * 检测当前浏览器信息
 * @returns {BrowserInfo | null} 浏览器信息对象，如果在服务器端则返回null
 */
export function detectBrowser(): BrowserInfo | null {
  // 在服务端返回null
  if (typeof window === 'undefined') {
    return null;
  }
  
  const ua = navigator.userAgent.toLowerCase();
  const browserInfo: BrowserInfo = {
    name: '未知浏览器',
    version: 0,
    isCompatible: true,
    engine: '未知内核',
    engineVersion: 0
  };
  
  /* 检测浏览器类型 */
  
  // 检测Chrome
  const chromeMatch = ua.match(/(?:chrome|crios)\/(\d+)/);
  
  // 检测Firefox
  const firefoxMatch = ua.match(/(?:firefox|fxios)\/(\d+)/);
  
  // 检测Safari
  const safariMatch = ua.match(/version\/(\d+).*safari/);
  
  // 检测Edge
  const edgeMatch = ua.match(/edg(?:e|a|ios)?\/(\d+)/);
  
  // 检测Opera
  const operaMatch = ua.match(/(?:opera|opr)\/(\d+)/);
  
  // 检测IE
  const ieMatch = ua.match(/(?:msie |trident.*rv:)(\d+)/);
  
  // 检测国内浏览器
  const is360 = ua.indexOf('qihu') !== -1 || ua.indexOf('360ee') !== -1 || ua.indexOf('360se') !== -1;
  const is2345 = ua.indexOf('2345explorer') !== -1;
  const isSogou = ua.indexOf('sogou') !== -1 || ua.indexOf('metasr') !== -1;
  const isLiebao = ua.indexOf('lbbrowser') !== -1;
  const isQQ = ua.indexOf('qqbrowser') !== -1;
  const isUC = ua.indexOf('ucbrowser') !== -1;
  const isWeixin = ua.indexOf('micromessenger') !== -1;
  const isBaidu = ua.indexOf('baidu') !== -1 || ua.indexOf('bidubrowser') !== -1;
  
  /* 检测渲染引擎 */
  
  // Blink引擎(Chrome, Edge新版, Opera新版)
  const blinkMatch = ua.match(/(?:chrome|crios)\/(\d+)/);
  
  // Webkit引擎(Safari, 旧版Chrome)
  const webkitMatch = ua.match(/applewebkit\/(\d+)/);
  
  // Gecko引擎(Firefox)
  const geckoMatch = ua.match(/gecko\/(\d+)/);
  
  // Trident引擎(IE)
  const tridentMatch = ua.match(/trident\/(\d+)/);
  
  // 优先检测主流浏览器
  if (edgeMatch && !is360) {
    browserInfo.name = 'Edge';
    browserInfo.version = parseInt(edgeMatch[1]);
    browserInfo.engine = 'Blink';
    browserInfo.engineVersion = blinkMatch ? parseInt(blinkMatch[1]) : 0;
  } else if (chromeMatch && !is360 && !isQQ && !isUC && !isBaidu && !isLiebao && !is2345 && !isSogou) {
    browserInfo.name = 'Chrome';
    browserInfo.version = parseInt(chromeMatch[1]);
    browserInfo.engine = 'Blink';
    browserInfo.engineVersion = blinkMatch ? parseInt(blinkMatch[1]) : 0;
  } else if (firefoxMatch) {
    browserInfo.name = 'Firefox';
    browserInfo.version = parseInt(firefoxMatch[1]);
    browserInfo.engine = 'Gecko';
    browserInfo.engineVersion = geckoMatch ? parseInt(geckoMatch[1]) : 0;
  } else if (safariMatch && !isQQ && !isUC) {
    browserInfo.name = 'Safari';
    browserInfo.version = parseInt(safariMatch[1]);
    browserInfo.engine = 'WebKit';
    browserInfo.engineVersion = webkitMatch ? parseInt(webkitMatch[1]) : 0;
  } else if (operaMatch) {
    browserInfo.name = 'Opera';
    browserInfo.version = parseInt(operaMatch[1]);
    browserInfo.engine = 'Blink';
    browserInfo.engineVersion = blinkMatch ? parseInt(blinkMatch[1]) : 0;
  } else if (ieMatch) {
    browserInfo.name = 'Internet Explorer';
    browserInfo.version = parseInt(ieMatch[1]);
    browserInfo.engine = 'Trident';
    browserInfo.engineVersion = tridentMatch ? parseInt(tridentMatch[1]) : 0;
    browserInfo.isCompatible = false; // IE永远不兼容现代网页
  } 
  // 检测国内浏览器
  else if (is360) {
    browserInfo.name = '360浏览器';
    // 假设使用Chrome的版本号
    browserInfo.version = chromeMatch ? parseInt(chromeMatch[1]) : 0;
    
    // 检测360浏览器内核 - 使用功能检测而非属性检测
    if (ua.indexOf('webkit') !== -1 && chromeMatch) {
      browserInfo.engine = 'Blink';
      browserInfo.engineVersion = blinkMatch ? parseInt(blinkMatch[1]) : 0;
    } else {
      browserInfo.engine = 'Trident';
      browserInfo.engineVersion = tridentMatch ? parseInt(tridentMatch[1]) : 0;
      browserInfo.isCompatible = false; // 老版本的360浏览器使用IE内核
    }
  } else if (is2345) {
    browserInfo.name = '2345浏览器';
    browserInfo.version = chromeMatch ? parseInt(chromeMatch[1]) : 0;
    
    if (webkitMatch) {
      browserInfo.engine = 'WebKit';
      browserInfo.engineVersion = parseInt(webkitMatch[1]);
      
      // 老版WebKit可能不支持新特性
      if (browserInfo.engineVersion < 537) { // 大约对应Chrome 28以下
        browserInfo.isCompatible = false;
      }
    } else if (tridentMatch) {
      browserInfo.engine = 'Trident';
      browserInfo.engineVersion = parseInt(tridentMatch[1]);
      browserInfo.isCompatible = false;
    }
  } else if (isSogou) {
    browserInfo.name = '搜狗浏览器';
    browserInfo.version = chromeMatch ? parseInt(chromeMatch[1]) : 0;
    
    if (webkitMatch) {
      browserInfo.engine = 'WebKit';
      browserInfo.engineVersion = parseInt(webkitMatch[1]);
      
      // 搜狗老版内核不支持现代CSS特性
      if (browserInfo.engineVersion < 537) {
        browserInfo.isCompatible = false;
      }
    } else if (tridentMatch) {
      browserInfo.engine = 'Trident';
      browserInfo.engineVersion = parseInt(tridentMatch[1]);
      browserInfo.isCompatible = false;
    }
  } else if (isQQ) {
    browserInfo.name = 'QQ浏览器';
    browserInfo.version = chromeMatch ? parseInt(chromeMatch[1]) : 0;
    
    if (webkitMatch) {
      browserInfo.engine = 'WebKit';
      browserInfo.engineVersion = parseInt(webkitMatch[1]);
      
      // QQ浏览器X5内核版本判断
      const x5Match = ua.match(/txthostingtbrowser\/(\d+)/);
      if (x5Match && parseInt(x5Match[1]) < 10) {
        browserInfo.isCompatible = false;
      }
    }
  } else if (isBaidu) {
    browserInfo.name = '百度浏览器';
    browserInfo.version = chromeMatch ? parseInt(chromeMatch[1]) : 0;
    
    if (webkitMatch) {
      browserInfo.engine = 'WebKit';
      browserInfo.engineVersion = parseInt(webkitMatch[1]);
    }
  } else if (isUC) {
    browserInfo.name = 'UC浏览器';
    // UC浏览器版本检测
    const ucMatch = ua.match(/ucbrowser\/(\d+)/);
    browserInfo.version = ucMatch ? parseInt(ucMatch[1]) : 0;
    
    if (webkitMatch) {
      browserInfo.engine = 'WebKit';
      browserInfo.engineVersion = parseInt(webkitMatch[1]);
      
      // UC的U3内核版本较低可能不支持某些特性
      if (browserInfo.engineVersion < 537) {
        browserInfo.isCompatible = false;
      }
    }
  } else if (isWeixin) {
    browserInfo.name = '微信内置浏览器';
    browserInfo.version = chromeMatch ? parseInt(chromeMatch[1]) : 0;
    
    if (webkitMatch) {
      browserInfo.engine = 'WebKit';
      browserInfo.engineVersion = parseInt(webkitMatch[1]);
    }
  } else if (isLiebao) {
    browserInfo.name = '猎豹浏览器';
    browserInfo.version = chromeMatch ? parseInt(chromeMatch[1]) : 0;
    
    if (webkitMatch) {
      browserInfo.engine = 'WebKit';
      browserInfo.engineVersion = parseInt(webkitMatch[1]);
    } else if (tridentMatch) {
      browserInfo.engine = 'Trident';
      browserInfo.engineVersion = parseInt(tridentMatch[1]);
      browserInfo.isCompatible = false;
    }
  }
  
  // WebKit版本太低，判定为不兼容
  if (browserInfo.engine === 'WebKit' && browserInfo.engineVersion < 537) {
    browserInfo.isCompatible = false; // WebKit 537以下版本(约2013年前)不支持某些CSS特性
  }
  
  // Blink引擎版本太低，判定为不兼容
  if (browserInfo.engine === 'Blink' && browserInfo.engineVersion < 88) {
    browserInfo.isCompatible = false; // Chrome 88以下(2021年前)可能不支持某些现代特性
  }
  
  return browserInfo;
}

/**
 * 获取推荐的现代浏览器列表
 * @returns {Array<{name: string, url: string, icon: string}>} 推荐浏览器列表
 */
export const recommendedBrowsers = [
  {
    name: 'Google Chrome',
    url: 'https://www.google.com/chrome/',
    icon: 'chrome'
  },
  {
    name: 'Microsoft Edge',
    url: 'https://www.microsoft.com/edge',
    icon: 'edge'
  },
  {
    name: 'Firefox',
    url: 'https://www.mozilla.org/firefox/',
    icon: 'firefox'
  },
  {
    name: 'Safari',
    url: 'https://www.apple.com/safari/',
    icon: 'safari'
  }
]; 