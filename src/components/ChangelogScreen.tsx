import { useEffect, useRef } from 'preact/hooks';
import { changelog, latestDate } from '../data/changelog';

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
    <div class="flex flex-col min-h-full p-[var(--spacing-md)] max-w-[600px] mx-auto fade-in">
      <div class="flex flex-col gap-[var(--spacing-lg)]">
        {changelog.map((entry) => (
          <div key={entry.date} class="border-l-[3px] border-l-[var(--color-primary)] pl-[var(--spacing-md)]">
            <div class="text-[length:var(--text-sm)] font-semibold text-[var(--color-primary)] mb-[var(--spacing-xs)]">
              {new Date(entry.date).toLocaleDateString('nl-NL', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </div>
            <ul class="m-0 p-0 list-none flex flex-col gap-[var(--spacing-xs)]">
              {entry.items.map((item, i) => (
                <li key={i} class="relative text-[length:var(--text-sm)] text-[var(--color-text-secondary)] pl-[var(--spacing-sm)] before:content-['–'] before:absolute before:left-0 before:text-[var(--color-text-muted)]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export { STORAGE_KEY as CHANGELOG_STORAGE_KEY };
