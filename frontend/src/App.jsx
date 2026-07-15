import React, { useState } from 'react';
import './App.css';

function App() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const defaultDate = `${year}-${month}-${day}`;
  const defaultTime = `${hours}:${minutes}`;

  const [formData, setFormData] = useState({
    hcpName: '',
    interactionType: 'Meeting',
    date: defaultDate,
    time: defaultTime,
    attendees: '',
    topics: '',
    sentiment: 'neutral',
    outcomes: '',
    followUp: '',
    materials: []
  });

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { 
      type: 'system', 
      text: 'Log interaction details here (e.g., "Met Dr. Smith, discussed Prodo-X efficacy, positive sentiment, shared brochure") or ask for help.' 
    }
  ]);

  const handleLogInteraction = async () => {
    if (!chatInput.trim()) return;

    // Add user message
    const newMessages = [...messages, { type: 'user', text: chatInput }];
    setMessages(newMessages);
    
    // Reset form data for new input to avoid old data lingering
    let updatedFormData = {
      hcpName: '',
      interactionType: 'Meeting',
      date: defaultDate,
      time: defaultTime,
      attendees: '',
      topics: '',
      sentiment: 'neutral',
      outcomes: '',
      followUp: '',
      materials: []
    };
    
    try {
      // Call the Python backend that uses the LLM
      const response = await fetch('http://localhost:8000/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Map the LLM JSON response to the form
        if (data.hcpName) updatedFormData.hcpName = data.hcpName;
        if (data.topics) updatedFormData.topics = data.topics;
        if (data.sentiment && ['positive', 'neutral', 'negative'].includes(data.sentiment.toLowerCase())) {
          updatedFormData.sentiment = data.sentiment.toLowerCase();
        }
        if (data.materials && Array.isArray(data.materials)) {
          updatedFormData.materials = data.materials;
        }
        if (data.followUp) updatedFormData.followUp = data.followUp;

        // Add success message
        setMessages([...newMessages, { 
          type: 'success', 
          text: '✅ **Interaction logged successfully!** The details have been automatically populated by the AI based on your summary.'
        }]);
      } else {
        const errText = await response.text();
        console.error("Backend Error:", errText);
        setMessages([...newMessages, { 
          type: 'system', 
          text: `❌ **Error from Backend:** ${errText}`
        }]);
      }
    } catch (error) {
      console.error("Error connecting to backend LLM:", error);
      setMessages([...newMessages, { 
        type: 'system', 
        text: `❌ **Network Error:** Could not connect to the backend.`
      }]);
    }

    setFormData(updatedFormData);
    setChatInput('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderFormattedText = (text) => {
    // Simple bold markdown parsing for the success message
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="app-container">
      <h1 className="header">Log HCP Interaction</h1>
      
      <div className="main-content">
        {/* Left Column: Form */}
        <div className="interaction-details">
          <div className="section-header">
            Interaction Details
          </div>
          
          <div className="form-content">
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>HCP Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  name="hcpName"
                  value={formData.hcpName}
                  onChange={handleInputChange}
                  placeholder="Search or select HCP..." 
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Interaction Type</label>
                <select 
                  className="form-select"
                  name="interactionType"
                  value={formData.interactionType}
                  onChange={handleInputChange}
                >
                  <option>Meeting</option>
                  <option>Call</option>
                  <option>Email</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input 
                  type="time" 
                  className="form-input" 
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Attendees</label>
              <input 
                type="text" 
                className="form-input" 
                name="attendees"
                value={formData.attendees}
                onChange={handleInputChange}
                placeholder="Enter names or search..." 
              />
            </div>

            <div className="form-group">
              <label>Topics Discussed</label>
              <textarea 
                className="form-textarea" 
                name="topics"
                value={formData.topics}
                onChange={handleInputChange}
                placeholder="Enter key discussion points..."
              ></textarea>
            </div>

            <button className="btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
              Summarize from Voice Note (Requires Consent)
            </button>

            <div className="materials-section">
              <h4>Materials Shared / Samples Distributed</h4>
              
              <div className="material-item">
                <div style={{flex: 1}}>
                  <p style={{marginBottom: "0.5rem", color: "var(--text-primary)", fontStyle: "normal", fontSize: "0.875rem", fontWeight: 500}}>Materials Shared</p>
                  {formData.materials.length > 0 ? (
                    <p style={{color: "var(--text-primary)", fontStyle: "normal"}}>{formData.materials.join(', ')}</p>
                  ) : (
                    <p>No materials added.</p>
                  )}
                </div>
                <button className="btn-secondary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  Search/Add
                </button>
              </div>

              <div className="material-item">
                <div style={{flex: 1}}>
                   <p style={{marginBottom: "0.5rem", color: "var(--text-primary)", fontStyle: "normal", fontSize: "0.875rem", fontWeight: 500}}>Samples Distributed</p>
                  <p>No samples added.</p>
                </div>
                <button className="btn-secondary">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Add Sample
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Observed/Inferred HCP Sentiment</label>
              <div className="sentiment-options">
                <label className="sentiment-label">
                  <input 
                    type="radio" 
                    name="sentiment" 
                    value="positive" 
                    checked={formData.sentiment === 'positive'}
                    onChange={handleInputChange}
                  />
                  😊 Positive
                </label>
                <label className="sentiment-label">
                  <input 
                    type="radio" 
                    name="sentiment" 
                    value="neutral" 
                    checked={formData.sentiment === 'neutral'}
                    onChange={handleInputChange}
                  />
                  😐 Neutral
                </label>
                <label className="sentiment-label">
                  <input 
                    type="radio" 
                    name="sentiment" 
                    value="negative" 
                    checked={formData.sentiment === 'negative'}
                    onChange={handleInputChange}
                  />
                  😟 Negative
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Outcomes</label>
              <textarea 
                className="form-textarea" 
                name="outcomes"
                value={formData.outcomes}
                onChange={handleInputChange}
                placeholder="Key outcomes or agreements..."
              ></textarea>
            </div>

            <div className="form-group">
              <label>Follow-up Actions</label>
              <textarea 
                className="form-textarea" 
                name="followUp"
                value={formData.followUp}
                onChange={handleInputChange}
                placeholder="Enter next steps or tasks..."
              ></textarea>
            </div>

            <div className="ai-suggestions">
              <h4>AI Suggested Follow-ups:</h4>
              <a href="#" className="suggestion-link">+ Schedule follow-up meeting in 2 weeks</a>
              <a href="#" className="suggestion-link">+ Send OncoBoost Phase III PDF</a>
              <a href="#" className="suggestion-link">+ Add {formData.hcpName || 'HCP'} to advisory board invite list</a>
            </div>

          </div>
        </div>

        {/* Right Column: AI Assistant */}
        <div className="ai-assistant">
          <div className="section-header" style={{background: '#ffffff', borderBottom: 'none'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <span style={{fontSize: '1.25rem'}}>🤖</span>
              <span style={{color: '#3b82f6', fontWeight: 600, fontSize: '1.1rem'}}>AI Assistant</span>
            </div>
          </div>
          <div style={{padding: '0 1.5rem', color: '#9ca3af', fontSize: '0.875rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)'}}>
            Log Interaction details here via chat
          </div>
          
          <div className="chat-area">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message chat-${msg.type}`}>
                {renderFormattedText(msg.text)}
              </div>
            ))}
          </div>

          <div className="chat-input-area">
            <textarea 
              className="chat-input" 
              placeholder="Describe Interaction..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleLogInteraction();
                }
              }}
              style={{resize: 'none', height: '60px'}}
            ></textarea>
            <button className="btn-primary" onClick={handleLogInteraction}>
              <span style={{display: 'block', fontSize: '0.75rem', fontWeight: 'bold'}}>A</span>
              Log
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
