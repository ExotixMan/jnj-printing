import Navbar from "@/app/_components/Navbar";
import Footer from "@/app/_components/Footer";

export const metadata = {
  title: "Privacy Policy | JNJ Printing",
  description: "Privacy Policy for JNJ Printing.",
};

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>

            <p className="mt-3 text-sm text-[var(--muted)]">
              Effective Date: June 8, 2026
            </p>
          </div>

          <div className="space-y-8 text-sm leading-7 text-[var(--muted)] md:text-base">
            <section>
              <p>
                JNJ Printing respects your privacy and is committed to protecting
                the personal information you share with us when using our
                website, creating an account, placing a custom order, uploading
                files, submitting payment proof, or contacting our team.
              </p>
            </section>

            <LegalSection title="1. Information We Collect">
              <p>We may collect the following information from you:</p>

              <h3 className="mt-4 font-semibold text-[var(--text)]">
                Account Information
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>First name</li>
                <li>Last name</li>
                <li>Email address</li>
                <li>Contact number</li>
                <li>Password or authentication credentials</li>
              </ul>

              <h3 className="mt-4 font-semibold text-[var(--text)]">
                Order Information
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>Product type</li>
                <li>Printing service selected</li>
                <li>Quantity, size, color, and placement details</li>
                <li>Design notes or instructions</li>
                <li>Uploaded design files or reference images</li>
                <li>Estimated price, final price, and order status</li>
                <li>Pickup or delivery-related information, if applicable</li>
              </ul>

              <h3 className="mt-4 font-semibold text-[var(--text)]">
                Payment Information
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>Payment reference details</li>
                <li>Uploaded proof of payment image or file</li>
                <li>Payment status</li>
                <li>Related order information</li>
              </ul>

              <p className="mt-3">
                We do not directly collect or store your full bank account,
                card, or e-wallet password information.
              </p>
            </LegalSection>

            <LegalSection title="2. How We Use Your Information">
              <ul className="list-disc space-y-1 pl-6">
                <li>Create and manage your account</li>
                <li>Process custom printing orders</li>
                <li>Review uploaded designs and order details</li>
                <li>Send order status updates and notifications</li>
                <li>Verify payment proof</li>
                <li>Respond to your inquiries</li>
                <li>Provide customer support</li>
                <li>Improve our website and services</li>
                <li>Prevent fraud, spam, abuse, and unauthorized access</li>
                <li>Comply with legal, tax, accounting, and business requirements</li>
              </ul>
            </LegalSection>

            <LegalSection title="3. Uploaded Designs and Files">
              <p>
                You may upload images, artwork, logos, references, or other
                files for custom printing.
              </p>

              <p className="mt-3">By uploading files, you confirm that:</p>

              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>You own the file or have permission to use it.</li>
                <li>
                  The file does not violate another person&apos;s copyright,
                  trademark, privacy, or other rights.
                </li>
                <li>
                  The file does not contain illegal, harmful, or offensive
                  material.
                </li>
              </ul>

              <p className="mt-3">
                We use uploaded files only for reviewing, preparing, producing,
                and completing your order, unless you give us permission to use
                them for another purpose such as portfolio, marketing, or
                promotional display.
              </p>
            </LegalSection>

            <LegalSection title="4. Sharing of Information">
              <p>We do not sell your personal information.</p>

              <p className="mt-3">
                We may share your information only when necessary with:
              </p>

              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>Authorized JNJ Printing staff</li>
                <li>
                  Service providers who help us operate our website, database,
                  hosting, payment verification, communication, or delivery
                  process
                </li>
                <li>
                  Government authorities, regulators, or legal bodies when
                  required by law
                </li>
                <li>
                  Security or technical providers when needed to detect or
                  prevent fraud, abuse, or unauthorized access
                </li>
              </ul>
            </LegalSection>

            <LegalSection title="5. Data Storage and Security">
              <p>
                We use reasonable administrative, technical, and physical
                safeguards to protect your information against unauthorized
                access, misuse, loss, alteration, or disclosure.
              </p>

              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>Account authentication</li>
                <li>Role-based access controls</li>
                <li>Secure database access</li>
                <li>Limited staff access</li>
                <li>Website security monitoring</li>
                <li>CAPTCHA or anti-spam protection</li>
                <li>Secure file storage where applicable</li>
              </ul>

              <p className="mt-3">
                However, no website, server, or internet transmission is
                completely secure. You are responsible for keeping your login
                credentials confidential.
              </p>
            </LegalSection>

            <LegalSection title="6. Data Retention">
              <p>
                We keep your information only as long as necessary for the
                purposes described in this Privacy Policy, including maintaining
                your account, completing and tracking orders, handling customer
                support, keeping transaction records, resolving disputes, and
                complying with legal requirements.
              </p>
            </LegalSection>

            <LegalSection title="7. Your Privacy Rights">
              <p>Subject to applicable law, you may have the right to:</p>

              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate or outdated information</li>
                <li>Request deletion or blocking of your personal information</li>
                <li>Object to certain processing activities</li>
                <li>Withdraw consent, when processing is based on consent</li>
                <li>Request information about how your data is processed</li>
                <li>File a complaint with the proper privacy authority</li>
              </ul>
            </LegalSection>

            <LegalSection title="8. Cookies and Similar Technologies">
              <p>
                Our website may use cookies or similar technologies to keep you
                signed in, remember preferences, improve website performance,
                protect the website from abuse, and understand general website
                usage.
              </p>
            </LegalSection>

            <LegalSection title="9. Children’s Privacy">
              <p>
                Our services are intended for customers who can legally place
                orders or have permission from a parent or guardian. We do not
                knowingly collect personal information from children without
                appropriate consent.
              </p>
            </LegalSection>

            <LegalSection title="10. Changes to This Privacy Policy">
              <p>
                We may update this Privacy Policy from time to time. When we make
                changes, we will update the effective date above. Continued use
                of our website after changes means you accept the updated Privacy
                Policy.
              </p>
            </LegalSection>

            <LegalSection title="11. Contact Us">
              <p>
                For questions, requests, or privacy concerns, contact us at:
              </p>

              <div className="mt-3 rounded-2xl bg-[var(--cream)] p-4 text-sm">
                <p className="font-semibold text-[var(--text)]">JNJ Printing</p>
                <p>Email: jnjprintinf.staff@gmail.com</p>
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