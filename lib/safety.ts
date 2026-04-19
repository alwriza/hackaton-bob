export type SafetyLevel = 'OK' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface SafetyResult {
  level: SafetyLevel;
  blocked: boolean;
  warning: string | null;
}

// Patterns that indicate trying to leave the platform
const HIGH_RISK_PATTERNS = [
  /whatsapp|ватсап|вотсап/i,
  /telegram|телеграм|тг\b|tg\b/i,
  /личн\w*\s+(встре|контакт|пере)/i,
  /вне\s+платформ/i,
  /без\s+сайта/i,
  /сам\s+заплач/i,
  /зайди\s+в\s+(лс|дм|директ)/i,
];

// Patterns for sharing personal info
const MEDIUM_RISK_PATTERNS = [
  /\+7[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/,  // phone
  /\b8[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}/,                             // phone 8-xxx
  /instagram|инстаграм|insta\b/i,
  /discord(?!\s*(сервер|канал))/i,
  /vk\.com|вконтакте|вк\b/i,
  /мой\s+номер|номер\s+телефона|позвони\s+мне/i,
  /скинь\s+(номер|контакт|адрес)/i,
];

// Pressure / manipulation patterns
const LOW_RISK_PATTERNS = [
  /или\s+я\s+(уйд|отказ|больш)/i,
  /срочно\s+нужно|иначе\s+отмен/i,
  /плати\s+сейчас|прямо\s+сейчас\s+перевед/i,
];

function isCapsStress(text: string): boolean {
  if (text.length < 10) return false;
  const uppercaseCount = (text.match(/[А-ЯA-Z]/g) || []).length;
  return uppercaseCount / text.length > 0.65;
}

/**
 * Analyzes a message for safety risks.
 * Returns a SafetyResult with level and optional warning message.
 */
export function analyzeSafety(text: string): SafetyResult {
  // HIGH: Blocked, no send, parent notified
  if (HIGH_RISK_PATTERNS.some(p => p.test(text))) {
    return {
      level: 'HIGH',
      blocked: true,
      warning: '🚫 Safety AI заблокировал сообщение. Попытка перейти в сторонний мессенджер зафиксирована. Родитель уведомлён.',
    };
  }

  // MEDIUM: Blocked, send not allowed
  if (MEDIUM_RISK_PATTERNS.some(p => p.test(text))) {
    return {
      level: 'MEDIUM',
      blocked: true,
      warning: '⚠️ Safety AI заблокировал сообщение: обнаружена попытка поделиться личными контактами. Это запрещено правилами платформы.',
    };
  }

  // CAPS pressure
  if (isCapsStress(text)) {
    return {
      level: 'LOW',
      blocked: false,
      warning: '⚠️ Пожалуйста, общайтесь уважительно. Safety AI зафиксировал агрессивный тон.',
    };
  }

  // LOW: Pressure tactics — warn but allow
  if (LOW_RISK_PATTERNS.some(p => p.test(text))) {
    return {
      level: 'LOW',
      blocked: false,
      warning: '💬 Safety AI: обнаружено давление. Если вы чувствуете угрозу — нажмите SOS.',
    };
  }

  return { level: 'OK', blocked: false, warning: null };
}
