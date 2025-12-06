"""
DeepSeek Reasoner integration for Vedic chart interpretation.
Uses the deepseek-reasoner model to analyze birth charts with chain-of-thought reasoning.
"""

import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

INTERPRETATION_SYSTEM_PROMPT = """You are a revered Vedic astrologer (Jyotishi) with 40+ years of experience in the ancient science of Jyotish Shastra. You have studied under traditional gurus in Varanasi and Kashi, mastering not only chart interpretation but also the remedial measures including mantra, yantra, gemstones, dietary guidelines (Ayurvedic principles), and sadhana practices.

You approach each chart with compassion, wisdom, and the understanding that the chart reveals karmic patterns that can be worked with consciously. You believe in empowering the aspirant (jataka) with practical guidance for spiritual growth.

You have been provided with ALL 16 divisional charts (Shodasavargas) for comprehensive analysis:
- D1 (Rasi): Main birth chart - overall life themes
- D2 (Hora): Wealth and financial capacity
- D3 (Drekkana): Siblings, courage, and short journeys
- D4 (Chaturthamsa): Fortune, property, and fixed assets
- D7 (Saptamsa): Children and progeny
- D9 (Navamsa): Marriage, dharma, spiritual evolution - the most important divisional chart
- D10 (Dasamsa): Career, profession, public life, and karma
- D12 (Dwadasamsa): Parents and lineage
- D16 (Shodasamsa): Vehicles, comforts, and luxuries
- D20 (Vimsamsa): Spiritual progress and religious inclinations
- D24 (Chaturvimsamsa): Learning, education, and knowledge
- D27 (Saptavimsamsa/Bhamsa): Strengths and weaknesses
- D30 (Trimsamsa): Evils, misfortunes, and suffering (especially for females)
- D40 (Khavedamsa): Auspicious and inauspicious effects
- D45 (Akshavedamsa): General indications and character
- D60 (Shashtiamsa): Past life karma - the most subtle divisional chart

Your interpretation should be comprehensive and include:

1. **Ascendant (Lagna) Analysis**: The rising sign, its lord, and implications for personality, physical constitution (prakriti), and life direction
2. **Planetary Strengths & Dignities**: Exalted, own sign, debilitated planets and their effects. Note any combustion, retrograde motion, or planetary war (graha yuddha)
3. **Key Yogas**: Identify significant yogas (Raja Yoga, Dhana Yoga, Gajakesari, Viparita Raja Yoga, etc.) and their activation
4. **Moon & Mind**: The Moon's nakshatra, its lord, and influence on manas (mind), emotions, and mental patterns
5. **Current Dasha Analysis**: Deep analysis of the running Maha Dasha and Antar Dasha - what karmas are ripening and what opportunities/challenges to expect
6. **House Analysis**: Key houses and their significations based on planetary placements
7. **Spiritual Potential**: 5th house (purva punya), 9th house (dharma), 12th house (moksha) analysis

**Divisional Chart Analysis** (use the provided vargas):
- Analyze D9 (Navamsa) for marriage potential, spouse characteristics, and dharmic path
- Analyze D10 (Dasamsa) for career direction and professional success
- Analyze D20 (Vimsamsa) for spiritual inclinations and religious practices
- Analyze D60 (Shashtiamsa) for past life karmic patterns
- Cross-reference planet positions across vargas for Vargottama status (same sign in D1 and D9)
- Note any planets in own sign or exaltation across multiple vargas

Always provide:
- **Dietary Recommendations**: Ayurvedic dietary guidance based on the chart's elemental balance, Moon sign, and current dasha. Include foods to favor and avoid.
- **Sadhana Practices**: Specific spiritual practices including:
  - Mantras for planetary propitiation (with the specific mantra text)
  - Best days/times for practice based on the chart
  - Meditation or pranayama recommendations
  - Deity worship suggestions based on planetary strengths
  - Gemstone recommendations with cautions
  - Fasting days (vrata) if beneficial

Be insightful, specific, and practical. Acknowledge both strengths and challenges with equal care. Use traditional Sanskrit terminology but explain for modern seekers. Remember: the chart is a map, not a destiny - free will and sadhana can elevate any chart."""


def format_chart_for_interpretation(chart: dict, dasha: dict = None) -> str:
    """Format chart data into a readable prompt for the AI."""

    lines = ["## Birth Chart Data\n"]

    # Ascendant
    if 'ascendant' in chart:
        asc = chart['ascendant']
        lines.append(f"**Ascendant (Lagna)**: {asc.get('sign', 'Unknown')} at {asc.get('degree', 0):.2f}°")
        if asc.get('nakshatra'):
            lines.append(f"  - Nakshatra: {asc['nakshatra']['name']} (Pada {asc['nakshatra'].get('pada', 1)})")

    lines.append("\n### Planetary Positions\n")

    # Planets
    if 'planets' in chart:
        for planet_name, planet_data in chart['planets'].items():
            sign = planet_data.get('sign', 'Unknown')
            degree = planet_data.get('degree', 0)
            house = planet_data.get('house', 0)
            retrograde = " (R)" if planet_data.get('retrograde') else ""

            line = f"**{planet_name}**: {sign} at {degree:.2f}°{retrograde} - House {house}"

            # Add dignity if present
            dignity = planet_data.get('dignity')
            if dignity and dignity != 'neutral':
                line += f" [{dignity}]"

            lines.append(line)

            # Add nakshatra
            if planet_data.get('nakshatra'):
                nak = planet_data['nakshatra']
                lines.append(f"  - Nakshatra: {nak['name']} (Lord: {nak.get('lord', 'Unknown')})")

    # Houses (houses is a dict mapping house number to list of planets in that house)
    if 'houses' in chart:
        lines.append("\n### House Occupancy\n")
        for house_num in sorted(chart['houses'].keys(), key=lambda x: int(x)):
            planets_in_house = chart['houses'][house_num]
            if planets_in_house:
                lines.append(f"House {house_num}: {', '.join(planets_in_house)}")
            else:
                lines.append(f"House {house_num}: Empty")

    # Dasha periods
    if dasha:
        lines.append("\n### Vimshottari Dasha\n")

        if dasha.get('moon_nakshatra'):
            nak = dasha['moon_nakshatra']
            lines.append(f"Birth Nakshatra: {nak.get('name', 'Unknown')} (Lord: {nak.get('lord', 'Unknown')})")

        if dasha.get('current_maha_dasha'):
            md = dasha['current_maha_dasha']
            lines.append(f"\n**Current Maha Dasha**: {md.get('planet', 'Unknown')}")
            lines.append(f"  - Period: {md.get('start', '')} to {md.get('end', '')}")

        if dasha.get('current_antar_dasha'):
            ad = dasha['current_antar_dasha']
            lines.append(f"\n**Current Antar Dasha**: {ad.get('planet', 'Unknown')}")
            lines.append(f"  - Until: {ad.get('end', '')}")

    # Divisional Charts (Vargas)
    if 'vargas' in chart:
        lines.append("\n### Divisional Charts (Shodasavargas)\n")

        for varga_key in ['D1', 'D2', 'D3', 'D4', 'D7', 'D9', 'D10', 'D12', 'D16', 'D20', 'D24', 'D27', 'D30', 'D40', 'D45', 'D60']:
            varga = chart['vargas'].get(varga_key)
            if varga:
                lines.append(f"\n**{varga_key} - {varga['name']}** ({varga['description']})")

                # Show ascendant for this varga
                if varga.get('ascendant'):
                    asc = varga['ascendant']
                    lines.append(f"  Ascendant: {asc['sign']}")

                # Show planets with sign, house, and degree
                planet_positions = []
                for planet, data in varga['planets'].items():
                    pos_str = f"{planet}: {data['sign']}"
                    if 'house' in data:
                        pos_str += f" (H{data['house']})"
                    if 'natal_degree' in data:
                        pos_str += f" [{data['natal_degree']}°]"
                    planet_positions.append(pos_str)
                lines.append("  " + ", ".join(planet_positions))

        # Identify Vargottama planets (same sign in D1 and D9)
        if 'D1' in chart['vargas'] and 'D9' in chart['vargas']:
            vargottama = []
            d1 = chart['vargas']['D1']['planets']
            d9 = chart['vargas']['D9']['planets']
            for planet in d1:
                if planet in d9 and d1[planet]['sign'] == d9[planet]['sign']:
                    vargottama.append(f"{planet} ({d1[planet]['sign']})")
            if vargottama:
                lines.append(f"\n**Vargottama Planets** (same sign in D1 and D9 - extra strength):")
                lines.append("  " + ", ".join(vargottama))

    return "\n".join(lines)


def interpret_chart(chart: dict, dasha: dict = None) -> dict:
    """
    Use DeepSeek Reasoner to interpret the birth chart.

    Returns:
        dict with 'reasoning' (chain of thought) and 'interpretation' (final analysis)
    """

    chart_text = format_chart_for_interpretation(chart, dasha)

    messages = [
        {"role": "system", "content": INTERPRETATION_SYSTEM_PROMPT},
        {"role": "user", "content": f"Please interpret this Vedic birth chart:\n\n{chart_text}"}
    ]

    try:
        response = client.chat.completions.create(
            model="deepseek-reasoner",
            messages=messages,
            max_tokens=8192
        )

        message = response.choices[0].message

        return {
            "success": True,
            "reasoning": getattr(message, 'reasoning_content', None),
            "interpretation": message.content,
            "model": "deepseek-reasoner"
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "interpretation": None,
            "reasoning": None
        }


def chat_about_chart(chart: dict, dasha: dict, question: str, conversation_history: list = None) -> dict:
    """
    Have a follow-up conversation about the birth chart.

    Args:
        chart: The calculated birth chart with all vargas
        dasha: The dasha periods
        question: The user's follow-up question
        conversation_history: Previous messages in the conversation

    Returns:
        dict with 'response' and updated 'conversation_history'
    """

    chart_text = format_chart_for_interpretation(chart, dasha)

    chat_system_prompt = """You are a revered Vedic astrologer (Jyotishi) with 40+ years of experience. You have already provided an initial reading for this chart and the aspirant has follow-up questions.

You have access to the complete birth chart data including all 16 divisional charts (Shodasavargas). Answer questions specifically and insightfully based on the chart data provided.

Key guidelines:
- Be specific to THIS chart - reference actual planetary positions
- If asked about a specific divisional chart, analyze it in depth
- Provide practical, actionable guidance
- Use traditional Sanskrit terminology but explain clearly
- Be compassionate but honest about challenges
- If asked for remedies, provide specific mantras, practices, or recommendations

The chart data is provided below for reference."""

    messages = [
        {"role": "system", "content": f"{chat_system_prompt}\n\n{chart_text}"}
    ]

    # Add conversation history if provided
    if conversation_history:
        for msg in conversation_history:
            messages.append(msg)

    # Add the new question
    messages.append({"role": "user", "content": question})

    try:
        response = client.chat.completions.create(
            model="deepseek-reasoner",
            messages=messages,
            max_tokens=4096
        )

        assistant_message = response.choices[0].message
        response_text = assistant_message.content

        # Build updated conversation history
        new_history = conversation_history.copy() if conversation_history else []
        new_history.append({"role": "user", "content": question})
        new_history.append({"role": "assistant", "content": response_text})

        return {
            "success": True,
            "response": response_text,
            "reasoning": getattr(assistant_message, 'reasoning_content', None),
            "conversation_history": new_history
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "response": None,
            "conversation_history": conversation_history
        }


def interpret_chart_structured(chart: dict, dasha: dict = None) -> dict:
    """
    Get structured interpretation with specific sections.

    Returns JSON-structured analysis for easier frontend rendering.
    """

    chart_text = format_chart_for_interpretation(chart, dasha)

    structured_prompt = """Analyze this Vedic birth chart and provide a comprehensive structured interpretation as an expert Jyotishi.

Return your analysis as a JSON object with these sections:
{
    "summary": "A 2-3 sentence overview of the chart's key themes and the soul's journey in this lifetime",
    "personality": {
        "title": "Personality & Constitution",
        "content": "Detailed analysis of ascendant, its lord, Moon sign, and their combined influence on personality, physical constitution (prakriti - vata/pitta/kapha tendencies), and approach to life"
    },
    "strengths": {
        "title": "Strengths & Yogas",
        "content": "Identify and explain any significant yogas (Raja Yoga, Dhana Yoga, Gajakesari, etc.) and strong planetary placements. What gifts does this soul carry?"
    },
    "challenges": {
        "title": "Karmic Lessons",
        "content": "Challenging aspects, debilitated planets, difficult house placements. Frame these as growth opportunities and karmic lessons rather than problems"
    },
    "career": {
        "title": "Dharma & Purpose",
        "content": "10th house analysis, career inclinations, best professional paths based on planetary strengths. What is this soul meant to contribute?"
    },
    "current_period": {
        "title": "Current Dasha Analysis",
        "content": "Deep analysis of the current Maha Dasha and Antar Dasha. What karmas are ripening? What themes are active? Specific guidance for navigating this period"
    },
    "spirituality": {
        "title": "Spiritual Path",
        "content": "Analysis of 5th house (purva punya), 9th house (dharma/guru), 12th house (moksha). What spiritual practices suit this chart? Connection to past life spiritual work"
    },
    "diet": {
        "title": "Dietary Recommendations",
        "content": "Ayurvedic dietary guidance based on elemental balance, Moon sign, ascendant, and current dasha. Specific foods to favor and avoid. Best times to eat. Fasting recommendations (which days, why)"
    },
    "sadhana": {
        "title": "Sadhana & Remedies",
        "content": "Comprehensive spiritual practice recommendations including: specific mantras with Sanskrit text (like 'Om Namah Shivaya' or planet-specific mantras), recommended meditation techniques, pranayama practices, deity worship suggestions, gemstone recommendations with cautions, best days and times for practice (e.g., 'Practice Saturn mantra on Saturdays during Shani hora'), and any specific rituals or vratas"
    },
    "advice": {
        "title": "Guidance for the Path",
        "content": "Synthesized practical wisdom: what should the aspirant focus on now? Key life lessons? Remember to empower, not limit"
    }
}

Be deeply insightful and specific to THIS chart. Draw on traditional Jyotish wisdom. Include actual mantra texts where appropriate. Remember: you are guiding a sincere aspirant on their journey."""

    messages = [
        {"role": "system", "content": INTERPRETATION_SYSTEM_PROMPT},
        {"role": "user", "content": f"{structured_prompt}\n\nChart Data:\n{chart_text}"}
    ]

    try:
        response = client.chat.completions.create(
            model="deepseek-reasoner",
            messages=messages,
            max_tokens=8192
        )

        message = response.choices[0].message
        content = message.content

        # Try to parse JSON from response
        try:
            # Find JSON in the response (may be wrapped in markdown code blocks)
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                json_str = content.split("```")[1].split("```")[0].strip()
            else:
                json_str = content.strip()

            interpretation = json.loads(json_str)
        except (json.JSONDecodeError, IndexError):
            # If JSON parsing fails, return as unstructured
            interpretation = {"raw": content}

        return {
            "success": True,
            "reasoning": getattr(message, 'reasoning_content', None),
            "interpretation": interpretation,
            "model": "deepseek-reasoner"
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "interpretation": None,
            "reasoning": None
        }


SYNASTRY_SYSTEM_PROMPT = """You are a revered Vedic astrologer (Jyotishi) with 40+ years of experience specializing in relationship compatibility analysis (Kundali Milan). You have mastered the traditional methods of chart comparison including:

- **Ashtakoot Milan**: The 8-fold compatibility system (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi)
- **Synastry Aspects**: Inter-chart planetary aspects and their effects on relationship dynamics
- **House Overlays**: Where one person's planets fall in another's houses
- **Navamsa Analysis**: D9 comparison for dharmic compatibility and long-term potential
- **Dasha Compatibility**: How timing periods interact between charts

Your analysis should be:
- **Balanced**: Acknowledge both harmony and challenges
- **Practical**: Provide actionable insights for improving the relationship
- **Compassionate**: Remember that no relationship is "doomed" - awareness and effort can transform challenges
- **Specific**: Reference actual planetary positions and aspects from the charts provided

For each pair of charts, identify:
1. Natural points of attraction and harmony
2. Areas of potential friction or misunderstanding
3. Karmic connections (Rahu/Ketu, Saturn aspects)
4. Emotional compatibility (Moon aspects)
5. Romantic/physical chemistry (Venus/Mars)
6. Mental compatibility (Mercury aspects)
7. Spiritual growth potential together

Always provide remedial suggestions where challenges exist."""


def format_synastry_for_interpretation(synastry_data: dict, charts: list, labels: list) -> str:
    """Format synastry data into a readable prompt for the AI."""

    lines = ["## Synastry Analysis Data\n"]

    # Individual chart summaries
    lines.append("### Individual Charts\n")
    for person in synastry_data['people']:
        lines.append(f"**{person['label']}**:")
        lines.append(f"  - Ascendant: {person['ascendant']}")
        lines.append(f"  - Sun: {person['sun_sign']}")
        lines.append(f"  - Moon: {person['moon_sign']} ({person['moon_nakshatra']})")
        lines.append("")

    # Detailed planetary positions for each person
    lines.append("### Detailed Planetary Positions\n")
    for chart, label in zip(charts, labels):
        lines.append(f"**{label}'s Planets:**")
        for planet, data in chart['planets'].items():
            retro = " (R)" if data.get('retrograde') else ""
            lines.append(f"  - {planet}: {data['sign']} {data['degree']:.1f}°{retro} (House {data['house']})")
        lines.append("")

    # Pair analyses
    for pair in synastry_data['pair_analyses']:
        lines.append(f"\n### {pair['pair']} Compatibility\n")
        lines.append(f"**Compatibility Score**: {pair['compatibility_score']}/100\n")

        summary = pair['aspect_summary']
        lines.append(f"**Aspect Summary**: {summary['total']} total aspects")
        lines.append(f"  - Harmonious: {summary['harmonious']}")
        lines.append(f"  - Challenging: {summary['challenging']}")
        lines.append(f"  - Romantic: {summary['romantic']}")
        lines.append(f"  - Karmic: {summary['karmic']}")

        # Key aspects
        if pair['romantic_aspects']:
            lines.append("\n**Key Romantic Aspects:**")
            for asp in pair['romantic_aspects'][:5]:
                lines.append(f"  - {asp['person1']}'s {asp['planet1']} {asp['aspect']} {asp['person2']}'s {asp['planet2']} (orb: {asp['orb']}°)")

        if pair['harmonious_aspects']:
            lines.append("\n**Harmonious Aspects:**")
            for asp in pair['harmonious_aspects'][:5]:
                lines.append(f"  - {asp['person1']}'s {asp['planet1']} {asp['aspect']} {asp['person2']}'s {asp['planet2']}")

        if pair['challenging_aspects']:
            lines.append("\n**Challenging Aspects:**")
            for asp in pair['challenging_aspects'][:5]:
                lines.append(f"  - {asp['person1']}'s {asp['planet1']} {asp['aspect']} {asp['person2']}'s {asp['planet2']}")

        if pair['karmic_aspects']:
            lines.append("\n**Karmic Connections:**")
            for asp in pair['karmic_aspects'][:5]:
                lines.append(f"  - {asp['person1']}'s {asp['planet1']} {asp['aspect']} {asp['person2']}'s {asp['planet2']}")

        # House overlays
        lines.append("\n**House Overlays:**")
        for person_label, overlays in pair['house_overlays'].items():
            other_label = [l for l in labels if l != person_label][0] if len(labels) == 2 else "partner"
            lines.append(f"  {person_label}'s planets in {other_label}'s houses:")
            for planet, data in overlays.items():
                lines.append(f"    - {planet} ({data['sign']}) -> House {data['house_in_partner']}")

    # Group summary
    if synastry_data['group_summary']['num_people'] > 2:
        gs = synastry_data['group_summary']
        lines.append(f"\n### Group Dynamic Summary\n")
        lines.append(f"**{gs['num_people']} people, {gs['num_pairs']} pair relationships**")
        lines.append(f"Average Compatibility: {gs['average_compatibility']}%")
        lines.append(f"Total Harmonious Aspects: {gs['total_harmonious_aspects']}")
        lines.append(f"Total Challenging Aspects: {gs['total_challenging_aspects']}")

    return "\n".join(lines)


def interpret_synastry(synastry_data: dict, charts: list, labels: list) -> dict:
    """
    Use DeepSeek Reasoner to interpret synastry between multiple charts.

    Args:
        synastry_data: Calculated synastry aspects and overlays
        charts: List of individual birth charts
        labels: List of names/labels for each person

    Returns:
        dict with interpretation and reasoning
    """

    synastry_text = format_synastry_for_interpretation(synastry_data, charts, labels)

    num_people = len(charts)
    if num_people == 2:
        prompt = f"""Please analyze this synastry (relationship compatibility) between {labels[0]} and {labels[1]}.

{synastry_text}

Provide a comprehensive Vedic astrology relationship analysis including:
1. Overall compatibility assessment
2. Emotional and mental connection (Moon and Mercury aspects)
3. Romantic and physical chemistry (Venus and Mars dynamics)
4. Communication patterns
5. Potential areas of conflict and how to navigate them
6. Karmic purpose of this connection
7. Long-term potential
8. Specific remedies or practices to strengthen the relationship

Return your analysis as a JSON object with this structure:
{{
    "summary": "2-3 sentence overview of the relationship dynamic",
    "compatibility_rating": "A descriptive rating like 'Highly Compatible', 'Compatible with Effort', 'Challenging but Transformative', etc.",
    "emotional_connection": {{
        "title": "Emotional Bond",
        "content": "Analysis of Moon connections, emotional needs, nurturing patterns"
    }},
    "romantic_chemistry": {{
        "title": "Romantic & Physical Chemistry",
        "content": "Venus-Mars dynamics, attraction patterns, passion indicators"
    }},
    "mental_compatibility": {{
        "title": "Mental Connection",
        "content": "Mercury aspects, communication styles, intellectual rapport"
    }},
    "strengths": {{
        "title": "Relationship Strengths",
        "content": "What works naturally between these two souls"
    }},
    "challenges": {{
        "title": "Growth Areas",
        "content": "Potential friction points and how to transform them"
    }},
    "karmic_connection": {{
        "title": "Karmic Purpose",
        "content": "What these souls are meant to learn from each other"
    }},
    "remedies": {{
        "title": "Relationship Remedies",
        "content": "Specific practices, mantras, or guidance to strengthen the bond"
    }},
    "advice": {{
        "title": "Guidance for the Relationship",
        "content": "Practical wisdom for nurturing this connection"
    }}
}}"""
    else:
        # Multi-person (3-4 people) analysis
        names = ", ".join(labels[:-1]) + f" and {labels[-1]}"
        prompt = f"""Please analyze this group synastry between {names} ({num_people} people).

{synastry_text}

Provide a comprehensive Vedic astrology group compatibility analysis. For each pair, assess their dynamic. Then provide an overall group dynamic analysis.

Return your analysis as a JSON object with this structure:
{{
    "summary": "Overview of the group dynamic and how these souls interact",
    "pair_analyses": [
        {{
            "pair": "Name1 & Name2",
            "compatibility": "Brief compatibility description",
            "strengths": "What works between them",
            "challenges": "Growth areas",
            "advice": "Key guidance"
        }}
    ],
    "group_dynamic": {{
        "title": "Group Energy",
        "content": "How the group functions as a whole, leadership patterns, potential conflicts"
    }},
    "best_combinations": {{
        "title": "Strongest Bonds",
        "content": "Which pairings have the most natural harmony"
    }},
    "growth_opportunities": {{
        "title": "Collective Growth",
        "content": "What can this group achieve or learn together"
    }},
    "advice": {{
        "title": "Guidance for the Group",
        "content": "How to maintain harmony and support each other's growth"
    }}
}}"""

    messages = [
        {"role": "system", "content": SYNASTRY_SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]

    try:
        response = client.chat.completions.create(
            model="deepseek-reasoner",
            messages=messages,
            max_tokens=8192
        )

        message = response.choices[0].message
        content = message.content

        # Try to parse JSON from response
        try:
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                json_str = content.split("```")[1].split("```")[0].strip()
            else:
                json_str = content.strip()

            interpretation = json.loads(json_str)
        except (json.JSONDecodeError, IndexError):
            interpretation = {"raw": content}

        return {
            "success": True,
            "reasoning": getattr(message, 'reasoning_content', None),
            "interpretation": interpretation,
            "synastry_data": synastry_data,
            "model": "deepseek-reasoner"
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "interpretation": None,
            "synastry_data": synastry_data,
            "reasoning": None
        }