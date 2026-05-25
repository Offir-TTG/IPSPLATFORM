// Shared Google Maps Places helpers.
//
// Extracted from the public enrollment wizard so the admin user-edit
// drawer can use the exact same loader + address parser without
// duplicating the script-injection logic.

declare global {
  interface Window {
    google: any;
  }
}

export type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type ParsedAddress = {
  address_line1: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
};

/**
 * Pull the bits we care about out of Google Places' address_components
 * array. Returns null for parts that aren't present (some addresses
 * don't have a postal_code or a sub-locality).
 */
export function parseGoogleAddressComponents(
  components: GoogleAddressComponent[],
): ParsedAddress {
  const findOne = (...types: string[]): GoogleAddressComponent | undefined =>
    components.find((c) => types.some((t) => c.types.includes(t)));

  const streetNumber = findOne('street_number')?.long_name ?? '';
  const route = findOne('route')?.long_name ?? '';
  const line1 = [streetNumber, route].filter(Boolean).join(' ').trim();

  return {
    address_line1: line1 || null,
    city:
      findOne('locality', 'postal_town', 'sublocality_level_1', 'sublocality')
        ?.long_name ?? null,
    region:
      findOne('administrative_area_level_1', 'administrative_area_level_2')
        ?.long_name ?? null,
    postal_code: findOne('postal_code')?.long_name ?? null,
    // Prefer long name ("Israel") over the ISO code ("IL") so the
    // admin CRM list reads naturally.
    country: findOne('country')?.long_name ?? null,
  };
}

/**
 * Idempotently inject the Google Maps JS API (with the places library).
 * Resolves immediately if it's already loaded.
 */
export function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).google?.maps) {
      resolve();
      return;
    }

    // Don't inject twice if a previous call is still loading.
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps-loader="1"]',
    );
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Google Maps script')),
      );
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps-loader', '1');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
}
