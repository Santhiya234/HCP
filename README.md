# AI-First CRM HCP Module

This project is an AI-first Customer Relationship Management (CRM) system designed for life science field representatives to manage interactions with Healthcare Professionals (HCPs). 

It features a **React** frontend, a **FastAPI** backend, and an AI agent built with **LangGraph** using the **Groq API** (`gemma2-9b-it` model).

## Project Structure

- `frontend/`: React application built with Vite, using Redux Toolkit for state management.
- `backend/`: FastAPI application with SQLite database (SQLAlchemy) and LangGraph AI agent.

## Prerequisites
- Node.js & npm
- Python 3.11+
- A Groq API Key

## Setup Instructions

### 1. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   # OR if requirements.txt is missing:
   pip install fastapi uvicorn sqlalchemy langgraph langchain-groq python-dotenv pydantic
   ```
4. Set your Groq API Key:
   Create a `.env` file in the `backend` directory or export it as an environment variable:
   ```bash
   export GROQ_API_KEY="your-groq-api-key"
   ```
5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

### 2. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## LangGraph Tools Implemented
The AI agent is equipped with 5 tools to assist the user:
1. `Log Interaction`: Captures interaction data directly into the database.
2. `Edit Interaction`: Modifies previously logged interactions.
3. `Get HCP Details`: Retrieves information about a specific HCP.
4. `Get Interaction History`: Fetches past interactions for an HCP.
5. `Suggest Follow-ups`: Generates follow-up actions based on discussion outcomes.
