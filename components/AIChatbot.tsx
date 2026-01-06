'use client'

import { useState, useRef, useEffect } from 'react'
import { FiMessageSquare, FiX, FiSend } from 'react-icons/fi'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Function to format AI response text
const formatMessage = (text: string) => {
  // Split by lines
  const lines = text.split('\n')
  const formatted: JSX.Element[] = []

  lines.forEach((line, idx) => {
    // Handle bold text **text**
    let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Handle bullet points
    if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
      const content = line.replace(/^[-•]\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      formatted.push(
        <div key={idx} className="flex items-start space-x-2 ml-2 my-1">
          <span className="text-primary mt-1">•</span>
          <span dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      )
    }
    // Handle numbered lists
    else if (/^\d+\./.test(line.trim())) {
      const content = line.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      formatted.push(
        <div key={idx} className="flex items-start space-x-2 ml-2 my-1">
          <span className="text-primary">{line.match(/^\d+/)?.[0]}.</span>
          <span dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      )
    }
    // Regular lines with formatting
    else if (line.trim()) {
      formatted.push(
        <p key={idx} className="my-1" dangerouslySetInnerHTML={{ __html: formattedLine }} />
      )
    }
    // Empty lines for spacing
    else {
      formatted.push(<div key={idx} className="h-2" />)
    }
  })

  return formatted
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1-0528:free',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant for a project management and task allocation system. Help users with questions about tasks, project management, team collaboration, and productivity tips.'
            },
            ...messages,
            userMessage
          ],
        }),
      })

      const data = await response.json()
      
      if (data.choices && data.choices[0]?.message?.content) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.choices[0].message.content
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error('Invalid response from AI')
      }
    } catch (error) {
      console.error('AI Chat Error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-primary hover:bg-primary-dark text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-50"
          aria-label="Open AI Chat"
        >
          <FiMessageSquare className="text-2xl" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-dark-card border border-gray-700 rounded-xl shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="bg-primary p-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FiMessageSquare className="text-white text-xl" />
              <h3 className="text-white font-bold">AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-primary-dark p-1 rounded transition-colors"
              aria-label="Close chat"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <FiMessageSquare className="text-5xl mx-auto mb-3 text-gray-600" />
                <p className="text-sm">Ask me anything about your tasks!</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-dark-bg text-gray-200 border border-gray-700'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="text-sm formatted-message">
                        {formatMessage(msg.content)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-dark-bg border border-gray-700 p-3 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-dark-bg border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-primary hover:bg-primary-dark text-white p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <FiSend className="text-xl" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
