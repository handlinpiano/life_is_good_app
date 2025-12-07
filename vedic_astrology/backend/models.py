"""Pydantic models for API request/response validation."""

from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional


class BirthData(BaseModel):
    """Input model for birth chart calculation."""
    year: int = Field(..., ge=1900, le=2100, description="Birth year")
    month: int = Field(..., ge=1, le=12, description="Birth month")
    day: int = Field(..., ge=1, le=31, description="Birth day")
    hour: int = Field(..., ge=0, le=23, description="Birth hour (24h format)")
    minute: int = Field(..., ge=0, le=59, description="Birth minute")
    latitude: float = Field(..., ge=-90, le=90, description="Birth place latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Birth place longitude")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "year": 1990,
                    "month": 5,
                    "day": 15,
                    "hour": 10,
                    "minute": 30,
                    "latitude": 28.6139,
                    "longitude": 77.2090
                }
            ]
        }
    }


class NakshatraInfo(BaseModel):
    """Nakshatra details."""
    name: str
    pada: int
    lord: str


class PlanetPosition(BaseModel):
    """Position data for a single planet."""
    longitude: float
    sign: str
    sign_num: int
    degree: float
    nakshatra: NakshatraInfo
    retrograde: bool
    house: int


class AscendantInfo(BaseModel):
    """Ascendant (Lagna) details."""
    longitude: float
    sign: str
    sign_num: int
    degree: float
    nakshatra: NakshatraInfo


class BirthDataResponse(BaseModel):
    """Birth data echo in response."""
    date: str
    time: str
    timezone: str
    latitude: float
    longitude: float


class SingleChart(BaseModel):
    """A single charts data (e.g. D1, D9)."""
    ascendant: Optional[AscendantInfo] = None
    planets: Dict[str, PlanetPosition]
    houses: Optional[Dict[str, List[str]]] = None
    sign: Optional[str] = None # For varga charts that act as signs

class ChartResponse(BaseModel):
    """Complete chart response with all vargas."""
    D1: SingleChart
    meta: Dict[str, Any]
    # Allow dynamic keys for other vargas (D2...D60)
    model_config = {"extra": "allow"}


class CitySearchResult(BaseModel):
    """City search result."""
    name: str
    country: str
    latitude: float
    longitude: float
    timezone: str


class ChatMessage(BaseModel):
    """A single message in the chat conversation."""
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    """Request model for follow-up chat (legacy - recalculates chart)."""
    birth_data: BirthData
    question: str = Field(..., min_length=1, description="The follow-up question")
    conversation_history: Optional[List[ChatMessage]] = Field(
        default=None,
        description="Previous messages in the conversation"
    )


class SimpleChatRequest(BaseModel):
    """Simple chat - just message + history. All context is in the history."""
    message: str = Field(..., min_length=1, description="The user's new message")
    history: List[ChatMessage] = Field(
        ...,
        description="Full conversation history (system prompt with chart data is already in there)"
    )


class PersonData(BaseModel):
    """Birth data with a label for synastry comparisons."""
    label: str = Field(..., min_length=1, max_length=50, description="Name or label for this person")
    birth_data: BirthData


class SynastryRequest(BaseModel):
    """Request model for synastry chart comparison (2-4 people)."""
    people: List[PersonData] = Field(
        ...,
        min_length=2,
        max_length=4,
        description="List of 2-4 people to compare"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "people": [
                        {
                            "label": "Person A",
                            "birth_data": {
                                "year": 1990, "month": 5, "day": 15,
                                "hour": 10, "minute": 30,
                                "latitude": 28.6139, "longitude": 77.2090
                            }
                        },
                        {
                            "label": "Person B",
                            "birth_data": {
                                "year": 1992, "month": 8, "day": 20,
                                "hour": 14, "minute": 15,
                                "latitude": 19.0760, "longitude": 72.8777
                            }
                        }
                    ]
                }
            ]
        }
    }


class AlignmentRequest(BaseModel):
    """Request model for daily cosmic alignment (Panchang)."""
    year: int = Field(..., ge=1900, le=2100, description="Current year")
    month: int = Field(..., ge=1, le=12, description="Current month")
    day: int = Field(..., ge=1, le=31, description="Current day")
    hour: int = Field(..., ge=0, le=23, description="Current hour (24h format)")
    minute: int = Field(..., ge=0, le=59, description="Current minute")
    latitude: float = Field(..., ge=-90, le=90, description="Location latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Location longitude")
