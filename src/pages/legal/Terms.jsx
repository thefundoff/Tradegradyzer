import LegalLayout from '../../components/layout/LegalLayout'
import { CONTACT_EMAIL } from '../../lib/legal'

export default function Terms() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      subtitle="The agreement between you and TradeGradyzer for using the Service."
    >
      <p className="lead">
        These Terms &amp; Conditions ("Terms") form a binding agreement between you and{' '}
        <strong>TradeGradyzer</strong> ("TradeGradyzer", "we", "us" or "our") and govern your access
        to and use of our website, progressive web app and related services (the "Service"). By
        creating an account or using the Service, you confirm that you accept these Terms. If you do
        not agree, you must not use the Service.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least <strong>18 years old</strong> and have the legal capacity to enter into
        a contract to use the Service. By using the Service you represent that you meet these
        requirements and that all information you provide is accurate and kept up to date.
      </p>

      <h2>2. The Service — what TradeGradyzer is (and is not)</h2>
      <p>
        TradeGradyzer is an <strong>AI-assisted, educational chart-analysis tool</strong>. You upload
        screenshots of trading charts and our automated model returns an indicative setup score,
        confidence grade, suggested key levels and an illustrative entry, stop-loss and take-profit,
        tailored to the trading profile you provide.
      </p>
      <p>
        <strong>The Service does not provide financial, investment, trading, legal, tax or
        accounting advice, and is not a recommendation, solicitation or offer to buy or sell any
        financial instrument.</strong> We are not a broker, dealer, investment adviser, portfolio
        manager or financial institution, and no client, fiduciary or advisory relationship is
        created. All output is informational and educational only and may be incomplete, delayed or
        wrong. You are solely responsible for your trading decisions and their outcomes. Please read
        our <a href="/disclaimer">Disclaimer</a>, which forms part of these Terms.
      </p>

      <h2>3. Your account</h2>
      <p>
        You must register for an account to use most features. You are responsible for keeping your
        login credentials confidential and for all activity that occurs under your account. Notify us
        immediately at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if you suspect any
        unauthorised use. You may not share your account, or create an account on behalf of someone
        else without authority.
      </p>

      <h2>4. Plans, quotas and the free allowance</h2>
      <p>
        We offer a free allowance and paid plans. The number of analyses available to you depends on
        your plan and is enforced by us:
      </p>
      <ul>
        <li><strong>Free</strong> — one (1) analysis in total, ever, per user.</li>
        <li><strong>Weekly</strong> — up to 15 analyses per rolling 7-day period.</li>
        <li><strong>Monthly</strong> — up to 60 analyses per rolling 30-day period.</li>
        <li><strong>Lifetime</strong> — a one-time purchase granting up to 25 analyses per rolling
          30-day period for as long as the Service operates; limited seats may apply.</li>
      </ul>
      <p>
        We apply rate limits and other technical controls to keep the Service available and to
        prevent abuse. Quotas, features and the availability of any plan (including the lifetime
        offer and its seat cap) may change; we will not reduce a plan you have already paid for
        during its paid period except as required by law or these Terms.
      </p>

      <h2>5. Pricing and payment</h2>
      <p>
        Prices are shown in the app and may be displayed in your local currency. Payments are
        processed by our third-party payment processor, <strong>Paystack</strong>; by purchasing you
        also agree to the processor's terms. You authorise us (via the processor) to charge the
        applicable fees, including any recurring charges for subscription plans until you cancel.
      </p>
      <ul>
        <li>Weekly and Monthly plans renew automatically at the end of each period unless cancelled
          beforehand.</li>
        <li>The Lifetime plan is a single, one-time charge and is not a recurring subscription.</li>
        <li>You are responsible for any taxes, bank or currency-conversion charges that apply to your
          payment.</li>
        <li>We may change prices on a prospective basis; changes do not affect a period you have
          already paid for.</li>
      </ul>
      <p>
        You can cancel a recurring plan at any time from your account; cancellation stops future
        renewals and your access continues until the end of the current paid period. Refunds are
        governed by our <a href="/refund-policy">Refund Policy</a>.
      </p>

      <h2>6. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the Service for any unlawful, fraudulent or harmful purpose;</li>
        <li>upload content you do not have the right to upload, or that infringes any third party's
          rights or contains malware;</li>
        <li>upload personal data of others, or any sensitive or confidential information you are not
          permitted to share;</li>
        <li>attempt to bypass quotas, rate limits, authentication, payment or any security or access
          control;</li>
        <li>copy, scrape, reverse engineer, decompile or create derivative works from the Service,
          except to the extent the law expressly permits;</li>
        <li>resell, sublicense or commercially exploit the Service or its output without our written
          permission;</li>
        <li>use automated means to access the Service in a way that burdens or disrupts it, or
          interferes with other users; or</li>
        <li>use the Service or its output to provide regulated financial advice to third parties.</li>
      </ul>
      <p>
        We may suspend or terminate access for any breach of this section.
      </p>

      <h2>7. Your content and licence</h2>
      <p>
        You retain ownership of the chart images, notes and other content you submit ("Your
        Content"). You grant us a worldwide, non-exclusive, royalty-free licence to host, store,
        process and transmit Your Content <strong>solely to operate and provide the Service to
        you</strong> — including sending it to our AI provider to generate your analysis and storing
        your analysis history. You confirm you have all rights necessary to grant this licence. We do
        not claim ownership of Your Content and do not use it to publicly identify you.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        The Service, including its software, design, branding, text and the structure of the analysis
        output, is owned by TradeGradyzer or its licensors and is protected by intellectual property
        laws. We grant you a limited, personal, non-transferable, revocable licence to use the
        Service for your own non-commercial trading and educational purposes, subject to these Terms.
        All rights not expressly granted are reserved.
      </p>

      <h2>9. Third-party services</h2>
      <p>
        The Service relies on third parties (including Supabase, Google's Gemini API, Paystack and
        Vercel). Their availability and performance are outside our control, and your use of features
        powered by them may also be subject to their terms. We are not responsible for third-party
        services.
      </p>

      <h2>10. Availability, changes and beta features</h2>
      <p>
        We aim to keep the Service available but do not guarantee it will be uninterrupted, timely,
        secure or error-free. We may modify, suspend or discontinue any part of the Service, and may
        offer experimental or "beta" features that are provided as-is and may change or be removed.
      </p>

      <h2>11. Disclaimer of warranties</h2>
      <p>
        To the maximum extent permitted by law, the Service and all output are provided{' '}
        <strong>"as is" and "as available", without warranties of any kind</strong>, whether express
        or implied, including any implied warranties of merchantability, fitness for a particular
        purpose, accuracy, or non-infringement. We do not warrant that any analysis, score, grade or
        suggested level is accurate, complete or profitable, or that the Service will meet your
        requirements. Nothing in these Terms excludes a warranty or right that cannot be excluded
        under applicable law.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law:
      </p>
      <ul>
        <li>we are <strong>not liable for any trading or investment losses</strong>, lost profits,
          lost opportunities, loss of data, or any indirect, incidental, special, consequential or
          punitive damages arising out of or related to your use of (or inability to use) the
          Service or any reliance on its output;</li>
        <li>our total aggregate liability for all claims relating to the Service is limited to the
          greater of (a) the amount you paid us for the Service in the three (3) months before the
          event giving rise to the claim, or (b) USD 50 (or its equivalent).</li>
      </ul>
      <p>
        Some jurisdictions do not allow certain exclusions or limitations, so some of the above may
        not apply to you; in that case our liability is limited to the smallest extent permitted by
        law. Nothing limits liability for death or personal injury caused by negligence, fraud, or
        any liability that cannot be excluded by law.
      </p>

      <h2>13. Indemnity</h2>
      <p>
        You agree to indemnify and hold harmless TradeGradyzer and its operators from any claims,
        losses, liabilities and reasonable expenses (including legal fees) arising out of your breach
        of these Terms, your misuse of the Service, Your Content, or your violation of any law or
        third-party right.
      </p>

      <h2>14. Suspension and termination</h2>
      <p>
        You may stop using the Service and delete your account at any time. We may suspend or
        terminate your access immediately if you breach these Terms, if required by law, or to
        protect the Service or other users. On termination, the licences granted to you end; sections
        that by their nature should survive (including ownership, disclaimers, limitation of
        liability, indemnity and governing law) will survive.
      </p>

      <h2>15. Governing law and disputes</h2>
      <p>
        These Terms and any dispute arising out of or in connection with them or the Service are
        governed by the laws of the <strong>Federal Republic of Nigeria</strong>, and you submit to
        the non-exclusive jurisdiction of the courts of Nigeria. This does not deprive you of the
        protection of mandatory consumer-protection laws of your country of residence. Before
        starting any formal proceedings, please contact us so we can try to resolve the matter (see
        our <a href="/complaints">Complaints Policy</a>).
      </p>

      <h2>16. General</h2>
      <ul>
        <li>These Terms, together with the Privacy Policy, Disclaimer, Refund Policy and Complaints
          Policy, are the entire agreement between us on this subject.</li>
        <li>If any provision is held unenforceable, the rest remains in effect.</li>
        <li>Our failure to enforce a right is not a waiver of it.</li>
        <li>You may not transfer your rights under these Terms without our consent; we may transfer
          ours in connection with a business transfer.</li>
        <li>We may update these Terms; material changes will be notified and the "Last updated" date
          revised. Continued use after changes take effect means you accept them.</li>
      </ul>

      <h2>17. Contact</h2>
      <p>
        Questions about these Terms? Email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalLayout>
  )
}
