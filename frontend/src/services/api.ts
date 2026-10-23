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
  preis_pro_m2: number
  interval_min: number | null
  interval_max: number | null
  model_id: string
  reference_year: number
  data_mode: string
  warnings: string[]
  features: Property
}

export interface ModelInfo {
  model_id: string
  data_mode: string
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
  let response: Response

  try {
    response = await fetch(`/api${path}`, {
      ...options,
      signal: options.signal
        ? AbortSignal.any([
            options.signal,
            AbortSignal.timeout(20000),
          ])
        : AbortSignal.timeout(20000),
    })
  } catch (error) {
    if (options.signal?.aborted) throw error

    throw new Error(
      'Keine Verbindung. Bitte prüfen Sie, ob der Dienst erreichbar ist.',
    )
  }

  if (!response.ok) {
    if (response.status === 422) {
      throw new Error(
        'Bitte prüfen Sie die Eingaben und die unterstützten Wertebereiche.',
      )
    }

    throw new Error(
      'Die Schätzung ist momentan nicht verfügbar. Bitte versuchen Sie es erneut.',
    )
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    throw new Error(
      'Unerwartete Antwort des Dienstes. Bitte prüfen Sie die Verbindung.',
    )
  }

  return response.json() as Promise<T>
}

export const getModel = (signal?: AbortSignal) =>
  request<ModelInfo>('/model', { signal })

export const predict = (property: Property) =>
  request<Prediction>('/predict', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(property),
  })
