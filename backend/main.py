from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import engine, Base, get_db
from agent import app_agent, llm
from langchain_core.messages import HumanMessage
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI-First CRM HCP Module API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed initial HCPs
@app.on_event("startup")
def startup_event():
    db = next(get_db())
    if db.query(models.HCP).count() == 0:
        hcp1 = models.HCP(name="Dr. Smith", specialty="Cardiology", hospital_affiliation="General Hospital")
        hcp2 = models.HCP(name="Dr. Sharma", specialty="Oncology", hospital_affiliation="Cancer Institute")
        db.add_all([hcp1, hcp2])
        db.commit()

@app.get("/hcps", response_model=List[schemas.HCPResponse])
def get_hcps(db: Session = Depends(get_db)):
    return db.query(models.HCP).all()

@app.post("/interactions", response_model=schemas.InteractionResponse)
def create_interaction(interaction: schemas.InteractionCreate, db: Session = Depends(get_db)):
    db_interaction = models.Interaction(**interaction.model_dump())
    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)
    return db_interaction

@app.get("/interactions", response_model=List[schemas.InteractionResponse])
def get_interactions(db: Session = Depends(get_db)):
    return db.query(models.Interaction).all()

@app.put("/interactions/{interaction_id}", response_model=schemas.InteractionResponse)
def update_interaction(interaction_id: int, interaction: schemas.InteractionUpdate, db: Session = Depends(get_db)):
    db_interaction = db.query(models.Interaction).filter(models.Interaction.id == interaction_id).first()
    if not db_interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    
    update_data = interaction.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_interaction, key, value)
        
    db.commit()
    db.refresh(db_interaction)
    return db_interaction

@app.post("/chat")
def chat_with_agent(chat_req: schemas.ChatRequest):
    # Pass the human message to the LangGraph agent
    try:
        initial_state = {"messages": [HumanMessage(content=chat_req.message)]}
        # Run agent
        result = app_agent.invoke(initial_state)
        # Get last message
        last_message = result["messages"][-1]
        return {"response": last_message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent Error: {str(e)}")

@app.post("/extract")
def extract_data(chat_req: schemas.ChatRequest):
    try:
        parser = JsonOutputParser()
        prompt = PromptTemplate(
            template="Extract the following interaction details from the text.\n"
                     "Return a JSON object with keys: hcpName (string), topics (string), sentiment (string: positive, neutral, negative), materials (list of strings), followUp (string).\n"
                     "If a field is not found, leave it empty. Format exactly as requested.\n\n"
                     "Text: {text}\n\n{format_instructions}",
            input_variables=["text"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )
        
        chain = prompt | llm | parser
        result = chain.invoke({"text": chat_req.message})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction Error: {str(e)}")
