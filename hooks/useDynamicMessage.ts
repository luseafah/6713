'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DynamicMessage {
  title: string;
  content: string;
  category: string;
}

interface MessageVariables {
  [key: string]: string | number | boolean;
}

/**
 * Hook to fetch and parse dynamic system messages with variable substitution
 * 
 * @param triggerId - The trigger_id of the message to fetch (e.g., 'on_verification_pending')
 * @param variables - Object with variable values to substitute (e.g., { user_name: 'John', talent_balance: 100 })
 * 
 * @example
 * const { message, loading } = useDynamicMessage('on_talent_throw', {
 *   talent_amount: 50,
 *   recipient_username: 'alice'
 * });
 */
export function useDynamicMessage(
  triggerId: string | null,
  variables?: MessageVariables
) {
  const [message, setMessage] = useState<DynamicMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!triggerId) {
      setMessage(null);
      return;
    }

    const fetchMessage = async () => {
      setLoading(true);
      setError(null);

      try {
        // Convert variables to JSONB format
        const varsJsonb = variables
          ? Object.entries(variables).reduce((acc, [key, value]) => {
              acc[key] = String(value);
              return acc;
            }, {} as Record<string, string>)
          : {};

        // Call database function to get message with substitutions
        const { data, error: rpcError } = await supabase.rpc('get_system_message', {
          p_trigger_id: triggerId,
          p_variables: varsJsonb,
        });

        if (rpcError) {
          throw rpcError;
        }

        if (data && data.length > 0) {
          setMessage(data[0]);
        } else {
          setError(`Message not found: ${triggerId}`);
        }
      } catch (err: any) {
        console.error('Error fetching dynamic message:', err);
        setError(err.message || 'Failed to fetch message');
      } finally {
        setLoading(false);
      }
    };

    fetchMessage();
  }, [triggerId, JSON.stringify(variables)]);

  return { message, loading, error };
}

/**
 * Hook to fetch all system messages by category
 * Useful for displaying all air-lock messages, god mode messages, etc.
 */
export function useSystemMessagesByCategory(category: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('system_messages')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('trigger_id');

      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();
  }, [category]);

  return { messages, loading };
}

/**
 * Hook for admins to fetch quick reply templates
 */
export function useQuickReplies() {
  const [quickReplies, setQuickReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchQuickReplies = async () => {
      const { data, error } = await supabase
        .from('quick_replies')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (!error && data) {
        setQuickReplies(data);
      }
      setLoading(false);
    };

    fetchQuickReplies();
  }, []);

  const sendQuickReply = async (
    replyId: string,
    recipientId: string,
    variables?: MessageVariables
  ) => {
    // Get the quick reply template
    const reply = quickReplies.find((qr) => qr.id === replyId);
    if (!reply) return;

    // Substitute variables
    let content = reply.content;
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(`{{${key}}}`, String(value));
      });
    }

    // Send as admin message (you would implement this based on your chat system)
    // For now, just return the processed content
    return {
      content,
      label: reply.label,
      icon: reply.icon,
      color: reply.color,
    };
  };

  return { quickReplies, loading, sendQuickReply };
}

/**
 * Client-side variable substitution (for non-database messages)
 */
export function substituteVariables(
  template: string,
  variables: MessageVariables
): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });
  return result;
}
