import { supabase } from '@/lib/supabase';

/**
 * Pope AI System - The Oracle of #Earth
 * Handles system announcements, moderation, and divine interventions
 */

export const POPE_AI_USER_ID = '00000000-0000-0000-0000-000000000001'; // Reserved UUID for Pope AI
export const POPE_AI_USERNAME = 'Pope AI';

/**
 * Post a message from Pope AI to the Wall
 */
export async function popeAISay(content: string, isPermanent: boolean = false) {
  try {
    const { error } = await supabase
      .from('wall_messages')
      .insert({
        user_id: POPE_AI_USER_ID,
        username: POPE_AI_USERNAME,
        content,
        message_type: 'system',
        post_type: 'wall',
        is_pope_ai: true,
        is_permanent: isPermanent
      });

    if (error) {
      console.error('Pope AI failed to speak:', error);
      return false;
    }

    console.log('🛐 Pope AI has spoken:', content);
    return true;
  } catch (error) {
    console.error('Pope AI error:', error);
    return false;
  }
}

/**
 * Announce when a user self-kills their account
 */
export async function announceAccountSelfKill(displayName: string) {
  const message = `🛑 USER ${displayName.toUpperCase()} HAS SELF-KILLED THEIR ACCOUNT. REVELATION ENDED.`;
  return popeAISay(message, true); // Permanent announcement
}

/**
 * Announce when a user enters COMA
 */
export async function announceComaEntry(displayName: string, reason: 'Choice' | 'Quest') {
  const message = reason === 'Choice'
    ? `💤 ${displayName.toUpperCase()} HAS ENTERED VOLUNTARY COMA. FREQUENCY PAUSED.`
    : `⚡ ${displayName.toUpperCase()} HAS BEEN PLACED IN COMA BY QUEST. PROTOCOL ENFORCED.`;
  return popeAISay(message, false);
}

/**
 * Announce when a user exits COMA
 */
export async function announceComaExit(displayName: string) {
  const message = `✨ ${displayName.toUpperCase()} HAS RETURNED FROM COMA. FREQUENCY RESTORED.`;
  return popeAISay(message, false);
}

/**
 * Announce when a user is rescued via CPR
 */
export async function announceCPRRescue(ghostName: string, rescuerName: string) {
  const message = `💫 ${rescuerName.toUpperCase()} HAS PERFORMED CPR ON ${ghostName.toUpperCase()}. LIFE RESTORED.`;
  return popeAISay(message, true); // Permanent miracle
}

/**
 * Warn user about slowmode violation (client-side only)
 */
export function getSlowmodeWarning() {
  return "⏱️ PATIENCE IS A TALENT. WAIT FOR THE FREQUENCY TO RESET.";
}

/**
 * Message shown when trying to reply to expired message (client-side only)
 */
export function getExpiredReplyMessage(username: string) {
  return `📡 THE ORIGINAL FREQUENCY HAS FADED. YOU MUST ASK @${username} DIRECTLY.`;
}

/**
 * Get welcome message for new users (optional)
 */
export function getWelcomeMessage(displayName: string) {
  return `🌍 ${displayName.toUpperCase()} HAS ENTERED #EARTH. WELCOME TO THE FREQUENCY.`;
}
