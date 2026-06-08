import Navbar from "@/app/_components/Navbar";
import Footer from "@/app/_components/Footer";

export const metadata = {
  title: "Terms and Conditions | JNJ Printing",
  description: "Terms and Conditions for JNJ Printing.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[var(--cream)] px-6 py-12 text-[var(--text)] md:px-8 xl:px-16">
        <section className="mx-auto max-w-4xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)] md:p-10">
          <div className="mb-8 border-b border-[var(--border)] pb-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
              Legal
            </p>

            <h1 className="font-display text-[clamp(32px,5vw,56px)] leading-tight text-[var(--text)]">
              Terms and Conditions
            </h1>

            <p className="mt-3 text-sm text-[var(--muted)]">
              Effective Date: June 8, 2026
            </p>
          </div>

          <div className="space-y-8 text-sm leading-7 text-[var(--muted)] md:text-base">
            <section>
              <p>
                Welcome to JNJ Printing. These Terms and Conditions govern your
                use of our website, account system, custom order services,
                uploaded files, payment process, and related features.
              </p>

              <p className="mt-3">
                By accessing our website, creating an account, placing an order,
                or using our services, you agree to these Terms and Conditions.
              </p>
            </section>

            <LegalSection title="1. About JNJ Printing">
              <p>
                JNJ Printing provides custom printing services, including
                services such as DTF printing, silkscreen printing, rubberized
                printing, and other related products or services offered through
                our website or physical store.
              </p>
            </LegalSection>

            <LegalSection title="2. Account Registration">
              <p>To place and track custom orders, you may need to create an account.</p>

              <p className="mt-3">You agree to:</p>

              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>Provide accurate and complete information</li>
                <li>Keep your login details confidential</li>
                <li>Update your information when necessary</li>
                <li>Use your account only for lawful purposes</li>
                <li>Notify us if you suspect unauthorized use of your account</li>
              </ul>

              <p className="mt-3">
                We may suspend or terminate accounts that submit false
                information, misuse the website, abuse staff, violate these
                Terms, or engage in suspicious or unlawful activity.
              </p>
            </LegalSection>

            <LegalSection title="3. Custom Orders">
              <p>
                When you submit a custom order, you are responsible for providing
                complete and accurate order details, including product type,
                printing service, quantity, size, color, placement, design file,
                special instructions, and pickup or delivery details if
                applicable.
              </p>

              <p className="mt-3">
                An order request is not final until reviewed and accepted by JNJ
                Printing.
              </p>

              <p className="mt-3">We may approve, reject, cancel, or request changes to an order if:</p>

              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>The design file is unclear or low quality</li>
                <li>The order details are incomplete</li>
                <li>The requested service is unavailable</li>
                <li>The design contains prohibited or infringing content</li>
                <li>The customer fails to complete payment</li>
                <li>The order cannot be reasonably produced</li>
              </ul>
            </LegalSection>

            <LegalSection title="4. Design Files and Customer Content">
              <p>
                You are responsible for all files, images, logos, text, artwork,
                and other content you upload or submit.
              </p>

              <p className="mt-3">By uploading or submitting content, you confirm that:</p>

              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>You own the content or have permission to use it.</li>
                <li>
                  The content does not violate copyright, trademark, privacy,
                  publicity, or other rights.
                </li>
                <li>
                  The content is not illegal, hateful, abusive, obscene,
                  misleading, or harmful.
                </li>
                <li>
                  JNJ Printing may use the content to review, prepare, produce,
                  and complete your order.
                </li>
              </ul>

              <p className="mt-3">
                We may refuse to print designs that we believe are unlawful,
                offensive, infringing, misleading, unsafe, or inconsistent with
                our business standards.
              </p>
            </LegalSection>

            <LegalSection title="5. Design Quality and Print Output">
              <p>
                You understand that final print output may vary depending on file
                resolution and quality, fabric type and color, printing method,
                monitor or screen color differences, material availability, and
                production limitations.
              </p>

              <p className="mt-3">
                We are not responsible for poor output caused by low-resolution,
                incorrect, or customer-provided design files.
              </p>
            </LegalSection>

            <LegalSection title="6. Prices and Quotations">
              <p>
                Prices shown on the website may be estimates only. Final pricing
                may depend on product type, printing method, quantity, design
                size and placement, material cost, rush requests, delivery or
                pickup arrangements, and additional services requested.
              </p>

              <p className="mt-3">
                JNJ Printing may update prices at any time. Price changes do not
                affect orders already confirmed and accepted, unless the customer
                changes the order details.
              </p>
            </LegalSection>

            <LegalSection title="7. Payment">
              <p>
                Depending on the order, we may require full payment before
                production, partial down payment, payment before release or
                pickup, or proof of payment upload.
              </p>

              <p className="mt-3">
                Orders may not proceed to production until payment requirements
                are satisfied.
              </p>

              <p className="mt-3">
                Fake, altered, duplicate, or misleading payment proof may result
                in order cancellation, account suspension, and further action.
              </p>
            </LegalSection>

            <LegalSection title="8. Order Status and Notifications">
              <p>
                Our website may show order statuses such as pending, design
                review, approved, rejected, waiting for payment, paid, printing,
                ready for pickup, out for delivery, completed, or cancelled.
              </p>

              <p className="mt-3">
                Order status updates are provided for convenience. Delays may
                happen due to production volume, file issues, payment
                verification, supplier availability, equipment issues, weather,
                holidays, or other circumstances beyond our control.
              </p>
            </LegalSection>

            <LegalSection title="9. Production Time">
              <p>
                Estimated production times are only estimates and are not
                guaranteed unless expressly confirmed in writing by JNJ Printing.
              </p>

              <p className="mt-3">
                Production may be delayed if files are incomplete or low quality,
                payment is delayed, customer confirmation is pending, materials
                are unavailable, there are equipment or supplier issues, or the
                order is changed after approval.
              </p>
            </LegalSection>

            <LegalSection title="10. Pickup and Delivery">
              <p>
                Customers may be required to pick up completed orders or arrange
                delivery if available. For pickup, please bring proof of order or
                any required confirmation.
              </p>

              <p className="mt-3">
                For delivery, delivery time and fees may vary depending on
                location and courier availability. JNJ Printing is not
                responsible for delays caused by third-party couriers, incorrect
                delivery details, or circumstances beyond our control.
              </p>
            </LegalSection>

            <LegalSection title="11. Cancellations and Changes">
              <p>
                You may request changes or cancellation before production starts.
                Once production has started, orders may no longer be cancelled or
                changed.
              </p>

              <p className="mt-3">
                If a cancellation is allowed, any refund or credit will depend on
                the order status, materials already used, labor already
                performed, and payment processing limitations.
              </p>
            </LegalSection>

            <LegalSection title="12. Refunds and Reprints">
              <p>
                Because custom printed products are made specifically for each
                customer, refunds and reprints are limited.
              </p>

              <p className="mt-3">
                We may offer correction, reprint, credit, or refund only when
                the issue is caused by JNJ Printing, such as wrong product
                printed, wrong approved design printed, major production defect,
                or incorrect quantity caused by our team.
              </p>

              <p className="mt-3">
                We may not offer refunds or reprints for customer-approved
                spelling or design errors, low-quality uploaded files, wrong
                size, color, or placement selected by the customer, color
                differences caused by screen display variations, minor print
                variations normal to the selected printing method, change of
                mind, or delays caused by customer response, payment, or file
                issues.
              </p>
            </LegalSection>

            <LegalSection title="13. Intellectual Property">
              <p>
                All JNJ Printing website content, branding, layout, graphics,
                photos, text, and system features belong to JNJ Printing or its
                licensors unless otherwise stated.
              </p>

              <p className="mt-3">
                Customer-uploaded designs remain owned by the customer or the
                rightful owner. However, you grant JNJ Printing permission to use
                uploaded files only as needed to process and complete your order.
              </p>

              <p className="mt-3">
                We will not use your design for marketing, portfolio, or
                promotional purposes without your consent.
              </p>
            </LegalSection>

            <LegalSection title="14. Prohibited Uses">
              <ul className="list-disc space-y-1 pl-6">
                <li>Submit false or misleading information</li>
                <li>Upload harmful, illegal, abusive, or infringing content</li>
                <li>Violate another person&apos;s intellectual property rights</li>
                <li>Attempt unauthorized access to our website, database, or systems</li>
                <li>Interfere with website security features</li>
                <li>Use automated bots, spam, scraping, or abuse tools</li>
                <li>Harass staff or other customers</li>
                <li>Commit fraud or payment abuse</li>
                <li>Violate applicable laws or regulations</li>
              </ul>
            </LegalSection>

            <LegalSection title="15. Website Availability">
              <p>
                We aim to keep the website available and functional, but we do
                not guarantee uninterrupted access. The website may be
                unavailable due to maintenance, technical errors, hosting issues,
                security updates, internet disruptions, or events beyond our
                control.
              </p>
            </LegalSection>

            <LegalSection title="16. Limitation of Liability">
              <p>
                To the fullest extent allowed by law, JNJ Printing will not be
                liable for indirect, incidental, special, consequential, or
                punitive damages arising from your use of the website or
                services.
              </p>

              <p className="mt-3">
                Our maximum liability for any order-related claim is limited to
                the amount paid for the specific order involved.
              </p>
            </LegalSection>

            <LegalSection title="17. Privacy">
              <p>
                Your use of our website and services is also governed by our
                Privacy Policy. By using our website, you agree that we may
                collect, use, store, and process your information as described in
                the Privacy Policy.
              </p>
            </LegalSection>

            <LegalSection title="18. Changes to These Terms">
              <p>
                We may update these Terms and Conditions from time to time. When
                changes are made, we will update the effective date above.
                Continued use of our website or services after changes means you
                accept the updated Terms.
              </p>
            </LegalSection>

            <LegalSection title="19. Governing Law">
              <p>
                These Terms are governed by the laws of the Republic of the
                Philippines. Any dispute shall first be handled through
                good-faith communication with JNJ Printing.
              </p>
            </LegalSection>

            <LegalSection title="20. Contact Us">
              <p>For questions about these Terms, contact us at:</p>

              <div className="mt-3 rounded-2xl bg-[var(--cream)] p-4 text-sm">
                <p className="font-semibold text-[var(--text)]">JNJ Printing</p>
                <p>Email: jnjprinting.staff@gmail.com</p>
              </div>
            </LegalSection>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 font-display text-2xl font-semibold text-[var(--text)]">
        {title}
      </h2>
      {children}
    </section>
  );
}