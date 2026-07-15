import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const fetchHcps = createAsyncThunk('crm/fetchHcps', async () => {
  const response = await axios.get(`${API_URL}/hcps`);
  return response.data;
});

export const logInteraction = createAsyncThunk('crm/logInteraction', async (data) => {
  const response = await axios.post(`${API_URL}/interactions`, data);
  return response.data;
});

export const sendMessageToAgent = createAsyncThunk('crm/sendMessage', async (message) => {
  const response = await axios.post(`${API_URL}/chat`, { message });
  return { user: message, agent: response.data.response };
});

const initialState = {
  hcps: [],
  interactions: [],
  chatHistory: [
    { sender: 'agent', text: 'Hello! I am your AI CRM Assistant. How can I help you log an interaction today?' }
  ],
  loading: false,
  error: null,
};

const crmSlice = createSlice({
  name: 'crm',
  initialState,
  reducers: {
    addMessageToChat: (state, action) => {
      state.chatHistory.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHcps.fulfilled, (state, action) => {
        state.hcps = action.payload;
      })
      .addCase(logInteraction.fulfilled, (state, action) => {
        state.interactions.push(action.payload);
      })
      .addCase(sendMessageToAgent.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendMessageToAgent.fulfilled, (state, action) => {
        state.loading = false;
        state.chatHistory.push({ sender: 'agent', text: action.payload.agent });
      })
      .addCase(sendMessageToAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.chatHistory.push({ sender: 'agent', text: 'Sorry, I encountered an error. Please try again.' });
      });
  },
});

export const { addMessageToChat } = crmSlice.actions;
export default crmSlice.reducer;
