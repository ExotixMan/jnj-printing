export type Language = "en" | "fil";

export const siteCopy = {
  navbar: {
    en: {
      signIn: "Sign In",
      myOrders: "My Orders",
      customOrder: "Custom Order",
      logout: "Logout",
      theme: "Dark",
      translate: "TL",
    },
    fil: {
      signIn: "Mag-sign In",
      myOrders: "Aking Orders",
      customOrder: "Custom Order",
      logout: "Logout",
      theme: "Dilim",
      translate: "EN",
    },
  },
  home: {
    en: {
      heroTitle: ["Beautiful custom", "prints, from idea", "to pickup."],
      heroDescription:
        "JNJ Printing helps customers request custom designs, upload files, view estimated prices, submit payment, and track every step of production.",
      startOrder: "Start a Custom Order →",
      viewServices: "View Services",
      featureTitle: "Custom T-Shirt Print",
      featureTag: "Starts at",
    },
    fil: {
      heroTitle: ["Magagandang custom", "prints, mula ideya", "hanggang pickup."],
      heroDescription:
        "Tinutulungan ng JNJ Printing ang mga customer na mag-request ng custom design, mag-upload ng file, tingnan ang presyo, magbayad, at i-track ang bawat yugto ng production.",
      startOrder: "Magsimula ng Custom Order →",
      viewServices: "Tingnan ang Services",
      featureTitle: "Custom T-Shirt Print",
      featureTag: "Mula ₱180",
    },
  },
  footer: {
    en: {
      description:
        "JNJ Printing helps customers request custom designs, upload files, view estimated prices, submit payment, and track every step of production.",
      quickLinks: "Quick Links",
      services: "Services",
      contact: "Contact",
      startOrder: "Start a Custom Order →",
      rights: "© 2026 JNJ Printing. All rights reserved.",
    },
    fil: {
      description:
        "Tinutulungan ng JNJ Printing ang mga customer na mag-request ng custom design, mag-upload ng file, tingnan ang presyo, magbayad, at i-track ang bawat yugto ng production.",
      quickLinks: "Mabilis na Links",
      services: "Mga Serbisyo",
      contact: "Makipag-ugnayan",
      startOrder: "Magsimula ng Custom Order →",
      rights: "© 2026 JNJ Printing. Lahat ng karapatan ay nakalaan.",
    },
  },
  guideline: {
    en: {
      title: "How It Works",
      subtitle: ["Three simple steps", "to your custom order"],
      steps: ["Choose Service", "Add Print Details", "Upload & Track"],
      stepNames: ["Select", "Details", "Track"],
      descriptions: [
        "Select DTF, Silkscreen, Rubberized, Sublimation, or Vinyl printing based on your custom print needs.",
        "Choose the apparel type, quantity, size, color, and print placement before sending your order request.",
        "Upload your design, wait for staff approval, confirm payment, and track your order until pickup.",
      ],
    },
    fil: {
      title: "Paano Ito Gumagana",
      subtitle: ["Tatlong simpleng hakbang", "para sa custom order mo"],
      steps: ["Piliin ang Serbisyo", "Idagdag ang Detalye", "Mag-upload at Mag-track"],
      stepNames: ["Piliin", "Detalye", "Track"],
      descriptions: [
        "Pumili ng DTF, Silkscreen, Rubberized, Sublimation, o Vinyl depende sa kailangan mong print.",
        "Piliin ang uri ng damit, dami, sukat, kulay, at placement bago ipasa ang order request.",
        "I-upload ang design, hintayin ang approval ng staff, kumpirmahin ang bayad, at i-track ang order hanggang pickup.",
      ],
    },
  },
  services: {
    en: {
      title: "Printing Services",
      subtitle: "These are the only services shown. Apparel is selected later inside the quote form.",
      heading: "Choose One Service",
      tags: ["Full color", "Bulk orders", "Raised finish", "Sportswear", "Names & numbers"],
    },
    fil: {
      title: "Mga Serbisyo sa Pagpi-print",
      subtitle: "Ito lang ang mga service na ipinapakita. Ang apparel ay pipiliin sa loob ng quote form.",
      heading: "Pumili ng Isang Serbisyo",
      tags: ["Buong kulay", "Maramihang order", "Raised finish", "Pang-sports", "Pangalan at numero"],
    },
  },
  about: {
    en: {
      title: "About JNJ Printing",
      subtitle: ["Your prints,", "our passion."],
      intro:
        "JNJ Printing is a local printing service that helps customers bring their custom ideas to life through quality prints, clear order details, design review, payment confirmation, and production tracking.",
      intro2:
        "The goal is to make custom printing easier for customers by guiding them from service selection to design upload and pickup.",
      journeyTitle: ["Built through service,", "growth, and quality."],
      journeyText:
        "From small beginnings to a more organized printing workflow, JNJ Printing continues to improve how customers request and track custom print orders.",
    },
    fil: {
      title: "Tungkol sa JNJ Printing",
      subtitle: ["Ang inyong prints,", "aming passion."],
      intro:
        "Ang JNJ Printing ay isang lokal na printing service na tumutulong sa mga customer na buhayin ang custom ideas sa pamamagitan ng quality prints, malinaw na order details, design review, payment confirmation, at production tracking.",
      intro2:
        "Layunin naming gawing mas madali ang custom printing sa pamamagitan ng paggabay mula service selection hanggang design upload at pickup.",
      journeyTitle: ["Binuo sa serbisyo,", "paglago, at kalidad."],
      journeyText:
        "Mula sa simpleng simula hanggang mas organisadong workflow, patuloy na pinapaganda ng JNJ Printing kung paano mag-request at mag-track ng custom print orders ang mga customer.",
    },
  },
} as const;
