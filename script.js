/* ========== KONFIGURÁCIA — upravte podľa seba ========== */
const CONFIG = {
  calendly: {
    zoom: 'https://calendly.com/vas-ucet/ai-workshop-zoom',
    phone: 'https://calendly.com/vas-ucet/telefonicky-hovor',
    discovery: 'https://calendly.com/vas-ucet/discovery-call',
  },
  email: 'hello@veltro.sk',
};

/* ========== Header & menu ========== */
const header = document.getElementById('header');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
});

menuToggle.addEventListener('click', () => {
  menuToggle.classList.toggle('active');
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    menuToggle.classList.remove('active');
    navLinks.classList.remove('open');
  });
});

/* ========== Scroll animations ========== */
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll(
  '.card, .step, .use-case, .pricing-card, .section-header, .stat-card, .team-card, .reference-card, .booking-card, .faq-item'
).forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

/* ========== Kontaktný formulár ========== */
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', e => {
  e.preventDefault();
  const btn = contactForm.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.textContent = 'Odosielam...';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = '✓ Správa odoslaná!';
    btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
    contactForm.reset();
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.disabled = false;
    }, 3000);
  }, 1200);
});

/* ========== Hero demo rotácia ========== */
const messages = [
  'Objednávka č. 4821 je na ceste — doručenie zajtra do 14:00. Poslal som vám SMS s odkazom na sledovanie.',
  'Vaša faktúra č. 2024-089 bola schválená. Posielam ju na e-mail do 5 minút.',
  'Našiel som 3 produkty, ktoré by vás mohli zaujímať. Chcete, aby som vám poslal porovnanie?',
];

let msgIndex = 0;
const agentResponse = document.getElementById('agentResponse');

if (agentResponse) {
  agentResponse.style.transition = 'opacity 0.4s ease';
  setInterval(() => {
    msgIndex = (msgIndex + 1) % messages.length;
    agentResponse.style.opacity = '0';
    setTimeout(() => {
      agentResponse.textContent = messages[msgIndex];
      agentResponse.style.opacity = '1';
    }, 400);
  }, 5000);
}

/* ========== Rezervačný modal ========== */
const bookingModal = document.getElementById('bookingModal');
const modalClose = document.getElementById('modalClose');
const bookingForm = document.getElementById('bookingForm');
const bookingType = document.getElementById('bookingType');
const modalTitle = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');
const calendlyLink = document.getElementById('calendlyLink');

const bookingLabels = {
  zoom: {
    title: 'Rezervovať Zoom videohovor',
    subtitle: '45-minútový bezplatný AI workshop online.',
    calendly: CONFIG.calendly.zoom,
  },
  phone: {
    title: 'Rezervovať telefonický hovor',
    subtitle: '20-minútový bezplatný hovor s naším konzultantom.',
    calendly: CONFIG.calendly.phone,
  },
  discovery: {
    title: 'Rezervovať Discovery call',
    subtitle: '60-minútový hĺbkový call pre komplexnejšie projekty.',
    calendly: CONFIG.calendly.discovery,
  },
};

function openBooking(type = 'zoom') {
  const config = bookingLabels[type] || bookingLabels.zoom;
  bookingType.value = type;
  modalTitle.textContent = config.title;
  modalSubtitle.textContent = config.subtitle;
  calendlyLink.href = config.calendly;
  bookingModal.classList.add('open');
  bookingModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('bookDate').min = tomorrow.toISOString().split('T')[0];
}

function closeBooking() {
  bookingModal.classList.remove('open');
  bookingModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.querySelectorAll('[data-open-booking]').forEach(btn => {
  btn.addEventListener('click', () => openBooking(btn.dataset.openBooking));
});

modalClose.addEventListener('click', closeBooking);
bookingModal.addEventListener('click', e => {
  if (e.target === bookingModal) closeBooking();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeBooking();
    closeChat();
  }
});

bookingForm.addEventListener('submit', e => {
  e.preventDefault();
  const btn = bookingForm.querySelector('button[type="submit"]');
  const type = bookingType.value;
  const name = document.getElementById('bookName').value;
  const email = document.getElementById('bookEmail').value;
  const date = document.getElementById('bookDate').value;
  const time = document.getElementById('bookTime').value;

  btn.textContent = 'Rezervujem...';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = '✓ Rezervácia odoslaná!';
    btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

    const typeName = type === 'zoom' ? 'Zoom' : type === 'phone' ? 'Telefón' : 'Discovery';
    console.log('Rezervácia:', { type: typeName, name, email, date, time });

    setTimeout(() => {
      closeBooking();
      bookingForm.reset();
      btn.textContent = 'Potvrdiť rezerváciu';
      btn.style.background = '';
      btn.disabled = false;
      alert(
        `Ďakujeme, ${name}! Vaša rezervácia (${typeName}) na ${date} o ${time} bola zaznamenaná. Potvrdenie pošleme na ${email}.\n\nTip: Pre automatické plánovanie pripojte Calendly odkaz v script.js.`
      );
    }, 1500);
  }, 1000);
});

/* ========== AI Chatbot (Veltro AI) ========== */
const chatToggle = document.getElementById('chatToggle');
const chatPanel = document.getElementById('chatPanel');
const chatClose = document.getElementById('chatClose');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatQuick = document.getElementById('chatQuick');

const chatKnowledge = [
  {
    keys: ['cenník', 'cena', 'ceny', 'koľko', 'stojí', 'stoji', 'cennik', 'balík', 'balik', 'starter', 'business', 'enterprise', '990', '2490'],
    answer:
      'Naše balíky: **Starter** od 990 €/mesiac (1 AI agent), **Business** od 2 490 €/mesiac (až 3 agenti, neobmedzené konverzácie) a **Enterprise** na mieru. Presnú cenu určíme po bezplatnom 45-minútovom workshope. Chcete si rezervovať konzultáciu?',
  },
  {
    keys: ['služb', 'sluzb', 'ponúk', 'ponuk', 'čo robíte', 'co robite', 'agent', 'web', 'e-shop', 'eshop', 'implement'],
    answer:
      'Ponúkame tri hlavné služby:\n\n1. **AI agenti** — zákaznícka podpora, predaj, interné procesy\n2. **Webstránky a e-shopy** — moderný dizajn, SEO, rýchlosť\n3. **Implementácia AI do businessu** — audit, automatizácia, školenia\n\nVšetko prispôsobíme vašej firme.',
  },
  {
    keys: ['proces', 'spoluprác', 'spoluprac', 'ako prebieha', 'kroky', 'postup', 'workflow'],
    answer:
      'Spolupráca má 5 krokov:\n\n01 Úvodný meeting (45 min AI workshop)\n02 Projekt a zmluva (KPI, harmonogram)\n03 Predanie prístupov (GDPR, šifrovanie)\n04 Implementácia riešenia\n05 Optimalizácia a škálovanie\n\nPrvý prototyp zvyčajne do 2 týždňov.',
  },
  {
    keys: ['rezerv', 'call', 'meeting', 'zoom', 'telefón', 'telefon', 'hovor', 'konzult', 'termín', 'termin', 'book', 'stretnut'],
    answer:
      'Bezplatnú konzultáciu si môžete rezervovať tromi spôsobmi:\n\n📹 **Zoom videohovor** (45 min)\n📞 **Telefonický hovor** (20 min)\n🤝 **Discovery call** (60 min)\n\nPrejdite do sekcie Rezervácia alebo kliknite na tlačidlo „Rezervovať call“ v menu. Môžem vám otvoriť rezervačný formulár — napíšte „rezervovať zoom“.',
    action: 'booking',
  },
  {
    keys: ['výsledk', 'vysledk', 'kedy', 'ako dlho', 'čas', 'cas', 'týžd', 'tyzd', 'nasaden'],
    answer:
      'Prvý prototyp AI agenta zvyčajne do **2 týždňov**. Merateľné výsledky (úspora času, rýchlejšie odpovede) väčšinou do **4–6 týždňov** po nasadení. Záleží od zložitosti integrácií.',
  },
  {
    keys: ['bezpeč', 'bezpec', 'gdpr', 'nda', 'dáta', 'data', 'ochrana', 'súkrom', 'sukrom'],
    answer:
      'Bezpečnosť berieme vážne: šifrované prístupy, GDPR compliance, minimálne spracovanie dát a NDA na požiadanie. Vaše dáta nikdy nepredávame tretím stranám.',
  },
  {
    keys: ['zahranič', 'zahranic', 'česko', 'cesko', 'anglick', 'cudz'],
    answer:
      'Áno, pracujeme aj so zahraničnými klientmi. Primárne obsluhujeme **slovenský a český trh**, komunikujeme v slovenčine, češtine a angličtine.',
  },
  {
    keys: ['kontakt', 'email', 'mail', 'telefón', 'telefon', 'zavola', 'napísa', 'napisa', 'adresa'],
    answer: `Kontaktujte nás:\n\n📧 ${CONFIG.email}\n📞 +421 900 123 456\n📍 Bratislava · Košice · Remote\n\nOdpovedáme do 24 hodín.`,
  },
  {
    keys: ['ahoj', 'hello', 'hi', 'dobrý', 'dobry', 'čau', 'cau', 'nazdar', 'začni', 'zacni'],
    answer:
      'Ahoj! Som **Veltro AI**, asistent spoločnosti Veltro. Pomôžem vám s informáciami o službách, cenách, procese alebo rezervácii callu. Čo vás zaujíma?',
  },
  {
    keys: ['ďakuj', 'dakuj', 'vďaka', 'vdaka', 'super', 'paráda', 'parada', 'ok', 'okej'],
    answer: 'Rád som pomohol! Ak budete potrebovať čokoľvek ďalšie, som tu. Prajem úspešný deň! 🚀',
  },
];

function findChatAnswer(text) {
  const lower = text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

  if (lower.includes('rezervovat zoom') || lower.includes('rezervuj zoom')) {
    return { answer: 'Otváram rezervačný formulár pre Zoom...', action: 'zoom' };
  }
  if (lower.includes('rezervovat') || lower.includes('rezervuj')) {
    return { answer: 'Otváram rezervačný formulár...', action: 'booking' };
  }

  let best = null;
  let bestScore = 0;

  for (const item of chatKnowledge) {
    let score = 0;
    for (const key of item.keys) {
      const k = key.normalize('NFD').replace(/\p{M}/gu, '');
      if (lower.includes(k)) score += k.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  if (best && bestScore > 0) return best;

  return {
    answer:
      'Na túto otázku zatiaľ nemám presnú odpoveď. Odporúčam:\n\n• Rezervovať si **bezplatný call** (sekcia Rezervácia)\n• Napísať na **hello@veltro.sk**\n• Alebo sa opýtať na cenník, služby či proces spolupráce.',
  };
}

function formatChatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function addChatMessage(text, isUser = false) {
  const div = document.createElement('div');
  div.className = `chat-msg ${isUser ? 'user' : 'bot'}`;
  if (isUser) {
    div.textContent = text;
  } else {
    div.innerHTML = formatChatText(text);
  }
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function botReply(userText) {
  addChatMessage(userText, true);

  const typing = document.createElement('div');
  typing.className = 'chat-msg bot typing';
  typing.textContent = 'Veltro AI píše...';
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  setTimeout(() => {
    typing.remove();
    const result = findChatAnswer(userText);
    addChatMessage(result.answer);

    if (result.action === 'booking' || result.action === 'zoom') {
      setTimeout(() => {
        closeChat();
        openBooking(result.action === 'zoom' ? 'zoom' : 'zoom');
      }, 800);
    }
  }, 600 + Math.random() * 400);
}

function openChat() {
  chatPanel.classList.add('open');
  chatPanel.setAttribute('aria-hidden', 'false');
  chatToggle.style.display = 'none';
  chatInput.focus();
}

function closeChat() {
  chatPanel.classList.remove('open');
  chatPanel.setAttribute('aria-hidden', 'true');
  chatToggle.style.display = 'flex';
}

chatToggle.addEventListener('click', openChat);
chatClose.addEventListener('click', closeChat);

chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';
  botReply(text);
});

chatQuick.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => botReply(btn.dataset.question));
});

/* ========== Cookies ========== */
const cookieBanner = document.getElementById('cookieBanner');
const cookieAccept = document.getElementById('cookieAccept');
const cookieReject = document.getElementById('cookieReject');
const cookieSettings = document.getElementById('cookieSettings');

if (!localStorage.getItem('cookiesChoice')) {
  setTimeout(() => cookieBanner.classList.add('show'), 1500);
}

cookieAccept.addEventListener('click', () => {
  localStorage.setItem('cookiesChoice', 'accepted');
  cookieBanner.classList.remove('show');
});

cookieReject.addEventListener('click', () => {
  localStorage.setItem('cookiesChoice', 'rejected');
  cookieBanner.classList.remove('show');
});

cookieSettings.addEventListener('click', e => {
  e.preventDefault();
  cookieBanner.classList.add('show');
});
