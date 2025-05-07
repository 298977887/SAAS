/**
 * 字符串工具函数
 */

/**
 * 文本截断
 * 将文本截断到指定长度，并添加省略号
 * 
 * @param text 原始文本
 * @param maxLength 最大长度
 * @param suffix 省略号样式 (默认 '...')
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + suffix;
}

/**
 * 生成随机字符串
 * 
 * @param length 字符串长度
 * @param includeNumbers 是否包含数字
 * @param includeSpecialChars 是否包含特殊字符
 * @returns 随机字符串
 */
export function generateRandomString(
  length: number = 8,
  includeNumbers: boolean = true,
  includeSpecialChars: boolean = false
): string {
  let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  if (includeNumbers) {
    chars += '0123456789';
  }
  
  if (includeSpecialChars) {
    chars += '!@#$%^&*()-_=+[]{}|;:,.<>?';
  }
  
  let result = '';
  const charsLength = chars.length;
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charsLength));
  }
  
  return result;
}

/**
 * 货币格式化
 * 
 * @param value 数值
 * @param currency 货币符号 (默认 '¥')
 * @param decimalPlaces 小数位数 (默认 2)
 * @returns 格式化后的货币字符串
 */
export function formatCurrency(
  value: number,
  currency: string = '¥',
  decimalPlaces: number = 2
): string {
  const options = {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  };
  
  const formatter = new Intl.NumberFormat('zh-CN', options);
  return `${currency}${formatter.format(value)}`;
}

/**
 * 格式化手机号码，添加分隔符
 * @param phone 手机号码
 * @returns 格式化后的手机号码
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone || phone.length !== 11) return phone;
  
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
}

/**
 * 安全地从对象中获取嵌套属性值
 * @param obj 对象
 * @param path 属性路径，如 'user.profile.name'
 * @param defaultValue 默认值
 * @returns 属性值或默认值
 */
export function getNestedValue(obj: any, path: string, defaultValue = ''): any {
  if (!obj || !path) return defaultValue;
  
  const properties = path.split('.');
  let value = obj;
  
  for (const prop of properties) {
    if (value === null || value === undefined || typeof value !== 'object') {
      return defaultValue;
    }
    
    value = value[prop];
    
    if (value === undefined) {
      return defaultValue;
    }
  }
  
  return value === null || value === undefined ? defaultValue : value;
}

/**
 * 将驼峰命名转换为短横线命名
 * 
 * @param text 驼峰命名的字符串 (如 'userName')
 * @returns 短横线命名的字符串 (如 'user-name')
 */
export function camelToKebabCase(text: string): string {
  return text.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * 将短横线命名转换为驼峰命名
 * 
 * @param text 短横线命名的字符串 (如 'user-name')
 * @param capitalizeFirstLetter 是否大写首字母 (生成 'UserName' 而非 'userName')
 * @returns 驼峰命名的字符串 (如 'userName' 或 'UserName')
 */
export function kebabToCamelCase(text: string, capitalizeFirstLetter: boolean = false): string {
  const result = text.replace(/-([a-z0-9])/g, (_, group) => group.toUpperCase());
  
  if (capitalizeFirstLetter) {
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
  
  return result;
}

/**
 * 将字符串首字母大写
 * 
 * @param text 原始字符串
 * @returns 首字母大写的字符串
 */
export function capitalizeFirstLetter(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
} 