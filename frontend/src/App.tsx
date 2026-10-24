import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { getModel, predict } from './services/api'
import LocationPicker from './components/LocationPicker'
import type { ModelInfo, Prediction, Property } from './services/api'

type Language = 'de' | 'en'
type Theme = 'light' | 'dark'
type Page = 'estimate' | 'history' | 'method'
type Entry = {
  id: string
  createdAt: string
  prediction: Prediction
}

const translations = {
  de: {
    estimate: 'Schätzung',
    history: 'Verlauf',
    method: 'Methodik',
    skip: 'Zum Inhalt',
    navigation: 'Hauptnavigation',
    language: 'Sprache',
    dark: 'Dunkles Design aktivieren',
    light: 'Helles Design aktivieren',
    menu: 'Menü',
    title: 'Was ist Ihre Immobilie wert?',
    intro: 'Beschreiben Sie Ihr Objekt. Wir berechnen eine erste Schätzung.',
    demo: 'Demodaten',
    location: 'Standort',
    property: 'Immobilie',
    review: 'Prüfen',
    locationTitle: 'Wo liegt Ihre Immobilie?',
    locationIntro: 'Wählen Sie einen vom aktuellen Modell unterstützten Standort.',
    country: 'Land',
    germany: 'Deutschland',
    city: 'Stadt',
    coverageNote: 'Aktuell verfügbar: Deutschland. Weitere Länder benötigen eigene Daten und ein dafür trainiertes Modell.',
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
    disclaimer: 'Das Modell wurde mit synthetischen Daten trainiert. Das Ergebnis ist eine Demonstration und keine Bewertung des tatsächlichen Marktwerts.',
    back: 'Zurück',
    next: 'Weiter',
    calculate: 'Schätzung berechnen',
    calculating: 'Wird berechnet …',
    yourDetails: 'Ihre Angaben',
    summary: 'Eine Modellschätzung auf Basis synthetischer Immobiliendaten.',
    viewMethod: 'Methodik ansehen',
    loading: 'Modelldaten werden geladen …',
    connection: 'Verbindung zum Modell nicht verfügbar',
    connectionHelp: 'Prüfen Sie, ob die API läuft und die Route /model verfügbar ist.',
    retry: 'Erneut versuchen',
    roomError: 'Die Anzahl der Schlafzimmer darf die Zimmeranzahl nicht überschreiten.',
    requestError: 'Die Schätzung konnte nicht berechnet werden. Prüfen Sie die Verbindung und Ihre Angaben.',
    resultTitle: 'Ihre Immobilie. Klar eingeschätzt.',
    result: 'Ergebnis',
    estimatedPrice: 'Geschätzter Kaufpreis',
    perArea: 'Preis pro Quadratmeter',
    syntheticBasis: 'Auf Basis synthetischer Daten',
    yourProperty: 'Ihr Objekt',
    reliability: 'Wie belastbar ist die Schätzung?',
    noInterval: 'Für dieses Modell ist noch kein kalibriertes Preisintervall verfügbar.',
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
    sessionNote: 'Der Verlauf bleibt nur in dieser Sitzung erhalten. Beim Neuladen oder Schließen der Seite wird er gelöscht.',
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
    dataText: 'Das Modell lernt aus künstlich erzeugten Immobiliendaten. Reale Kaufverträge oder aktuelle Marktangebote sind nicht enthalten.',
    modelText: 'Mehrere Entscheidungsbäume berechnen gemeinsam eine Preisschätzung. Beim Training und bei der Vorhersage wird dieselbe gespeicherte Datenverarbeitung verwendet.',
    uncertainty: 'Unsicherheit',
    noIntervalTitle: 'Kein kalibriertes Preisintervall',
    uncertaintyText: 'Der angezeigte Preis ist eine einzelne Modellschätzung. Die Genauigkeit auf realen Immobilien ist nicht nachgewiesen.',
    performance: 'Modellleistung',
    performanceText: 'Auswertung auf synthetischen Testdaten. Diese Werte belegen keine Genauigkeit auf dem realen Immobilienmarkt.',
    mae: 'Mittlerer absoluter Fehler (MAE)',
    rmse: 'Wurzel des mittleren quadratischen Fehlers (RMSE)',
    r2: 'Bestimmtheitsmaß (R²)',
    training: 'Trainingsobjekte',
    testing: 'Testobjekte',
    supported: 'Unterstützte Eingaben',
    cities: 'Städte',
    limitations: 'Was das Modell nicht berücksichtigt',
    limitationsText: 'Zum Beispiel den tatsächlichen Gebäudezustand, die Energieeffizienz, eine konkrete Adresse oder aktuelle lokale Marktbewegungen.',
    notAvailable: 'Nicht verfügbar',
    yes: 'Ja',
    no: 'Nein',
    footer: 'Demo mit synthetischen Daten',
  },
  en: {
    estimate: 'Estimate',
    history: 'History',
    method: 'Methodology',
    skip: 'Skip to content',
    navigation: 'Main navigation',
    language: 'Language',
    dark: 'Switch to dark theme',
    light: 'Switch to light theme',
    menu: 'Menu',
    title: 'What is your property worth?',
    intro: 'Describe your property to calculate an initial estimate.',
    demo: 'Demo data',
    location: 'Location',
    property: 'Property',
    review: 'Review',
    locationTitle: 'Where is your property?',
    locationIntro: 'Choose a location supported by the current model.',
    country: 'Country',
    germany: 'Germany',
    city: 'City',
    coverageNote: 'Currently available: Germany. Additional countries require suitable data and a model trained for those markets.',
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
    disclaimer: 'The model was trained on synthetic data. This result is a demonstration, not an appraisal of actual market value.',
    back: 'Back',
    next: 'Continue',
    calculate: 'Calculate estimate',
    calculating: 'Calculating …',
    yourDetails: 'Your details',
    summary: 'A model estimate based on synthetic property data.',
    viewMethod: 'View methodology',
    loading: 'Loading model information …',
    connection: 'Model connection unavailable',
    connectionHelp: 'Check that the API is running and the /model endpoint is available.',
    retry: 'Try again',
    roomError: 'The number of bedrooms cannot exceed the total number of rooms.',
    requestError: 'The estimate could not be calculated. Check your connection and property details.',
    resultTitle: 'Your property. Clearly estimated.',
    result: 'Result',
    estimatedPrice: 'Estimated purchase price',
    perArea: 'Price per square metre',
    syntheticBasis: 'Based on synthetic data',
    yourProperty: 'Your property',
    reliability: 'How reliable is this estimate?',
    noInterval: 'A calibrated price interval is not yet available for this model.',
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
    sessionNote: 'History is kept only during this session. Reloading or closing the page clears it.',
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
    dataText: 'The model learns from artificially generated property data. It does not include actual sale contracts or current listings.',
    modelText: 'Multiple decision trees work together to estimate a price. Training and prediction use the same saved preprocessing pipeline.',
    uncertainty: 'Uncertainty',
    noIntervalTitle: 'No calibrated price interval',
    uncertaintyText: 'The displayed price is a single model estimate. Its accuracy on real properties has not been established.',
    performance: 'Model performance',
    performanceText: 'Evaluation on synthetic test data. These metrics do not establish accuracy in the real property market.',
    mae: 'Mean absolute error (MAE)',
    rmse: 'Root mean squared error (RMSE)',
    r2: 'Coefficient of determination (R²)',
    training: 'training properties',
    testing: 'test properties',
    supported: 'Supported inputs',
    cities: 'Cities',
    limitations: 'What the model does not consider',
    limitationsText: 'For example, actual building condition, energy efficiency, a precise address or current local market changes.',
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
    // Preferences remain usable when browser storage is unavailable.
  }
}

type IconName = 'menu' | 'home' | 'sun' | 'moon' | 'print' | 'edit'

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    menu: 'M4 6h16M4 12h16M4 18h16',
    home: 'M3 10 12 3l9 7M5 9v12h14V9M9 21v-8h6v8',
    sun: 'M12 3V1M12 23v-2M3 12H1M23 12h-2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
    moon: 'M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z',
    print: 'M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7Z',
    edit: 'm15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z',
  }

  return (
    <svg
      width="20"
      height="20"
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
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = readPreference('immolens.theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  const [page, setPage] = useState<Page>('estimate')
  const [menuOpen, setMenuOpen] = useState(false)
  const [model, setModel] = useState<ModelInfo | null>(null)
  const [modelError, setModelError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [property, setProperty] = useState<Property>(initialProperty)
  const [country, setCountry] = useState('DE')
  const [locationSupported, setLocationSupported] = useState(true)
  const [step, setStep] = useState(0)
  const [editing, setEditing] = useState(true)
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const [error, setError] = useState<'rooms' | 'request' | null>(null)
  const [history, setHistory] = useState<Entry[]>([])
  const [selected, setSelected] = useState<Entry | null>(null)

  const t = translations[language]
  const locale = language === 'de' ? 'de-DE' : 'en-GB'
  const result = selected?.prediction

  const money = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)

  const number = (value: number, digits = 0) =>
    new Intl.NumberFormat(locale, {
      maximumFractionDigits: digits,
    }).format(value)

  useEffect(() => {
    document.documentElement.lang = language
    document.title = `ImmoLens | ${translations[language].estimate}`
    savePreference('immolens.language', language)
  }, [language])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    savePreference('immolens.theme', theme)
  }, [theme])

  useEffect(() => {
    const controller = new AbortController()
    getModel(controller.signal)
      .then((info) => {
        setModel(info)
        setModelError(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) setModelError(true)
      })
    return () => controller.abort()
  }, [retry])

  function navigate(nextPage: Page) {
    setPage(nextPage)
    setMenuOpen(false)
  }

  function newEstimate() {
    setCountry('DE')
    setLocationSupported(true)
    setProperty({ ...initialProperty })
    setStep(0)
    setError(null)
    setEditing(true)
    navigate('estimate')
  }

  function openEntry(entry: Entry) {
    setSelected(entry)
    setEditing(false)
    navigate('estimate')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || !locationSupported) return
    setError(null)

    if (property.schlafzimmer > property.zimmer) {
      setError('rooms')
      return
    }

    if (step < 2) {
      setStep(step + 1)
      return
    }

    pending.current = true
    setBusy(true)
    try {
      const prediction = await predict(property)
      const entry: Entry = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        prediction,
      }
      setHistory((previous) => [entry, ...previous])
      setSelected(entry)
      setEditing(false)
    } catch {
      setError('request')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  function details(value: Property) {
    const rows: [string, string | number][] = [
      [t.country, t.germany],
      [t.city, value.stadt],
      [t.area, `${number(value.flaeche, 1)} m²`],
      [t.rooms, value.zimmer],
      [t.bedrooms, value.schlafzimmer],
      [t.year, value.baujahr],
      [t.floor, value.etage],
      [t.station, `${number(value.entfernung_bahn, 2)} km`],
      [t.garden, value.garten ? t.yes : t.no],
      [t.balcony, value.balkon ? t.yes : t.no],
    ]
    return (
      <dl className="property-details">
        {rows.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>
    )
  }

  function numericField(
    key: Exclude<keyof Property, 'stadt'>,
    label: string,
    minimum: number,
    maximum: number,
    increment = 1,
    unit = '',
  ) {
    return (
      <label className="field" htmlFor={key}>
        <span>{label}</span>
        <span className="input-wrap">
          <input
            id={key}
            type="number"
            required
            min={minimum}
            max={maximum}
            step={increment}
            value={Number.isFinite(property[key]) ? property[key] : ''}
            onChange={(event) => {
              const value = event.currentTarget.valueAsNumber
              setProperty((previous) => ({ ...previous, [key]: value }))
            }}
          />
          {unit && <span className="input-unit">{unit}</span>}
        </span>
        <small>{minimum}–{maximum}{unit ? ` ${unit}` : ''}</small>
      </label>
    )
  }

  function metric(key: string, currency = false, digits = 0) {
    const value = model?.metrics[key]
    return typeof value === 'number' && Number.isFinite(value)
      ? currency ? money(value) : number(value, digits)
      : t.notAvailable
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">{t.skip}</a>
      <header className="site-header">
        <button className="brand" type="button" onClick={() => navigate('estimate')}>
          <img src="/brand/immolens-logo.png" alt="" />
          <span>ImmoLens</span>
        </button>

        <nav
          id="main-navigation"
          className={`navigation ${menuOpen ? 'is-open' : ''}`}
          aria-label={t.navigation}
        >
          {(['estimate', 'history', 'method'] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={page === item ? 'active' : ''}
              aria-current={page === item ? 'page' : undefined}
              onClick={() => navigate(item)}
            >
              {t[item]}
            </button>
          ))}
        </nav>

        <div className="header-tools">
          <label className="sr-only" htmlFor="language">{t.language}</label>
          <select
            id="language"
            className="language-select"
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
          >
            <option value="de" lang="de">DE</option>
            <option value="en" lang="en">EN</option>
          </select>

          <button
            className="icon-button"
            type="button"
            aria-label={theme === 'light' ? t.dark : t.light}
            title={theme === 'light' ? t.dark : t.light}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} />
          </button>

          <button
            className="icon-button menu-button"
            type="button"
            aria-label={t.menu}
            aria-controls="main-navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>

      <main id="main">
        {modelError && (
          <div className="service-message no-print" role="alert">
            <div><strong>{t.connection}</strong><p>{t.connectionHelp}</p></div>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setModelError(false)
                setRetry((value) => value + 1)
              }}
            >
              {t.retry}
            </button>
          </div>
        )}

        {page === 'estimate' && editing && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">{t.estimate}</p>
                <h1>{t.title}</h1>
                <p className="subtitle">{t.intro}</p>
              </div>
              <span className="badge">{t.demo}</span>
            </div>

            <div className="form-layout">
              <section className="card form-card">
                <ol className="steps">
                  {[t.location, t.property, t.review].map((label, index) => (
                    <li
                      key={index}
                      className={index === step ? 'current' : index < step ? 'done' : ''}
                      aria-current={index === step ? 'step' : undefined}
                    >
                      <span>{index + 1}</span>{label}
                    </li>
                  ))}
                </ol>
                {!model && !modelError && <p role="status">{t.loading}</p>}

                <form onSubmit={submit}>
                  <fieldset disabled={busy || !model}>
                    <legend className="sr-only">
                      {[t.location, t.property, t.review][step]}
                    </legend>

                    {step === 0 && (
                      <>
                        <h2>{t.locationTitle}</h2>
                        <p className="section-description">{t.locationIntro}</p>
                        <div className="fields">
                          <LocationPicker
                            key="location-picker"
                            language={language}
                            country={country}
                            cityName={property.stadt}
                            supportedCities={model?.coverage.cities ?? []}
                            onChange={(code, city, supported) => {
                              setCountry(code)
                              setLocationSupported(supported)
                              setProperty((previous) => ({ ...previous, stadt: city }))
                            }}
                          />
                          {numericField('entfernung_bahn', t.station, 0, 5, 0.01, 'km')}
                        </div>
                        
                      </>
                    )}

                    {step === 1 && (
                      <>
                        <h2>{t.propertyTitle}</h2>
                        <p className="section-description">{t.propertyIntro}</p>
                        <div className="fields">
                          {numericField('flaeche', t.area, 30, 250, 0.1, 'm²')}
                          {numericField('baujahr', t.year, 1950, 2022)}
                          {numericField('zimmer', t.rooms, 1, 8)}
                          {numericField('schlafzimmer', t.bedrooms, 0, 5)}
                          {numericField('etage', t.floor, 0, 9)}
                        </div>
                        <div className="amenities">
                          {(['garten', 'balkon'] as const).map((key) => (
                            <label className="check-card" key={key}>
                              <span>{key === 'garten' ? t.garden : t.balcony}</span>
                              <input
                                type="checkbox"
                                checked={property[key] === 1}
                                onChange={(event) =>
                                  setProperty({ ...property, [key]: event.target.checked ? 1 : 0 })
                                }
                              />
                            </label>
                          ))}
                        </div>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <h2>{t.reviewTitle}</h2>
                        <p className="section-description">{t.reviewIntro}</p>
                        {details(property)}
                        <div className="notice"><p>{t.disclaimer}</p></div>
                      </>
                    )}

                    {error && (
                      <p className="form-error" role="alert">
                        {error === 'rooms' ? t.roomError : t.requestError}
                      </p>
                    )}

                    <div className="form-actions">
                      {step > 0 && (
                        <button
                          className="button secondary"
                          type="button"
                          onClick={() => {
                            setStep(step - 1)
                            setError(null)
                          }}
                        >
                          {t.back}
                        </button>
                      )}
                      <button className="button primary" type="submit" disabled={!locationSupported}>
                        {busy ? t.calculating : step === 2 ? t.calculate : t.next}
                      </button>
                    </div>
                  </fieldset>
                </form>
              </section>

              <aside className="card summary-card">
                <div className="card-title"><Icon name="home" /><h2>{t.yourDetails}</h2></div>
                <p className="summary-city">{property.stadt}</p>
                <p>{new Intl.DisplayNames([language], { type: 'region' }).of(country)} · {number(property.flaeche, 1)} m²</p>
                <hr />
                <span className="badge">{t.demo}</span>
                <p className="muted">{t.summary}</p>
                <button className="text-button" type="button" onClick={() => navigate('method')}>
                  {t.viewMethod} →
                </button>
              </aside>
            </div>
          </>
        )}

        {page === 'estimate' && !editing && result && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">{t.estimate} / {t.result}</p>
                <h1>{t.resultTitle}</h1>
                <p className="subtitle">
                  {result.features.stadt}, {t.germany} · {number(result.features.flaeche, 1)} m²
                  {' · '}{result.features.zimmer} {t.rooms.toLowerCase()}
                </p>
              </div>
              <span className="badge">{t.demo}</span>
            </div>

            <div className="result-grid">
              <section className="card price-card">
                <p className="eyebrow">{t.estimatedPrice}</p>
                <p className="price">{money(result.preis_estimate)}</p>
                <p className="price-per-area" aria-label={t.perArea}>
                  {money(result.preis_pro_m2)}/m²
                </p>
                <p className="price-caption">{t.syntheticBasis}</p>
              </section>
              <section className="card">
                <div className="card-title"><Icon name="home" /><h2>{t.yourProperty}</h2></div>
                {details(result.features)}
              </section>
              <section className="card">
                <h2>{t.reliability}</h2>
                <p className="muted">
                  {result.interval_min !== null && result.interval_max !== null
                    ? `${t.priceRange}: ${money(result.interval_min)} – ${money(result.interval_max)}`
                    : t.noInterval}
                </p>
                <button
                  className="text-button no-print"
                  type="button"
                  onClick={() => navigate('method')}
                >
                  {t.viewMethod} →
                </button>
              </section>
              <section className="card">
                <h2>{t.modelInfo}</h2>
                <dl className="model-details">
                  <div><dt>{t.model}</dt><dd>Random Forest</dd></div>
                  <div><dt>{t.referenceYear}</dt><dd>{result.reference_year}</dd></div>
                  <div><dt>{t.modelId}</dt><dd>{result.model_id}</dd></div>
                </dl>
              </section>
            </div>

            <div className="result-actions no-print">
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  const { plz: ignoredPostalCode, ...values } = result.features
                  void ignoredPostalCode
                  setCountry('DE')
                  setLocationSupported(true)
                  setProperty(values)
                  setStep(0)
                  setError(null)
                  setEditing(true)
                }}
              >
                <Icon name="edit" />{t.edit}
              </button>
              <button className="button primary" type="button" onClick={() => window.print()}>
                <Icon name="print" />{t.print}
              </button>
            </div>
            <p className="print-only">{t.disclaimer} {t.noInterval}</p>
          </>
        )}

        {page === 'history' && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">{t.history}</p>
                <h1>{t.historyTitle}</h1>
                <p className="subtitle">{history.length} {t.sessionCount}</p>
              </div>
              <button className="button primary" type="button" onClick={newEstimate}>
                {t.newEstimate}
              </button>
            </div>
            <p className="session-note">{t.sessionNote}</p>

            {history.length === 0 ? (
              <section className="card empty-state">
                <Icon name="home" /><h2>{t.emptyTitle}</h2><p>{t.emptyText}</p>
                <button className="button primary" type="button" onClick={newEstimate}>
                  {t.firstEstimate}
                </button>
              </section>
            ) : (
              <section className="card history-card">
                {history.map((entry) => (
                  <article className="history-row" key={entry.id}>
                    <div>
                      <h2>{entry.prediction.features.stadt}</h2>
                      <p>{t.germany} · {number(entry.prediction.features.flaeche, 1)} m²</p>
                    </div>
                    <time dateTime={entry.createdAt}>
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(entry.createdAt))}
                    </time>
                    <div className="history-price">
                      <strong>{money(entry.prediction.preis_estimate)}</strong>
                      <span>{t.demo}</span>
                    </div>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => openEntry(entry)}
                    >
                      {t.view}
                    </button>
                  </article>
                ))}
              </section>
            )}

            {history.length > 0 && (
              <button
                className="text-button clear-history"
                type="button"
                onClick={() => {
                  if (window.confirm(t.confirmClear)) {
                    setHistory([])
                    setSelected(null)
                    setEditing(true)
                  }
                }}
              >
                {t.clear}
              </button>
            )}
          </>
        )}

        {page === 'method' && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">{t.method}</p>
                <h1>{t.methodTitle}</h1>
                <p className="subtitle">{t.methodIntro}</p>
              </div>
              <span className="badge">{t.demo}</span>
            </div>

            <div className="method-grid">
              <section className="card">
                <p className="eyebrow">{t.dataBasis}</p>
                <h2>{t.synthetic}</h2><p className="muted">{t.dataText}</p>
              </section>
              <section className="card">
                <p className="eyebrow">{t.model}</p>
                <h2>Random Forest</h2><p className="muted">{t.modelText}</p>
              </section>
              <section className="card">
                <p className="eyebrow">{t.uncertainty}</p>
                <h2>{t.noIntervalTitle}</h2><p className="muted">{t.uncertaintyText}</p>
              </section>
            </div>

            {!model && !modelError && <p role="status">{t.loading}</p>}
            {model && (
              <>
                <section className="card performance-card">
                  <h2>{t.performance}</h2>
                  <p className="section-description">{t.performanceText}</p>
                  <div className="metrics-grid">
                    <div><span>{t.mae}</span><strong>{metric('test_mae_eur', true)}</strong></div>
                    <div><span>{t.rmse}</span><strong>{metric('test_rmse_eur', true)}</strong></div>
                    <div><span>{t.r2}</span><strong>{metric('test_r2', false, 3)}</strong></div>
                  </div>
                  <p className="muted">
                    {metric('train_samples')} {t.training} · {metric('test_samples')} {t.testing}
                  </p>
                </section>
                <div className="method-bottom-grid">
                  <section className="card">
                    <h2>{t.supported}</h2>
                    <dl className="model-details">
                      <div><dt>{t.country}</dt><dd>{t.germany}</dd></div>
                      <div><dt>{t.cities}</dt><dd>{model.coverage.cities.join(', ')}</dd></div>
                      <div><dt>{t.area}</dt><dd>{model.coverage.area_m2.join('–')} m²</dd></div>
                      <div><dt>{t.year}</dt><dd>{model.coverage.year_built.join('–')}</dd></div>
                      <div><dt>{t.referenceYear}</dt><dd>{model.reference_year}</dd></div>
                    </dl>
                  </section>
                  <section className="card">
                    <h2>{t.limitations}</h2>
                    <p className="muted">{t.limitationsText}</p>
                    <p className="muted">{t.disclaimer}</p>
                    <p className="model-id">{t.modelId}: {model.model_id}</p>
                  </section>
                </div>
              </>
            )}
          </>
        )}
      </main>

      <footer className="site-footer">
        <span>© {currentYear} Pascal C. Nague</span>
        <span>ImmoLens · {t.footer}</span>
      </footer>
    </div>
  )
}

export default App
