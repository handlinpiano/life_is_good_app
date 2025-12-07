"""
Vedic Astrology API - FastAPI Backend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import BirthData, ChartResponse, ChatRequest, SimpleChatRequest, SynastryRequest, AlignmentRequest
from calculator import calculate_chart, calculate_navamsa, calculate_dasha, calculate_all_vargas, calculate_synastry, calculate_current_alignment
from interpreter import interpret_chart, interpret_chart_structured, chat_about_chart, simple_chat, interpret_synastry

app = FastAPI(
    title="Vedic Astrology API",
    description="Calculate Vedic birth charts with planetary positions, nakshatras, and divisional charts",
    version="1.0.0"
)

# CORS for frontend - allow all origins for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False when using "*" for origins
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Vedic Astrology API"}


@app.post("/api/chart", response_model=ChartResponse)
def get_chart(data: BirthData):
    """
    Calculate a complete Vedic birth chart.

    Returns planetary positions in sidereal zodiac using Lahiri ayanamsa,
    along with nakshatra positions and house placements.
    """
    try:
        chart = calculate_chart(
            year=data.year,
            month=data.month,
            day=data.day,
            hour=data.hour,
            minute=data.minute,
            latitude=data.latitude,
            longitude=data.longitude
        )

        # Add all divisional charts (vargas)
        # Add all divisional charts (vargas)
        vargas = calculate_all_vargas(chart)
        
        # Structure the response to include D1 explicitly and other vargas at top level
        # This creates a cleaner API that matches Frontend expectations (chart.D1, chart.D9, etc)
        response = {
            "D1": chart,  # Main Rashi Chart
            "meta": {
                "ayanamsa": chart.get('ayanamsa'),
                "ayanamsa_type": chart.get('ayanamsa_type'),
                "birth_data": chart.get('birth_data')
            }
        }
        
        # Add all other vargas to root, but don't overwrite D1 if it exists in vargas
        # We want D1 to be the full 'chart' object, not the simplified varga version
        for key, value in vargas.items():
            if key != 'D1':
                response[key] = value
        
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chart/basic")
def get_basic_chart(data: BirthData):
    """
    Get basic chart without divisional charts.
    Lighter response for quick lookups.
    """
    try:
        chart = calculate_chart(
            year=data.year,
            month=data.month,
            day=data.day,
            hour=data.hour,
            minute=data.minute,
            latitude=data.latitude,
            longitude=data.longitude
        )
        return chart

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/dasha")
def get_dasha_periods(data: BirthData):
    """
    Calculate Vimshottari Dasha periods.

    Returns all Maha Dasha periods from birth, plus the current
    running Maha Dasha and Antar Dasha (sub-period).
    """
    try:
        dasha = calculate_dasha(
            year=data.year,
            month=data.month,
            day=data.day,
            hour=data.hour,
            minute=data.minute,
            latitude=data.latitude,
            longitude=data.longitude
        )
        return dasha

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/interpret")
def get_interpretation(data: BirthData, structured: bool = True):
    """
    Get AI-powered interpretation of the birth chart using DeepSeek Reasoner.

    The 'structured' parameter controls the output format:
    - True (default): Returns JSON-structured sections for easy frontend rendering
    - False: Returns free-form interpretation text

    The response includes 'reasoning' (chain of thought) and 'interpretation' (final analysis).
    """
    try:
        # First calculate the chart and dasha
        chart = calculate_chart(
            year=data.year,
            month=data.month,
            day=data.day,
            hour=data.hour,
            minute=data.minute,
            latitude=data.latitude,
            longitude=data.longitude
        )

        dasha = calculate_dasha(
            year=data.year,
            month=data.month,
            day=data.day,
            hour=data.hour,
            minute=data.minute,
            latitude=data.latitude,
            longitude=data.longitude
        )

        # Get interpretation
        if structured:
            result = interpret_chart_structured(chart, dasha)
        else:
            result = interpret_chart(chart, dasha)

        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Interpretation failed"))

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/synastry")
def get_synastry(request: SynastryRequest):
    """
    Calculate synastry (relationship compatibility) between 2-4 people.

    Compares birth charts and provides:
    - Inter-chart aspects (conjunctions, trines, squares, etc.)
    - House overlays (where one person's planets fall in another's houses)
    - Compatibility scores and analysis
    - AI-powered relationship interpretation
    """
    try:
        charts = []
        labels = []

        # Calculate chart for each person
        for person in request.people:
            data = person.birth_data
            chart = calculate_chart(
                year=data.year,
                month=data.month,
                day=data.day,
                hour=data.hour,
                minute=data.minute,
                latitude=data.latitude,
                longitude=data.longitude
            )
            charts.append(chart)
            labels.append(person.label)

        # Calculate synastry aspects and overlays
        synastry_data = calculate_synastry(charts, labels)

        # Get AI interpretation
        interpretation_result = interpret_synastry(synastry_data, charts, labels)

        if not interpretation_result.get("success"):
            # Return synastry data even if interpretation fails
            return {
                "success": True,
                "synastry": synastry_data,
                "interpretation": None,
                "interpretation_error": interpretation_result.get("error")
            }

        return {
            "success": True,
            "synastry": synastry_data,
            "interpretation": interpretation_result.get("interpretation"),
            "reasoning": interpretation_result.get("reasoning")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/v2")
def chat_simple(request: SimpleChatRequest):
    """
    Simple chat - just message + history.

    All context (system prompt, chart data, persona) is already in the history.
    No recalculation needed - just pass to LLM and get response.
    """
    try:
        # Convert to dict format
        history = [{"role": msg.role, "content": msg.content} for msg in request.history]

        # Get chat response
        result = simple_chat(request.message, history)

        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Chat failed"))

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat")
def chat_followup(request: ChatRequest):
    """
    Have a follow-up conversation about the birth chart (legacy - recalculates).

    DEPRECATED: Use /api/chat/v2 with pre-calculated chart data instead.
    """
    try:
        data = request.birth_data

        # Calculate chart with all vargas
        chart = calculate_chart(
            year=data.year,
            month=data.month,
            day=data.day,
            hour=data.hour,
            minute=data.minute,
            latitude=data.latitude,
            longitude=data.longitude
        )
        chart['vargas'] = calculate_all_vargas(chart)

        # Calculate dasha
        dasha = calculate_dasha(
            year=data.year,
            month=data.month,
            day=data.day,
            hour=data.hour,
            minute=data.minute,
            latitude=data.latitude,
            longitude=data.longitude
        )

        # Convert conversation history to dict format
        history = None
        if request.conversation_history:
            history = [{"role": msg.role, "content": msg.content} for msg in request.conversation_history]

        # Get chat response
        result = chat_about_chart(chart, dasha, request.question, history)

        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Chat failed"))

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/alignment")
def get_daily_alignment(data: AlignmentRequest):
    """
    Get current cosmic alignment (Panchang) for a given location.

    Returns Tithi, Nakshatra, and other daily indicators for
    personalized guidance based on the current planetary positions.
    """
    try:
        alignment = calculate_current_alignment(
            year=data.year,
            month=data.month,
            day=data.day,
            hour=data.hour,
            minute=data.minute,
            latitude=data.latitude,
            longitude=data.longitude
        )
        return alignment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
