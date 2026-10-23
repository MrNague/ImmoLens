import base64
from datetime import datetime
from html import escape
from pathlib import Path

import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st


# ============================================================
# Configuration
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
ICON_PATH = BASE_DIR / "immoLens_Icon.png"
REFERENCE_YEAR = datetime.now().year

st.set_page_config(
    page_title="ImmoLens",
    page_icon=str(ICON_PATH) if ICON_PATH.is_file() else None,
    layout="wide",
    initial_sidebar_state="auto",
)


# ============================================================
# Styles
# ============================================================

st.markdown(
    """
<style>
    * {
        font-family: 'Times New Roman', Times, serif !important;
    }

    .material-symbols-rounded,
    [data-testid="stIconMaterial"] {
        font-family: 'Material Symbols Rounded' !important;
        font-weight: 400;
        font-style: normal;
        letter-spacing: normal;
        text-transform: none;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        font-feature-settings: 'liga';
        -webkit-font-feature-settings: 'liga';
        -webkit-font-smoothing: antialiased;
    }

    .immo-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        vertical-align: middle;
        line-height: 1;
    }

    .brand-header {
        display: flex;
        align-items: center;
        gap: 18px;
        padding-bottom: 16px;
        margin-bottom: 12px;
        border-bottom: 2px solid #3498db;
    }

    .brand-header-logo {
        width: 88px;
        height: 88px;
        object-fit: contain;
        flex-shrink: 0;
    }

    .brand-header h1 {
        margin: 0;
        padding: 0;
        color: #243649;
        font-size: clamp(1.6rem, 3vw, 3rem);
        font-weight: 700;
        line-height: 1.15;
        overflow-wrap: anywhere;
    }

    .sub-header {
        margin-top: 8px;
        color: #64748b;
        font-size: 1.15rem;
        line-height: 1.5;
    }

    .sidebar-brand {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 8px 0 24px;
        text-align: center;
    }

    .sidebar-brand-logo {
        width: 140px;
        height: 140px;
        object-fit: contain;
    }

    .sidebar-brand-name {
        margin-top: 8px;
        color: #243649;
        font-size: 1.6rem;
        font-weight: 700;
    }

    .sidebar-brand-description {
        margin-top: 3px;
        color: #64748b;
        font-size: 0.95rem;
    }

    .icon-heading,
    .field-label {
        display: flex;
        align-items: center;
        gap: 9px;
        color: #243649;
    }

    .icon-heading {
        margin: 18px 0 12px;
        font-size: 1.35rem;
        font-weight: 700;
    }

    .field-label {
        margin: 10px 0 6px;
        font-size: 0.98rem;
        font-weight: 600;
    }

    .price-card {
        min-width: 0;
        min-height: 180px;
        height: 100%;
        padding: 22px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        box-shadow: 0 6px 22px rgba(0, 0, 0, 0.04);
    }

    .price-label {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 12px;
        color: #64748b;
        font-size: 0.9rem;
        line-height: 1.4;
    }

    .price-value {
        margin: 0;
        color: #243649;
        font-size: clamp(1.8rem, 2.8vw, 3rem);
        font-weight: 700;
        line-height: 1.2;
        overflow-wrap: anywhere;
    }

    .price-unit {
        display: inline-block;
        margin-left: 6px;
        color: #64748b;
        font-size: 1rem;
        font-weight: 400;
    }

    .card-note {
        margin-top: 10px;
        color: #64748b;
        font-size: 0.9rem;
    }

    .feature-card,
    .recommendation-card {
        margin: 8px 0;
        padding: 15px;
        color: #243649;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow-wrap: anywhere;
    }

    .recommendation-card {
        border-left: 4px solid #3498db;
    }

    .recommendation-title {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-bottom: 7px;
    }

    .feature-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    }

    .feature-name {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .custom-divider {
        height: 1px;
        margin: 24px 0;
        background: linear-gradient(
            90deg, transparent, #cbd5e0, transparent
        );
    }

    .stButton > button {
        min-height: 46px;
        padding: 10px 20px;
        color: white;
        background: #243649;
        border: none;
        border-radius: 9px;
        font-weight: 600;
    }

    .stButton > button:hover {
        color: white;
        background: #34495e;
    }

    .confidence-bar {
        width: 100%;
        height: 6px;
        margin: 12px 0 6px;
        background: #ecf0f1;
        border-radius: 3px;
    }

    .confidence-fill {
        height: 6px;
        background: #3498db;
        border-radius: 3px;
    }

    .footer {
        margin-top: 30px;
        padding: 22px 0;
        color: #64748b;
        text-align: center;
        border-top: 1px solid #e2e8f0;
    }

    .footer-name {
        color: #243649;
        font-size: 1.1rem;
        font-weight: 700;
    }

    .footer-signature {
        margin-top: 4px;
        font-size: 0.85rem;
    }

    [data-testid="stColumn"] {
        min-width: 0;
    }

    @media (max-width: 767px) {
        [data-testid="stMain"] .block-container {
            padding: 2rem 1rem;
        }

        [data-testid="stMain"] [data-testid="stHorizontalBlock"] {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem !important;
        }

        [data-testid="stMain"] [data-testid="stColumn"] {
            width: 100% !important;
            flex: 1 1 100% !important;
            min-width: 0 !important;
        }

        .brand-header {
            gap: 12px;
            padding-bottom: 14px;
        }

        .brand-header-logo {
            width: 62px;
            height: 62px;
        }

        .brand-header h1 {
            font-size: 1.6rem;
        }

        .sub-header {
            font-size: 1rem;
        }

        .price-card {
            min-height: auto;
            padding: 20px;
        }

        .price-value {
            font-size: 2.2rem;
        }

        .icon-heading {
            font-size: 1.2rem;
        }

        .sidebar-brand {
            padding-bottom: 18px;
        }

        .sidebar-brand-logo {
            width: 110px;
            height: 110px;
        }
    }
</style>
""",
    unsafe_allow_html=True,
)


# ============================================================
# Affichage
# ============================================================

def icon(name, size=22, color="#3498db"):
    return (
        '<span class="material-symbols-rounded immo-icon" '
        'aria-hidden="true" '
        f'style="font-size:{int(size)}px;'
        f'color:{escape(color, quote=True)};">'
        f"{escape(name)}</span>"
    )


def logo_html(css_class):
    if not ICON_PATH.is_file():
        return icon("home", 54, "#243649")

    encoded_image = base64.b64encode(
        ICON_PATH.read_bytes()
    ).decode("ascii")

    return (
        f'<img class="{escape(css_class, quote=True)}" '
        f'src="data:image/png;base64,{encoded_image}" '
        'alt="ImmoLens">'
    )


def section_title(label, symbol):
    st.markdown(
        '<h3 class="icon-heading">'
        f"{icon(symbol, 24)}"
        f"<span>{escape(label)}</span>"
        "</h3>",
        unsafe_allow_html=True,
    )


def field_label(label, symbol):
    st.markdown(
        '<div class="field-label">'
        f"{icon(symbol, 20)}"
        f"<span>{escape(label)}</span>"
        "</div>",
        unsafe_allow_html=True,
    )


def checkbox_with_icon(label, symbol, key):
    left, right = st.columns([1, 5])

    with left:
        st.markdown(
            '<div style="padding-top:7px">'
            f"{icon(symbol, 20)}"
            "</div>",
            unsafe_allow_html=True,
        )

    with right:
        return st.checkbox(label, value=False, key=key)


def divider():
    st.markdown(
        '<div class="custom-divider"></div>',
        unsafe_allow_html=True,
    )


def price_card(label, value, unit, symbol, note=""):
    st.markdown(
        '<div class="price-card">'
        '<div class="price-label">'
        f"{icon(symbol)}<span>{escape(label)}</span>"
        "</div>"
        '<div class="price-value">'
        f'{escape(value)}<span class="price-unit">{escape(unit)}</span>'
        "</div>"
        f'<div class="card-note">{escape(note)}</div>'
        "</div>",
        unsafe_allow_html=True,
    )


# ============================================================
# Pays et villes
# ============================================================

CITIES_BY_COUNTRY = {
    "Deutschland": [
        "Berlin", "Hamburg", "München", "Köln", "Frankfurt",
        "Stuttgart", "Düsseldorf", "Leipzig", "Dresden", "Hannover",
    ],
    "France": [
        "Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux",
        "Lille", "Nantes", "Strasbourg", "Montpellier", "Rennes",
    ],
    "España": [
        "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza",
        "Málaga", "Murcia", "Palma", "Bilbao", "Alicante",
    ],
    "Italia": [
        "Roma", "Milano", "Napoli", "Torino", "Palermo",
        "Genova", "Bologna", "Firenze", "Bari", "Catania",
    ],
    "United Kingdom": [
        "London", "Manchester", "Birmingham", "Liverpool", "Bristol",
        "Leeds", "Sheffield", "Edinburgh", "Glasgow", "Cardiff",
    ],
    "Nederland": [
        "Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven",
        "Groningen", "Maastricht", "Leiden", "Delft", "Haarlem",
    ],
    "Polska": [
        "Warszawa", "Kraków", "Wrocław", "Poznań", "Gdańsk",
        "Łódź", "Szczecin", "Lublin", "Katowice", "Białystok",
    ],
    "Česká republika": [
        "Praha", "Brno", "Ostrava", "Plzeň", "Liberec",
        "Olomouc", "Ústí nad Labem", "Hradec Králové",
        "České Budějovice", "Pardubice",
    ],
    "Danmark": [
        "København", "Aarhus", "Odense", "Aalborg", "Esbjerg",
        "Randers", "Kolding", "Horsens", "Vejle", "Roskilde",
    ],
    "Suomi": [
        "Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu",
        "Turku", "Jyväskylä", "Lahti", "Kuopio", "Pori",
    ],
}

LANGUAGES = {
    "DE": "Deutsch",
    "FR": "Français",
    "EN": "English",
}


# ============================================================
# Textes
# ============================================================

TRANSLATIONS = {
    "DE": {
        "title": "Immobilienmarkt-Rechner",
        "subtitle": "Eine erste Einschätzung für Ihre Immobilie.",
        "tagline": "Immobilien verstehen.",
        "language": "Sprache",
        "property_data": "Ihre Immobilie",
        "surface": "Wohnfläche (m²)",
        "rooms": "Zimmer",
        "bedrooms": "Schlafzimmer",
        "floor": "Etage",
        "country": "Land",
        "city": "Stadt",
        "year": "Baujahr",
        "garden": "Garten",
        "balcony": "Balkon",
        "calculate": "Preis berechnen",
        "estimated_price": "Geschätzter Wert",
        "price_per_m2": "Preis pro m²",
        "market_trend": "Preisentwicklung",
        "market_analysis": "Preisübersicht",
        "price_comparison": "Ähnliche Immobilien",
        "your_property": "Ihre Immobilie",
        "city_average": "Stadtdurchschnitt",
        "country_average": "Landesdurchschnitt",
        "key_factors": "Einflussfaktoren",
        "recommendations": "Was Sie beachten sollten",
        "confidence": "Beispielindikator",
        "source": "Datengrundlage: simulierte Beispieldaten",
        "demo_notice": (
            "Beispielberechnung mit simulierten Daten. "
            "Keine Immobilienbewertung."
        ),
        "details": "Berechnungsdetails",
        "forecast": "Ausblick",
        "location": "Lage",
        "condition": "Baujahr und Zustand",
        "amenities": "Ausstattung",
        "price": "Preis",
        "comparison_a": "Vergleich A",
        "comparison_b": "Vergleich B",
        "comparison_c": "Vergleich C",
        "deviation": "Abweichung",
        "age": "Alter",
        "years": "Jahre",
        "annual_growth": "Jährliche Entwicklung",
        "empty_title": "Was ist Ihre Immobilie wert?",
        "empty_text": (
            "Tragen Sie die Angaben zu Ihrer Immobilie ein "
            "und starten Sie die Berechnung."
        ),
        "indicator_note": "Illustrativer Wert, keine statistische Sicherheit.",
        "factors_note": "Beispielhafte Gewichtung.",
    },
    "FR": {
        "title": "Calculateur immobilier",
        "subtitle": "Une première estimation pour votre bien.",
        "tagline": "L’immobilier, plus clair.",
        "language": "Langue",
        "property_data": "Votre bien",
        "surface": "Surface (m²)",
        "rooms": "Pièces",
        "bedrooms": "Chambres",
        "floor": "Étage",
        "country": "Pays",
        "city": "Ville",
        "year": "Année de construction",
        "garden": "Jardin",
        "balcony": "Balcon",
        "calculate": "Estimer mon bien",
        "estimated_price": "Valeur estimée",
        "price_per_m2": "Prix au m²",
        "market_trend": "Évolution du prix",
        "market_analysis": "Vue d’ensemble des prix",
        "price_comparison": "Biens similaires",
        "your_property": "Votre bien",
        "city_average": "Moyenne de la ville",
        "country_average": "Moyenne du pays",
        "key_factors": "Facteurs clés",
        "recommendations": "Les points à examiner",
        "confidence": "Indicateur illustratif",
        "source": "Données utilisées : exemples simulés",
        "demo_notice": (
            "Estimation indicative à partir de données simulées. "
            "Ne constitue pas une expertise immobilière."
        ),
        "details": "Détail du calcul",
        "forecast": "Projection",
        "location": "Emplacement",
        "condition": "Année et état du bien",
        "amenities": "Équipements",
        "price": "Prix",
        "comparison_a": "Bien A",
        "comparison_b": "Bien B",
        "comparison_c": "Bien C",
        "deviation": "Écart",
        "age": "Âge",
        "years": "ans",
        "annual_growth": "Évolution annuelle",
        "empty_title": "Combien vaut votre bien ?",
        "empty_text": (
            "Renseignez les caractéristiques de votre bien, "
            "puis lancez l’estimation."
        ),
        "indicator_note": (
            "Valeur illustrative, sans mesure de fiabilité statistique."
        ),
        "factors_note": "Pondération illustrative.",
    },
    "EN": {
        "title": "Property price calculator",
        "subtitle": "A first estimate for your property.",
        "tagline": "A clearer view of property.",
        "language": "Language",
        "property_data": "Your property",
        "surface": "Living area (m²)",
        "rooms": "Rooms",
        "bedrooms": "Bedrooms",
        "floor": "Floor",
        "country": "Country",
        "city": "City",
        "year": "Year built",
        "garden": "Garden",
        "balcony": "Balcony",
        "calculate": "Estimate my property",
        "estimated_price": "Estimated value",
        "price_per_m2": "Price per m²",
        "market_trend": "Price change",
        "market_analysis": "Price overview",
        "price_comparison": "Similar properties",
        "your_property": "Your property",
        "city_average": "City average",
        "country_average": "Country average",
        "key_factors": "Key factors",
        "recommendations": "Points to consider",
        "confidence": "Example indicator",
        "source": "Based on simulated example data",
        "demo_notice": (
            "Illustrative estimate using simulated data. "
            "Not a property appraisal."
        ),
        "details": "Calculation details",
        "forecast": "Outlook",
        "location": "Location",
        "condition": "Age and condition",
        "amenities": "Amenities",
        "price": "Price",
        "comparison_a": "Property A",
        "comparison_b": "Property B",
        "comparison_c": "Property C",
        "deviation": "Difference",
        "age": "Age",
        "years": "years",
        "annual_growth": "Annual change",
        "empty_title": "What is your property worth?",
        "empty_text": (
            "Enter your property details, "
            "then calculate your estimate."
        ),
        "indicator_note": "Illustrative value, not statistical confidence.",
        "factors_note": "Illustrative weighting.",
    },
}

if "language" not in st.session_state:
    st.session_state.language = "DE"


def t(key):
    language = st.session_state.get("language", "DE")
    return TRANSLATIONS.get(
        language, TRANSLATIONS["DE"]
    ).get(key, key)


# ============================================================
# Simulation
# ============================================================

COUNTRY_FACTORS = {
    "Deutschland": (3000, 0.15, 1.05),
    "France": (4500, 0.12, 1.03),
    "España": (2500, 0.18, 1.08),
    "Italia": (2800, 0.14, 1.04),
    "United Kingdom": (5500, 0.10, 1.02),
    "Nederland": (4000, 0.08, 1.06),
    "Polska": (1800, 0.20, 1.12),
    "Česká republika": (2200, 0.16, 1.10),
    "Danmark": (3500, 0.09, 1.04),
    "Suomi": (3200, 0.11, 1.03),
}

CITY_FACTORS = {
    "Berlin": 1.3, "Hamburg": 1.2, "München": 1.5,
    "Köln": 1.1, "Frankfurt": 1.25,
    "Paris": 1.8, "Lyon": 1.2, "Marseille": 1.0,
    "Madrid": 1.3, "Barcelona": 1.4,
    "Roma": 1.2, "Milano": 1.4,
    "London": 2.0, "Manchester": 1.1,
    "Amsterdam": 1.6, "Rotterdam": 1.1,
    "Warszawa": 1.3, "Kraków": 1.1,
    "Praha": 1.4, "Brno": 1.0,
    "København": 1.5, "Aarhus": 1.1,
    "Helsinki": 1.3, "Espoo": 1.1,
}


def calculate_example(property_data):
    base, volatility, growth = COUNTRY_FACTORS[
        property_data["country"]
    ]

    size = property_data["size"]
    age = REFERENCE_YEAR - property_data["year"]

    value = size * base * CITY_FACTORS.get(
        property_data["city"], 1.0
    )
    value *= 1 + 0.03 * property_data["rooms"]
    value *= 1 + 0.05 * property_data["bedrooms"]
    value *= 1 + 0.01 * property_data["floor"]
    value *= max(0.7, 1.0 - age * 0.005)
    value *= 1 + 0.08 * int(property_data["garden"])
    value *= 1 + 0.05 * int(property_data["balcony"])

    rng = np.random.default_rng()
    value *= max(0.1, rng.normal(1.0, volatility))

    return {
        "property": dict(property_data),
        "price": float(value),
        "city_average": float(value * rng.normal(0.95, 0.05)),
        "country_average": float(value * rng.normal(0.85, 0.08)),
        "trend": float((growth - 1) * 100),
        "indicator": float(
            min(
                95,
                70 + (property_data["year"] - 1950) / 30
                + size / 500 * 10,
            )
        ),
    }


def get_recommendations(property_data):
    language = st.session_state.get("language", "DE")
    recommendations = []

    def add(symbol, de, fr, en):
        content = {"DE": de, "FR": fr, "EN": en}
        title, text = content[language]
        recommendations.append((symbol, title, text))

    age = REFERENCE_YEAR - property_data["year"]

    if age > 50:
        add(
            "build",
            (
                "Zustand prüfen",
                "Dämmung, Heizung und anstehende Arbeiten können "
                "die Gesamtkosten deutlich beeinflussen.",
            ),
            (
                "Vérifier l’état du bien",
                "L’isolation, le chauffage et les travaux à prévoir "
                "peuvent peser sur le coût total.",
            ),
            (
                "Check the property's condition",
                "Insulation, heating and upcoming repairs can "
                "have a significant effect on the total cost.",
            ),
        )
    elif age < 10:
        add(
            "home",
            (
                "Jüngeres Gebäude",
                "Prüfen Sie Bauunterlagen, Energieverbrauch "
                "und die Qualität der Ausstattung.",
            ),
            (
                "Construction récente",
                "Consultez les documents de construction, "
                "la consommation énergétique et les prestations.",
            ),
            (
                "Recent construction",
                "Review the building documents, energy consumption "
                "and quality of the fittings.",
            ),
        )

    if property_data["garden"]:
        add(
            "park",
            (
                "Garten",
                "Größe, Ausrichtung und Pflegeaufwand gehören "
                "mit in die Bewertung.",
            ),
            (
                "Jardin",
                "Sa surface, son orientation et son entretien "
                "comptent aussi dans votre choix.",
            ),
            (
                "Garden",
                "Consider its size, orientation and maintenance needs.",
            ),
        )

    if property_data["balcony"]:
        add(
            "balcony",
            (
                "Balkon",
                "Achten Sie auf Ausrichtung, Lärm "
                "und den baulichen Zustand.",
            ),
            (
                "Balcon",
                "Vérifiez son orientation, son état "
                "et l’exposition au bruit.",
            ),
            (
                "Balcony",
                "Check its orientation, condition and exposure to noise.",
            ),
        )

    add(
        "location_on",
        (
            "Die Nachbarschaft zählt",
            "Vergleichen Sie ähnliche Objekte im selben Viertel. "
            "Ein Stadtdurchschnitt reicht für eine Bewertung nicht aus.",
        ),
        (
            "Le quartier fait la différence",
            "Comparez des biens similaires dans le même quartier. "
            "Une moyenne par ville ne suffit pas à évaluer un bien.",
        ),
        (
            "The neighbourhood matters",
            "Compare similar properties in the same neighbourhood. "
            "A city average alone cannot determine a property's value.",
        ),
    )

    return recommendations


# ============================================================
# Barre latérale
# ============================================================

with st.sidebar:
    st.markdown(
        '<div class="sidebar-brand">'
        f'{logo_html("sidebar-brand-logo")}'
        '<div class="sidebar-brand-name">ImmoLens</div>'
        f'<div class="sidebar-brand-description">{escape(t("tagline"))}</div>'
        "</div>",
        unsafe_allow_html=True,
    )

    section_title(t("language"), "translate")

    st.selectbox(
        t("language"),
        options=list(LANGUAGES),
        format_func=lambda value: LANGUAGES[value],
        key="language",
        label_visibility="collapsed",
    )

    divider()
    section_title(t("property_data"), "home")

    field_label(t("country"), "public")
    selected_country = st.selectbox(
        t("country"),
        options=list(CITIES_BY_COUNTRY),
        key="country",
        label_visibility="collapsed",
    )

    city_options = CITIES_BY_COUNTRY[selected_country]

    if st.session_state.get("city") not in city_options:
        st.session_state["city"] = city_options[0]

    field_label(t("city"), "location_city")
    selected_city = st.selectbox(
        t("city"),
        options=city_options,
        key="city",
        label_visibility="collapsed",
    )

    col1, col2 = st.columns(2)

    with col1:
        field_label(t("surface"), "square_foot")
        size = st.number_input(
            t("surface"),
            min_value=20,
            max_value=500,
            value=85,
            step=5,
            key="size",
            label_visibility="collapsed",
        )

    with col2:
        field_label(t("year"), "calendar_month")
        year = st.number_input(
            t("year"),
            min_value=1900,
            max_value=REFERENCE_YEAR,
            value=2010,
            step=1,
            key="year",
            label_visibility="collapsed",
        )

    col1, col2 = st.columns(2)

    with col1:
        field_label(t("rooms"), "door_front")
        rooms = st.number_input(
            t("rooms"),
            min_value=1,
            max_value=15,
            value=4,
            step=1,
            key="rooms",
            label_visibility="collapsed",
        )

    with col2:
        field_label(t("bedrooms"), "bed")
        bedrooms = st.number_input(
            t("bedrooms"),
            min_value=1,
            max_value=8,
            value=2,
            step=1,
            key="bedrooms",
            label_visibility="collapsed",
        )

    field_label(t("floor"), "layers")
    floor = st.number_input(
        t("floor"),
        min_value=0,
        max_value=50,
        value=2,
        step=1,
        key="floor",
        label_visibility="collapsed",
    )

    garden = checkbox_with_icon(t("garden"), "park", "garden")
    balcony = checkbox_with_icon(t("balcony"), "balcony", "balcony")

    st.markdown("<br>", unsafe_allow_html=True)

    calculate = st.button(
        t("calculate"),
        icon=":material/calculate:",
        use_container_width=True,
        type="primary",
    )

    divider()
    st.caption(t("source"))


# ============================================================
# En-tête
# ============================================================

st.markdown(
    '<div class="brand-header">'
    f'{logo_html("brand-header-logo")}'
    f'<h1>{escape(t("title"))}</h1>'
    "</div>",
    unsafe_allow_html=True,
)

st.markdown(
    f'<p class="sub-header">{escape(t("subtitle"))}</p>',
    unsafe_allow_html=True,
)

st.caption(t("demo_notice"))


# ============================================================
# Calcul et conservation des résultats
# ============================================================

if calculate:
    property_data = {
        "country": selected_country,
        "city": selected_city,
        "size": size,
        "year": year,
        "rooms": rooms,
        "bedrooms": bedrooms,
        "floor": floor,
        "garden": garden,
        "balcony": balcony,
    }

    st.session_state["result"] = calculate_example(property_data)


result = st.session_state.get("result")

if result is None:
    divider()

    st.markdown(
        '<div class="feature-card">'
        '<div class="recommendation-title">'
        f'{icon("home", 28)}'
        f'<strong>{escape(t("empty_title"))}</strong>'
        "</div>"
        f'<div>{escape(t("empty_text"))}</div>'
        "</div>",
        unsafe_allow_html=True,
    )

else:
    property_data = result["property"]
    current_price = result["price"]
    city_avg = result["city_average"]
    country_avg = result["country_average"]
    trend = result["trend"]
    indicator = result["indicator"]
    result_size = property_data["size"]
    price_per_m2 = current_price / result_size

    divider()

    # Première rangée de cartes
    col1, col2 = st.columns(2)

    with col1:
        price_card(
            t("estimated_price"),
            f"{current_price:,.0f}",
            "EUR",
            "payments",
            f'{property_data["city"]} · {result_size} m²',
        )

    with col2:
        price_card(
            t("price_per_m2"),
            f"{price_per_m2:,.0f}",
            "EUR/m²",
            "square_foot",
            f'{t("city_average")} : {city_avg / result_size:,.0f} EUR/m²',
        )

    # Deuxième rangée de cartes
    col1, col2 = st.columns(2)

    with col1:
        st.markdown(
            '<div class="price-card">'
            '<div class="price-label">'
            f'{icon("analytics")}<span>{escape(t("confidence"))}</span>'
            "</div>"
            '<div class="price-value">'
            f'{indicator:.0f}<span class="price-unit">/ 100</span>'
            "</div>"
            '<div class="confidence-bar">'
            f'<div class="confidence-fill" style="width:{indicator}%"></div>'
            "</div>"
            f'<div class="card-note">{escape(t("indicator_note"))}</div>'
            "</div>",
            unsafe_allow_html=True,
        )

    with col2:
        if trend > 2:
            trend_symbol = "trending_up"
            trend_color = "#218653"
        elif trend > -2:
            trend_symbol = "trending_flat"
            trend_color = "#a96700"
        else:
            trend_symbol = "trending_down"
            trend_color = "#c0392b"

        st.markdown(
            '<div class="price-card">'
            '<div class="price-label">'
            f'{icon("monitoring")}<span>{escape(t("market_trend"))}</span>'
            "</div>"
            '<div class="price-value">'
            f'{trend:+.1f}<span class="price-unit">%</span>'
            "</div>"
            '<div class="card-note">'
            f'{icon(trend_symbol, 20, trend_color)} '
            f'{escape(t("forecast"))} {REFERENCE_YEAR + 1}'
            "</div>"
            "</div>",
            unsafe_allow_html=True,
        )

    divider()

    # Graphiques
    col1, col2 = st.columns(2)

    with col1:
        section_title(t("market_analysis"), "bar_chart")

        comparison_data = pd.DataFrame({
            "category": [
                t("your_property"),
                t("city_average"),
                t("country_average"),
            ],
            "value": [current_price, city_avg, country_avg],
        })

        fig = px.bar(
            comparison_data,
            x="category",
            y="value",
            color="category",
            color_discrete_sequence=[
                "#243649", "#3498db", "#94a3b8",
            ],
            text_auto=".0f",
            labels={
                "category": "",
                "value": f'{t("price")} (EUR)',
            },
        )

        fig.update_traces(
            texttemplate="%{y:,.0f} EUR",
            textposition="outside",
            cliponaxis=False,
        )

        fig.update_layout(
            title=property_data["city"],
            showlegend=False,
            font_family="Times New Roman",
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            margin=dict(l=10, r=10, t=55, b=20),
            height=360,
            yaxis=dict(
                range=[0, max(current_price, city_avg, country_avg) * 1.2]
            ),
        )

        st.plotly_chart(
            fig,
            use_container_width=True,
            config={"displayModeBar": False},
        )

    with col2:
        section_title(t("price_comparison"), "compare_arrows")

        similar_properties = pd.DataFrame({
            "category": [
                t("comparison_a"),
                t("comparison_b"),
                t("comparison_c"),
                t("your_property"),
            ],
            "value": [
                current_price * 0.9,
                current_price * 1.15,
                current_price * 0.95,
                current_price,
            ],
        })

        fig = px.bar(
            similar_properties,
            x="value",
            y="category",
            orientation="h",
            color="category",
            color_discrete_sequence=[
                "#94a3b8", "#94a3b8", "#94a3b8", "#243649",
            ],
            labels={
                "category": "",
                "value": f'{t("price")} (EUR)',
            },
        )

        fig.update_layout(
            showlegend=False,
            font_family="Times New Roman",
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            margin=dict(l=10, r=10, t=55, b=20),
            height=360,
        )

        st.plotly_chart(
            fig,
            use_container_width=True,
            config={"displayModeBar": False},
        )

    divider()

    # Facteurs et recommandations
    col1, col2 = st.columns(2)

    with col1:
        section_title(t("key_factors"), "tune")
        st.caption(t("factors_note"))

        factors = [
            (t("location"), 0.30, "location_on"),
            (t("surface"), 0.25, "square_foot"),
            (t("condition"), 0.20, "calendar_month"),
            (t("amenities"), 0.15, "tune"),
            (t("floor"), 0.10, "layers"),
        ]

        for label, importance, symbol in factors:
            st.markdown(
                '<div class="feature-card">'
                '<div class="feature-line">'
                '<span class="feature-name">'
                f'{icon(symbol, 19)}<span>{escape(label)}</span>'
                "</span>"
                f"<strong>{importance * 100:.0f}%</strong>"
                "</div>"
                '<div class="confidence-bar">'
                '<div class="confidence-fill" '
                f'style="width:{importance * 100}%"></div>'
                "</div>"
                "</div>",
                unsafe_allow_html=True,
            )

    with col2:
        section_title(t("recommendations"), "lightbulb")

        for symbol, title, text in get_recommendations(property_data):
            st.markdown(
                '<div class="recommendation-card">'
                '<div class="recommendation-title">'
                f"{icon(symbol)}"
                f"<strong>{escape(title)}</strong>"
                "</div>"
                f"<div>{escape(text)}</div>"
                "</div>",
                unsafe_allow_html=True,
            )

    divider()

    # Détails : deux sections
    with st.expander(
        t("details"),
        icon=":material/table_chart:",
    ):
        col1, col2 = st.columns(2)

        with col1:
            section_title(t("price"), "payments")

            st.markdown(
                f"""
- {t("price_per_m2")} : **{price_per_m2:,.0f} EUR/m²**
- {t("city_average")} : **{city_avg / result_size:,.0f} EUR/m²**
- {t("country_average")} : **{country_avg / result_size:,.0f} EUR/m²**
- {t("annual_growth")} : **{trend:+.1f}%**
"""
            )

        with col2:
            section_title(t("property_data"), "home")

            st.markdown(
                f"""
- {t("city")} : **{property_data["city"]}**
- {t("surface")} : **{result_size}**
- {t("year")} : **{property_data["year"]}**
- {t("age")} : **{REFERENCE_YEAR - property_data["year"]} {t("years")}**
- {t("rooms")} : **{property_data["rooms"]}**
- {t("bedrooms")} : **{property_data["bedrooms"]}**
- {t("floor")} : **{property_data["floor"]}**
"""
            )


# ============================================================
# Pied de page
# ============================================================

st.markdown(
    '<div class="footer">'
    '<div class="footer-name">ImmoLens</div>'
    '<div class="footer-signature">'
    f"© {REFERENCE_YEAR} Pascal C. Nague"
    "</div>"
    "</div>",
    unsafe_allow_html=True,
)