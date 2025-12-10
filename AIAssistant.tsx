
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Mic, Send, X, Bot, Sparkles, StopCircle } from 'lucide-react';
import { getSmartResponse } from '../services/geminiService';

interface AIAssistantProps {
  language: 'en' | 'ar';
  contextData: any; // Data context to help AI answer questions
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ language, contextData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: language === 'ar' ? 'مرحبًا! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم في إدارة عقاراتك؟' : 'Hello! I am your AI assistant. How can I help you manage your properties today?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Voice Recognition Setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = language === 'ar' ? 'ar-EG' : 'en-US';

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputText(transcript);
            setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };
    }
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListening = () => {
    if (isListening) {
        recognitionRef.current?.stop();
    } else {
        setIsListening(true);
        recognitionRef.current?.start();
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Prepare context string for AI
      const contextString = JSON.stringify(contextData);
      const response = await getSmartResponse(contextString, userMsg.text);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: language === 'ar' ? 'عذرًا، حدث خطأ في المعالجة.' : 'Sorry, I encountered an error processing your request.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Position based on language (LTR: Right, RTL: Left)
  // In RTL mode, 'right-0' is visually on the left if dir="rtl" is set on parent, 
  // but "fixed" positioning usually relates to viewport. 
  // We need explicit class names based on language prop to be safe.
  const positionClass = language === 'ar' ? 'left-6' : 'right-6';
  const alignClass = language === 'ar' ? 'items-start' : 'items-end';

  return (
    <div className={`fixed bottom-6 ${positionClass} z-50 flex flex-col ${alignClass} pointer-events-none`}>
      {/* Chat Window */}
      {isOpen && (
        <div className={`pointer-events-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-80 md:w-96 mb-4 border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col transition-all duration-300 transform origin-bottom animate-in slide-in-from-bottom-10 fade-in zoom-in-95`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-blue-600 dark:from-blue-900 dark:to-indigo-900 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                 <Bot size={20} className="text-white" />
              </div>
              <div>
                 <h3 className="font-bold text-sm">{language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}</h3>
                 <span className="flex items-center gap-1 text-[10px] text-blue-100 opacity-90">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    {language === 'ar' ? 'متصل' : 'Online'}
                 </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="h-80 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 space-y-3">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? (language === 'ar' ? 'justify-start' : 'justify-end') : (language === 'ar' ? 'justify-end' : 'justify-start')}`}
              >
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-white rounded-br-none' 
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className={`flex ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
                 <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
            <div className="flex items-center gap-2">
               <button 
                  onClick={toggleListening}
                  className={`p-2 rounded-full transition-all ${
                     isListening 
                       ? 'bg-red-50 dark:bg-red-900/20 text-red-500 animate-pulse' 
                       : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                  title={language === 'ar' ? 'تحدث' : 'Speak'}
               >
                  {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
               </button>
               <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={isListening ? (language === 'ar' ? 'جاري الاستماع...' : 'Listening...') : (language === 'ar' ? 'اكتب رسالتك...' : 'Type a message...')}
                  className="flex-1 bg-gray-50 dark:bg-gray-700 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none dark:text-white dark:placeholder-gray-400"
               />
               <button 
                  onClick={handleSend}
                  disabled={!inputText.trim() || isLoading}
                  className="p-2 bg-primary text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  <Send size={18} />
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto w-14 h-14 bg-primary hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <div className="relative">
             <MessageSquare size={26} />
             <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-primary"></div>
        </div>
      </button>

      {/* Re-open button when closed - logic is unified above, but if isOpen is true, we usually hide the main FAB or change it to close. 
          The design prompt asks for "Assistant Icon" which usually toggles. 
          I implemented a standard chat widget pattern: FAB hides when window opens, or transforms. 
          Let's make sure the FAB is visible if the window is closed. 
          If window is open, the 'X' in header closes it. 
      */}
    </div>
  );
};

export default AIAssistant;