import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { getModel, predict } from './services/api'
import LocationPicker from './components/LocationPicker'
import type { ModelInfo, Prediction, Property } from './services/api'

type Language = 'de' | 'en'
type Page = 'overview' | 'estimate' | 'history' | 'method'
type EstimateView = 'form' | 'result'

type Entry = {
  id: string
  createdAt: string
  prediction: Prediction
}

const translations = {
  de: {
    overview: 'Übersicht',
    estimate: 'Schätzung',
    history: 'Verlauf',
    method: 'Methodik',
    skip: 'Zum Inhalt',
    navigation: 'Hauptnavigation',
    language: 'Sprache',
    menu: 'Menü',

    heroEyebrow: 'IMMOBILIEN · MACHINE LEARNING · DATEN',
    heroTitle: 'Immobilienwert.',
    heroAccent: 'Präziser eingeschätzt.',
    heroText:
      'ImmoLens nutzt moderne Machine-Learning-Modelle, um den Wert von Immobilien schnell, transparent und datenbasiert zu schätzen.',
    startEstimate: 'Jetzt Schätzung starten',
    howWorks: 'So funktioniert es',

    fast: 'Schnell',
    fastText: 'in wenigen Sekunden',
    dataDriven: 'Datenbasiert',
    dataDrivenText: 'ML-gestützte Schätzung',
    transparent: 'Transparent',
    transparentText: 'Nachvollziehbare Methodik',

    estimateCardText: 'Marktwert Ihrer Immobilie berechnen.',
    historyCardText: 'Ihre bisherigen Schätzungen im Überblick.',
    methodCardText: 'Daten, Modelle und Genauigkeit.',

    estimatorEyebrow: 'IMMOLENS ESTIMATOR',
    estimatorTitle: 'Ihre Immobilie. Schritt für Schritt.',
    estimatorIntro:
      'Erfassen Sie Standort, Größe und Ausstattung. ImmoLens führt Sie durch drei kompakte Schritte.',
    backToOverview: 'Zur Übersicht',

    demo: 'Demodaten',

    location: 'Standort',
    property: 'Immobilie',
    review: 'Prüfen',

    locationTitle: 'Wo liegt Ihre Immobilie?',
    locationIntro:
      'Wählen Sie einen vom aktuellen Modell unterstützten Standort.',

    country: 'Land',
    germany: 'Deutschland',
    city: 'Stadt',

    coverageNote:
      'Aktuell verfügbar: Deutschland. Weitere Länder benötigen eigene Daten und ein dafür trainiertes Modell.',

    station: 'Entfernung zum Bahnhof',

    propertyTitle: 'Ihre Immobilie im Detail',
    propertyIntro: 'Ergänzen Sie Größe, Baujahr und Ausstattung.',

    area: 'Wohnfläche',
    year: 'Baujahr',
    rooms: 'Zimmer',
    bedrooms: 'Schlafzimmer',
    floor: 'Etage',
    garden: 'Garten',
    balcony: 'Balkon',

    reviewTitle: 'Stimmen Ihre Angaben?',
    reviewIntro: 'Prüfen Sie die Angaben vor der Berechnung.',

    disclaimer:
      'Das Modell wurde mit synthetischen Daten trainiert. Das Ergebnis ist eine Demonstration und keine Bewertung des tatsächlichen Marktwerts.',

    back: 'Zurück',
    next: 'Weiter',
    calculate: 'Schätzung berechnen',
    calculating: 'Wird berechnet …',

    yourDetails: 'Ihre Angaben',
    summary:
      'Eine Modellschätzung auf Basis synthetischer Immobiliendaten.',

    viewMethod: 'Methodik ansehen',

    loading: 'Modelldaten werden geladen …',

    connection: 'Verbindung zum Modell nicht verfügbar',
    connectionHelp:
      'Prüfen Sie, ob die API läuft und die Route /model verfügbar ist.',
    retry: 'Erneut versuchen',

    roomError:
      'Die Anzahl der Schlafzimmer darf die Zimmeranzahl nicht überschreiten.',

    requestError:
      'Die Schätzung konnte nicht berechnet werden. Prüfen Sie die Verbindung und Ihre Angaben.',

    resultEyebrow: 'SCHÄTZUNG · ERGEBNIS',
    resultTitle: 'Ihre Immobilie. Klar eingeschätzt.',
    result: 'Ergebnis',

    estimatedPrice: 'Geschätzter Kaufpreis',
    perArea: 'Preis pro Quadratmeter',
    syntheticBasis: 'Auf Basis synthetischer Daten',

    yourProperty: 'Ihr Objekt',

    reliability: 'Wie belastbar ist die Schätzung?',
    noInterval:
      'Für dieses Modell ist noch kein kalibriertes Preisintervall verfügbar.',
    priceRange: 'Preisintervall',

    modelInfo: 'Modellinformationen',
    model: 'Modell',
    referenceYear: 'Referenzjahr',
    modelId: 'Modell-ID',

    edit: 'Angaben bearbeiten',
    print: 'Drucken / PDF',

    historyTitle: 'Ihre bisherigen Schätzungen.',
    sessionCount: 'Schätzungen in dieser Sitzung',
    newEstimate: 'Neue Schätzung',

    sessionNote:
      'Der Verlauf bleibt nur in dieser Sitzung erhalten. Beim Neuladen oder Schließen der Seite wird er gelöscht.',

    emptyTitle: 'Noch keine Schätzungen',
    emptyText: 'Ihre berechneten Ergebnisse erscheinen hier.',
    firstEstimate: 'Erste Schätzung erstellen',

    view: 'Ansehen',
    clear: 'Verlauf löschen',
    confirmClear: 'Alle Schätzungen dieser Sitzung löschen?',

    methodTitle: 'Die Grundlage Ihrer Schätzung.',
    methodIntro: 'Daten, Modell und Grenzen auf einen Blick.',

    dataBasis: 'Datenbasis',
    synthetic: 'Synthetische Daten',

    dataText:
      'Das Modell lernt aus künstlich erzeugten Immobiliendaten. Reale Kaufverträge oder aktuelle Marktangebote sind nicht enthalten.',

    modelText:
      'Mehrere Entscheidungsbäume berechnen gemeinsam eine Preisschätzung. Beim Training und bei der Vorhersage wird dieselbe gespeicherte Datenverarbeitung verwendet.',

    uncertainty: 'Unsicherheit',
    noIntervalTitle: 'Kein kalibriertes Preisintervall',

    uncertaintyText:
      'Der angezeigte Preis ist eine einzelne Modellschätzung. Die Genauigkeit auf realen Immobilien ist nicht nachgewiesen.',

    performance: 'Modellleistung',

    performanceText:
      'Auswertung auf synthetischen Testdaten. Diese Werte belegen keine Genauigkeit auf dem realen Immobilienmarkt.',

    mae: 'Mittlerer absoluter Fehler (MAE)',
    rmse: 'Wurzel des mittleren quadratischen Fehlers (RMSE)',
    r2: 'Bestimmtheitsmaß (R²)',

    training: 'Trainingsobjekte',
    testing: 'Testobjekte',

    supported: 'Unterstützte Eingaben',
    cities: 'Städte',

    limitations: 'Was das Modell nicht berücksichtigt',

    limitationsText:
      'Zum Beispiel den tatsächlichen Gebäudezustand, die Energieeffizienz, eine konkrete Adresse oder aktuelle lokale Marktbewegungen.',

    notAvailable: 'Nicht verfügbar',
    yes: 'Ja',
    no: 'Nein',

    footer: 'Demo mit synthetischen Daten',
  },

  en: {
    overview: 'Overview',
    estimate: 'Estimate',
    history: 'History',
    method: 'Methodology',
    skip: 'Skip to content',
    navigation: 'Main navigation',
    language: 'Language',
    menu: 'Menu',

    heroEyebrow: 'REAL ESTATE · MACHINE LEARNING · DATA',
    heroTitle: 'Property value.',
    heroAccent: 'Estimated with precision.',
    heroText:
      'ImmoLens uses modern machine-learning models to estimate property value quickly, transparently and with a data-driven approach.',
    startEstimate: 'Start an estimate',
    howWorks: 'How it works',

    fast: 'Fast',
    fastText: 'in a few seconds',
    dataDriven: 'Data-driven',
    dataDrivenText: 'ML-powered estimation',
    transparent: 'Transparent',
    transparentText: 'Traceable methodology',

    estimateCardText: 'Calculate an estimated property value.',
    historyCardText: 'Review your previous estimates.',
    methodCardText: 'Data, models and accuracy.',

    estimatorEyebrow: 'IMMOLENS ESTIMATOR',
    estimatorTitle: 'Your property. Step by step.',
    estimatorIntro:
      'Enter location, size and amenities. ImmoLens guides you through three compact steps.',
    backToOverview: 'Back to overview',

    demo: 'Demo data',

    location: 'Location',
    property: 'Property',
    review: 'Review',

    locationTitle: 'Where is your property?',
    locationIntro:
      'Choose a location supported by the current model.',

    country: 'Country',
    germany: 'Germany',
    city: 'City',

    coverageNote:
      'Currently available: Germany. Additional countries require suitable data and a model trained for those markets.',

    station: 'Distance to railway station',

    propertyTitle: 'Your property in detail',
    propertyIntro: 'Add its size, construction year and amenities.',

    area: 'Living area',
    year: 'Year built',
    rooms: 'Rooms',
    bedrooms: 'Bedrooms',
    floor: 'Floor',
    garden: 'Garden',
    balcony: 'Balcony',

    reviewTitle: 'Are these details correct?',
    reviewIntro: 'Review your details before calculating.',

    disclaimer:
      'The model was trained on synthetic data. This result is a demonstration, not an appraisal of actual market value.',

    back: 'Back',
    next: 'Continue',
    calculate: 'Calculate estimate',
    calculating: 'Calculating …',

    yourDetails: 'Your details',
    summary:
      'A model estimate based on synthetic property data.',

    viewMethod: 'View methodology',

    loading: 'Loading model information …',

    connection: 'Model connection unavailable',
    connectionHelp:
      'Check that the API is running and the /model endpoint is available.',
    retry: 'Try again',

    roomError:
      'The number of bedrooms cannot exceed the total number of rooms.',

    requestError:
      'The estimate could not be calculated. Check your connection and property details.',

    resultEyebrow: 'ESTIMATE · RESULT',
    resultTitle: 'Your property. Clearly estimated.',
    result: 'Result',

    estimatedPrice: 'Estimated purchase price',
    perArea: 'Price per square metre',
    syntheticBasis: 'Based on synthetic data',

    yourProperty: 'Your property',

    reliability: 'How reliable is this estimate?',
    noInterval:
      'A calibrated price interval is not yet available for this model.',
    priceRange: 'Price interval',

    modelInfo: 'Model information',
    model: 'Model',
    referenceYear: 'Reference year',
    modelId: 'Model ID',

    edit: 'Edit details',
    print: 'Print / PDF',

    historyTitle: 'Your previous estimates.',
    sessionCount: 'estimates in this session',
    newEstimate: 'New estimate',

    sessionNote:
      'History is kept only during this session. Reloading or closing the page clears it.',

    emptyTitle: 'No estimates yet',
    emptyText: 'Your calculated results will appear here.',
    firstEstimate: 'Create your first estimate',

    view: 'View',
    clear: 'Clear history',
    confirmClear: 'Delete all estimates from this session?',

    methodTitle: 'Behind your estimate.',
    methodIntro: 'Understand the data, the model and its limitations.',

    dataBasis: 'Data source',
    synthetic: 'Synthetic data',

    dataText:
      'The model learns from artificially generated property data. It does not include actual sale contracts or current listings.',

    modelText:
      'Multiple decision trees work together to estimate a price. Training and prediction use the same saved preprocessing pipeline.',

    uncertainty: 'Uncertainty',
    noIntervalTitle: 'No calibrated price interval',

    uncertaintyText:
      'The displayed price is a single model estimate. Its accuracy on real properties has not been established.',

    performance: 'Model performance',

    performanceText:
      'Evaluation on synthetic test data. These metrics do not establish accuracy in the real property market.',

    mae: 'Mean absolute error (MAE)',
    rmse: 'Root mean squared error (RMSE)',
    r2: 'Coefficient of determination (R²)',

    training: 'training properties',
    testing: 'test properties',

    supported: 'Supported inputs',
    cities: 'Cities',

    limitations: 'What the model does not consider',

    limitationsText:
      'For example, actual building condition, energy efficiency, a precise address or current local market changes.',

    notAvailable: 'Not available',
    yes: 'Yes',
    no: 'No',

    footer: 'Synthetic data demo',
  },
} as const

const initialProperty: Property = {
  stadt: 'Berlin',
  flaeche: 85,
  zimmer: 4,
  schlafzimmer: 2,
  etage: 2,
  baujahr: 2010,
  entfernung_bahn: 0.5,
  garten: 1,
  balkon: 1,
}

const currentYear = new Date().getFullYear()

function readPreference(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function savePreference(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore unavailable browser storage.
  }
}

type IconName =
  | 'menu'
  | 'home'
  | 'print'
  | 'edit'
  | 'arrow'
  | 'play'
  | 'bolt'
  | 'target'
  | 'shield'
  | 'chart'
  | 'layers'
  | 'nodes'
  | 'globe'

function Icon({
  name,
  size = 20,
}: {
  name: IconName
  size?: number
}) {
  const paths: Record<IconName, string> = {
    menu: 'M4 6h16M4 12h16M4 18h16',
    home: 'M3 10 12 3l9 7M5 9v12h14V9M9 21v-8h6v8',
    print: 'M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7Z',
    edit:
      'm15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    play: 'M8 5v14l11-7Z',
    bolt: 'M13 2 5 14h7l-1 8 8-12h-7l1-8Z',
    target:
      'M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 11a1 1 0 1 0 1 1M15 9l6-6M17 3h4v4',
    shield:
      'M12 3 20 6v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Zm-3 9 2 2 4-4',
    chart: 'M5 20V11M10 20V7M15 20V4M20 20V9',
    layers:
      'm12 3 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5',
    nodes:
      'M12 5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM5 21a3 3 0 1 0 0-6 3 3 0 0 0 0 0 6Zm14 0a3 3 0 1 0 0-6 3 3 0 0 0 0 0 6ZM10 5 6 15M14 5l4 10M8 18h8',
    globe:
      'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.2-2.4 3.3-5.4 3.3-9S14.2 5.4 12 3c-2.2 2.4-3.3 5.4-3.3 9s1.1 6.6 3.3 9ZM3.6 9h16.8M3.6 15h16.8',
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}

function App() {
  const [language, setLanguage] = useState<Language>(() =>
    readPreference('immolens.language') === 'en' ? 'en' : 'de',
  )

  const [page, setPage] = useState<Page>('overview')
  const [estimateView, setEstimateView] =
    useState<EstimateView>('form')

  const [menuOpen, setMenuOpen] = useState(false)

  const [model, setModel] = useState<ModelInfo | null>(null)
  const [modelError, setModelError] = useState(false)
  const [retry, setRetry] = useState(0)

  const [property, setProperty] =
    useState<Property>(initialProperty)

  const [country, setCountry] = useState('DE')
  const [locationSupported, setLocationSupported] =
    useState(true)

  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)

  const pending = useRef(false)

  const [error, setError] =
    useState<'rooms' | 'request' | null>(null)

  const [history, setHistory] = useState<Entry[]>([])

  const [selected, setSelected] =
    useState<Entry | null>(null)

  const t = translations[language]

  const locale =
    language === 'de'
      ? 'de-DE'
      : 'en-GB'

  const result = selected?.prediction

  const money = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)

  const number = (
    value: number,
    digits = 0,
  ) =>
    new Intl.NumberFormat(locale, {
      maximumFractionDigits: digits,
    }).format(value)

  useEffect(() => {
    document.documentElement.lang =
      language

    document.title =
      `ImmoLens | ${translations[language].estimate}`

    savePreference(
      'immolens.language',
      language,
    )
  }, [language])

  useEffect(() => {
    const controller =
      new AbortController()

    getModel(controller.signal)
      .then((info) => {
        setModel(info)
        setModelError(false)
      })
      .catch(() => {
        if (
          !controller.signal.aborted
        ) {
          setModelError(true)
        }
      })

    return () =>
      controller.abort()
  }, [retry])

function showOverview() {
  setPage('overview')
  setMenuOpen(false)
}

function navigate(nextPage: Page) {
  setPage(nextPage)
  setMenuOpen(false)

  if (nextPage === 'estimate') {
    setEstimateView('form')
  }
}

  function newEstimate() {
    setCountry('DE')
    setLocationSupported(true)

    setProperty({
      ...initialProperty,
    })

    setStep(0)
    setError(null)
    setSelected(null)

    setPage('estimate')
    setEstimateView('form')

    setMenuOpen(false)
  }

  function openEntry(
    entry: Entry,
  ) {
    setSelected(entry)
    setPage('estimate')
    setEstimateView('result')
    setMenuOpen(false)
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      pending.current ||
      !locationSupported
    ) {
      return
    }

    setError(null)

    if (
      property.schlafzimmer >
      property.zimmer
    ) {
      setError('rooms')
      return
    }

    if (step < 2) {
      setStep(
        (current) =>
          current + 1,
      )

      return
    }

    pending.current = true
    setBusy(true)

    try {
      const prediction =
        await predict(property)

      const entry: Entry = {
        id: crypto.randomUUID(),
        createdAt:
          new Date().toISOString(),
        prediction,
      }

      setHistory(
        (previous) => [
          entry,
          ...previous,
        ],
      )

      setSelected(entry)

      setEstimateView(
        'result',
      )
    } catch {
      setError('request')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  function details(
    value: Property,
  ) {
    const rows:
      [string, string | number][] =
      [
        [
          t.country,
          t.germany,
        ],
        [
          t.city,
          value.stadt,
        ],
        [
          t.area,
          `${number(
            value.flaeche,
            1,
          )} m²`,
        ],
        [
          t.rooms,
          value.zimmer,
        ],
        [
          t.bedrooms,
          value.schlafzimmer,
        ],
        [
          t.year,
          value.baujahr,
        ],
        [
          t.floor,
          value.etage,
        ],
        [
          t.station,
          `${number(
            value.entfernung_bahn,
            2,
          )} km`,
        ],
        [
          t.garden,
          value.garten
            ? t.yes
            : t.no,
        ],
        [
          t.balcony,
          value.balkon
            ? t.yes
            : t.no,
        ],
      ]

    return (
      <dl className="property-details">
        {rows.map(
          ([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ),
        )}
      </dl>
    )
  }

  function numericField(
    key: Exclude<
      keyof Property,
      'stadt'
    >,
    label: string,
    minimum: number,
    maximum: number,
    increment = 1,
    unit = '',
  ) {
    return (
      <label
        className="field"
        htmlFor={key}
      >
        <span>{label}</span>

        <span className="input-wrap">
          <input
            id={key}
            type="number"
            required
            min={minimum}
            max={maximum}
            step={increment}
            value={
              Number.isFinite(
                property[key],
              )
                ? property[key]
                : ''
            }
            onChange={(
              event,
            ) => {
              const value =
                event.currentTarget
                  .valueAsNumber

              setProperty(
                (previous) => ({
                  ...previous,
                  [key]: value,
                }),
              )
            }}
          />

          {unit && (
            <span className="input-unit">
              {unit}
            </span>
          )}
        </span>

        <small>
          {minimum}–{maximum}
          {unit
            ? ` ${unit}`
            : ''}
        </small>
      </label>
    )
  }

  function metric(
    key: string,
    currency = false,
    digits = 0,
  ) {
    const value =
      model?.metrics[key]

    return typeof value ===
      'number' &&
      Number.isFinite(value)
      ? currency
        ? money(value)
        : number(
            value,
            digits,
          )
      : t.notAvailable
  }

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main"
      >
        {t.skip}
      </a>

      <header className="site-header">
        <button
          className="brand"
          type="button"
          onClick={showOverview}
        >
          <img
            src="/brand/immolens-logo.png"
            alt=""
          />

          <span>
            Immo
            <strong>
              Lens
            </strong>
          </span>
        </button>

        <span
          className="header-divider"
          aria-hidden="true"
        />

        <nav
          id="main-navigation"
          className={`navigation ${
            menuOpen
              ? 'is-open'
              : ''
          }`}
          aria-label={t.navigation}
        >
          {(
            [
	      'overview',
              'estimate',
              'history',
              'method',
            ] as const
          ).map((item) => (
            <button
              key={item}
              type="button"
              className={
                page === item
                  ? 'active'
                  : ''
              }
              aria-current={
                page === item
                  ? 'page'
                  : undefined
              }
              onClick={() =>
                navigate(item)
              }
            >
              {t[item]}
            </button>
          ))}
        </nav>

        <div className="header-tools">
          <label
            className="language-control"
            htmlFor="language"
          >
            <Icon
              name="globe"
              size={18}
            />

            <select
              id="language"
              className="language-select"
              value={language}
              aria-label={
                t.language
              }
              onChange={(
                event,
              ) =>
                setLanguage(
                  event.target
                    .value as Language,
                )
              }
            >
              <option
                value="de"
                lang="de"
              >
                DE
              </option>

              <option
                value="en"
                lang="en"
              >
                EN
              </option>
            </select>
          </label>

          <button
            className="icon-button menu-button"
            type="button"
            aria-label={t.menu}
            aria-controls="main-navigation"
            aria-expanded={
              menuOpen
            }
            onClick={() =>
              setMenuOpen(
                (open) =>
                  !open,
              )
            }
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>

      <main id="main">
        {modelError && (
          <div
            className="service-message no-print"
            role="alert"
          >
            <div>
              <strong>
                {t.connection}
              </strong>

              <p>
                {
                  t.connectionHelp
                }
              </p>
            </div>

            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setModelError(
                  false,
                )

                setRetry(
                  (value) =>
                    value + 1,
                )
              }}
            >
              {t.retry}
            </button>
          </div>
        )}

        {page === 'overview' && (
            <section className="landing-page">
              <div
                className="hero-beam hero-beam-blue"
                aria-hidden="true"
              />

              <div
                className="hero-beam hero-beam-red"
                aria-hidden="true"
              />

              <div className="hero-shell">
                <div className="hero-copy">
                  <p className="hero-eyebrow">
                    {
                      t.heroEyebrow
                    }
                  </p>

                  <h1 className="hero-title">
                    <span>
                      {
                        t.heroTitle
                      }
                    </span>

                    <strong>
                      {
                        t.heroAccent
                      }
                    </strong>
                  </h1>

                  <span
                    className="hero-red-line"
                    aria-hidden="true"
                  />

                  <p className="hero-description">
                    {t.heroText}
                  </p>

                  <div className="hero-actions">
                    <button
                      className="button hero-primary"
                      type="button"
                      onClick={
                        newEstimate
                      }
                    >
                      <span>
                        {
                          t.startEstimate
                        }
                      </span>

                      <Icon name="arrow" />
                    </button>

                    <button
                      className="button hero-secondary"
                      type="button"
                      onClick={() =>
                        navigate(
                          'method',
                        )
                      }
                    >
                      <Icon name="play" />

                      <span>
                        {
                          t.howWorks
                        }
                      </span>
                    </button>
                  </div>

                  <div
                    className="hero-benefits"
                    aria-label="ImmoLens benefits"
                  >
                    <div className="benefit-item">
                      <Icon
                        name="bolt"
                        size={28}
                      />

                      <div>
                        <strong>
                          {t.fast}
                        </strong>

                        <span>
                          {
                            t.fastText
                          }
                        </span>
                      </div>
                    </div>

                    <div className="benefit-item">
                      <Icon
                        name="target"
                        size={28}
                      />

                      <div>
                        <strong>
                          {
                            t.dataDriven
                          }
                        </strong>

                        <span>
                          {
                            t.dataDrivenText
                          }
                        </span>
                      </div>
                    </div>

                    <div className="benefit-item">
                      <Icon
                        name="shield"
                        size={28}
                      />

                      <div>
                        <strong>
                          {
                            t.transparent
                          }
                        </strong>

                        <span>
                          {
                            t.transparentText
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="hero-visual"
                  aria-hidden="true"
                >
                  <div className="hero-glow hero-glow-blue" />
                  <div className="hero-glow hero-glow-red" />
                </div>
              </div>

              <div className="landing-cards">
                <button
                  className="landing-card card-blue"
                  type="button"
                  onClick={
                    newEstimate
                  }
                >
                  <span className="landing-card-icon">
                    <Icon
                      name="chart"
                      size={36}
                    />
                  </span>

                  <span className="landing-card-copy">
                    <strong>
                      {t.estimate}
                    </strong>

                    <small>
                      {
                        t.estimateCardText
                      }
                    </small>
                  </span>

                  <Icon
                    name="arrow"
                    size={22}
                  />
                </button>

                <button
                  className="landing-card card-violet"
                  type="button"
                  onClick={() =>
                    navigate(
                      'history',
                    )
                  }
                >
                  <span className="landing-card-icon">
                    <Icon
                      name="layers"
                      size={36}
                    />
                  </span>

                  <span className="landing-card-copy">
                    <strong>
                      {t.history}
                    </strong>

                    <small>
                      {
                        t.historyCardText
                      }
                    </small>
                  </span>

                  <Icon
                    name="arrow"
                    size={22}
                  />
                </button>

                <button
                  className="landing-card card-red"
                  type="button"
                  onClick={() =>
                    navigate(
                      'method',
                    )
                  }
                >
                  <span className="landing-card-icon">
                    <Icon
                      name="nodes"
                      size={36}
                    />
                  </span>

                  <span className="landing-card-copy">
                    <strong>
                      {t.method}
                    </strong>

                    <small>
                      {
                        t.methodCardText
                      }
                    </small>
                  </span>

                  <Icon
                    name="arrow"
                    size={22}
                  />
                </button>
              </div>
            </section>
          )}

        {page === 'estimate' &&
          estimateView ===
            'form' && (
            <section className="estimator-page content-page">
              <div className="content-heading estimator-heading">
                <div>
                  <button
                    className="back-link"
                    type="button"
                    onClick={
                      showOverview
                    }
                  >
                    ←{' '}
                    {
                      t.backToOverview
                    }
                  </button>

                  <p className="eyebrow">
                    {
                      t.estimatorEyebrow
                    }
                  </p>

                  <h1>
                    {
                      t.estimatorTitle
                    }
                  </h1>

                  <p className="subtitle">
                    {
                      t.estimatorIntro
                    }
                  </p>
                </div>

                <span className="badge">
                  {t.demo}
                </span>
              </div>

              <div className="form-layout">
                <section className="card form-card">
                  <ol className="steps">
                    {[
                      t.location,
                      t.property,
                      t.review,
                    ].map(
                      (
                        label,
                        index,
                      ) => (
                        <li
                          key={
                            label
                          }
                          className={
                            index ===
                            step
                              ? 'current'
                              : index <
                                  step
                                ? 'done'
                                : ''
                          }
                          aria-current={
                            index ===
                            step
                              ? 'step'
                              : undefined
                          }
                        >
                          <span>
                            {index +
                              1}
                          </span>

                          {label}
                        </li>
                      ),
                    )}
                  </ol>

                  {!model &&
                    !modelError && (
                      <p role="status">
                        {
                          t.loading
                        }
                      </p>
                    )}

                  <form
                    onSubmit={
                      submit
                    }
                  >
                    <fieldset
                      disabled={
                        busy ||
                        !model
                      }
                    >
                      <legend className="sr-only">
                        {
                          [
                            t.location,
                            t.property,
                            t.review,
                          ][step]
                        }
                      </legend>

                      {step ===
                        0 && (
                        <>
                          <h2>
                            {
                              t.locationTitle
                            }
                          </h2>

                          <p className="section-description">
                            {
                              t.locationIntro
                            }
                          </p>

                          <div className="fields">
                            <LocationPicker
                              key="location-picker"
                              language={
                                language
                              }
                              country={
                                country
                              }
                              cityName={
                                property.stadt
                              }
                              supportedCities={
                                model
                                  ?.coverage
                                  .cities ??
                                []
                              }
                              onChange={(
                                code,
                                city,
                                supported,
                              ) => {
                                setCountry(
                                  code,
                                )

                                setLocationSupported(
                                  supported,
                                )

                                setProperty(
                                  (
                                    previous,
                                  ) => ({
                                    ...previous,
                                    stadt:
                                      city,
                                  }),
                                )
                              }}
                            />

                            {numericField(
                              'entfernung_bahn',
                              t.station,
                              0,
                              5,
                              0.01,
                              'km',
                            )}
                          </div>
                        </>
                      )}

                      {step ===
                        1 && (
                        <>
                          <h2>
                            {
                              t.propertyTitle
                            }
                          </h2>

                          <p className="section-description">
                            {
                              t.propertyIntro
                            }
                          </p>

                          <div className="fields">
                            {numericField(
                              'flaeche',
                              t.area,
                              30,
                              250,
                              0.1,
                              'm²',
                            )}

                            {numericField(
                              'baujahr',
                              t.year,
                              1950,
                              2022,
                            )}

                            {numericField(
                              'zimmer',
                              t.rooms,
                              1,
                              8,
                            )}

                            {numericField(
                              'schlafzimmer',
                              t.bedrooms,
                              0,
                              5,
                            )}

                            {numericField(
                              'etage',
                              t.floor,
                              0,
                              9,
                            )}
                          </div>

                          <div className="amenities">
                            {(
                              [
                                'garten',
                                'balkon',
                              ] as const
                            ).map(
                              (key) => (
                                <label
                                  className="check-card"
                                  key={
                                    key
                                  }
                                >
                                  <span>
                                    {key ===
                                    'garten'
                                      ? t.garden
                                      : t.balcony}
                                  </span>

                                  <input
                                    type="checkbox"
                                    checked={
                                      property[
                                        key
                                      ] ===
                                      1
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      setProperty(
                                        (
                                          previous,
                                        ) => ({
                                          ...previous,
                                          [key]:
                                            event
                                              .target
                                              .checked
                                              ? 1
                                              : 0,
                                        }),
                                      )
                                    }
                                  />
                                </label>
                              ),
                            )}
                          </div>
                        </>
                      )}

                      {step ===
                        2 && (
                        <>
                          <h2>
                            {
                              t.reviewTitle
                            }
                          </h2>

                          <p className="section-description">
                            {
                              t.reviewIntro
                            }
                          </p>

                          {details(
                            property,
                          )}

                          <div className="notice">
                            <p>
                              {
                                t.disclaimer
                              }
                            </p>
                          </div>
                        </>
                      )}

                      {error && (
                        <p
                          className="form-error"
                          role="alert"
                        >
                          {error ===
                          'rooms'
                            ? t.roomError
                            : t.requestError}
                        </p>
                      )}

                      <div className="form-actions">
                        {step >
                          0 && (
                          <button
                            className="button secondary"
                            type="button"
                            onClick={() => {
                              setStep(
                                (
                                  current,
                                ) =>
                                  Math.max(
                                    0,
                                    current -
                                      1,
                                  ),
                              )

                              setError(
                                null,
                              )
                            }}
                          >
                            {t.back}
                          </button>
                        )}

                        <button
                          className="button primary"
                          type="submit"
                          disabled={
                            !locationSupported
                          }
                        >
                          {busy
                            ? t.calculating
                            : step ===
                                2
                              ? t.calculate
                              : t.next}

                          {!busy && (
                            <Icon
                              name="arrow"
                              size={17}
                            />
                          )}
                        </button>
                      </div>
                    </fieldset>
                  </form>
                </section>

                <aside className="card summary-card">
                  <div
                    className="summary-visual"
                    aria-hidden="true"
                  />

                  <div className="summary-content">
                    <div className="card-title">
                      <Icon name="home" />

                      <h2>
                        {
                          t.yourDetails
                        }
                      </h2>
                    </div>

                    <p className="summary-city">
                      {
                        property.stadt
                      }
                    </p>

                    <p>
                      {new Intl.DisplayNames(
                        [language],
                        {
                          type: 'region',
                        },
                      ).of(
                        country,
                      )}
                      {' · '}
                      {number(
                        property.flaeche,
                        1,
                      )}{' '}
                      m²
                    </p>

                    <hr />

                    <span className="badge">
                      {t.demo}
                    </span>

                    <p className="muted">
                      {t.summary}
                    </p>

                    <button
                      className="text-button"
                      type="button"
                      onClick={() =>
                        navigate(
                          'method',
                        )
                      }
                    >
                      {t.viewMethod}{' '}
                      →
                    </button>
                  </div>
                </aside>
              </div>
            </section>
          )}

        {page === 'estimate' &&
          estimateView ===
            'result' &&
          result && (
            <section className="result-page content-page">
              <div className="content-heading result-heading">
                <div>
                  <p className="eyebrow">
                    {
                      t.resultEyebrow
                    }
                  </p>

                  <h1>
                    {
                      t.resultTitle
                    }
                  </h1>

                  <p className="subtitle">
                    {
                      result
                        .features
                        .stadt
                    }
                    , {t.germany}
                    {' · '}
                    {number(
                      result
                        .features
                        .flaeche,
                      1,
                    )}{' '}
                    m²
                    {' · '}
                    {
                      result
                        .features
                        .zimmer
                    }{' '}
                    {t.rooms.toLowerCase()}
                  </p>
                </div>

                <span className="badge">
                  {t.demo}
                </span>
              </div>

              <div className="result-grid">
                <section className="card price-card">
                  <div className="price-content">
                    <p className="eyebrow">
                      {
                        t.estimatedPrice
                      }
                    </p>

                    <p className="price">
                      {money(
                        result.preis_estimate,
                      )}
                    </p>

                    <p
                      className="price-per-area"
                      aria-label={
                        t.perArea
                      }
                    >
                      {money(
                        result.preis_pro_m2,
                      )}
                      /m²
                    </p>

                    <p className="price-caption">
                      {
                        t.syntheticBasis
                      }
                    </p>
                  </div>
                </section>

                <section className="card result-detail-card">
                  <div className="card-title">
                    <Icon name="home" />

                    <h2>
                      {
                        t.yourProperty
                      }
                    </h2>
                  </div>

                  {details(
                    result.features,
                  )}
                </section>

                <section className="card result-detail-card">
                  <h2>
                    {t.reliability}
                  </h2>

                  <p className="muted">
                    {result.interval_min !==
                      null &&
                    result.interval_max !==
                      null
                      ? `${t.priceRange}: ${money(
                          result.interval_min,
                        )} – ${money(
                          result.interval_max,
                        )}`
                      : t.noInterval}
                  </p>

                  <button
                    className="text-button no-print"
                    type="button"
                    onClick={() =>
                      navigate(
                        'method',
                      )
                    }
                  >
                    {t.viewMethod}{' '}
                    →
                  </button>
                </section>

                <section className="card result-detail-card">
                  <h2>
                    {t.modelInfo}
                  </h2>

                  <dl className="model-details">
                    <div>
                      <dt>
                        {t.model}
                      </dt>

                      <dd>
                        Random Forest
                      </dd>
                    </div>

                    <div>
                      <dt>
                        {
                          t.referenceYear
                        }
                      </dt>

                      <dd>
                        {
                          result.reference_year
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>
                        {t.modelId}
                      </dt>

                      <dd>
                        {
                          result.model_id
                        }
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>

              <div className="result-actions no-print">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => {
                    const {
                      plz: ignoredPostalCode,
                      ...values
                    } =
                      result.features

                    void ignoredPostalCode

                    setCountry(
                      'DE',
                    )

                    setLocationSupported(
                      true,
                    )

                    setProperty(
                      values,
                    )

                    setStep(0)
                    setError(null)

                    setEstimateView(
                      'form',
                    )
                  }}
                >
                  <Icon name="edit" />

                  {t.edit}
                </button>

                <button
                  className="button primary"
                  type="button"
                  onClick={() =>
                    window.print()
                  }
                >
                  <Icon name="print" />

                  {t.print}
                </button>
              </div>

              <p className="print-only">
                {t.disclaimer}{' '}
                {t.noInterval}
              </p>
            </section>
          )}

        {page ===
          'history' && (
          <section className="content-page">
            <div className="content-heading history-heading">
              <div>
                <p className="eyebrow">
                  {t.history}
                </p>

                <h1>
                  {t.historyTitle}
                </h1>

                <p className="subtitle">
                  {history.length}{' '}
                  {
                    t.sessionCount
                  }
                </p>
              </div>

              <button
                className="button primary"
                type="button"
                onClick={
                  newEstimate
                }
              >
                {t.newEstimate}

                <Icon
                  name="arrow"
                  size={17}
                />
              </button>
            </div>

            <p className="session-note">
              {t.sessionNote}
            </p>

            {history.length ===
            0 ? (
              <section className="card empty-state">
                <Icon
                  name="home"
                  size={34}
                />

                <h2>
                  {t.emptyTitle}
                </h2>

                <p>
                  {t.emptyText}
                </p>

                <button
                  className="button primary"
                  type="button"
                  onClick={
                    newEstimate
                  }
                >
                  {
                    t.firstEstimate
                  }

                  <Icon
                    name="arrow"
                    size={17}
                  />
                </button>
              </section>
            ) : (
              <section className="history-grid">
                {history.map(
                  (entry) => (
                    <article
                      className="history-property-card"
                      key={
                        entry.id
                      }
                    >
                      <div
                        className="history-property-image"
                        aria-hidden="true"
                      />

                      <div className="history-property-body">
                        <div>
                          <p className="eyebrow">
                            {
                              t.syntheticBasis
                            }
                          </p>

                          <h2>
                            {
                              entry
                                .prediction
                                .features
                                .stadt
                            }
                          </h2>

                          <p>
                            {
                              t.germany
                            }
                            {' · '}
                            {number(
                              entry
                                .prediction
                                .features
                                .flaeche,
                              1,
                            )}{' '}
                            m²
                          </p>
                        </div>

                        <strong>
                          {money(
                            entry
                              .prediction
                              .preis_estimate,
                          )}
                        </strong>

                        <time
                          dateTime={
                            entry.createdAt
                          }
                        >
                          {new Intl.DateTimeFormat(
                            locale,
                            {
                              dateStyle:
                                'medium',
                              timeStyle:
                                'short',
                            },
                          ).format(
                            new Date(
                              entry.createdAt,
                            ),
                          )}
                        </time>

                        <button
                          className="button secondary"
                          type="button"
                          onClick={() =>
                            openEntry(
                              entry,
                            )
                          }
                        >
                          {t.view}

                          <Icon
                            name="arrow"
                            size={16}
                          />
                        </button>
                      </div>
                    </article>
                  ),
                )}
              </section>
            )}

            {history.length >
              0 && (
              <button
                className="text-button clear-history"
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      t.confirmClear,
                    )
                  ) {
                    setHistory(
                      [],
                    )

                    setSelected(
                      null,
                    )
                  }
                }}
              >
                {t.clear}
              </button>
            )}
          </section>
        )}

        {page ===
          'method' && (
          <section className="content-page method-page">
            <div className="content-heading method-heading">
              <div>
                <p className="eyebrow">
                  {t.method}
                </p>

                <h1>
                  {t.methodTitle}
                </h1>

                <p className="subtitle">
                  {t.methodIntro}
                </p>
              </div>

              <span className="badge">
                {t.demo}
              </span>
            </div>

            <div className="method-grid">
              <section className="card method-card method-blue">
                <p className="eyebrow">
                  {t.dataBasis}
                </p>

                <h2>
                  {t.synthetic}
                </h2>

                <p className="muted">
                  {t.dataText}
                </p>
              </section>

              <section className="card method-card method-violet">
                <p className="eyebrow">
                  {t.model}
                </p>

                <h2>
                  Random Forest
                </h2>

                <p className="muted">
                  {t.modelText}
                </p>
              </section>

              <section className="card method-card method-red">
                <p className="eyebrow">
                  {t.uncertainty}
                </p>

                <h2>
                  {
                    t.noIntervalTitle
                  }
                </h2>

                <p className="muted">
                  {
                    t.uncertaintyText
                  }
                </p>
              </section>
            </div>

            {!model &&
              !modelError && (
                <p role="status">
                  {t.loading}
                </p>
              )}

            {model && (
              <>
                <section className="card performance-card">
                  <h2>
                    {t.performance}
                  </h2>

                  <p className="section-description">
                    {
                      t.performanceText
                    }
                  </p>

                  <div className="metrics-grid">
                    <div>
                      <span>
                        {t.mae}
                      </span>

                      <strong>
                        {metric(
                          'test_mae_eur',
                          true,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        {t.rmse}
                      </span>

                      <strong>
                        {metric(
                          'test_rmse_eur',
                          true,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        {t.r2}
                      </span>

                      <strong>
                        {metric(
                          'test_r2',
                          false,
                          3,
                        )}
                      </strong>
                    </div>
                  </div>

                  <p className="muted">
                    {metric(
                      'train_samples',
                    )}{' '}
                    {t.training}
                    {' · '}
                    {metric(
                      'test_samples',
                    )}{' '}
                    {t.testing}
                  </p>
                </section>

                <div className="method-bottom-grid">
                  <section className="card">
                    <h2>
                      {t.supported}
                    </h2>

                    <dl className="model-details">
                      <div>
                        <dt>
                          {t.country}
                        </dt>

                        <dd>
                          {t.germany}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          {t.cities}
                        </dt>

                        <dd>
                          {model.coverage.cities.join(
                            ', ',
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          {t.area}
                        </dt>

                        <dd>
                          {model.coverage.area_m2.join(
                            '–',
                          )}{' '}
                          m²
                        </dd>
                      </div>

                      <div>
                        <dt>
                          {t.year}
                        </dt>

                        <dd>
                          {model.coverage.year_built.join(
                            '–',
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          {
                            t.referenceYear
                          }
                        </dt>

                        <dd>
                          {
                            model.reference_year
                          }
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section className="card">
                    <h2>
                      {t.limitations}
                    </h2>

                    <p className="muted">
                      {
                        t.limitationsText
                      }
                    </p>

                    <p className="muted">
                      {
                        t.disclaimer
                      }
                    </p>

                    <p className="model-id">
                      {t.modelId}:{' '}
                      {model.model_id}
                    </p>
                  </section>
                </div>
              </>
            )}
          </section>
        )}
      </main>

      <footer className="site-footer">
        <span>
          © {currentYear}{' '}
          Pascal C. Nague
        </span>

        <span>
          ImmoLens · {t.footer}
        </span>
      </footer>
    </div>
  )
}

export default App