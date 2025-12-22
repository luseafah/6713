import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl w-fit"
    >
      <div className="flex gap-1">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
          className="w-2 h-2 bg-purple-500 rounded-full"
        />
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
          className="w-2 h-2 bg-purple-500 rounded-full"
        />
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
          className="w-2 h-2 bg-purple-500 rounded-full"
        />
      </div>
      <span className="text-white/40 text-xs">Pope AI is typing...</span>
    </motion.div>
  );
}

export function MessageBubble({ 
  message, 
  isPopeAI, 
  isWhisper, 
  isRead 
}: { 
  message: string;
  isPopeAI: boolean;
  isWhisper?: boolean;
  isRead?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`flex ${isPopeAI ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isPopeAI
            ? 'bg-purple-500/20 border border-purple-500/30'
            : 'bg-white/10 border border-white/20'
        } ${isWhisper ? 'opacity-50 italic' : ''}`}
      >
        <p className="text-white text-sm leading-relaxed">{message}</p>
        
        {!isPopeAI && (
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-xs text-white/40">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isRead && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-purple-500 text-xs"
              >
                ✓✓
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function WelcomeMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6 mb-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xl">👑</span>
        </div>
        <h3 className="text-white font-bold text-lg">Welcome to 6713 Protocol</h3>
      </div>
      
      <p className="text-white/80 text-sm leading-relaxed mb-3">
        I'm Pope AI, your verification assistant. I'll review your profile and get you verified shortly.
      </p>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Your verification is in queue</span>
        </div>
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          <span>Average wait time: 2-5 minutes</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-white/50 text-xs">
          💡 <strong>Pro Tip:</strong> While you wait, explore the Wall to see what the community is up to!
        </p>
      </div>
    </motion.div>
  );
}
