/**
 * Intent Recognition Engine
 * Analyzes chat messages to detect booking intent and extract entities
 */

export interface BookingIntent {
  hasBookingIntent: boolean;
  confidence: number;
  extractedData: {
    who?: {
      name?: string;
      email?: string;
    };
    what?: string;
    when?: {
      date?: string;
      time?: string;
    };
  };
  requiresFollowUp: {
    name: boolean;
    email: boolean;
    service: boolean;
    dateTime: boolean;
  };
}

// Keywords that indicate booking intent
const BOOKING_KEYWORDS = [
  'book', 'schedule', 'appointment', 'meeting', 'call', 'session',
  'consultation', 'demo', 'setup', 'audit', 'repair', 'help',
  'reserve', 'contact', 'call me', 'reach out', 'get in touch',
  'talk to', 'speak with', 'consult', 'arrange', 'plan',
  'when can', 'available', 'free', 'time', 'date'
];

// Email regex pattern
const EMAIL_REGEX = /[^\s@]+@[^\s@]+\.[^\s@]+/g;

// Common date patterns
const DATE_PATTERNS = [
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\b/,
  /\b(today|tomorrow|next week|this week)\b/i,
  /\b(\d{1,2}(?:st|nd|rd|th)?)\b/,
];

// Time patterns (e.g., "3pm", "15:00", "3:30")
const TIME_PATTERNS = [
  /\b(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?\b/,
  /\b(\d{1,2})\s*(am|pm|AM|PM)\b/,
];

/**
 * Extract email addresses from text
 */
function extractEmails(text: string): string[] {
  return text.match(EMAIL_REGEX) || [];
}

/**
 * Extract potential names (capitalized words, excluding common words)
 */
function extractNames(text: string): string[] {
  const commonWords = new Set([
    'i', 'me', 'you', 'the', 'a', 'an', 'is', 'am', 'are', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'can', 'may', 'might', 'should', 'must', 'for', 'from', 'to',
    'in', 'on', 'at', 'by', 'with', 'and', 'or', 'but', 'if', 'my',
    'your', 'his', 'her', 'its', 'our', 'their', 'name', 'email'
  ]);

  const words = text.split(/\s+/);
  const names: string[] = [];

  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    if (
      cleanWord.length > 2 &&
      word[0] === word[0].toUpperCase() &&
      !commonWords.has(cleanWord)
    ) {
      names.push(word);
    }
  }

  return names;
}

/**
 * Extract dates from text
 */
function extractDates(text: string): string[] {
  const dates: string[] = [];
  for (const pattern of DATE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      dates.push(...matches);
    }
  }
  return dates;
}

/**
 * Extract times from text
 */
function extractTimes(text: string): string[] {
  const times: string[] = [];
  for (const pattern of TIME_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      times.push(...matches);
    }
  }
  return times;
}

/**
 * Detect booking intent in conversation
 */
export function detectBookingIntent(
  currentMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): BookingIntent {
  const messageText = currentMessage.toLowerCase();
  const fullContext = [
    ...conversationHistory.map((m) => m.content.toLowerCase()),
    messageText,
  ].join(' ');

  // Check for booking keywords
  let bookingKeywordCount = 0;
  for (const keyword of BOOKING_KEYWORDS) {
    if (fullContext.includes(keyword)) {
      bookingKeywordCount++;
    }
  }

  const confidence = Math.min(bookingKeywordCount / BOOKING_KEYWORDS.length, 1);
  const hasBookingIntent = bookingKeywordCount >= 2 || confidence > 0.3;

  // Extract entities
  const emails = extractEmails(messageText);
  const names = extractNames(currentMessage); // Don't lowercase for names
  const dates = extractDates(messageText);
  const times = extractTimes(messageText);

  // Extract service from message (look for service keywords like "repair", "setup", "audit")
  const serviceKeywords = [
    'repair', 'setup', 'audit', 'consultation', 'demo', 'training',
    'integration', 'optimization', 'migration', 'basic', 'enterprise'
  ];
  let service = '';
  for (const keyword of serviceKeywords) {
    if (messageText.includes(keyword)) {
      service = keyword;
      break;
    }
  }

  return {
    hasBookingIntent,
    confidence,
    extractedData: {
      who: {
        name: names[0],
        email: emails[0],
      },
      what: service,
      when: {
        date: dates[0],
        time: times[0],
      },
    },
    requiresFollowUp: {
      name: !names.length,
      email: !emails.length,
      service: !service,
      dateTime: !dates.length || !times.length,
    },
  };
}

/**
 * Generate appropriate follow-up question based on missing data
 */
export function generateFollowUpQuestion(
  intent: BookingIntent,
  conversationCount: number
): string {
  const missing = intent.requiresFollowUp;

  if (missing.name) {
    return "What's your name?";
  }
  if (missing.email) {
    return "What's the best email address to reach you?";
  }
  if (missing.service) {
    return "What service are you interested in? (e.g., consultation, setup, audit)";
  }
  if (missing.dateTime) {
    return "When would you like to schedule this? (e.g., Tuesday at 3 PM)";
  }

  return "Great! Should I confirm this booking?";
}

/**
 * Validate if we have all required data for booking
 */
export function isBookingComplete(intent: BookingIntent): boolean {
  const missing = intent.requiresFollowUp;
  return !missing.name && !missing.email && !missing.service && !missing.dateTime;
}

/**
 * Extract complete booking details
 */
export function extractBookingDetails(intent: BookingIntent): {
  name: string;
  email: string;
  service: string;
  datetime: string;
} | null {
  if (!isBookingComplete(intent)) {
    return null;
  }

  return {
    name: intent.extractedData.who?.name || '',
    email: intent.extractedData.who?.email || '',
    service: intent.extractedData.what || '',
    datetime: `${intent.extractedData.when?.date} ${intent.extractedData.when?.time}`,
  };
}
