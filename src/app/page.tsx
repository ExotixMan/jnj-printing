import ClientFloatingActions from "./_components/ClientFloatingActions";
import Footer from "./_components/Footer";
import Gallery from "./_components/Gallery";
import Guideline from "./_components/Guideline";
import HomePage from "./_components/HomePage";
import Navbar from "./_components/Navbar";
import Services from "./_components/Services";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen scroll-smooth">
      <Navbar />
      <main className="scroll-smooth">
        <HomePage />
        <Guideline />
        <Services />
        <Gallery />
        <Footer />
        <ClientFloatingActions />
      </main>
    </div>
  );
}
