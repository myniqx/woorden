import { useEffect, useRef } from 'preact/hooks';
import { changelog, latestDate } from '../data/changelog';
import './ChangelogScreen.css';

const STORAGE_KEY = 'changelog_seen_date';

export function ChangelogScreen() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, latestDate);
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div class="changelog-screen fade-in">
      <div class="changelog-list">
        {changelog.map((entry) => (
          <div key={entry.date} class="changelog-entry">
            <div class="changelog-date">
              {new Date(entry.date).toLocaleDateString('nl-NL', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </div>
            <ul class="changelog-items">
              {entry.items.map((item, i) => (
                <li key={i} class="changelog-item">{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export { STORAGE_KEY as CHANGELOG_STORAGE_KEY };
