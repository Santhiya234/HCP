import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessageToAgent, addMessageToChat } from '../store/crmSlice';
import { Send } from 'lucide-react';

const AIAssistantChat = () => {
  const [input, setInput] = useState('');
  const dispatch = useDispatch();
  const { chatHistory, loading } = useSelector((state) => state.crm);
  const endOfMessagesRef = useRef(null);

  const handleSend = () => {
    if (input.trim()) {
      dispatch(addMessageToChat({ sender: 'user', text: input }));
      dispatch(sendMessageToAgent(input));
      setInput('');
    }
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <div className="card">
      <h2 className="card-title">AI Assistant</h2>
      <div className="chat-container">
        <div className="chat-messages">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          {loading && <div className="message agent">typing...</div>}
          <div ref={endOfMessagesRef} />
        </div>
        <div className="chat-input-wrapper">
          <input
            type="text"
            className="form-control chat-input"
            placeholder="Describe the interaction..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button className="btn btn-primary" onClick={handleSend} disabled={loading}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantChat;
