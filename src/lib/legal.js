// Shared metadata for the legal/policy pages. Edit these in ONE place and the
// effective date, contact details and footer links stay consistent everywhere.

// Trading name shown to users. If/when a registered company is incorporated,
// add its legal name + registration (RC) number in the "About this operator"
// block on each policy page.
export const LEGAL_ENTITY = 'TradeGradyzer'

// Single published contact for privacy, support and complaints.
export const CONTACT_EMAIL = 'hudozit@gmail.com'

// Country whose law governs the documents (see each page's Governing Law clause).
export const JURISDICTION = 'the Federal Republic of Nigeria'

// Last time the policy text was reviewed/updated. Bump when you change wording.
export const EFFECTIVE_DATE = '29 June 2026'

// Footer + cross-links between the policy pages. Order is intentional.
export const LEGAL_LINKS = [
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/refund-policy', label: 'Refund Policy' },
  { to: '/disclaimer', label: 'Disclaimer' },
  { to: '/complaints', label: 'Complaints Policy' },
]
