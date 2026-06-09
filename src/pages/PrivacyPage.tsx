import { ChevronLeft } from 'lucide-preact';
import { CONTACT_EMAIL, APP_URL } from '../data/constants';
import './LegalPage.css';

function goBack() {
  if (history.length > 1) history.back();
  else window.location.href = APP_URL;
}

export function PrivacyPage() {
  return (
    <div class="legal-page fade-in">
      <button class="legal-back" onClick={goBack}>
        <ChevronLeft size={20} />
        Back
      </button>
      <h1 class="legal-title">Privacy Policy</h1>
      <p class="legal-date">Last updated: June 9, 2026</p>

      <section class="legal-section">
        <h2>Overview</h2>
        <p>Woorden is a Dutch vocabulary learning app. This policy explains what data we collect and how we use it.</p>
      </section>

      <section class="legal-section">
        <h2>Data We Collect</h2>
        <ul>
          <li><strong>Google account info</strong> — name and email address, collected when you sign in with Google. Used only to identify your account.</li>
          <li><strong>Learning progress</strong> — quiz results, streaks, and word statistics. Stored locally in your browser and optionally synced to our servers when you are signed in.</li>
          <li><strong>Username and avatar</strong> — optional, set by you, displayed on the leaderboard.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>How We Use Your Data</h2>
        <ul>
          <li>To sync your progress across devices.</li>
          <li>To display your rank on the leaderboard.</li>
          <li>We do not sell or share your data with third parties.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>Third-Party Services</h2>
        <p>We use <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> for authentication and data storage, and Google OAuth for sign-in. Their respective privacy policies apply.</p>
      </section>

      <section class="legal-section">
        <h2>Data Deletion</h2>
        <p>You can delete your account and all associated data by contacting us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>

      <section class="legal-section">
        <h2>Contact</h2>
        <p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
      </section>
    </div>
  );
}
