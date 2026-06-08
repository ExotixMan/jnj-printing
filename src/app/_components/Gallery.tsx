import Image from "next/image";

const gallery = [
  {
    image: "/lanyard.png",
    title: "Custom Lanyard",
    type: "ID Lace / Lanyard",
  },
  {
    image: "/book.png",
    title: "Printed Book Cover",
    type: "Book / Document Print",
  },
  {
    image: "/bag.png",
    title: "Custom Bag Print",
    type: "Tote Bag / Eco Bag",
  },
  {
    image: "/tshirt.png",
    title: "Custom T-Shirt Print",
    type: "Shirt Printing",
  },
];

export default function Gallery() {
  return (
    <section id="gallery" className="bg-[var(--surface)] px-4 py-20 md:px-8 xl:px-16">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-9">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold)]">
            Gallery
          </p>

          <h2 className="text-[26px] font-bold leading-tight text-[var(--text)]">
            Print samples from real projects
          </h2>

          <p className="mt-2 max-w-[620px] text-[16px] leading-[1.7] text-[var(--muted)]">
            Browse finished works that show the quality, detail, and style of our custom printing services.
          </p>
        </div>

        {/* Gallery Cards */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {gallery.map((item, index) => (
            <div
              key={index}
              className="group overflow-hidden rounded-[24px] bg-[var(--surface)] shadow-[0_12px_35px_rgba(13,13,20,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(13,13,20,0.12)]"
            >
              <div className="relative h-[220px] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={500}
                  height={300}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Soft overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Label on hover */}
                <div className="absolute bottom-4 left-4 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-bold text-[var(--purple)] backdrop-blur-md">
                    {item.type}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-white">
                    {item.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}