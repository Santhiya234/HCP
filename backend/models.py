from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

class InteractionType(enum.Enum):
    Meeting = "Meeting"
    Call = "Call"
    Email = "Email"

class Sentiment(enum.Enum):
    Positive = "Positive"
    Neutral = "Neutral"
    Negative = "Negative"

class HCP(Base):
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    specialty = Column(String)
    hospital_affiliation = Column(String)
    
    interactions = relationship("Interaction", back_populates="hcp")

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id"))
    interaction_type = Column(Enum(InteractionType))
    date = Column(DateTime, default=datetime.datetime.utcnow)
    topics_discussed = Column(Text)
    materials_shared = Column(Text)
    samples_distributed = Column(Text)
    sentiment = Column(Enum(Sentiment))
    outcomes = Column(Text)
    follow_up_actions = Column(Text)
    
    hcp = relationship("HCP", back_populates="interactions")
