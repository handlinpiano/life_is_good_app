"""
Vedic Astrology Chart Calculator using Swiss Ephemeris.
All calculations done offline - no external APIs needed.
"""

import swisseph as swe
from datetime import datetime
from typing import Dict, Any, List
import pytz
from timezonefinder import TimezoneFinder

# Initialize timezone finder (uses bundled data, no API needed)
tf = TimezoneFinder()

# Zodiac signs
SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

# 27 Nakshatras (lunar mansions)
NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
    'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
]

# Nakshatra lords for Vimshottari Dasha
NAKSHATRA_LORDS = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
    'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun',
    'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
    'Jupiter', 'Saturn', 'Mercury'
]

# Planet IDs in Swiss Ephemeris
PLANETS = {
    'Sun': swe.SUN,
    'Moon': swe.MOON,
    'Mars': swe.MARS,
    'Mercury': swe.MERCURY,
    'Jupiter': swe.JUPITER,
    'Venus': swe.VENUS,
    'Saturn': swe.SATURN,
    'Rahu': swe.MEAN_NODE,  # Mean North Node
}

# Planetary Dignities in Vedic Astrology
PLANET_DIGNITIES = {
    'Sun': {
        'own': ['Leo'],
        'exalted': 'Aries',
        'exalted_degree': 10,
        'debilitated': 'Libra',
        'mooltrikona': {'sign': 'Leo', 'start': 0, 'end': 20},
        'friends': ['Moon', 'Mars', 'Jupiter'],
        'enemies': ['Venus', 'Saturn'],
        'neutrals': ['Mercury']
    },
    'Moon': {
        'own': ['Cancer'],
        'exalted': 'Taurus',
        'exalted_degree': 3,
        'debilitated': 'Scorpio',
        'mooltrikona': {'sign': 'Cancer', 'start': 4, 'end': 30},
        'friends': ['Sun', 'Mercury'],
        'enemies': [],
        'neutrals': ['Mars', 'Jupiter', 'Venus', 'Saturn']
    },
    'Mars': {
        'own': ['Aries', 'Scorpio'],
        'exalted': 'Capricorn',
        'exalted_degree': 28,
        'debilitated': 'Cancer',
        'mooltrikona': {'sign': 'Aries', 'start': 0, 'end': 12},
        'friends': ['Sun', 'Moon', 'Jupiter'],
        'enemies': ['Mercury'],
        'neutrals': ['Venus', 'Saturn']
    },
    'Mercury': {
        'own': ['Gemini', 'Virgo'],
        'exalted': 'Virgo',
        'exalted_degree': 15,
        'debilitated': 'Pisces',
        'mooltrikona': {'sign': 'Virgo', 'start': 15, 'end': 20},
        'friends': ['Sun', 'Venus'],
        'enemies': ['Moon'],
        'neutrals': ['Mars', 'Jupiter', 'Saturn']
    },
    'Jupiter': {
        'own': ['Sagittarius', 'Pisces'],
        'exalted': 'Cancer',
        'exalted_degree': 5,
        'debilitated': 'Capricorn',
        'mooltrikona': {'sign': 'Sagittarius', 'start': 0, 'end': 10},
        'friends': ['Sun', 'Moon', 'Mars'],
        'enemies': ['Mercury', 'Venus'],
        'neutrals': ['Saturn']
    },
    'Venus': {
        'own': ['Taurus', 'Libra'],
        'exalted': 'Pisces',
        'exalted_degree': 27,
        'debilitated': 'Virgo',
        'mooltrikona': {'sign': 'Libra', 'start': 0, 'end': 15},
        'friends': ['Mercury', 'Saturn'],
        'enemies': ['Sun', 'Moon'],
        'neutrals': ['Mars', 'Jupiter']
    },
    'Saturn': {
        'own': ['Capricorn', 'Aquarius'],
        'exalted': 'Libra',
        'exalted_degree': 20,
        'debilitated': 'Aries',
        'mooltrikona': {'sign': 'Aquarius', 'start': 0, 'end': 20},
        'friends': ['Mercury', 'Venus'],
        'enemies': ['Sun', 'Moon', 'Mars'],
        'neutrals': ['Jupiter']
    },
    'Rahu': {
        'own': [],
        'exalted': 'Gemini',
        'exalted_degree': 20,
        'debilitated': 'Sagittarius',
        'mooltrikona': {},
        'friends': ['Mercury', 'Venus', 'Saturn'],
        'enemies': ['Sun', 'Moon', 'Mars'],
        'neutrals': ['Jupiter']
    },
    'Ketu': {
        'own': [],
        'exalted': 'Sagittarius',
        'exalted_degree': 20,
        'debilitated': 'Gemini',
        'mooltrikona': {},
        'friends': ['Mercury', 'Venus', 'Saturn'],
        'enemies': ['Sun', 'Moon', 'Mars'],
        'neutrals': ['Jupiter']
    }
}


def get_timezone_from_coordinates(latitude: float, longitude: float) -> str:
    """Get timezone string from coordinates (offline lookup)."""
    tz_name = tf.timezone_at(lat=latitude, lng=longitude)
    return tz_name or 'UTC'


def local_to_utc(year: int, month: int, day: int, hour: int, minute: int,
                  latitude: float, longitude: float) -> datetime:
    """Convert local time to UTC based on coordinates."""
    tz_name = get_timezone_from_coordinates(latitude, longitude)
    tz = pytz.timezone(tz_name)
    local_dt = tz.localize(datetime(year, month, day, hour, minute))
    return local_dt.astimezone(pytz.UTC)


def calculate_julian_day(utc_dt: datetime) -> float:
    """Convert UTC datetime to Julian Day number."""
    hour_decimal = utc_dt.hour + utc_dt.minute / 60 + utc_dt.second / 3600
    return swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, hour_decimal)


def get_nakshatra(longitude: float) -> Dict[str, Any]:
    """Calculate nakshatra from longitude."""
    nakshatra_span = 360 / 27  # 13°20' each
    nakshatra_idx = int(longitude / nakshatra_span)
    pada = int((longitude % nakshatra_span) / (nakshatra_span / 4)) + 1

    return {
        'name': NAKSHATRAS[nakshatra_idx],
        'pada': pada,
        'lord': NAKSHATRA_LORDS[nakshatra_idx]
    }


def calculate_tithi(sun_lon: float, moon_lon: float) -> Dict[str, Any]:
    """
    Calculate Tithi (Lunar Day).
    Tithi is based on the angular distance between Moon and Sun (Moon - Sun).
    Each Tithi is 12 degrees.
    """
    diff = (moon_lon - sun_lon) % 360
    tithi_num = int(diff / 12) + 1
    
    # Paksha (Fortnight)
    if tithi_num <= 15:
        paksha = "Shukla" # Waxing
        display_num = tithi_num
    else:
        paksha = "Krishna" # Waning
        display_num = tithi_num - 15
        
    tithi_names = [
        "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
        "Shashti", "Saptami", "Ashtami", "Navami", "Dashami",
        "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", 
        "Purnima" if paksha == "Shukla" else "Amavasya"
    ]
    
    # Handle the 15th/30th index carefully
    name_idx = display_num - 1
    tithi_name = tithi_names[name_idx]
    
    return {
        'number': tithi_num,
        'name': f"{paksha} {tithi_name}",
        'paksha': paksha,
        'special': 'Ekadashi' if tithi_name == 'Ekadashi' else None
    }


def calculate_dignity(planet_name: str, sign: str, degree: float) -> Dict[str, Any]:
    """Returns {'dignity': str, 'strength': int, 'description': str}"""
    if planet_name not in PLANET_DIGNITIES:
        return {'dignity': 'Neutral', 'strength': 1, 'description': 'No dignity data available'}

    dignity_data = PLANET_DIGNITIES[planet_name]

    # Check exalted
    if sign == dignity_data['exalted'] and abs(degree - dignity_data['exalted_degree']) < 2:
        return {'dignity': 'Exalted', 'strength': 5, 'description': f'Strongly exalted in {sign} at {degree}° (ideal: {dignity_data["exalted_degree"]}°)'}

    # Check mooltrikona
    if dignity_data['mooltrikona'] and sign == dignity_data['mooltrikona']['sign']:
        if dignity_data['mooltrikona']['start'] <= degree <= dignity_data['mooltrikona']['end']:
            return {'dignity': 'Mooltrikona', 'strength': 4, 'description': f'In mooltrikona sign {sign} ({dignity_data["mooltrikona"]["start"]}°-{dignity_data["mooltrikona"]["end"]}°)'}

    # Check own sign
    if sign in dignity_data['own']:
        return {'dignity': 'Own Sign', 'strength': 3, 'description': f'In own sign {sign}'}

    # Check debilitated
    if sign == dignity_data['debilitated']:
        return {'dignity': 'Debilitated', 'strength': -3, 'description': f'Debilitated in {sign}'}

    # Check friends/enemies
    friends = dignity_data.get('friends', [])
    enemies = dignity_data.get('enemies', [])
    neutrals = dignity_data.get('neutrals', [])

    # For simplicity, we'll consider signs ruled by friends as friendly, etc.
    # In a full implementation, this would be more complex
    sign_ruler = get_sign_ruler(sign)
    if sign_ruler in friends:
        return {'dignity': 'Friend\'s Sign', 'strength': 2, 'description': f'In {sign_ruler}\'s sign ({sign}) - friendly placement'}
    elif sign_ruler in enemies:
        return {'dignity': 'Enemy\'s Sign', 'strength': -1, 'description': f'In {sign_ruler}\'s sign ({sign}) - enemy placement'}
    else:
        return {'dignity': 'Neutral', 'strength': 1, 'description': f'In {sign_ruler}\'s sign ({sign}) - neutral placement'}


def get_sign_ruler(sign: str) -> str:
    """Get the ruling planet of a zodiac sign."""
    rulers = {
        'Aries': 'Mars',
        'Taurus': 'Venus',
        'Gemini': 'Mercury',
        'Cancer': 'Moon',
        'Leo': 'Sun',
        'Virgo': 'Mercury',
        'Libra': 'Venus',
        'Scorpio': 'Mars',
        'Sagittarius': 'Jupiter',
        'Capricorn': 'Saturn',
        'Aquarius': 'Saturn',
        'Pisces': 'Jupiter'
    }
    return rulers.get(sign, '')


def calculate_chart(year: int, month: int, day: int, hour: int, minute: int,
                    latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Calculate complete Vedic birth chart.

    Args:
        year, month, day: Birth date
        hour, minute: Birth time (local time)
        latitude, longitude: Birth place coordinates

    Returns:
        Dictionary containing all chart data
    """
    # Convert to UTC
    utc_dt = local_to_utc(year, month, day, hour, minute, latitude, longitude)
    jd = calculate_julian_day(utc_dt)

    # Set Lahiri Ayanamsa (most commonly used in Vedic astrology)
    swe.set_sid_mode(swe.SIDM_LAHIRI)

    # Get ayanamsa value for reference
    ayanamsa = swe.get_ayanamsa(jd)

    # Calculate planetary positions
    planets = {}
    for name, planet_id in PLANETS.items():
        result = swe.calc_ut(jd, planet_id, swe.FLG_SIDEREAL)
        lon = result[0][0]
        speed = result[0][3]

        sign_idx = int(lon // 30)
        degree_in_sign = lon % 30

        sign = SIGNS[sign_idx]
        degree = round(degree_in_sign, 2)

        planets[name] = {
            'longitude': round(lon, 4),
            'sign': sign,
            'sign_num': sign_idx + 1,
            'degree': degree,
            'nakshatra': get_nakshatra(lon),
            'retrograde': speed < 0,
            'dignity': calculate_dignity(name, sign, degree)
        }

    # Calculate Ketu (always opposite to Rahu)
    rahu_lon = planets['Rahu']['longitude']
    ketu_lon = (rahu_lon + 180) % 360
    ketu_sign_idx = int(ketu_lon // 30)

    ketu_sign = SIGNS[ketu_sign_idx]
    ketu_degree = round(ketu_lon % 30, 2)

    planets['Ketu'] = {
        'longitude': round(ketu_lon, 4),
        'sign': ketu_sign,
        'sign_num': ketu_sign_idx + 1,
        'degree': ketu_degree,
        'nakshatra': get_nakshatra(ketu_lon),
        'retrograde': True,  # Rahu/Ketu always retrograde
        'dignity': calculate_dignity('Ketu', ketu_sign, ketu_degree)
    }

    # Calculate Ascendant (Lagna) and house cusps
    # Using whole sign houses (most common in Vedic)
    houses = swe.houses_ex(jd, latitude, longitude, b'W', swe.FLG_SIDEREAL)
    ascendant_lon = houses[1][0]
    asc_sign_idx = int(ascendant_lon // 30)

    ascendant = {
        'longitude': round(ascendant_lon, 4),
        'sign': SIGNS[asc_sign_idx],
        'sign_num': asc_sign_idx + 1,
        'degree': round(ascendant_lon % 30, 2),
        'nakshatra': get_nakshatra(ascendant_lon)
    }

    # Calculate house positions for each planet
    for planet_name, planet_data in planets.items():
        planet_sign = planet_data['sign_num']
        house = ((planet_sign - ascendant['sign_num']) % 12) + 1
        planet_data['house'] = house

    # Build house occupancy map (string keys for JSON/Pydantic compatibility)
    house_occupancy = {str(i): [] for i in range(1, 13)}
    for planet_name, planet_data in planets.items():
        house_occupancy[str(planet_data['house'])].append(planet_name)

    return {
        'ascendant': ascendant,
        'planets': planets,
        'houses': house_occupancy,
        'ayanamsa': round(ayanamsa, 4),
        'ayanamsa_type': 'Lahiri',
        'birth_data': {
            'date': f"{year}-{month:02d}-{day:02d}",
            'time': f"{hour:02d}:{minute:02d}",
            'timezone': get_timezone_from_coordinates(latitude, longitude),
            'latitude': latitude,
            'longitude': longitude
        }
    }


# =============================================================================
# DIVISIONAL CHART (VARGA) CALCULATIONS
# =============================================================================

# Varga metadata
VARGA_INFO = {
    'D1': {'name': 'Rasi', 'division': 1, 'description': 'Main birth chart - overall life'},
    'D2': {'name': 'Hora', 'division': 2, 'description': 'Wealth and finances'},
    'D3': {'name': 'Drekkana', 'division': 3, 'description': 'Siblings and courage'},
    'D4': {'name': 'Chaturthamsa', 'division': 4, 'description': 'Fortune and property'},
    'D7': {'name': 'Saptamsa', 'division': 7, 'description': 'Children and progeny'},
    'D9': {'name': 'Navamsa', 'division': 9, 'description': 'Marriage and dharma'},
    'D10': {'name': 'Dasamsa', 'division': 10, 'description': 'Career and profession'},
    'D12': {'name': 'Dwadasamsa', 'division': 12, 'description': 'Parents and ancestry'},
    'D16': {'name': 'Shodasamsa', 'division': 16, 'description': 'Vehicles and comforts'},
    'D20': {'name': 'Vimsamsa', 'division': 20, 'description': 'Spiritual progress'},
    'D24': {'name': 'Chaturvimsamsa', 'division': 24, 'description': 'Learning and education'},
    'D27': {'name': 'Saptavimsamsa', 'division': 27, 'description': 'Strengths and weaknesses'},
    'D30': {'name': 'Trimsamsa', 'division': 30, 'description': 'Evils and misfortunes'},
    'D40': {'name': 'Khavedamsa', 'division': 40, 'description': 'Auspicious effects'},
    'D45': {'name': 'Akshavedamsa', 'division': 45, 'description': 'General indications'},
    'D60': {'name': 'Shashtiamsa', 'division': 60, 'description': 'Past life karma'},
}


def calculate_d1_rasi(chart: Dict[str, Any]) -> Dict[str, Any]:
    """D1 - Rasi chart (main birth chart). Just returns the natal positions."""
    return {
        planet_name: {
            'sign': planet_data['sign'],
            'sign_num': planet_data['sign_num']
        }
        for planet_name, planet_data in chart['planets'].items()
    }


def calculate_d2_hora(chart: Dict[str, Any]) -> Dict[str, Any]:
    """
    D2 - Hora chart for wealth.
    Each sign divided into 2 parts of 15° each.
    Odd signs: 0-15° = Sun (Leo), 15-30° = Moon (Cancer)
    Even signs: 0-15° = Moon (Cancer), 15-30° = Sun (Leo)
    """
    hora = {}
    for planet_name, planet_data in chart['planets'].items():
        degree = planet_data['degree']
        sign_num = planet_data['sign_num']
        is_odd_sign = sign_num % 2 == 1

        if degree < 15:
            # First half
            hora_sign = 'Leo' if is_odd_sign else 'Cancer'
        else:
            # Second half
            hora_sign = 'Cancer' if is_odd_sign else 'Leo'

        hora[planet_name] = {
            'sign': hora_sign,
            'sign_num': SIGNS.index(hora_sign) + 1
        }
    return hora


def calculate_d3_drekkana(chart: Dict[str, Any]) -> Dict[str, Any]:
    """
    D3 - Drekkana chart for siblings and courage.
    Each sign divided into 3 parts of 10° each.
    1st drekkana (0-10°): Same sign
    2nd drekkana (10-20°): 5th sign from it
    3rd drekkana (20-30°): 9th sign from it
    """
    drekkana = {}
    for planet_name, planet_data in chart['planets'].items():
        degree = planet_data['degree']
        sign_idx = planet_data['sign_num'] - 1

        if degree < 10:
            drekkana_sign_idx = sign_idx
        elif degree < 20:
            drekkana_sign_idx = (sign_idx + 4) % 12  # 5th from (0-indexed + 4)
        else:
            drekkana_sign_idx = (sign_idx + 8) % 12  # 9th from (0-indexed + 8)

        drekkana[planet_name] = {
            'sign': SIGNS[drekkana_sign_idx],
            'sign_num': drekkana_sign_idx + 1
        }
    return drekkana


def calculate_d4_chaturthamsa(chart: Dict[str, Any]) -> Dict[str, Any]:
    """
    D4 - Chaturthamsa chart for fortune and property.
    Each sign divided into 4 parts of 7.5° each.
    Movable signs (1,4,7,10): Start from same sign
    Fixed signs (2,5,8,11): Start from 4th sign
    Dual signs (3,6,9,12): Start from 7th sign
    """
    chaturthamsa = {}
    for planet_name, planet_data in chart['planets'].items():
        degree = planet_data['degree']
        sign_idx = planet_data['sign_num'] - 1
        part = int(degree / 7.5)

        # Determine sign type (0-indexed)
        if sign_idx % 3 == 0:  # Movable: Aries, Cancer, Libra, Capricorn
            start_idx = sign_idx
        elif sign_idx % 3 == 1:  # Fixed: Taurus, Leo, Scorpio, Aquarius
            start_idx = (sign_idx + 3) % 12
        else:  # Dual: Gemini, Virgo, Sagittarius, Pisces
            start_idx = (sign_idx + 6) % 12

        result_idx = (start_idx + part) % 12

        chaturthamsa[planet_name] = {
            'sign': SIGNS[result_idx],
            'sign_num': result_idx + 1
        }
    return chaturthamsa


def calculate_d7_saptamsa(chart: Dict[str, Any]) -> Dict[str, Any]:
    """
    D7 - Saptamsa chart for children.
    Each sign divided into 7 parts of 4°17'8.57" each.
    Odd signs: Start from same sign
    Even signs: Start from 7th sign
    """
    saptamsa = {}
    for planet_name, planet_data in chart['planets'].items():
        degree = planet_data['degree']
        sign_idx = planet_data['sign_num'] - 1
        part = int(degree / (30 / 7))
        is_odd = sign_idx % 2 == 0  # 0-indexed, so even index = odd sign

        if is_odd:
            start_idx = sign_idx
        else:
            start_idx = (sign_idx + 6) % 12  # 7th from

        result_idx = (start_idx + part) % 12

        saptamsa[planet_name] = {
            'sign': SIGNS[result_idx],
            'sign_num': result_idx + 1
        }
    return saptamsa


def calculate_navamsa(chart: Dict[str, Any]) -> Dict[str, Any]:
    """
    D9 - Navamsa chart for marriage and dharma.
    Each sign divided into 9 parts of 3°20' each.
    Fire signs (Aries, Leo, Sag): Start from Aries
    Earth signs (Taurus, Virgo, Cap): Start from Capricorn
    Air signs (Gemini, Libra, Aqua): Start from Libra
    Water signs (Cancer, Scorpio, Pisces): Start from Cancer
    """
    navamsa = {}

    for planet_name, planet_data in chart['planets'].items():
        lon = planet_data['longitude']
        navamsa_num = int((lon % 30) / (30 / 9))
        sign_idx = planet_data['sign_num'] - 1

        if sign_idx % 4 == 0:  # Fire signs start from Aries
            navamsa_sign_idx = navamsa_num
        elif sign_idx % 4 == 1:  # Earth signs start from Capricorn
            navamsa_sign_idx = (9 + navamsa_num) % 12
        elif sign_idx % 4 == 2:  # Air signs start from Libra
            navamsa_sign_idx = (6 + navamsa_num) % 12
        else:  # Water signs start from Cancer
            navamsa_sign_idx = (3 + navamsa_num) % 12

        navamsa[planet_name] = {
            'sign': SIGNS[navamsa_sign_idx],
            'sign_num': navamsa_sign_idx + 1
        }

    return navamsa


def calculate_d10_dasamsa(chart: Dict[str, Any]) -> Dict[str, Any]:
    """
    D10 - Dasamsa chart for career.
    Each sign divided into 10 parts of 3° each.
    Odd signs: Start from same sign
    Even signs: Start from 9th sign
    """
    dasamsa = {}
    for planet_name, planet_data in chart['planets'].items():
        degree = planet_data['degree']
        sign_idx = planet_data['sign_num'] - 1
        part = int(degree / 3)
        is_odd = sign_idx % 2 == 0

        if is_odd:
            start_idx = sign_idx
        else:
            start_idx = (sign_idx + 8) % 12  # 9th from

        result_idx = (start_idx + part) % 12

        dasamsa[planet_name] = {
            'sign': SIGNS[result_idx],
            'sign_num': result_idx + 1
        }
    return dasamsa


def calculate_d12_dwadasamsa(chart: Dict[str, Any]) -> Dict[str, Any]:
    """
    D12 - Dwadasamsa chart for parents.
    Each sign divided into 12 parts of 2.5° each.
    Always starts from same sign and cycles through all 12.
    """
    dwadasamsa = {}
    for planet_name, planet_data in chart['planets'].items():
        degree = planet_data['degree']
        sign_idx = planet_data['sign_num'] - 1
        part = int(degree / 2.5)

        result_idx = (sign_idx + part) % 12

        dwadasamsa[planet_name] = {
            'sign': SIGNS[result_idx],
            'sign_num': result_idx + 1
        }
    return dwadasamsa


def calculate_d16_shodasamsa(chart: Dict[str, Any]) -> Dict[str, Any]:
    """
    D16 - Shodasamsa chart for vehicles and comforts.
    Each sign divided into 16 parts of 1°52'30" each.
    Movable signs: Start from Aries
    Fixed signs: Start from Leo
    Dual signs: Start from Sagittarius
    """
    shodasamsa = {}
    for planet_name, planet_data in chart['planets'].items():
        degree = planet_data['degree']
        sign_idx = planet_data['sign_num'] - 1
        part = int(degree / (30 / 16))

        if sign_idx % 3 == 0:  # Movable
            start_idx = 0  # Aries
        elif sign_idx % 3 == 1:  # Fixed
            start_idx = 4  # Leo
        else:  # Dual
            start_idx = 8  # Sagittarius

        result_idx = (start_idx + part) % 12

        shodasamsa[planet_name] = {
            'sign': SIGNS[result_idx],
            'sign_num': result_idx + 1
        }
    return shodasamsa


def calculate_d20_vimsamsa(chart: Dict[str, Any]) -> Dict[str, Any]:
    """
    D20 - Vimsamsa chart for spiritual progress.
    Each sign divided into 20 parts of 1.5° each.
    Movable signs: Start from Aries
    Fixed signs: Start from Sagittarius
    Dual signs: Start from Leo
    """
    vimsamsa = {}
    for planet_name, planet_data in chart['planets'].items():
        degree = planet_data['degree']
        sign_idx = planet_data['sign_num'] - 1
        part = int(degree / 1.5)

        if sign_idx % 3 == 0:  # Movable
            start_idx = 0  # Aries
        elif sign_idx % 3 == 1:  # Fixed
            start_idx = 8  # Sagittarius
        else:  # Dual
            start_idx = 4  # Leo

        result_idx = (start_idx + part) % 12

        vimsamsa[planet_name] = {
            'sign': SIGNS[result_idx],
            'sign_num': result_idx + 1
        }
    return vimsamsa


def calculate_d24_chaturvimsamsa(chart: Dict[str, Any]) -> Dict[str, Any]:
    """
    D24 - Chaturvimsamsa chart for learning and education.
    Each sign divided into 24 parts of 1.25° each.
    Odd signs: Start from Leo
    Even signs: Start from Cancer
    """
    chaturvimsamsa = {}
    for planet_name, planet_data in chart['planets'].items():
        degree = planet_data['degree']
        sign_idx = planet_data['sign_num'] - 1
        part = int(degree / 1.25)
        is_odd = sign_idx % 2 == 0

        if is_odd:
            start_idx = 4  # Leo
        else:
            start_idx = 3  # Cancer

        result_idx = (start_idx + part) % 12

        chaturvimsamsa[planet_name] = {
            'sign': SIGNS[result_idx],
            'sign_num': result_idx + 1
        }
    return chaturvimsamsa


def calculate_d27_saptavimsamsa(chart: Dict[str, Any]) -> Dict[str, Any]:
    """
    D27 - Saptavimsamsa (Bhamsa) chart for strengths/weaknesses.
    Each sign divided into 27 parts of 1°6'40" each.
    Fire signs: Start from Aries
    Earth signs: Start from Cancer
    Air signs: Start from Libra
    Water signs: Start from Capricorn
    """
    saptavimsamsa = {}
    for planet_name, planet_data in chart['planets'].items():
        degree = planet_data['degree']
        sign_idx = planet_data['sign_num'] - 1
        part = int(degree / (30 / 27))

        element = sign_idx % 4
        if element == 0:  # Fire
            start_idx = 0  # Aries
        elif element == 1:  # Earth
            start_idx = 3  # Cancer
        elif element == 2:  # Air
            start_idx = 6  # Libra
        else:  # Water
            start_idx = 9  # Capricorn

        result_idx = (start_idx + part) % 12

        saptavimsamsa[planet_name] = {
            'sign': SIGNS[result_idx],
            'sign_num': result_idx + 1
        }
    return saptavimsamsa


def calculate_d30_trimsamsa(chart: Dict[str, Any]) -> Dict[str, Any]:
    """
    D30 - Trimsamsa chart for evils and misfortunes.
    Uses unequal divisions based on planetary rulerships.
    Odd signs: Mars(5°), Saturn(5°), Jupiter(8°), Mercury(7°), Venus(5°)
    Even signs: Venus(5°), Mercury(7°), Jupiter(8°), Saturn(5°), Mars(5°)
    """
    # Trimsamsa lords and their signs
    odd_rulers = [
        (5, 'Mars', 'Aries'),
        (5, 'Saturn', 'Aquarius'),
        (8, 'Jupiter', 'Sagittarius'),
        (7, 'Mercury', 'Gemini'),
        (5, 'Venus', 'Libra')
    ]
    even_rulers = [
        (5, 'Venus', 'Taurus'),
        (7, 'Mercury', 'Virgo'),
        (8, 'Jupiter', 'Pisces'),
        (5, 'Saturn', 'Capricorn'),
        (5, 'Mars', 'Scorpio')
    ]

    trimsamsa = {}
    for planet_name, planet_data in chart['planets'].items():
        degree = planet_data['degree']
        sign_idx = planet_data['sign_num'] - 1
        is_odd = sign_idx % 2 == 0

        rulers = odd_rulers if is_odd else even_rulers
        cumulative = 0
        result_sign = rulers[-1][2]  # Default to last

        for span, lord, sign in rulers:
            cumulative += span
            if degree < cumulative:
                result_sign = sign
                break

        trimsamsa[planet_name] = {
            'sign': result_sign,
            'sign_num': SIGNS.index(result_sign) + 1
        }
    return trimsamsa


def calculate_d40_khavedamsa(chart: Dict[str, Any]) -> Dict[str, Any]:
    """
    D40 - Khavedamsa chart for auspicious effects.
    Each sign divided into 40 parts of 0.75° each.
    Odd signs: Start from Aries
    Even signs: Start from Libra
    """
    khavedamsa = {}
    for planet_name, planet_data in chart['planets'].items():
        degree = planet_data['degree']
        sign_idx = planet_data['sign_num'] - 1
        part = int(degree / 0.75)
        is_odd = sign_idx % 2 == 0

        if is_odd:
            start_idx = 0  # Aries
        else:
            start_idx = 6  # Libra

        result_idx = (start_idx + part) % 12

        khavedamsa[planet_name] = {
            'sign': SIGNS[result_idx],
            'sign_num': result_idx + 1
        }
    return khavedamsa


def calculate_d45_akshavedamsa(chart: Dict[str, Any]) -> Dict[str, Any]:
    """
    D45 - Akshavedamsa chart for general indications.
    Each sign divided into 45 parts of 0.667° each.
    Movable signs: Start from Aries
    Fixed signs: Start from Leo
    Dual signs: Start from Sagittarius
    """
    akshavedamsa = {}
    for planet_name, planet_data in chart['planets'].items():
        degree = planet_data['degree']
        sign_idx = planet_data['sign_num'] - 1
        part = int(degree / (30 / 45))

        if sign_idx % 3 == 0:  # Movable
            start_idx = 0  # Aries
        elif sign_idx % 3 == 1:  # Fixed
            start_idx = 4  # Leo
        else:  # Dual
            start_idx = 8  # Sagittarius

        result_idx = (start_idx + part) % 12

        akshavedamsa[planet_name] = {
            'sign': SIGNS[result_idx],
            'sign_num': result_idx + 1
        }
    return akshavedamsa


def calculate_d60_shashtiamsa(chart: Dict[str, Any]) -> Dict[str, Any]:
    """
    D60 - Shashtiamsa chart for past life karma.
    Each sign divided into 60 parts of 0.5° each.
    Odd signs: Start from Aries
    Even signs: Start from Libra
    """
    shashtiamsa = {}
    for planet_name, planet_data in chart['planets'].items():
        degree = planet_data['degree']
        sign_idx = planet_data['sign_num'] - 1
        part = int(degree / 0.5)
        is_odd = sign_idx % 2 == 0

        if is_odd:
            start_idx = 0  # Aries
        else:
            start_idx = 6  # Libra

        result_idx = (start_idx + part) % 12

        shashtiamsa[planet_name] = {
            'sign': SIGNS[result_idx],
            'sign_num': result_idx + 1
        }
    return shashtiamsa


def calculate_varga_ascendant(asc_lon: float, asc_sign_idx: int, division: int, varga_key: str) -> Dict[str, Any]:
    """Calculate the ascendant position in a divisional chart."""
    degree = asc_lon % 30

    # Use the same logic as planet calculations for each varga
    if varga_key == 'D1':
        result_idx = asc_sign_idx
    elif varga_key == 'D2':
        # Hora: odd signs 0-15=Sun(Leo), 15-30=Moon(Cancer)
        is_odd = asc_sign_idx % 2 == 0
        result_idx = 4 if (degree < 15) == is_odd else 3  # Leo=4, Cancer=3
    elif varga_key == 'D3':
        part = int(degree / 10)
        if part == 0:
            result_idx = asc_sign_idx
        elif part == 1:
            result_idx = (asc_sign_idx + 4) % 12
        else:
            result_idx = (asc_sign_idx + 8) % 12
    elif varga_key == 'D4':
        part = int(degree / 7.5)
        if asc_sign_idx % 3 == 0:
            start_idx = asc_sign_idx
        elif asc_sign_idx % 3 == 1:
            start_idx = (asc_sign_idx + 3) % 12
        else:
            start_idx = (asc_sign_idx + 6) % 12
        result_idx = (start_idx + part) % 12
    elif varga_key == 'D7':
        part = int(degree / (30 / 7))
        is_odd = asc_sign_idx % 2 == 0
        start_idx = asc_sign_idx if is_odd else (asc_sign_idx + 6) % 12
        result_idx = (start_idx + part) % 12
    elif varga_key == 'D9':
        navamsa_num = int(degree / (30 / 9))
        if asc_sign_idx % 4 == 0:
            result_idx = navamsa_num
        elif asc_sign_idx % 4 == 1:
            result_idx = (9 + navamsa_num) % 12
        elif asc_sign_idx % 4 == 2:
            result_idx = (6 + navamsa_num) % 12
        else:
            result_idx = (3 + navamsa_num) % 12
    elif varga_key == 'D10':
        part = int(degree / 3)
        is_odd = asc_sign_idx % 2 == 0
        start_idx = asc_sign_idx if is_odd else (asc_sign_idx + 8) % 12
        result_idx = (start_idx + part) % 12
    elif varga_key == 'D12':
        part = int(degree / 2.5)
        result_idx = (asc_sign_idx + part) % 12
    elif varga_key == 'D16':
        part = int(degree / (30 / 16))
        if asc_sign_idx % 3 == 0:
            start_idx = 0
        elif asc_sign_idx % 3 == 1:
            start_idx = 4
        else:
            start_idx = 8
        result_idx = (start_idx + part) % 12
    elif varga_key == 'D20':
        part = int(degree / 1.5)
        if asc_sign_idx % 3 == 0:
            start_idx = 0
        elif asc_sign_idx % 3 == 1:
            start_idx = 8
        else:
            start_idx = 4
        result_idx = (start_idx + part) % 12
    elif varga_key == 'D24':
        part = int(degree / 1.25)
        is_odd = asc_sign_idx % 2 == 0
        start_idx = 4 if is_odd else 3
        result_idx = (start_idx + part) % 12
    elif varga_key == 'D27':
        part = int(degree / (30 / 27))
        element = asc_sign_idx % 4
        if element == 0:
            start_idx = 0
        elif element == 1:
            start_idx = 3
        elif element == 2:
            start_idx = 6
        else:
            start_idx = 9
        result_idx = (start_idx + part) % 12
    elif varga_key == 'D30':
        # Trimsamsa uses unequal divisions - simplified
        is_odd = asc_sign_idx % 2 == 0
        if is_odd:
            if degree < 5: result_idx = 0
            elif degree < 10: result_idx = 10
            elif degree < 18: result_idx = 8
            elif degree < 25: result_idx = 2
            else: result_idx = 6
        else:
            if degree < 5: result_idx = 1
            elif degree < 12: result_idx = 5
            elif degree < 20: result_idx = 11
            elif degree < 25: result_idx = 9
            else: result_idx = 7
    elif varga_key == 'D40':
        part = int(degree / 0.75)
        is_odd = asc_sign_idx % 2 == 0
        start_idx = 0 if is_odd else 6
        result_idx = (start_idx + part) % 12
    elif varga_key == 'D45':
        part = int(degree / (30 / 45))
        if asc_sign_idx % 3 == 0:
            start_idx = 0
        elif asc_sign_idx % 3 == 1:
            start_idx = 4
        else:
            start_idx = 8
        result_idx = (start_idx + part) % 12
    elif varga_key == 'D60':
        part = int(degree / 0.5)
        is_odd = asc_sign_idx % 2 == 0
        start_idx = 0 if is_odd else 6
        result_idx = (start_idx + part) % 12
    else:
        result_idx = asc_sign_idx

    return {
        'sign': SIGNS[result_idx],
        'sign_num': result_idx + 1
    }


def calculate_all_vargas(chart: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate all 16 divisional charts with full planet data including houses."""
    varga_calculators = {
        'D1': calculate_d1_rasi,
        'D2': calculate_d2_hora,
        'D3': calculate_d3_drekkana,
        'D4': calculate_d4_chaturthamsa,
        'D7': calculate_d7_saptamsa,
        'D9': calculate_navamsa,
        'D10': calculate_d10_dasamsa,
        'D12': calculate_d12_dwadasamsa,
        'D16': calculate_d16_shodasamsa,
        'D20': calculate_d20_vimsamsa,
        'D24': calculate_d24_chaturvimsamsa,
        'D27': calculate_d27_saptavimsamsa,
        'D30': calculate_d30_trimsamsa,
        'D40': calculate_d40_khavedamsa,
        'D45': calculate_d45_akshavedamsa,
        'D60': calculate_d60_shashtiamsa,
    }

    # Get ascendant info for house calculations
    asc_lon = chart['ascendant']['longitude']
    asc_sign_idx = chart['ascendant']['sign_num'] - 1

    vargas = {}
    for varga_key, info in VARGA_INFO.items():
        calculator = varga_calculators.get(varga_key)
        if calculator:
            # Get basic planet positions
            planets = calculator(chart)

            # Calculate varga ascendant
            varga_asc = calculate_varga_ascendant(asc_lon, asc_sign_idx, info['division'], varga_key)

            # Add house positions to each planet based on varga ascendant
            for planet_name, planet_data in planets.items():
                planet_sign_num = planet_data['sign_num']
                varga_asc_sign_num = varga_asc['sign_num']
                # House = planet's sign position relative to ascendant sign
                house = ((planet_sign_num - varga_asc_sign_num + 12) % 12) + 1
                planet_data['house'] = house

                # Add original degree from D1 chart for reference
                if planet_name in chart['planets']:
                    planet_data['natal_degree'] = round(chart['planets'][planet_name]['degree'], 2)

            vargas[varga_key] = {
                'name': info['name'],
                'description': info['description'],
                'ascendant': varga_asc,
                'planets': planets
            }

    return vargas


# =============================================================================
# VIMSHOTTARI DASHA CALCULATIONS
# =============================================================================

# Dasha periods in years (total = 120 years)
DASHA_YEARS = {
    'Ketu': 7,
    'Venus': 20,
    'Sun': 6,
    'Moon': 10,
    'Mars': 7,
    'Rahu': 18,
    'Jupiter': 16,
    'Saturn': 19,
    'Mercury': 17,
}

# Fixed sequence of Dasha lords
DASHA_SEQUENCE = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']


def calculate_dasha_balance(moon_longitude: float) -> tuple:
    """
    Calculate which dasha is running at birth and how much is remaining.

    Args:
        moon_longitude: Moon's sidereal longitude (0-360)

    Returns:
        (dasha_lord, years_remaining, nakshatra_name)
    """
    nakshatra_span = 360 / 27  # 13°20' = 13.333... degrees
    nakshatra_idx = int(moon_longitude / nakshatra_span)
    nakshatra_name = NAKSHATRAS[nakshatra_idx]

    # Position within nakshatra (0 to 1)
    pos_in_nakshatra = (moon_longitude % nakshatra_span) / nakshatra_span

    # The lord of the nakshatra determines starting dasha
    dasha_lord = NAKSHATRA_LORDS[nakshatra_idx]
    total_years = DASHA_YEARS[dasha_lord]

    # Remaining portion of the dasha at birth
    remaining_fraction = 1 - pos_in_nakshatra
    years_remaining = total_years * remaining_fraction

    return dasha_lord, years_remaining, nakshatra_name


def calculate_maha_dasha(birth_date: datetime, moon_longitude: float) -> list:
    """
    Calculate all Maha Dasha periods for a lifetime.

    Args:
        birth_date: Birth datetime
        moon_longitude: Moon's sidereal longitude

    Returns:
        List of dasha periods with start/end dates
    """
    from datetime import timedelta

    starting_lord, balance_years, _ = calculate_dasha_balance(moon_longitude)

    # Find starting position in sequence
    start_idx = DASHA_SEQUENCE.index(starting_lord)

    periods = []
    current_date = birth_date

    # First period (partial - balance at birth)
    days = balance_years * 365.25
    end_date = current_date + timedelta(days=days)
    periods.append({
        'planet': starting_lord,
        'start': current_date.isoformat(),
        'end': end_date.isoformat(),
        'years': round(balance_years, 2),
        'is_balance': True,
    })
    current_date = end_date

    # Subsequent full periods (cycle through sequence)
    for i in range(1, 10):  # Complete one full 120-year cycle
        idx = (start_idx + i) % 9
        planet = DASHA_SEQUENCE[idx]
        years = DASHA_YEARS[planet]
        days = years * 365.25
        end_date = current_date + timedelta(days=days)

        periods.append({
            'planet': planet,
            'start': current_date.isoformat(),
            'end': end_date.isoformat(),
            'years': years,
            'is_balance': False,
        })
        current_date = end_date

    return periods


def calculate_antar_dasha(maha_dasha: dict) -> list:
    """
    Calculate Antar Dasha (sub-periods) within a Maha Dasha.

    Each Maha Dasha is divided proportionally among all 9 planets,
    starting from the Maha Dasha lord.
    """
    from datetime import timedelta

    maha_planet = maha_dasha['planet']
    maha_start = datetime.fromisoformat(maha_dasha['start'])
    maha_years = maha_dasha['years']

    # Start sequence from Maha Dasha lord
    start_idx = DASHA_SEQUENCE.index(maha_planet)

    antar_periods = []
    current_date = maha_start

    for i in range(9):
        idx = (start_idx + i) % 9
        planet = DASHA_SEQUENCE[idx]

        # Antar Dasha proportion: (planet_years / 120) * maha_years
        antar_years = (DASHA_YEARS[planet] / 120) * maha_years
        days = antar_years * 365.25
        end_date = current_date + timedelta(days=days)

        antar_periods.append({
            'planet': planet,
            'start': current_date.isoformat(),
            'end': end_date.isoformat(),
            'years': round(antar_years, 3),
        })
        current_date = end_date

    return antar_periods


def get_current_dasha(maha_dashas: list) -> dict:
    """
    Find the current Maha Dasha and Antar Dasha based on today's date.
    """
    now = datetime.now(pytz.UTC)

    current_maha = None
    for md in maha_dashas:
        start = datetime.fromisoformat(md['start']).astimezone(pytz.UTC)
        end = datetime.fromisoformat(md['end']).astimezone(pytz.UTC)
        if start <= now <= end:
            current_maha = md
            break

    if not current_maha:
        return {'current_maha': None, 'current_antar': None}

    # Calculate Antar Dasha for current Maha Dasha
    antars = calculate_antar_dasha(current_maha)

    current_antar = None
    for ad in antars:
        start = datetime.fromisoformat(ad['start']).astimezone(pytz.UTC)
        end = datetime.fromisoformat(ad['end']).astimezone(pytz.UTC)
        if start <= now <= end:
            current_antar = ad
            break

    return {
        'current_maha': current_maha,
        'current_antar': current_antar,
        'all_antars': antars,
    }


def calculate_dasha(year: int, month: int, day: int, hour: int, minute: int,
                    latitude: float, longitude: float) -> dict:
    """
    Calculate complete Vimshottari Dasha for a birth chart.

    Returns:
        Dictionary with all Maha Dasha periods and current running dashas
    """
    # Get Moon's position
    utc_dt = local_to_utc(year, month, day, hour, minute, latitude, longitude)
    jd = calculate_julian_day(utc_dt)
    swe.set_sid_mode(swe.SIDM_LAHIRI)

    moon_result = swe.calc_ut(jd, swe.MOON, swe.FLG_SIDEREAL)
    moon_lon = moon_result[0][0]

    # Birth datetime for calculations
    tz_name = get_timezone_from_coordinates(latitude, longitude)
    tz = pytz.timezone(tz_name)
    birth_date = tz.localize(datetime(year, month, day, hour, minute))

    # Calculate all Maha Dasha periods
    maha_dashas = calculate_maha_dasha(birth_date, moon_lon)

    # Get current running dashas
    current = get_current_dasha(maha_dashas)

    # Get Moon's nakshatra info
    nakshatra = get_nakshatra(moon_lon)

    return {
        'moon_nakshatra': nakshatra,
        'moon_longitude': round(moon_lon, 4),
        'maha_dashas': maha_dashas,
        'current_maha_dasha': current['current_maha'],
        'current_antar_dasha': current['current_antar'],
        'current_antar_dashas': current.get('all_antars', []),
    }


# =============================================================================
# SYNASTRY CALCULATIONS
# =============================================================================

# Synastry aspects and their significance
SYNASTRY_ASPECTS = {
    0: {'name': 'Conjunction', 'orb': 8, 'nature': 'powerful', 'description': 'Fusion of energies'},
    60: {'name': 'Sextile', 'orb': 4, 'nature': 'harmonious', 'description': 'Opportunity and flow'},
    90: {'name': 'Square', 'orb': 6, 'nature': 'challenging', 'description': 'Tension and growth'},
    120: {'name': 'Trine', 'orb': 6, 'nature': 'harmonious', 'description': 'Natural harmony'},
    180: {'name': 'Opposition', 'orb': 8, 'nature': 'challenging', 'description': 'Polarity and balance'},
}

# Important synastry combinations
SYNASTRY_SIGNIFICATORS = {
    'romantic': ['Venus', 'Mars', 'Moon', 'Sun'],
    'emotional': ['Moon', 'Venus', 'Jupiter'],
    'mental': ['Mercury', 'Jupiter'],
    'karmic': ['Saturn', 'Rahu', 'Ketu'],
    'spiritual': ['Jupiter', 'Ketu', 'Sun'],
}


def calculate_aspect(lon1: float, lon2: float) -> Dict[str, Any]:
    """Calculate the aspect between two planetary longitudes."""
    diff = abs(lon1 - lon2)
    if diff > 180:
        diff = 360 - diff

    for angle, aspect_info in SYNASTRY_ASPECTS.items():
        if abs(diff - angle) <= aspect_info['orb']:
            return {
                'aspect': aspect_info['name'],
                'angle': round(diff, 2),
                'exact_angle': angle,
                'orb': round(abs(diff - angle), 2),
                'nature': aspect_info['nature'],
                'description': aspect_info['description'],
            }

    return None


def calculate_house_overlay(planet_lon: float, other_ascendant: Dict[str, Any]) -> int:
    """Calculate which house a planet falls into in another person's chart."""
    planet_sign = int(planet_lon // 30) + 1
    asc_sign = other_ascendant['sign_num']
    house = ((planet_sign - asc_sign + 12) % 12) + 1
    return house


def calculate_synastry_pair(chart1: Dict[str, Any], chart2: Dict[str, Any],
                            label1: str, label2: str) -> Dict[str, Any]:
    """Calculate synastry aspects between two charts."""
    aspects = []
    house_overlays = {label1: {}, label2: {}}

    planets1 = chart1['planets']
    planets2 = chart2['planets']

    # Calculate inter-aspects
    for p1_name, p1_data in planets1.items():
        for p2_name, p2_data in planets2.items():
            aspect = calculate_aspect(p1_data['longitude'], p2_data['longitude'])
            if aspect:
                aspects.append({
                    'planet1': p1_name,
                    'person1': label1,
                    'planet2': p2_name,
                    'person2': label2,
                    **aspect
                })

        # Calculate house overlay: where person1's planets fall in person2's houses
        house = calculate_house_overlay(p1_data['longitude'], chart2['ascendant'])
        house_overlays[label1][p1_name] = {
            'house_in_partner': house,
            'sign': p1_data['sign'],
        }

    # Calculate house overlay: where person2's planets fall in person1's houses
    for p2_name, p2_data in planets2.items():
        house = calculate_house_overlay(p2_data['longitude'], chart1['ascendant'])
        house_overlays[label2][p2_name] = {
            'house_in_partner': house,
            'sign': p2_data['sign'],
        }

    # Categorize aspects by significance
    romantic_aspects = []
    challenging_aspects = []
    harmonious_aspects = []
    karmic_aspects = []

    for asp in aspects:
        p1, p2 = asp['planet1'], asp['planet2']

        # Check if romantic significators
        if p1 in SYNASTRY_SIGNIFICATORS['romantic'] or p2 in SYNASTRY_SIGNIFICATORS['romantic']:
            romantic_aspects.append(asp)

        # Check if karmic
        if p1 in SYNASTRY_SIGNIFICATORS['karmic'] or p2 in SYNASTRY_SIGNIFICATORS['karmic']:
            karmic_aspects.append(asp)

        # Categorize by nature
        if asp['nature'] == 'harmonious':
            harmonious_aspects.append(asp)
        elif asp['nature'] == 'challenging':
            challenging_aspects.append(asp)

    # Calculate compatibility score (simplified)
    harmony_score = len(harmonious_aspects) * 10
    challenge_score = len(challenging_aspects) * 5
    romantic_bonus = len(romantic_aspects) * 5
    base_score = 50 + harmony_score - challenge_score + romantic_bonus
    compatibility_score = max(0, min(100, base_score))

    return {
        'pair': f"{label1} & {label2}",
        'all_aspects': sorted(aspects, key=lambda x: x['orb']),
        'romantic_aspects': romantic_aspects,
        'harmonious_aspects': harmonious_aspects,
        'challenging_aspects': challenging_aspects,
        'karmic_aspects': karmic_aspects,
        'house_overlays': house_overlays,
        'compatibility_score': compatibility_score,
        'aspect_summary': {
            'total': len(aspects),
            'harmonious': len(harmonious_aspects),
            'challenging': len(challenging_aspects),
            'romantic': len(romantic_aspects),
            'karmic': len(karmic_aspects),
        }
    }


def calculate_synastry(charts: List[Dict[str, Any]], labels: List[str]) -> Dict[str, Any]:
    """
    Calculate synastry for multiple people (2-4).

    Args:
        charts: List of calculated birth charts
        labels: List of labels/names for each person

    Returns:
        Complete synastry analysis with all pair comparisons
    """
    from itertools import combinations

    pair_analyses = []

    # Calculate synastry for each unique pair
    for (i, chart1), (j, chart2) in combinations(enumerate(charts), 2):
        pair_analysis = calculate_synastry_pair(
            chart1, chart2,
            labels[i], labels[j]
        )
        pair_analyses.append(pair_analysis)

    # Summary across all pairs
    total_harmony = sum(p['aspect_summary']['harmonious'] for p in pair_analyses)
    total_challenge = sum(p['aspect_summary']['challenging'] for p in pair_analyses)
    avg_compatibility = sum(p['compatibility_score'] for p in pair_analyses) / len(pair_analyses)

    # Individual summaries
    individual_summaries = []
    for i, (chart, label) in enumerate(zip(charts, labels)):
        individual_summaries.append({
            'label': label,
            'ascendant': chart['ascendant']['sign'],
            'sun_sign': chart['planets']['Sun']['sign'],
            'moon_sign': chart['planets']['Moon']['sign'],
            'moon_nakshatra': chart['planets']['Moon']['nakshatra']['name'],
        })

    return {
        'people': individual_summaries,
        'pair_analyses': pair_analyses,
        'group_summary': {
            'total_harmonious_aspects': total_harmony,
            'total_challenging_aspects': total_challenge,
            'average_compatibility': round(avg_compatibility, 1),
            'num_people': len(charts),
            'num_pairs': len(pair_analyses),
        }
    }


# =============================================================================
# DAILY ALIGNMENT / PANCHANG CALCULATIONS
# =============================================================================

# Weekday rulers in Vedic astrology
WEEKDAY_LORDS = {
    0: {'name': 'Sunday', 'lord': 'Sun', 'sanskrit': 'Ravivara'},
    1: {'name': 'Monday', 'lord': 'Moon', 'sanskrit': 'Somavara'},
    2: {'name': 'Tuesday', 'lord': 'Mars', 'sanskrit': 'Mangalavara'},
    3: {'name': 'Wednesday', 'lord': 'Mercury', 'sanskrit': 'Budhavara'},
    4: {'name': 'Thursday', 'lord': 'Jupiter', 'sanskrit': 'Guruvara'},
    5: {'name': 'Friday', 'lord': 'Venus', 'sanskrit': 'Shukravara'},
    6: {'name': 'Saturday', 'lord': 'Saturn', 'sanskrit': 'Shanivara'},
}

# Yoga (Sun-Moon combination) names
YOGAS = [
    'Vishkumbha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
    'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva',
    'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan',
    'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla',
    'Brahma', 'Indra', 'Vaidhriti'
]

# Karana (half-tithi) names
KARANAS = [
    'Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti',
    'Shakuni', 'Chatushpada', 'Naga', 'Kimstughna'
]


def calculate_yoga(sun_lon: float, moon_lon: float) -> Dict[str, Any]:
    """Calculate Yoga (Sun + Moon longitude combination)."""
    total = (sun_lon + moon_lon) % 360
    yoga_idx = int(total / (360 / 27))
    return {
        'number': yoga_idx + 1,
        'name': YOGAS[yoga_idx]
    }


def calculate_karana(sun_lon: float, moon_lon: float) -> Dict[str, Any]:
    """Calculate Karana (half of a tithi)."""
    diff = (moon_lon - sun_lon) % 360
    karana_num = int(diff / 6) + 1  # Each karana is 6 degrees

    # First 4 karanas are fixed (Kimstughna, Shakuni, Chatushpada, Naga)
    # appear only once at specific positions. Rest cycle through 7.
    if karana_num == 1:
        karana_name = 'Kimstughna'
    elif karana_num in [57, 58, 59, 60]:
        fixed_karanas = ['Shakuni', 'Chatushpada', 'Naga', 'Kimstughna']
        karana_name = fixed_karanas[karana_num - 57]
    else:
        # Cycle through the 7 repeating karanas
        cycle_idx = (karana_num - 2) % 7
        karana_name = KARANAS[cycle_idx]

    return {
        'number': karana_num,
        'name': karana_name
    }


def calculate_current_alignment(year: int, month: int, day: int, hour: int, minute: int,
                                  latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Calculate current cosmic alignment (Panchang) for daily guidance.

    This provides the five elements of Panchang:
    1. Tithi (Lunar day)
    2. Nakshatra (Moon's constellation)
    3. Yoga (Sun-Moon combination)
    4. Karana (Half-tithi)
    5. Vara (Weekday)

    Plus current transit positions for all planets.
    """
    # Convert to UTC and get Julian Day
    utc_dt = local_to_utc(year, month, day, hour, minute, latitude, longitude)
    jd = calculate_julian_day(utc_dt)

    # Set Lahiri Ayanamsa
    swe.set_sid_mode(swe.SIDM_LAHIRI)

    # Get Sun and Moon positions (needed for Tithi, Yoga, Karana)
    sun_result = swe.calc_ut(jd, swe.SUN, swe.FLG_SIDEREAL)
    moon_result = swe.calc_ut(jd, swe.MOON, swe.FLG_SIDEREAL)

    sun_lon = sun_result[0][0]
    moon_lon = moon_result[0][0]

    # Calculate Panchang elements
    tithi = calculate_tithi(sun_lon, moon_lon)
    moon_nakshatra = get_nakshatra(moon_lon)
    yoga = calculate_yoga(sun_lon, moon_lon)
    karana = calculate_karana(sun_lon, moon_lon)

    # Get weekday
    weekday_idx = datetime(year, month, day).weekday()
    # Python: Monday=0, but Vedic: Sunday=0, so adjust
    vedic_weekday = (weekday_idx + 1) % 7
    vara = WEEKDAY_LORDS[vedic_weekday]

    # Calculate all transit positions
    transits = {}
    for name, planet_id in PLANETS.items():
        result = swe.calc_ut(jd, planet_id, swe.FLG_SIDEREAL)
        lon = result[0][0]
        speed = result[0][3]
        sign_idx = int(lon // 30)

        transits[name] = {
            'longitude': round(lon, 4),
            'sign': SIGNS[sign_idx],
            'sign_num': sign_idx + 1,
            'degree': round(lon % 30, 2),
            'nakshatra': get_nakshatra(lon),
            'retrograde': speed < 0
        }

    # Add Ketu
    ketu_lon = (transits['Rahu']['longitude'] + 180) % 360
    ketu_sign_idx = int(ketu_lon // 30)
    transits['Ketu'] = {
        'longitude': round(ketu_lon, 4),
        'sign': SIGNS[ketu_sign_idx],
        'sign_num': ketu_sign_idx + 1,
        'degree': round(ketu_lon % 30, 2),
        'nakshatra': get_nakshatra(ketu_lon),
        'retrograde': True
    }

    return {
        'tithi': tithi,
        'moon_nakshatra': moon_nakshatra,
        'yoga': yoga,
        'karana': karana,
        'vara': vara,
        'transits': transits,
        'sun_sign': transits['Sun']['sign'],
        'moon_sign': transits['Moon']['sign'],
        'datetime': {
            'date': f"{year}-{month:02d}-{day:02d}",
            'time': f"{hour:02d}:{minute:02d}",
            'timezone': get_timezone_from_coordinates(latitude, longitude)
        }
    }
