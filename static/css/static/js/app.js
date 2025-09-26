(async function () {
  // Carregar config (com cache-bust)
  const res = await fetch(`data/site.json?v=${Date.now()}`);
  const cfg = await res.json();

  // Utils
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => document.querySelectorAll(sel);
  const setText = (bind, val) =>
    qsa(`[data-bind="${bind}"]`).forEach((el) => (el.textContent = val || ""));

  // Título, marca, ano
  setText("title", `${cfg.business.name} — ${cfg.meta_title || "Site"}`);
  setText("business_name", cfg.business.name);
  setText("year", new Date().getFullYear());
  setText("footer_text", cfg.footer?.text || "Todos os direitos reservados.");
  setText("agency", cfg.footer?.agency || "Sua Agência");

  // ---- Hero / Banner — com pré-carregamento e fallbacks de caminho ----
  async function aplicarBannerComFallback(imgPathOriginal) {
    if (!imgPathOriginal) return;

    // Gera 3 possibilidades: como está, com './' e com '/' (raiz)
    const candidatos = [
      imgPathOriginal,
      imgPathOriginal.startsWith("./") ? imgPathOriginal : `./${imgPathOriginal}`,
      imgPathOriginal.startsWith("/") ? imgPathOriginal : `/${imgPathOriginal}`,
    ];

    // Remove duplicados mantendo ordem
    const vistos = new Set();
    const tentativas = candidatos.filter((p) => (vistos.has(p) ? false : vistos.add(p)));

    const heroEl = qs(".hero");
    for (const src of tentativas) {
      try {
        await new Promise((ok, nok) => {
          const im = new Image();
          im.onload = () => ok(true);
          im.onerror = () => nok(new Error("erro"));
          im.src = src + (src.includes("?") ? `&v=${Date.now()}` : `?v=${Date.now()}`);
        });
        // Sucesso: aplica o background completo (degradê + cover)
        heroEl.style.setProperty(
          "background",
          `linear-gradient(90deg, rgba(0,0,0,.55), rgba(0,0,0,.35)), url('${src}') center/cover no-repeat`
        );
        return; // para na primeira que funcionar
      } catch (e) {
        // tenta o próximo candidato
      }
    }
    // Se nada funcionou, mantém sem imagem (evita tarja)
  }

  await aplicarBannerComFallback(cfg.hero?.image);

  // Headline / Sub / Badges
  if (cfg.hero?.headline) setText("headline", cfg.hero.headline);
  if (cfg.hero?.subheadline) setText("subheadline", cfg.hero.subheadline);
  if (cfg.hero?.badges) {
    setText("badge1", cfg.hero.badges[0] || "");
    setText("badge2", cfg.hero.badges[1] || "");
    setText("badge3", cfg.hero.badges[2] || "");
  }

  // WhatsApp
  const wa = cfg.contact.whatsapp?.replace(/\D/g, "") || "";
  const waText = encodeURIComponent(cfg.contact.wa_message || "");
  const waLink = wa ? `https://wa.me/${wa}?text=${waText}` : "#";
  qsa('[data-bind="whatsapp_link"]').forEach((a) => (a.href = waLink));
  const waDisplay = qs("#wa_display");
  if (waDisplay) waDisplay.href = waLink;
  const waFloat = qs("#wa_float");
  if (waFloat) waFloat.href = waLink;

  // Telefone / Email
  const tel = qs("#telefone");
  if (tel) tel.textContent = cfg.contact.phone || "";
  const emailLink = qs("#email_link");
  if (emailLink) {
    emailLink.textContent = cfg.contact.email || "";
    emailLink.href = `mailto:${cfg.contact.email || ""}`;
  }

  // Cards
  const cards = qs("#cards_container");
  if (cards && Array.isArray(cfg.cards)) {
    cards.innerHTML = cfg.cards
      .slice(0, 3)
      .map(
        (c) => `
      <article class="card">
        ${c.image ? `<img class="thumb" src="${c.image}" alt="${c.title}">` : `<div class="thumb"></div>`}
        <h3>${c.title}</h3>
        <p>${c.text || ""}</p>
      </article>
    `
      )
      .join("");
  }

  // Legal strip
  const legal = qs("#legal_lines");
  if (legal && cfg.legal_info?.lines?.length) {
    legal.innerHTML = cfg.legal_info.lines
      .map((line) => `<span class="line">${line}</span>`)
      .join("");
  }

  // Sobre / História
  if (cfg.about?.title) setText("about_title", cfg.about.title);
  if (cfg.about?.text) qs("#about_text").textContent = cfg.about.text;
  if (cfg.about?.history_title) setText("history_title", cfg.about.history_title);
  if (cfg.about?.history) qs("#history_text").textContent = cfg.about.history;

  // Pagamentos
  const payWrap = qs("#payments_badges");
  if (payWrap && Array.isArray(cfg.payments?.methods)) {
    payWrap.innerHTML = cfg.payments.methods
      .map((m) => {
        const cls = m.toLowerCase().replace(/\s+/g, "");
        return `<span class="badge ${cls}">${m}</span>`;
      })
      .join("");
  }
  const pnote = qs("#payments_note");
  if (pnote) pnote.textContent = cfg.payments?.note || "";

  // Certificados
  const certList = qs("#cert_list");
  if (certList && Array.isArray(cfg.certs?.items)) {
    certList.innerHTML = cfg.certs.items
      .map(
        (txt) => `
      <li>
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z"/></svg>
        <span>${txt}</span>
      </li>
    `
      )
      .join("");
  }

  // Endereço, horários, mapa
  const end = qs("#endereco");
  if (end) end.textContent = cfg.business.address || "";
  const hrs = qs("#horarios");
  if (hrs && Array.isArray(cfg.business.hours))
    hrs.innerHTML = cfg.business.hours.map((h) => `<div>${h}</div>`).join("");
  const map = qs("#map_iframe");
  if (map && cfg.business.maps_embed) map.src = cfg.business.maps_embed;

  // Cor primária
  if (cfg.colors?.primary)
    document.documentElement.style.setProperty("--primary", cfg.colors.primary);

  // WhatsApp flutuante
  const toggleWA = () => {
    if (!waFloat) return;
    const scrolled = window.scrollY > 40;
    const mobile = window.innerWidth < 768;
    waFloat.classList.toggle("show", scrolled || mobile);
  };
  toggleWA();
  window.addEventListener("scroll", toggleWA);
  window.addEventListener("resize", toggleWA);
})();
