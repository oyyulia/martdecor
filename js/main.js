/* МАРТдекор — прототип. Данные в js/data.js, типографика строк — js/typo.js. */
(function () {
  const M = window.MD;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  /* typo + последнее слово не остаётся одно на строке (короткие пары, чтобы не распирать узкие карточки) */
  const T = (s, max = 17) => window.typo(s).replace(/(\S+) (\S+)$/, (m, a, b) => (a.length + b.length <= max ? a + " " + b : m));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const money = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
  const params = new URLSearchParams(location.search);
  const byId = (id) => M.items.find((x) => x.id === id);

  const SEC_ICON = { lepnina: "building-arch", oboi: "wallpaper", kraski: "paint", paneli: "layout-grid", shpon: "mountain", profili: "bulb" };
  const STATUS = { in: ["in", "В наличии"], few: ["few", "Осталось немного"], order: ["order", "Под заказ"] };

  /* ---------- появление при прокрутке ---------- */
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px" })
    : null;
  function observe(els) { els.forEach((el) => (io ? io.observe(el) : el.classList.add("is-in"))); }

  const ph = (tone, icon, cap) =>
    '<div class="ph tone-' + tone + '"><i class="ti ti-' + icon + ' ph__ic"></i>' +
    (cap ? '<span class="ph__cap"><i class="ti ti-photo"></i>' + T(cap) + "</span>" : "") + "</div>";

  /* ---------- меню ---------- */
  const burger = $(".burger");
  if (burger) {
    burger.addEventListener("click", () => {
      const open = $(".nav").classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open);
      burger.innerHTML = open ? '<i class="ti ti-x"></i>' : '<i class="ti ti-menu-2"></i>';
    });
    $$(".nav a").forEach((a) => a.addEventListener("click", () => $(".nav").classList.remove("is-open")));
  }

  /* ---------- открыто сейчас (Ростов-на-Дону — московское время) ---------- */
  const parts = new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", hour: "numeric", hourCycle: "h23", weekday: "short" }).formatToParts(new Date());
  const hour = parseInt(parts.find((p) => p.type === "hour").value, 10);
  const wd = parts.find((p) => p.type === "weekday").value.toLowerCase();
  const weekend = wd.startsWith("сб") || wd.startsWith("вс");
  const [open, close] = weekend ? M.site.hours.weekend : M.site.hours.week;
  const isOpen = hour >= open && hour < close;
  $$("[data-status]").forEach((el) => {
    el.classList.toggle("is-closed", !isOpen);
    el.textContent = T(isOpen ? "Открыто до " + close + ":00" : hour < open ? "Откроемся в " + open + ":00" : "Закрыто, завтра с 10:00");
  });

  /* ---------- подборка: вместо корзины — список для менеджера ---------- */
  const KEY = "martdecor-selection";
  let sel = [];
  try { sel = JSON.parse(localStorage.getItem(KEY) || "[]").filter(byId); } catch (e) { sel = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(sel)); } catch (e) { /* без хранилища подборка живёт до перезагрузки */ } };
  const has = (id) => sel.indexOf(id) >= 0;

  let toastTimer;
  function toast(text) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.innerHTML = '<i class="ti ti-check"></i>' + esc(T(text));
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-on"), 2200);
  }

  function toggle(id) {
    if (has(id)) { sel = sel.filter((x) => x !== id); toast("Убрали из подборки"); }
    else { sel.push(id); toast("Добавили в подборку"); }
    save(); syncSel();
  }

  function syncSel() {
    $$("[data-sel-n]").forEach((n) => { n.textContent = sel.length; n.toggleAttribute("data-zero", !sel.length); });
    $$("[data-add]").forEach((b) => {
      const on = has(b.dataset.add);
      b.setAttribute("aria-pressed", on);
      b.setAttribute("aria-label", on ? "Убрать из подборки" : "Добавить в подборку");
      const lbl = $("[data-add-label]", b);
      if (lbl) lbl.textContent = on ? "В подборке" : "В подборку";
      const ic = $("i", b);
      if (ic) ic.className = "ti " + (on ? "ti-check" : "ti-plus");
    });
    const list = $("[data-drawer-list]");
    if (list) {
      list.innerHTML = sel.length
        ? sel.map((id) => {
            const it = byId(id), s = M.sections[it.sec];
            return '<div class="drawer__item">' + ph(s.tone, SEC_ICON[it.sec]) +
              "<div><b>" + esc(T(it.name)) + "</b><span>от " + money(it.price) + "</span></div>" +
              '<button class="drawer__rm" data-rm="' + it.id + '" aria-label="Убрать"><i class="ti ti-x"></i></button></div>';
          }).join("")
        : '<div class="drawer__empty"><i class="ti ti-layers-subtract"></i>' + esc(T("Добавляйте материалы кнопкой «+» — менеджер посчитает количество и стоимость всей подборки.")) + "</div>";
    }
    const formSel = $("[data-form-sel]");
    if (formSel) {
      formSel.hidden = !sel.length;
      formSel.innerHTML = "<b>Ваша подборка — " + sel.length + " поз.</b><ul>" + sel.map((id) => "<li>" + esc(T(byId(id).name)) + "</li>").join("") + "</ul>";
    }
  }

  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) { e.preventDefault(); toggle(add.dataset.add); return; }
    const rm = e.target.closest("[data-rm]");
    if (rm) { toggle(rm.dataset.rm); return; }
    if (e.target.closest("[data-drawer-open]")) { drawer(true); return; }
    if (e.target.closest("[data-drawer-close]")) drawer(false);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") drawer(false); });

  /* закрытая панель скрыта целиком, чтобы не торчать за правым краем */
  let drawerTimer;
  function drawer(open) {
    const d = $(".drawer");
    if (!d) return;
    clearTimeout(drawerTimer);
    if (open) { d.hidden = false; void d.offsetWidth; d.classList.add("is-open"); }
    else if (!d.hidden) { d.classList.remove("is-open"); drawerTimer = setTimeout(() => (d.hidden = true), 400); }
  }

  /* ---------- карточка позиции в сетке ---------- */
  function card(it) {
    const s = M.sections[it.sec], st = STATUS[it.status];
    return '<article class="item" data-reveal>' +
      '<span class="item__label">' + esc(it.code) + "</span>" +
      ph(s.tone, SEC_ICON[it.sec], "Фото образца") +
      '<div class="item__body"><span class="item__sec">' + esc(T(s.title)) + (it.pack ? " · " + esc(it.pack.replace(/ /g, "\u00A0")) : "") + "</span>" +
      '<h3><a href="item.html?id=' + it.id + '">' + esc(T(it.name)) + "</a></h3>" +
      '<span class="badge badge--' + st[0] + '">' + st[1] + "</span>" +
      '<div class="item__foot"><span class="item__price"><small>от </small>' + money(it.price) + "</span>" +
      '<button class="add" data-add="' + it.id + '" aria-pressed="false" aria-label="Добавить в подборку"><i class="ti ti-plus"></i></button></div>' +
      "</div></article>";
  }
  const needLepnina = () =>
    '<div class="item--need" data-reveal><i class="ti ti-clipboard-text"></i><h3>' + esc(T("Лепной декор — нужны позиции от вас")) + "</h3>" +
    "<p>" + esc(T("3–4 позиции с ценами: молдинг, карниз, плинтус, розетка. Страницы лепнины на сайте не открылись, а цены придумывать не стали.")) + "</p></div>";

  /* ---------- главная ---------- */
  const dirs = $("[data-dirs]");
  if (dirs) {
    dirs.innerHTML = Object.keys(M.sections).map((k) => {
      const s = M.sections[k], list = M.items.filter((x) => x.sec === k);
      const min = list.length ? Math.min.apply(null, list.map((x) => x.price)) : null;
      return '<a class="dir" href="catalog.html?sec=' + k + '" data-reveal>' + ph(s.tone, SEC_ICON[k], "Фактура крупным планом") +
        '<div class="dir__body"><div class="dir__top"><h3>' + esc(T(s.title)) + "</h3>" +
        (min ? '<span class="dir__price">от ' + money(min) + "</span>" : '<span class="dir__price is-need">цены — от вас</span>') + "</div>" +
        "<p>" + esc(T(s.fact)) + "</p>" +
        '<span class="link">Смотреть <i class="ti ti-arrow-right"></i></span></div></a>';
    }).join("");
  }

  const stylesBox = $("[data-styles]");
  if (stylesBox) {
    const keys = Object.keys(M.styles);
    $("[data-style-tabs]").innerHTML = keys.map((k, i) =>
      '<button class="chip-tab" role="tab" aria-selected="' + (i === 0) + '" data-style="' + k + '">' + esc(T(M.styles[k].title)) + "</button>").join("");
    const show = (k) => {
      const s = M.styles[k];
      $$("[data-style]").forEach((b) => b.setAttribute("aria-selected", b.dataset.style === k));
      $("[data-style-img]").innerHTML = ph("sand", "armchair", "Интерьер в стиле «" + s.title + "»") +
        '<div class="swatches">' + s.swatches.map((c) => '<span style="background:' + c + '"></span>').join("") + "</div>";
      $("[data-style-title]").textContent = T(s.title);
      $("[data-style-lead]").textContent = T(s.lead);
      $("[data-style-mats]").innerHTML = s.list.map((m) => "<li>" + esc(T(m)) + "</li>").join("");
      $("[data-style-meta]").innerHTML = "<span><b>Оттенки:</b> " + esc(T(s.palette)) + "</span><span><b>Стиль:</b> " + esc(T(s.tags)) + "</span>";
      $("[data-style-link]").href = "catalog.html?style=" + k;
    };
    stylesBox.addEventListener("click", (e) => { const b = e.target.closest("[data-style]"); if (b) show(b.dataset.style); });
    show(keys[0]);
  }

  const featured = $("[data-featured]");
  if (featured) {
    featured.innerHTML = ["fresco-palermo", "lanors-travertin", "gips-origami", "decaro-d1135", "verde-guatemala", "sirpi-20065", "decaro-d1186"]
      .map((id) => card(byId(id))).join("") + needLepnina();
  }

  const rev = $("[data-reviews]");
  if (rev) {
    rev.innerHTML = M.reviews.map((r, i) =>
      '<figure class="review"' + (i >= 6 ? " hidden" : "") + '><span class="review__q">«</span><blockquote class="review__text">' +
      r.text.split("\n").map((p) => "<p>" + esc(T(p, 26)) + "</p>").join("") + "</blockquote>" +
      '<figcaption class="review__who"><span class="review__ava" data-l="' + esc(r.name.charAt(0)) + '" aria-hidden="true"></span><div><b>' + esc(T(r.name)) + '</b><p class="review__role">' + esc(T(r.role)) + "</p></div></figcaption></figure>").join("");
    const more = $("[data-reviews-more]");
    if (more) {
      more.textContent = "Показать все " + M.reviews.length + " отзывов";
      more.addEventListener("click", () => { $$(".review[hidden]", rev).forEach((r) => (r.hidden = false)); more.parentElement.remove(); });
    }
  }

  const tips = $("[data-tips]");
  if (tips) tips.innerHTML = M.articles.map(tipCard).join("");
  function tipCard(a) {
    const s = M.sections[a.sec];
    return '<article class="tip" data-reveal>' + ph(s.tone, SEC_ICON[a.sec], "Фото из поста") +
      '<div class="tip__body"><span class="tip__meta">' + esc(a.date) + " · " + esc(s.title) + "</span>" +
      '<h3><a href="article.html?id=' + a.id + '">' + esc(T(a.title)) + "</a></h3><p>" + esc(T(a.lead)) + "</p></div></article>";
  }

  const faq = $("[data-faq]");
  if (faq) {
    faq.innerHTML = M.faq.map(([q, a], i) =>
      "<details" + (i === 0 ? " open" : "") + "><summary>" + esc(T(q)) + '<i class="ti ti-plus"></i></summary><p>' + esc(T(a)) + "</p></details>").join("");
  }

  const form = $("[data-form]");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      form.classList.add("is-sent");
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const file = $("[data-file]", form);
    if (file) file.addEventListener("change", () => {
      $("[data-file-name]", form).textContent = file.files.length ? T("Фото прикреплено: " + file.files[0].name) : T("Прикрепить фото помещения или проект");
    });
  }

  /* ---------- каталог ---------- */
  const grid = $("[data-cat-grid]");
  if (grid) {
    const state = { sec: params.get("sec") || "all", style: params.get("style") || "", q: params.get("q") || "" };
    if (state.sec !== "all" && !M.sections[state.sec]) state.sec = "all";
    if (state.style && !M.styles[state.style]) state.style = "";
    const search = $("[data-search]");
    search.value = state.q;

    const tabs = $("[data-cat-tabs]");
    tabs.innerHTML = [["all", "Все материалы", M.items.length]]
      .concat(Object.keys(M.sections).map((k) => [k, M.sections[k].title, M.items.filter((x) => x.sec === k).length]))
      .map(([k, t, n]) => '<button class="chip-tab" role="tab" aria-selected="' + (state.sec === k) + '" data-sec="' + k + '">' + esc(T(t)) + "<span>" + n + "</span></button>").join("");

    const sf = $("[data-style-filter]");
    sf.innerHTML = "<span>Подойдёт для стиля:</span>" + Object.keys(M.styles).map((k) =>
      '<button aria-pressed="' + (state.style === k) + '" data-fstyle="' + k + '">' + esc(T(M.styles[k].title)) + "</button>").join("");

    const render = () => {
      const q = state.q.trim().toLowerCase();
      const list = M.items.filter((it) =>
        (state.sec === "all" || it.sec === state.sec) &&
        (!state.style || it.styles.indexOf(state.style) >= 0) &&
        (!q || (it.name + " " + it.code + " " + M.sections[it.sec].title).toLowerCase().indexOf(q) >= 0));
      const withNeed = (state.sec === "all" || state.sec === "lepnina") && !state.style && !q;
      grid.innerHTML = list.map(card).join("") + (withNeed ? needLepnina() : "") +
        (!list.length && !withNeed ? '<div class="cat-empty"><i class="ti ti-search"></i>' + esc(T("Ничего не нашли. Напишите менеджеру — подберём по описанию или фото.")) + "</div>" : "");
      $$("[data-sec]", tabs).forEach((b) => b.setAttribute("aria-selected", b.dataset.sec === state.sec));
      $$("[data-fstyle]", sf).forEach((b) => b.setAttribute("aria-pressed", b.dataset.fstyle === state.style));
      const title = $("[data-cat-title]");
      if (title) title.textContent = T(state.sec === "all" ? "Каталог материалов" : M.sections[state.sec].title);
      syncSel(); observe($$("[data-reveal]", grid));
    };
    tabs.addEventListener("click", (e) => { const b = e.target.closest("[data-sec]"); if (b) { state.sec = b.dataset.sec; render(); } });
    sf.addEventListener("click", (e) => { const b = e.target.closest("[data-fstyle]"); if (b) { state.style = state.style === b.dataset.fstyle ? "" : b.dataset.fstyle; render(); } });
    search.addEventListener("input", () => { state.q = search.value; render(); });
    render();
  }

  /* ---------- страница позиции ---------- */
  const pp = $("[data-pp]");
  if (pp) {
    const it = byId(params.get("id")) || M.items[0];
    const s = M.sections[it.sec], st = STATUS[it.status];
    document.title = it.name + " — МАРТдекор";
    $("[data-pp-crumb-sec]").textContent = T(s.title);
    $("[data-pp-crumb-sec]").href = "catalog.html?sec=" + it.sec;
    $("[data-pp-crumb]").textContent = T(it.name);
    $("[data-pp-gal]").innerHTML = ph(s.tone, SEC_ICON[it.sec], "Фото образца крупным планом");
    $("[data-pp-thumbs]").innerHTML = ["", "", "", ""].map(() => ph(s.tone, SEC_ICON[it.sec])).join("");
    $("[data-pp-code]").textContent = s.title.toUpperCase() + " · " + it.code;
    $("[data-pp-name]").textContent = T(it.name + (it.pack ? " — " + it.pack : ""));
    $("[data-pp-price]").innerHTML = "<b>от " + money(it.price) + '</b><span class="badge badge--' + st[0] + '">' + st[1] + "</span>";
    $("[data-pp-add]").dataset.add = it.id;
    $("[data-pp-specs]").innerHTML = it.specs.concat([["Раздел", s.title]]).map(([k, v]) => "<div><dt>" + esc(T(k)) + "</dt><dd>" + esc(T(v)) + "</dd></div>").join("");
    $("[data-pp-src]").innerHTML = 'Название и цена — из каталога салона: <a href="' + it.url + '" target="_blank" rel="noopener">позиция на martdecor.online</a>. Наличие показано для примера.';
    $("[data-pp-similar]").innerHTML = M.items.filter((x) => x.sec === it.sec && x.id !== it.id).concat(M.items.filter((x) => x.sec !== it.sec)).slice(0, 4).map(card).join("");
  }

  /* ---------- статья ---------- */
  const art = $("[data-article]");
  if (art) {
    const a = M.articles.find((x) => x.id === params.get("id")) || M.articles[0];
    const s = M.sections[a.sec];
    document.title = a.title + " — МАРТдекор";
    $("[data-art-crumb]").textContent = T(a.title);
    $("[data-art-meta]").textContent = a.date + " · " + s.title;
    $("[data-art-title]").textContent = T(a.title);
    $("[data-art-lead]").textContent = T(a.lead);
    $("[data-art-img]").outerHTML = ph(s.tone, SEC_ICON[a.sec], "Фото из поста салона");
    $("[data-art-body]").innerHTML = a.body.map((b) => (b.startsWith("## ") ? "<h2>" + esc(T(b.slice(3))) + "</h2>" : "<p>" + esc(T(b)) + "</p>")).join("");
    $("[data-art-src]").innerHTML = "Текст — " + esc(a.src) + ', <a href="' + M.site.vk + '" target="_blank" rel="noopener">группа салона ВКонтакте</a>.';
    $("[data-art-cat]").href = "catalog.html?sec=" + a.sec;
    $("[data-art-more]").innerHTML = M.articles.filter((x) => x.id !== a.id).map(tipCard).join("");
  }

  observe($$("[data-reveal]"));
  syncSel();
})();
