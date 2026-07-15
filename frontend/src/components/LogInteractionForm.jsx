import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logInteraction, fetchHcps } from '../store/crmSlice';
import { Save } from 'lucide-react';

const LogInteractionForm = () => {
  const dispatch = useDispatch();
  const hcps = useSelector((state) => state.crm.hcps);
  
  const [formData, setFormData] = useState({
    hcp_id: '',
    interaction_type: 'Meeting',
    topics_discussed: '',
    sentiment: 'Neutral',
    outcomes: '',
    follow_up_actions: ''
  });

  useEffect(() => {
    dispatch(fetchHcps());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.hcp_id) {
      dispatch(logInteraction({
        ...formData,
        hcp_id: parseInt(formData.hcp_id)
      }));
      alert('Interaction logged successfully!');
      // Reset form
      setFormData({
        ...formData,
        topics_discussed: '',
        outcomes: '',
        follow_up_actions: ''
      });
    } else {
      alert('Please select an HCP.');
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Interaction Details</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>HCP Name</label>
          <select 
            className="form-control" 
            name="hcp_id" 
            value={formData.hcp_id} 
            onChange={handleChange}
            required
          >
            <option value="">Select an HCP...</option>
            {hcps.map(hcp => (
              <option key={hcp.id} value={hcp.id}>{hcp.name} - {hcp.specialty}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Interaction Type</label>
          <select 
            className="form-control" 
            name="interaction_type" 
            value={formData.interaction_type} 
            onChange={handleChange}
          >
            <option value="Meeting">Meeting</option>
            <option value="Call">Call</option>
            <option value="Email">Email</option>
          </select>
        </div>

        <div className="form-group">
          <label>Topics Discussed</label>
          <textarea 
            className="form-control" 
            name="topics_discussed" 
            placeholder="Enter key discussion points..."
            value={formData.topics_discussed} 
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <div className="form-group">
          <label>Sentiment</label>
          <select 
            className="form-control" 
            name="sentiment" 
            value={formData.sentiment} 
            onChange={handleChange}
          >
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>
        </div>

        <div className="form-group">
          <label>Outcomes</label>
          <textarea 
            className="form-control" 
            name="outcomes" 
            placeholder="Key outcomes or agreements..."
            value={formData.outcomes} 
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="form-group">
          <label>Follow-up Actions</label>
          <textarea 
            className="form-control" 
            name="follow_up_actions" 
            placeholder="Enter next steps or tasks..."
            value={formData.follow_up_actions} 
            onChange={handleChange}
          ></textarea>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          <Save size={18} style={{ marginRight: '8px' }}/> Log Interaction
        </button>
      </form>
    </div>
  );
};

export default LogInteractionForm;
