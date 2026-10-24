import { useEffect, useMemo, useState } from 'react'

type City = {
  id: string
  name: string
  ascii: string
  region: string
  district: string
  population: number
  modelCity: string | null
}

type Country = {
  code: string
  count: number
}

type Props = {
  language: 'de' | 'en'
  country: string
  cityName: string
  supportedCities: string[]
  onChange: (country: string, city: string, supported: boolean) => void
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .trim()
}

export default function LocationPicker({
  language,
  country,
  cityName,
  supportedCities,
  onChange,
}: Props) {
  const [countries, setCountries] = useState<Country[]>([])
  const [catalogue, setCatalogue] = useState<{ country: string; cities: City[] } | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<City | null>(null)
  const [countryError, setCountryError] = useState(false)
  const [cityError, setCityError] = useState(false)
  const [retry, setRetry] = useState(0)

  const de = language === 'de'
  const names = new Intl.DisplayNames([language], { type: 'region' })
  const cities = useMemo(
    () => catalogue?.country === country ? catalogue.cities : [],
    [catalogue, country],
  )

  const searchIndex = useMemo(
    () => cities.map((city) => ({
      city,
      searchable: normalize(city.name) + ' ' + normalize(city.ascii),
    })),
    [cities],
  )
  const loading = catalogue?.country !== country && !cityError

  useEffect(() => {
    const controller = new AbortController()
    fetch('/data/locations/countries.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Catalogue unavailable')
        return response.json() as Promise<Country[]>
      })
      .then((value) => {
        setCountries(value)
        setCountryError(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) setCountryError(true)
      })
    return () => controller.abort()
  }, [retry])

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/data/locations/${country}.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Catalogue unavailable')
        return response.json() as Promise<{ country: string; cities: City[] }>
      })
      .then((value) => {
        setCatalogue(value)
        setCityError(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) setCityError(true)
      })
    return () => controller.abort()
  }, [country, retry])

  const restoredCity = cities.find(
    (city) => city.modelCity !== null && city.modelCity === cityName,
  )
  const currentCity = selected?.name === cityName ? selected : restoredCity
  const currentSupported = Boolean(
    country === 'DE'
    && currentCity?.modelCity
    && supportedCities.includes(currentCity.modelCity),
  )

  const search = normalize(query)
  const matches = useMemo(
    () => searchIndex.filter((entry) => entry.searchable.includes(search)),
    [searchIndex, search],
  )
  const visible = matches.slice(0, 100).map((entry) => entry.city)

  return (
    <div className="location-picker">
      <label className="field" htmlFor="country">
        <span>{de ? 'Land' : 'Country'}</span>
        <select
          id="country"
          value={country}
          onChange={(event) => {
            setQuery('')
            setSelected(null)
            setCityError(false)
            onChange(event.target.value, '', false)
          }}
        >
          {(countries.length ? countries : [{ code: 'DE', count: 0 }]).map((item) => (
            <option key={item.code} value={item.code}>
              {names.of(item.code) ?? item.code}
            </option>
          ))}
        </select>
      </label>

      <label className="field" htmlFor="city-search">
        <span>{de ? 'Stadt suchen' : 'Search for a city'}</span>
        <input
          id="city-search"
          type="search"
          value={query}
          autoComplete="off"
          placeholder={de ? 'Name eingeben …' : 'Enter a name …'}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {(countryError || cityError) && (
        <div className="form-error" role="alert">
          <p>
            {de
              ? 'Der Ortskatalog konnte nicht geladen werden.'
              : 'The location catalogue could not be loaded.'}
          </p>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setCountryError(false)
              setCityError(false)
              setRetry((value) => value + 1)
            }}
          >
            {de ? 'Erneut versuchen' : 'Try again'}
          </button>
        </div>
      )}

      {loading && <p role="status">{de ? 'Orte werden geladen …' : 'Loading places …'}</p>}

      {!loading && !cityError && (
        <div className="location-results">
          <p className="muted" aria-live="polite">
            {matches.length} {de ? 'Treffer' : 'matches'}
            {matches.length > 100 && (
              de
                ? ' · Die ersten 100 werden angezeigt. Suche weiter eingrenzen.'
                : ' · Showing the first 100. Refine your search.'
            )}
          </p>
          <ul className="city-results">
            {visible.map((city) => (
              <li key={city.id}>
                <button
                  type="button"
                  aria-pressed={currentCity?.id === city.id}
                  onClick={() => {
                    setSelected(city)
                    setQuery(city.name)
                    onChange(
                      country,
                      city.modelCity ?? city.name,
                      Boolean(
                        country === 'DE'
                        && city.modelCity
                        && supportedCities.includes(city.modelCity),
                      ),
                    )
                  }}
                >
                  <strong>{city.name}</strong>
                  <small>
                    {de ? 'Regionscode' : 'Region code'}: {city.region}
                    {city.district ? ` / ${city.district}` : ''}
                    {' · '}ID {city.id}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="location-status" role="status">
        <strong>
          {de ? 'Ausgewählt: ' : 'Selected: '}
          {cityName || (de ? 'Noch keine Stadt' : 'No city selected')}
        </strong>
        <p>
          {cityName
            ? currentSupported
              ? de
                ? 'Synthetische Demo-Schätzung verfügbar.'
                : 'Synthetic demo estimate available.'
              : de
                ? 'Für diesen Ort ist noch keine Schätzung verfügbar.'
                : 'An estimate is not yet available for this location.'
            : de
              ? 'Wählen Sie einen Ort aus der Ergebnisliste.'
              : 'Choose a place from the results.'}
        </p>
      </div>

      <p className="location-credit">
        {de ? 'Ortsdaten: ' : 'Location data: '}
        <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames</a>
        {' · '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
          CC BY 4.0
        </a>
      </p>
    </div>
  )
}
