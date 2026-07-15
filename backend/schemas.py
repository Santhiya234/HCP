from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from models import InteractionType, Sentiment

class HCPBase(BaseModel):
    name: str
    specialty: Optional[str] = None
    hospital_affiliation: Optional[str] = None

class HCPCreate(HCPBase):
    pass

class HCPResponse(HCPBase):
    id: int

    class Config:
        from_attributes = True

class InteractionBase(BaseModel):
    hcp_id: int
    interaction_type: InteractionType
    date: Optional[datetime] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[str] = None
    samples_distributed: Optional[str] = None
    sentiment: Optional[Sentiment] = None
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None

class InteractionCreate(InteractionBase):
    pass

class InteractionUpdate(BaseModel):
    hcp_id: Optional[int] = None
    interaction_type: Optional[InteractionType] = None
    date: Optional[datetime] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[str] = None
    samples_distributed: Optional[str] = None
    sentiment: Optional[Sentiment] = None
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None

class InteractionResponse(InteractionBase):
    id: int
    hcp: HCPResponse

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
