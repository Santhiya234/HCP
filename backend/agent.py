import os
from typing import TypedDict, Annotated, List, Dict, Any, Union
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field
import json
from sqlalchemy.orm import Session
from database import SessionLocal
import models

# 1. State definition
class AgentState(TypedDict):
    messages: Annotated[list, "The messages in the conversation"]

# 2. Tools
def log_interaction(hcp_id: int, interaction_type: str, topics_discussed: str, sentiment: str, outcomes: str, follow_up_actions: str) -> str:
    """Logs a new interaction with an HCP."""
    db = SessionLocal()
    try:
        interaction = models.Interaction(
            hcp_id=hcp_id,
            interaction_type=interaction_type,
            topics_discussed=topics_discussed,
            sentiment=sentiment,
            outcomes=outcomes,
            follow_up_actions=follow_up_actions
        )
        db.add(interaction)
        db.commit()
        db.refresh(interaction)
        return f"Interaction logged successfully with ID {interaction.id}."
    except Exception as e:
        return f"Error logging interaction: {str(e)}"
    finally:
        db.close()

def edit_interaction(interaction_id: int, topics_discussed: str = None, sentiment: str = None, outcomes: str = None) -> str:
    """Edits an existing logged interaction."""
    db = SessionLocal()
    try:
        interaction = db.query(models.Interaction).filter(models.Interaction.id == interaction_id).first()
        if not interaction:
            return f"Interaction with ID {interaction_id} not found."
        
        if topics_discussed: interaction.topics_discussed = topics_discussed
        if sentiment: interaction.sentiment = sentiment
        if outcomes: interaction.outcomes = outcomes
        
        db.commit()
        return f"Interaction {interaction_id} updated successfully."
    except Exception as e:
        return f"Error editing interaction: {str(e)}"
    finally:
        db.close()

def get_hcp_details(hcp_name: str) -> str:
    """Retrieves details of an HCP by their name."""
    db = SessionLocal()
    try:
        # Simple case-insensitive search
        hcp = db.query(models.HCP).filter(models.HCP.name.ilike(f"%{hcp_name}%")).first()
        if not hcp:
            return f"No HCP found matching the name '{hcp_name}'."
        return f"HCP Details: ID={hcp.id}, Name={hcp.name}, Specialty={hcp.specialty}, Affiliation={hcp.hospital_affiliation}."
    finally:
        db.close()

def get_interaction_history(hcp_id: int) -> str:
    """Fetches past interactions for a specific HCP ID."""
    db = SessionLocal()
    try:
        interactions = db.query(models.Interaction).filter(models.Interaction.hcp_id == hcp_id).all()
        if not interactions:
            return f"No interaction history found for HCP ID {hcp_id}."
        
        history = []
        for i in interactions:
            history.append(f"ID={i.id}, Date={i.date.strftime('%Y-%m-%d')}, Type={i.interaction_type}, Topics={i.topics_discussed}, Sentiment={i.sentiment}")
        
        return "\n".join(history)
    finally:
        db.close()

def suggest_follow_ups(topics_discussed: str, outcomes: str) -> str:
    """Generates follow-up actions based on the topics and outcomes."""
    return f"Suggested follow-up: Send materials related to {topics_discussed}. Schedule next meeting to review {outcomes}."

# Mapping for tool execution
TOOL_MAPPING = {
    "log_interaction": log_interaction,
    "edit_interaction": edit_interaction,
    "get_hcp_details": get_hcp_details,
    "get_interaction_history": get_interaction_history,
    "suggest_follow_ups": suggest_follow_ups
}

# 3. LLM Setup
# Initialize ChatGroq (ensure GROQ_API_KEY is in environment)
api_key = os.getenv("GROQ_API_KEY")
llm = ChatGroq(temperature=0, model_name="llama-3.1-8b-instant", api_key=api_key)

# Bind tools to the LLM
# In LangGraph/LangChain we can bind tools as JSON schemas or use bind_tools
tools_schema = [
    {
        "type": "function",
        "function": {
            "name": "log_interaction",
            "description": "Logs a new interaction with an HCP.",
            "parameters": {
                "type": "object",
                "properties": {
                    "hcp_id": {"type": "integer", "description": "The ID of the HCP"},
                    "interaction_type": {"type": "string", "enum": ["Meeting", "Call", "Email"]},
                    "topics_discussed": {"type": "string"},
                    "sentiment": {"type": "string", "enum": ["Positive", "Neutral", "Negative"]},
                    "outcomes": {"type": "string"},
                    "follow_up_actions": {"type": "string"}
                },
                "required": ["hcp_id", "interaction_type", "topics_discussed", "sentiment"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "edit_interaction",
            "description": "Edits an existing logged interaction.",
            "parameters": {
                "type": "object",
                "properties": {
                    "interaction_id": {"type": "integer"},
                    "topics_discussed": {"type": "string"},
                    "sentiment": {"type": "string", "enum": ["Positive", "Neutral", "Negative"]},
                    "outcomes": {"type": "string"}
                },
                "required": ["interaction_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_hcp_details",
            "description": "Retrieves details of an HCP by their name.",
            "parameters": {
                "type": "object",
                "properties": {
                    "hcp_name": {"type": "string"}
                },
                "required": ["hcp_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_interaction_history",
            "description": "Fetches past interactions for a specific HCP ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "hcp_id": {"type": "integer"}
                },
                "required": ["hcp_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "suggest_follow_ups",
            "description": "Generates follow-up actions based on the topics and outcomes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topics_discussed": {"type": "string"},
                    "outcomes": {"type": "string"}
                },
                "required": ["topics_discussed", "outcomes"]
            }
        }
    }
]

llm_with_tools = llm.bind_tools(tools_schema)

# 4. Define Graph Nodes
def chatbot(state: AgentState):
    messages = state["messages"]
    system_message = SystemMessage(content="You are an AI-first CRM assistant for life science field reps. You help them log and manage interactions with Healthcare Professionals (HCPs). You have access to tools to find HCPs, log interactions, edit them, and suggest follow-ups. Always be helpful and professional. If you need to log an interaction, try to find the HCP first if the ID is unknown.")
    
    # Prepend system message if not present
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages = [system_message] + messages

    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

def tool_executor(state: AgentState):
    messages = state["messages"]
    last_message = messages[-1]
    
    tool_responses = []
    if last_message.tool_calls:
        for tool_call in last_message.tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]
            
            print(f"Executing tool: {tool_name} with args: {tool_args}")
            if tool_name in TOOL_MAPPING:
                try:
                    result = TOOL_MAPPING[tool_name](**tool_args)
                    tool_responses.append(ToolMessage(content=str(result), tool_call_id=tool_call["id"]))
                except Exception as e:
                    tool_responses.append(ToolMessage(content=f"Error: {e}", tool_call_id=tool_call["id"]))
            else:
                tool_responses.append(ToolMessage(content=f"Error: Tool {tool_name} not found.", tool_call_id=tool_call["id"]))
    
    return {"messages": tool_responses}

def should_continue(state: AgentState) -> str:
    messages = state["messages"]
    last_message = messages[-1]
    
    # If there is no tool call, then we finish
    if not last_message.tool_calls:
        return "end"
    # Otherwise we continue to tool_executor
    return "continue"

# Use SystemMessage from langchain_core
from langchain_core.messages import SystemMessage

# 5. Build Graph
workflow = StateGraph(AgentState)
workflow.add_node("agent", chatbot)
workflow.add_node("action", tool_executor)

workflow.set_entry_point("agent")
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "continue": "action",
        "end": END
    }
)
workflow.add_edge("action", "agent")

app_agent = workflow.compile()
