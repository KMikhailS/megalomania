import { useEffect, useState } from 'react';
import { searchCdekCities } from '../../../api/client';
import { useDebounce } from '../../../hooks/useDebounce';
import type { CdekCity } from '../../../types/cdek';
import styles from './styles.module.css';

interface CitySelectorProps {
  onSelectCity: (city: CdekCity) => void;
  initialCity?: CdekCity | null;
}

export function CitySelector({ onSelectCity, initialCity }: CitySelectorProps) {
  const [query, setQuery] = useState(initialCity?.name ?? '');
  const [cities, setCities] = useState<CdekCity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setCities([]);
      return;
    }

    setIsLoading(true);
    searchCdekCities(debouncedQuery.trim())
      .then((data) => setCities(data))
      .catch(() => setCities([]))
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  return (
    <div className={styles.citySearch}>
      <input
        className={styles.cityInput}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Город для доставки"
      />
      {isLoading && (
        <div className={styles.citySuggestions}>
          <div className={styles.citySuggestionItem}>Поиск...</div>
        </div>
      )}
      {!isLoading && cities.length > 0 && (
        <div className={styles.citySuggestions}>
          {cities.map((city) => (
            <button
              key={city.code}
              className={styles.citySuggestionItem}
              type="button"
              onClick={() => {
                onSelectCity(city);
                setQuery(`${city.name}${city.region ? `, ${city.region}` : ''}`);
                setCities([]);
              }}
            >
              {city.name}
              {city.region ? `, ${city.region}` : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
