import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { getModel, predict } from './services/api'
import type {
  ModelInfo,
  Prediction,
  Property,
} from './services/api'

type Page = 'estimate' | 'history' | 'method'

type Entry = {
  id: string
  created: string
  prediction: Prediction
}

const copyrightYear = new Date().getFullYear()

const initial: Property = {
  flaeche: 85,
  zimmer: 4,
  schlafzimmer: 2,
  etage: 2,
  stadt: 'Berlin',
  baujahr: 2010,
  entfernung_bahn: 0.5,
  garten: 1,
  balkon: 1,
}

const money = (value: number) =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)

const number = (value: number, digits = 0) =>
  new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: digits,
  }).format(value)

const date = (value: string) =>
  new Date(value).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

const paths = {
  home: 'M3 10 12 3l9 7M5 9v12h14V9M9 21v-7h6v7',
  menu: 'M4 6h16M4 12h16M4 18h16',
  edit: 'm4 16-1 5 5-1L21 7l-4-4L4 16ZM14 6l4 4',
  print: 'M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6z',
  plus: 'M12 4v16M4 12h16',
  info: 'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  chart: 'M4 20V10h4v10M10 20V5h4v15M16 20V2h4v18',
  model: 'M12 3v7M5 14v-4h14v4M3 14h4v5H3zM17 14h4v5h-4z',
} as const

function Icon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}

function Details({ property: p }: { property: Property }) {
  const rows = [
    ['Wohnfläche', `${number(p.flaeche, 1)} m²`],
    ['Zimmer', p.zimmer],
    ['Schlafzimmer', p.schlafzimmer],
    ['Baujahr', p.baujahr],
    ['Etage', p.etage],
    ['Bahnhof', `${number(p.entfernung_bahn, 1)} km`],
  ]

  return (
    <>
      <dl className="details">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="chips">
        <span>Garten: {p.garten ? 'Ja' : 'Nein'}</span>
        <span>Balkon: {p.balkon ? 'Ja' : 'Nein'}</span>
      </div>
    </>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('estimate')
  const [menu, setMenu] = useState(false)
  const [model, setModel] = useState<ModelInfo | null>(null)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)

  const [draft, setDraft] = useState<Property>(initial)
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const [error, setError] = useState('')

  const [history, setHistory] = useState<Entry[]>([])
  const [selected, setSelected] = useState<Entry | null>(null)
  const [editing, setEditing] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    getModel(controller.signal)
      .then((data) => {
        setModel(data)
        setLoadError('')

        setDraft((old) => ({
          ...old,
          stadt: data.coverage.cities.includes(old.stadt)
            ? old.stadt
            : data.coverage.cities[0],
        }))
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(
            reason instanceof Error
              ? reason.message
              : 'Verbindung fehlgeschlagen.',
          )
        }
      })

    return () => controller.abort()
  }, [attempt])

  function navigate(next: Page) {
    setPage(next)
    setMenu(false)
  }

  function newEstimate() {
    setDraft({
      ...initial,
      stadt: model?.coverage.cities[0] ?? 'Berlin',
    })
    setStep(0)
    setError('')
    setEditing(true)
    navigate('estimate')
  }

  function open(entry: Entry) {
    setSelected(entry)
    setEditing(false)
    navigate('estimate')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pending.current) return

    setError('')

    if (draft.schlafzimmer > draft.zimmer) {
      setError(
        'Die Zahl der Schlafzimmer darf die Zimmerzahl nicht überschreiten.',
      )
      return
    }

    if (step < 2) {
      setStep(step + 1)
      return
    }

    pending.current = true
    setBusy(true)

    try {
      const prediction = await predict(draft)

      const entry = {
        id: crypto.randomUUID(),
        created: new Date().toISOString(),
        prediction,
      }

      setHistory((old) => [entry, ...old])
      setSelected(entry)
      setEditing(false)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Die Berechnung ist fehlgeschlagen.',
      )
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  function field(
    key: keyof Omit<Property, 'stadt'>,
    label: string,
    min: number,
    max: number,
    increment = 1,
  ) {
    return (
      <label className="field" key={key}>
        {label}

        <input
          type="number"
          required
          min={min}
          max={max}
          step={increment}
          value={Number.isNaN(draft[key]) ? '' : draft[key]}
          onChange={(event) =>
            setDraft({
              ...draft,
              [key]: event.currentTarget.valueAsNumber,
            })
          }
        />

        <small>{min}–{max}</small>
      </label>
    )
  }

  const result = selected?.prediction

  const nav = [
    ['estimate', 'Schätzung'],
    ['history', 'Verlauf'],
    ['method', 'Methodik'],
  ] as const

  return (
    <div className="app-shell">
      <a className="skip" href="#content">
        Zum Inhalt
      </a>

      <header className="header">
        <button
          className="brand"
          onClick={() => navigate('estimate')}
          aria-label="ImmoLens Startseite"
        >
          <img src="/brand/immolens-logo.png" alt="" />
          <span>ImmoLens</span>
        </button>

        <button
          className="menu-button"
          aria-label="Menü"
          aria-expanded={menu}
          aria-controls="navigation"
          onClick={() => setMenu(!menu)}
        >
          <Icon name="menu" />
        </button>

        <nav
          id="navigation"
          className={menu ? 'navigation is-open' : 'navigation'}
          aria-label="Hauptnavigation"
        >
          {nav.map(([key, label]) => (
            <button
              key={key}
              aria-current={page === key ? 'page' : undefined}
              onClick={() => navigate(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <span className="language" aria-label="Sprache Deutsch">
          DE
        </span>
      </header>

      <main id="content">
        {loadError && (
          <div className="notice error no-print" role="alert">
            <span>{loadError}</span>

            <button
              className="button secondary"
              onClick={() => {
                setLoadError('')
                setAttempt(attempt + 1)
              }}
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {page === 'estimate' && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">
                  Schätzung / {editing ? 'Angaben' : 'Ergebnis'}
                </p>

                <h1>
                  {editing
                    ? 'Was ist Ihre Immobilie wert?'
                    : 'Ihre Immobilie. Klar eingeschätzt.'}
                </h1>

                <p className="subtitle">
                  {editing
                    ? 'Beschreiben Sie Ihr Objekt. Wir berechnen eine erste Einschätzung.'
                    : `${result?.features.stadt} · ${result?.features.flaeche} m² · ${result?.features.zimmer} Zimmer`}
                </p>
              </div>

              <span className="badge">Demodaten</span>
            </div>

            {editing ? (
              <form className="form-layout" onSubmit={submit}>
                <section className="card">
                  <ol className="steps">
                    {['Standort', 'Immobilie', 'Prüfen'].map(
                      (label, index) => (
                        <li
                          key={label}
                          aria-current={index === step ? 'step' : undefined}
                        >
                          <span>{index + 1}</span>
                          {label}
                        </li>
                      ),
                    )}
                  </ol>

                  <fieldset disabled={busy || !model}>
                    <legend className="sr-only">
                      Immobilienangaben
                    </legend>

                    {step === 0 && (
                      <div className="fields">
                        <label className="field">
                          Stadt

                          <select
                            value={draft.stadt}
                            required
                            onChange={(event) =>
                              setDraft({
                                ...draft,
                                stadt: event.target.value,
                              })
                            }
                          >
                            {!model && (
                              <option value={draft.stadt}>
                                Wird geladen…
                              </option>
                            )}

                            {model?.coverage.cities.map((city) => (
                              <option key={city}>{city}</option>
                            ))}
                          </select>

                          <small>Unterstützte Städte in Deutschland</small>
                        </label>

                        {field(
                          'entfernung_bahn',
                          'Entfernung zum Bahnhof (km)',
                          0,
                          5,
                          0.1,
                        )}
                      </div>
                    )}

                    {step === 1 && (
                      <>
                        <div className="fields">
                          {field('flaeche', 'Wohnfläche (m²)', 30, 250, 0.1)}
                          {field('baujahr', 'Baujahr', 1950, 2022)}
                          {field('zimmer', 'Zimmer', 1, 8)}

                          {field(
                            'schlafzimmer',
                            'Schlafzimmer',
                            0,
                            Math.min(5, draft.zimmer),
                          )}

                          {field('etage', 'Etage', 0, 9)}
                        </div>

                        <div className="checks">
                          {(['garten', 'balkon'] as const).map((key) => (
                            <label key={key}>
                              <input
                                type="checkbox"
                                checked={Boolean(draft[key])}
                                onChange={(event) =>
                                  setDraft({
                                    ...draft,
                                    [key]: Number(event.target.checked),
                                  })
                                }
                              />

                              {key === 'garten' ? 'Garten' : 'Balkon'}
                            </label>
                          ))}
                        </div>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <h2>Ihre Angaben prüfen</h2>
                        <p>{draft.stadt}</p>
                        <Details property={draft} />
                      </>
                    )}

                    {error && (
                      <p className="notice error" role="alert">
                        {error}
                      </p>
                    )}

                    <div className="actions form-actions">
                      {step > 0 && (
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => setStep(step - 1)}
                        >
                          Zurück
                        </button>
                      )}

                      <button type="submit" className="button primary">
                        {busy
                          ? 'Wird berechnet…'
                          : step === 2
                            ? 'Preis schätzen'
                            : 'Weiter'}
                      </button>
                    </div>
                  </fieldset>

                  {!model && !loadError && (
                    <p role="status">
                      Modellinformationen werden geladen…
                    </p>
                  )}
                </section>

                <aside className="card summary">
                  <Icon name="home" />
                  <h2>Ihre Angaben</h2>
                  <p>{draft.stadt}</p>

                  <p>
                    {number(draft.flaeche || 0, 1)} m² ·{' '}
                    {draft.zimmer || 0} Zimmer
                  </p>

                  <hr />

                  <span className="badge">Demodaten</span>

                  <p className="muted">
                    Diese Schätzung basiert auf synthetischen Daten
                    und ist keine Immobilienbewertung.
                  </p>
                </aside>
              </form>
            ) : result && selected && (
              <div className="result">
                <div className="result-grid">
                  <section className="card price-card">
                    <p className="eyebrow">Geschätzter Kaufpreis</p>

                    <div className="price">
                      {money(result.preis_estimate)}
                    </div>

                    <p className="per-area">
                      {money(result.preis_pro_m2)}/m²
                    </p>

                    <hr />

                    <p className="muted">
                      Auf Basis synthetischer Daten ·{' '}
                      {date(selected.created)}
                    </p>
                  </section>

                  <section className="card">
                    <h2>
                      <Icon name="home" />
                      Ihr Objekt
                    </h2>

                    <Details property={result.features} />
                  </section>

                  <section className="card">
                    <h2>
                      <Icon name="info" />
                      Wie belastbar ist die Schätzung?
                    </h2>

                    <p>
                      {result.interval_min !== null &&
                      result.interval_max !== null
                        ? `${money(result.interval_min)} – ${money(result.interval_max)}`
                        : 'Für dieses Modell ist noch kein kalibriertes Preisintervall verfügbar.'}
                    </p>

                    <button
                      className="text-button no-print"
                      onClick={() => navigate('method')}
                    >
                      Methodik ansehen →
                    </button>
                  </section>

                  <section className="card">
                    <h2>
                      <Icon name="model" />
                      Modellgrundlage
                    </h2>

                    <p>Random Forest · Synthetische Daten</p>

                    <p className="muted model-id">
                      {result.model_id}
                    </p>

                    <p className="muted">
                      Referenzjahr: {result.reference_year}
                    </p>
                  </section>
                </div>

                <div className="actions no-print">
                  <button
                    className="button secondary"
                    onClick={() => {
                      setDraft({ ...result.features })
                      setStep(0)
                      setError('')
                      setEditing(true)
                    }}
                  >
                    <Icon name="edit" />
                    Angaben bearbeiten
                  </button>

                  <button
                    className="button primary"
                    onClick={() => window.print()}
                  >
                    <Icon name="print" />
                    Drucken / PDF
                  </button>
                </div>

                <p className="print-only">
                  ImmoLens · Beispielberechnung mit synthetischen Daten.
                  Keine Immobilienbewertung.
                </p>
              </div>
            )}
          </>
        )}

        {page === 'history' && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">Verlauf</p>
                <h1>Ihre bisherigen Schätzungen.</h1>

                <p className="subtitle">
                  Alle Ergebnisse dieser Sitzung im Überblick.
                </p>
              </div>

              <button
                className="button primary"
                onClick={newEstimate}
              >
                <Icon name="plus" />
                Neue Schätzung
              </button>
            </div>

            <p className="notice">
              <Icon name="info" />
              Nur für diese Sitzung gespeichert.
              Beim Neuladen der Seite wird der Verlauf gelöscht.
            </p>

            <section className="card history">
              <div className="history-heading">
                <h2>{history.length} Schätzungen</h2>
                <span className="muted">Neueste zuerst</span>
              </div>

              {history.length === 0 ? (
                <div className="empty">
                  <Icon name="home" />
                  <h2>Noch keine Schätzungen</h2>

                  <p>
                    Starten Sie mit den Angaben zu Ihrer Immobilie.
                  </p>

                  <button
                    className="button primary"
                    onClick={newEstimate}
                  >
                    Immobilie schätzen
                  </button>
                </div>
              ) : (
                history.map((entry) => (
                  <article className="history-row" key={entry.id}>
                    <div>
                      <h3>{entry.prediction.features.stadt}</h3>

                      <span className="muted">
                        {entry.prediction.features.flaeche} m² ·{' '}
                        {entry.prediction.features.zimmer} Zimmer
                      </span>
                    </div>

                    <time dateTime={entry.created}>
                      {date(entry.created)}
                    </time>

                    <strong>
                      {money(entry.prediction.preis_estimate)}
                    </strong>

                    <button
                      className="button secondary"
                      onClick={() => open(entry)}
                    >
                      Ansehen / PDF
                    </button>
                  </article>
                ))
              )}
            </section>

            {history.length > 0 && (
              <button
                className="text-button clear"
                onClick={() => {
                  if (
                    window.confirm(
                      'Alle Schätzungen dieser Sitzung löschen?',
                    )
                  ) {
                    setHistory([])
                    setSelected(null)
                    setEditing(true)
                  }
                }}
              >
                Verlauf leeren
              </button>
            )}
          </>
        )}

        {page === 'method' && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">Methodik</p>
                <h1>So entsteht Ihre Schätzung.</h1>

                <p className="subtitle">
                  Daten, Modell und Grenzen – verständlich erklärt.
                </p>
              </div>

              <span className="badge">Demodaten</span>
            </div>

            <div className="two-columns">
              <section className="card">
                <h2>
                  <Icon name="info" />
                  Die Datenbasis
                </h2>

                <h3>Synthetische Immobiliendaten</h3>

                <p>
                  Künstlich erzeugte Beispiele,
                  keine echten Kauftransaktionen.
                </p>

                <div className="metrics compact">
                  <div>
                    <strong>
                      {model
                        ? number(model.metrics.train_samples)
                        : '—'}
                    </strong>
                    <span>Training</span>
                  </div>

                  <div>
                    <strong>
                      {model
                        ? number(model.metrics.test_samples)
                        : '—'}
                    </strong>
                    <span>Test</span>
                  </div>
                </div>
              </section>

              <section className="card">
                <h2>
                  <Icon name="model" />
                  Das Modell
                </h2>

                <h3>Random Forest</h3>

                <p>
                  Mehrere Entscheidungsbäume liefern gemeinsam
                  eine Preisschätzung.
                </p>

                <hr />

                <p className="muted model-id">
                  Version: {model?.model_id ?? 'Nicht verfügbar'}
                </p>
              </section>
            </div>

            <section className="card metrics-card">
              <h2>
                <Icon name="chart" />
                Wie gut funktioniert das Modell?
              </h2>

              <p className="muted">
                Gemessen auf synthetischen Testdaten.
              </p>

              <div className="metrics">
                <div>
                  <span>MAE</span>

                  <strong>
                    {model
                      ? money(model.metrics.test_mae_eur)
                      : '—'}
                  </strong>

                  <span>Mittlerer absoluter Fehler</span>
                </div>

                <div>
                  <span>RMSE</span>

                  <strong>
                    {model
                      ? money(model.metrics.test_rmse_eur)
                      : '—'}
                  </strong>

                  <span>Gewichtet große Fehler stärker</span>
                </div>

                <div>
                  <span>R²</span>

                  <strong>
                    {model
                      ? number(model.metrics.test_r2, 3)
                      : '—'}
                  </strong>

                  <span>Anpassung an die Testdaten</span>
                </div>
              </div>

              <hr />

              <p className="muted">
                Diese Werte belegen keine Genauigkeit
                auf dem realen Immobilienmarkt.
              </p>
            </section>

            <div className="two-columns">
              <section className="card">
                <h2>Unterstützter Bereich</h2>

                <p>
                  {model?.coverage.cities.join(', ') ??
                    'Wird geladen…'}
                </p>

                {model && (
                  <p>
                    {model.coverage.area_m2.join('–')} m² ·
                    Baujahr {model.coverage.year_built.join('–')}
                  </p>
                )}

                <p className="muted">
                  Lage, Fläche, Zimmer, Schlafzimmer, Baujahr,
                  Etage, Garten, Balkon und Entfernung zum Bahnhof.
                </p>
              </section>

              <section className="card">
                <h2>Was noch fehlt</h2>

                <ul>
                  <li>Reale Marktdaten</li>
                  <li>Kalibriertes Preisintervall</li>
                  <li>Bewertung des Gebäudezustands</li>
                </ul>
              </section>
            </div>

            <div className="actions">
              <button
                className="button primary"
                onClick={newEstimate}
              >
                <Icon name="home" />
                Immobilie schätzen
              </button>
            </div>
          </>
        )}
      </main>

      <footer>
        <span>© {copyrightYear} Pascal C. Nague</span>
        <span>ImmoLens</span>
      </footer>
    </div>
  )
}
