/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns 是否符合邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号格式（中国大陆）
 * @param phone 手机号码
 * @returns 是否符合手机号格式
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const pattern = /^1[3-9]\d{9}$/;
  return pattern.test(phone);
}

/**
 * 验证密码强度
 * @param password 密码
 * @param options 选项: minLength, requireUppercase, requireLowercase, requireNumber, requireSpecial
 * @returns 包含验证结果和强度评分的对象
 */
export function validatePassword(password: string, options = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false
}): { isValid: boolean; score: number; message: string } {
  if (!password) {
    return { isValid: false, score: 0, message: '请输入密码' };
  }
  
  let score = 0;
  const errors: string[] = [];
  
  // 检查长度
  if (password.length < options.minLength) {
    errors.push(`密码长度应不少于${options.minLength}个字符`);
  } else {
    score += 1;
  }
  
  // 检查大写字母
  if (options.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码应包含至少一个大写字母');
  } else if (options.requireUppercase) {
    score += 1;
  }
  
  // 检查小写字母
  if (options.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码应包含至少一个小写字母');
  } else if (options.requireLowercase) {
    score += 1;
  }
  
  // 检查数字
  if (options.requireNumber && !/\d/.test(password)) {
    errors.push('密码应包含至少一个数字');
  } else if (options.requireNumber) {
    score += 1;
  }
  
  // 检查特殊字符
  if (options.requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('密码应包含至少一个特殊字符');
  } else if (options.requireSpecial) {
    score += 1;
  }
  
  // 额外的长度分数
  if (password.length >= options.minLength + 4) {
    score += 1;
  }
  
  const maxScore = Object.values(options).filter(Boolean).length + 1;
  const isValid = errors.length === 0;
  
  return {
    isValid,
    score: Math.min(score, maxScore),
    message: errors.length > 0 ? errors[0] : '密码强度良好'
  };
}

/**
 * 验证表单字段
 * @param value 字段值
 * @param rules 验证规则
 * @returns 验证结果对象
 */
export function validateField(value: any, rules: {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  validator?: (value: any) => boolean | string;
}): { isValid: boolean; message: string } {
  const { required, minLength, maxLength, pattern, validator } = rules;
  
  // 验证必填项
  if (required && (value === undefined || value === null || value === '')) {
    return { isValid: false, message: '该字段为必填项' };
  }
  
  // 如果值为空但不是必填，则视为有效
  if ((value === undefined || value === null || value === '') && !required) {
    return { isValid: true, message: '' };
  }
  
  // 验证最小长度
  if (minLength !== undefined && typeof value === 'string' && value.length < minLength) {
    return { isValid: false, message: `长度应不少于${minLength}个字符` };
  }
  
  // 验证最大长度
  if (maxLength !== undefined && typeof value === 'string' && value.length > maxLength) {
    return { isValid: false, message: `长度应不超过${maxLength}个字符` };
  }
  
  // 验证正则模式
  if (pattern && typeof value === 'string' && !pattern.test(value)) {
    return { isValid: false, message: '格式不正确' };
  }
  
  // 自定义验证器
  if (validator) {
    const result = validator(value);
    if (result === false) {
      return { isValid: false, message: '验证失败' };
    }
    if (typeof result === 'string') {
      return { isValid: false, message: result };
    }
  }
  
  return { isValid: true, message: '' };
}

/**
 * 验证手机号码（中国大陆）
 * 
 * @param phoneNumber 手机号码
 * @returns 是否有效
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // 中国大陆手机号正则表达式
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phoneNumber);
}

/**
 * 验证密码强度
 * 
 * @param password 密码
 * @param minLength 最小长度 (默认 8)
 * @param requireNumbers 是否需要数字 (默认 true)
 * @param requireSpecialChar 是否需要特殊字符 (默认 false)
 * @returns 密码强度对象 {isValid, score, feedback}
 */
export function validatePasswordStrength(
  password: string, 
  minLength: number = 8, 
  requireNumbers: boolean = true,
  requireSpecialChar: boolean = false
): { isValid: boolean; score: number; feedback: string } {
  let score = 0;
  const feedback: string[] = [];
  
  // 检查长度
  if (password.length < minLength) {
    feedback.push(`密码至少需要${minLength}个字符`);
  } else {
    score += 1;
  }
  
  // 检查字母
  if (!/[a-zA-Z]/.test(password)) {
    feedback.push('密码需要包含字母');
  } else {
    score += 1;
    
    // 加分：同时包含大小写字母
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score += 1;
    }
  }
  
  // 检查数字
  if (requireNumbers && !/\d/.test(password)) {
    feedback.push('密码需要包含数字');
  } else if (/\d/.test(password)) {
    score += 1;
  }
  
  // 检查特殊字符
  if (requireSpecialChar && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    feedback.push('密码需要包含特殊字符');
  } else if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score += 1;
  }
  
  // 额外加分：长度超过最小要求
  if (password.length >= minLength + 4) {
    score += 1;
  }
  
  // 计算是否有效
  const isValid = feedback.length === 0;
  
  // 生成反馈信息
  let feedbackMessage = '';
  if (feedback.length > 0) {
    feedbackMessage = feedback.join('；');
  } else {
    if (score <= 2) {
      feedbackMessage = '弱密码';
    } else if (score <= 4) {
      feedbackMessage = '中等强度密码';
    } else {
      feedbackMessage = '强密码';
    }
  }
  
  return {
    isValid,
    score,
    feedback: feedbackMessage
  };
}

/**
 * 验证URL格式
 * 
 * @param url URL字符串
 * @returns 是否有效
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证身份证号码（中国大陆）
 * 
 * @param idNumber 身份证号码
 * @returns 是否有效
 */
export function isValidIdNumber(idNumber: string): boolean {
  // 简单验证：18位数字，最后一位可能是X
  const idRegex = /(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  return idRegex.test(idNumber);
}

/**
 * 验证是否为空
 * 
 * @param value 要验证的值
 * @returns 是否为空
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
} 