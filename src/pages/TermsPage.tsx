import { ChevronLeft } from 'lucide-preact';
import { CONTACT_EMAIL, APP_URL } from '../data/constants';
import './LegalPage.css';

function goBack() {
  if (history.length > 1) history.back();
  else window.location.href = APP_URL;
}

export function TermsPage() {
  return (
    <div class="legal-page fade-in">
      <button class="legal-back" onClick={goBack}>
        <ChevronLeft size={20} />
        Back
      </button>
      <h1 class="legal-title">Terms of Service</h1>
      <p class="legal-date">Last updated: June 9, 2026</p>

      <section class="legal-section">
        <h2>Acceptance</h2>
        <p>By using Woorden, you agree to these terms.</p>
      </section>

      <section class="legal-section">
        <h2>Use of the App</h2>
        <ul>
          <li>Woorden is a free Dutch vocabulary learning app.</li>
          <li>You may use it for personal, non-commercial purposes.</li>
          <li>You agree not to misuse the app or attempt to disrupt its services.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>Accounts</h2>
        <p>Sign-in with Google is optional. You are responsible for keeping your account secure.</p>
      </section>

      <section class="legal-section">
        <h2>Disclaimer</h2>
        <p>Woorden is provided "as is" without warranties of any kind. We are not liable for any damages arising from use of the app.</p>
      </section>

      <section class="legal-section">
        <h2>Changes</h2>
        <p>We may update these terms at any time. Continued use of the app constitutes acceptance of the updated terms.</p>
      </section>

      <section class="legal-section">
        <h2>Contact</h2>
        <p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
      </section>
    </div>
  );
}
