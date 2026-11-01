export interface Property {
  flaeche: number
  zimmer: number
  schlafzimmer: number
  etage: number
  stadt: string
  baujahr: number
  entfernung_bahn: number
  garten: number
  balkon: number
}

export interface Prediction {
  preis_estimate: number
  preis_formatiert: string
  preis_pro_m2: number
  interval_min: number | null
  interval_max: number | null
  modell: string
  model_id: string
  reference_year: number
  data_mode: 'synthetic'
  target: string
  currency: 'EUR'
  warnings: string[]
  features: Property & {
    plz?: string | number | null
  }
}

export interface ModelInfo {
  model_id: string
  data_mode: 'synthetic'
  reference_year: number
  coverage: {
    cities: string[]
    area_m2: number[]
    year_built: number[]
  }
  metrics: Record<string, number>
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const timeout = AbortSignal.timeout(20_000)
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout])
    : timeout

  let response: Response

  try {
    response = await fetch(`/api${path}`, {
      ...options,
      signal,
    })
  } catch (error) {
    if (options.signal?.aborted) {
      throw error
    }

    if (timeout.aborted) {
      throw new Error(
        'Die Anfrage dauert zu lange. Bitte versuchen Sie es erneut.',
      )
    }

    throw new Error(
      'Keine Verbindung zum Dienst. Bitte versuchen Sie es erneut.',
    )
  }

  if (!response.ok) {
    if (response.status === 422) {
      throw new Error(
        'Bitte prüfen Sie Ihre Angaben und die zulässigen Wertebereiche.',
      )
    }

    if (response.status === 503) {
      throw new Error(
        'Das Modell ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.',
      )
    }

    throw new Error(
      `Die Anfrage konnte nicht verarbeitet werden (HTTP ${response.status}).`,
    )
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    throw new Error(
      'Der Dienst hat eine unerwartete Antwort geliefert.',
    )
  }

  return response.json() as Promise<T>
}

export function getModel(signal?: AbortSignal): Promise<ModelInfo> {
  return request<ModelInfo>('/model', { signal })
}

export function predict(property: Property): Promise<Prediction> {
  return request<Prediction>('/predict', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(property),
  })
}
