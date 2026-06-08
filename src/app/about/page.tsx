import Navbar from "../_components/Navbar";
import Footer from "../_components/Footer";
import About from "../_components/About";

export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--cream)] scroll-smooth">
      <Navbar />
      <About />
      <Footer />
    </div>
  );
}
