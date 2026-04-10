import { SIMULATOR_CONFIGS } from "./pull-simulator-config.js";
import { mergePersistedPullState, storageKeyForConfig } from "./pull-simulator-storage.js";

function chooseRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatNum(n) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

class PullSimulator {
  constructor(root, config) {
    this.root = root;
    this.config = config;
    this.state = this.loadState();
    this.lastPullCount = 0;
    this.adModalCleanup = null;
    this.rewardRequestPending = false;
    this.renderShell();
    this.bindEvents();
    this.renderAll();
  }

  get activeBanner() {
    return (
      this.config.banners.find((b) => b.id === this.state.activeBannerId) ||
      this.config.banners[0]
    );
  }

  get storageKey() {
    return storageKeyForConfig(this.config.key);
  }

  get currency() {
    return this.config.currency;
  }

  wishesAffordable() {
    return Math.floor(this.state.premiumCurrency / this.currency.costPerWish);
  }

  canAfford(count) {
    return this.state.premiumCurrency >= count * this.currency.costPerWish;
  }

  loadState() {
    const requestedBannerId = this.getRequestedBannerId();
    const c = this.config.currency;
    const bannerIds = new Set(this.config.banners.map((b) => b.id));
    const firstBannerId = this.config.banners[0]?.id;
    let chosen = requestedBannerId || firstBannerId;
    if (!bannerIds.has(chosen)) chosen = firstBannerId;
    const fallback = {
      activeBannerId: chosen,
      pity5: 0,
      pity4: 0,
      featuredGuarantee: false,
      totalPulls: 0,
      recentResults: [],
      inventory: {},
      rarityCounts: { 5: 0, 4: 0, 3: 0 },
      premiumCurrency: c?.startingAmount ?? 1600,
      lastAdRewardAt: null
    };

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      let merged = mergePersistedPullState(fallback, parsed, requestedBannerId);
      if (!bannerIds.has(merged.activeBannerId)) {
        merged = { ...merged, activeBannerId: fallback.activeBannerId };
      }
      return merged;
    } catch {
      return fallback;
    }
  }

  getRequestedBannerId() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("banner");
    if (!id) return null;
    return this.config.banners.some((b) => b.id === id) ? id : null;
  }

  persist() {
    window.localStorage.setItem(this.storageKey, JSON.stringify(this.state));
  }

  getAdCooldownRemainingMs() {
    const last = this.state.lastAdRewardAt;
    if (last == null) return 0;
    const elapsed = Date.now() - last;
    const cd = this.currency.adCooldownMs;
    return Math.max(0, cd - elapsed);
  }

  formatCooldown(ms) {
    const s = Math.ceil(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  }

  renderShell() {
    this.root.classList.add("pull-shell");
    this.root.style.setProperty("--pull-accent", this.config.accent);

    const bannerOptions = this.config.banners
      .map(
        (b) =>
          `<option value="${escapeHtml(b.id)}">${escapeHtml(b.name)} — ${escapeHtml(b.label)}</option>`
      )
      .join("");

    this.root.innerHTML = `
      <div class="pull-banner-toolbar">
        <label class="pull-banner-select-label">
          <span class="pull-banner-select-kicker">Featured character</span>
          <select class="pull-banner-select" data-role="banner-select" aria-label="Choose featured banner">
            ${bannerOptions}
          </select>
        </label>
      </div>

      <section class="pull-banner-hero" data-role="banner-hero"></section>

      <section class="pull-results-section">
        <div class="pull-results-grid" data-role="latest-results"></div>
      </section>

      <section class="pull-footer">
        <div class="pull-footer-main">
          <div class="pull-stats-panel">
            <h2 class="pull-section-title">Stats</h2>
            <div class="pull-metric-grid" data-role="stats"></div>
          </div>
          <div class="pull-stats-panel">
            <h2 class="pull-section-title">Collection</h2>
            <ul class="pull-history-list" data-role="inventory-list"></ul>
          </div>
          <div class="pull-stats-panel">
            <h2 class="pull-section-title">History</h2>
            <ul class="pull-history-list" data-role="history-list"></ul>
          </div>
        </div>
        <aside class="pull-footer-side">
          <div class="pull-ad-slot" id="pull-sidebar-ad" data-role="sidebar-ad">
            <ins class="adsbygoogle"
                 style="display:block;width:100%;min-height:100px;"
                 data-ad-client="ca-pub-8172357380640839"
                 data-ad-slot="4576513797"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
          </div>
          <div class="pull-stats-panel" style="margin-top:0.75rem;">
            <p class="pull-muted-note">Fan-made odds, not exact game rates. Pity and 50/50 persist across banner switches. Wallet and ad cooldown persist in this browser.</p>
            <a class="pull-guide-link" data-role="active-guide-link" href="${this.activeBanner.guideUrl}">
              Read ${escapeHtml(this.activeBanner.name)} guide →
            </a>
            <a class="pull-guide-link" href="${this.config.guideHubUrl}">All character guides →</a>
          </div>
        </aside>
      </section>
    `;

    this.bannerSelect = this.root.querySelector('[data-role="banner-select"]');
    this.bannerHero = this.root.querySelector('[data-role="banner-hero"]');
    this.statsNode = this.root.querySelector('[data-role="stats"]');
    this.latestResultsNode = this.root.querySelector('[data-role="latest-results"]');
    this.historyNode = this.root.querySelector('[data-role="history-list"]');
    this.inventoryNode = this.root.querySelector('[data-role="inventory-list"]');
    this.activeGuideLink = this.root.querySelector('[data-role="active-guide-link"]');

    this.initSidebarAdDeferred();
  }

  /**
   * Load sidebar AdSense only when near the viewport, after idle — reduces Chrome
   * "heavy ad" removals and main-thread contention with the sim UI.
   */
  initSidebarAdDeferred() {
    const container = this.root.querySelector('[data-role="sidebar-ad"]');
    const ins = container?.querySelector(".adsbygoogle");
    if (!ins || ins.getAttribute("data-ad-pushed") === "1") return;

    const pushAd = () => {
      if (ins.getAttribute("data-ad-pushed") === "1") return;
      ins.setAttribute("data-ad-pushed", "1");
      const run = () => {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {}
      };
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(run, { timeout: 3000 });
      } else {
        window.setTimeout(run, 300);
      }
    };

    if (typeof window.IntersectionObserver === "function") {
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io.disconnect();
          pushAd();
        },
        { root: null, rootMargin: "200px 0px", threshold: 0 }
      );
      io.observe(container);
    } else {
      window.setTimeout(pushAd, 800);
    }
  }

  bindEvents() {
    this.bannerSelect.addEventListener("change", () => {
      this.state.activeBannerId = this.bannerSelect.value;
      this.persist();
      this.renderAll();
    });

    this.root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      if (btn.dataset.action === "pull-one") this.executePulls(1);
      if (btn.dataset.action === "pull-ten") this.executePulls(10);
      if (btn.dataset.action === "reset-session") this.resetSession();
      if (btn.dataset.action === "watch-ad") this.onWatchAdClick();
    });
  }

  resetSession() {
    const { premiumCurrency, lastAdRewardAt } = this.state;
    this.state = {
      activeBannerId: this.state.activeBannerId,
      pity5: 0,
      pity4: 0,
      featuredGuarantee: false,
      totalPulls: 0,
      recentResults: [],
      inventory: {},
      rarityCounts: { 5: 0, 4: 0, 3: 0 },
      premiumCurrency,
      lastAdRewardAt
    };
    this.lastPullCount = 0;
    this.persist();
    this.renderAll();
  }

  executePulls(count) {
    const cost = count * this.currency.costPerWish;
    if (!this.canAfford(count)) {
      this.bannerHero?.classList.add("pull-banner-hero--shake");
      setTimeout(() => this.bannerHero?.classList.remove("pull-banner-hero--shake"), 450);
      return;
    }

    this.state.premiumCurrency -= cost;
    const drops = [];
    for (let i = 0; i < count; i++) {
      const result = this.rollOnce();
      drops.push(result);
      this.state.totalPulls += 1;
      this.state.rarityCounts[result.rarity] += 1;
      if (result.type === "character") {
        this.state.inventory[result.name] = (this.state.inventory[result.name] || 0) + 1;
      }
    }
    this.state.recentResults = drops.concat(this.state.recentResults).slice(0, 20);
    this.lastPullCount = count;
    this.persist();
    this.renderAll();
  }

  rollOnce() {
    const rarity = this.resolveRarity();
    const banner = this.activeBanner;

    if (rarity === 5) {
      this.state.pity5 = 0;
      this.state.pity4 = 0;
      const std = this.config.standardFiveStarPool;
      const hitFeatured = this.state.featuredGuarantee || Math.random() < this.config.pity.featuredWinRate;
      if (hitFeatured) {
        this.state.featuredGuarantee = false;
        return { rarity: 5, type: "character", featured: true, standard: false, ...banner };
      }
      this.state.featuredGuarantee = true;
      const pick = chooseRandom(std);
      return {
        rarity: 5,
        type: "character",
        featured: false,
        standard: true,
        id: pick.id,
        name: pick.name,
        image: pick.image || null
      };
    }

    this.state.pity5 += 1;

    if (rarity === 4) {
      this.state.pity4 = 0;
      return { rarity: 4, type: "item", featured: false, ...chooseRandom(this.config.fourStarPool) };
    }

    this.state.pity4 += 1;
    return { rarity: 3, type: "item", featured: false, ...chooseRandom(this.config.threeStarPool) };
  }

  resolveRarity() {
    const nextPity5 = this.state.pity5 + 1;
    const nextPity4 = this.state.pity4 + 1;
    const p = this.config.pity;

    if (nextPity5 >= p.fiveStarHard) return 5;

    const softPityStart = Math.floor(p.fiveStarHard * 0.82);
    let fiveStarRate = p.baseFiveStarRate;
    if (nextPity5 > softPityStart) {
      const progress = (nextPity5 - softPityStart) / (p.fiveStarHard - softPityStart);
      fiveStarRate = fiveStarRate + (1 - fiveStarRate) * progress * 0.72;
    }
    if (Math.random() < fiveStarRate) return 5;

    const floor5 = p.fourStarFloorFiveStarRate ?? 0.06;
    if (nextPity4 >= p.fourStarHard) {
      if (Math.random() < floor5) return 5;
      return 4;
    }
    if (Math.random() < p.baseFourStarRate) return 4;

    return 3;
  }

  onWatchAdClick() {
    const remaining = this.getAdCooldownRemainingMs();
    if (remaining > 0 || this.rewardRequestPending) return;

    let settled = false;
    const settle = () => {
      this.rewardRequestPending = false;
    };
    const grant = () => {
      if (settled) return;
      settled = true;
      settle();
      this.state.premiumCurrency += this.currency.adRewardAmount;
      this.state.lastAdRewardAt = Date.now();
      this.persist();
      this.renderAll();
      this.closeAdModal();
    };
    const completeWithoutReward = (message) => {
      if (settled) return;
      settled = true;
      settle();
      this.renderAll();
      this.openRewardMessageModal(message);
    };

    this.rewardRequestPending = true;
    this.renderAll();

    if (typeof window.hippopennyPullSimulatorShowRewardedAd === "function") {
      try {
        window.hippopennyPullSimulatorShowRewardedAd({
          placementName: `${this.config.key}_pull_reward`,
          onViewed: () => grant(),
          onDismissed: () => {
            completeWithoutReward({
              title: "Reward Incomplete",
              body: "The ad was closed before it finished, so no bonus currency was granted."
            });
          },
          onUnavailable: (status) => {
            if (status === "dismissed") {
              completeWithoutReward({
                title: "Reward Incomplete",
                body: "The ad was closed before it finished, so no bonus currency was granted."
              });
              return;
            }
            this.openRewardUnavailableModal(status);
          }
        });
      } catch {
        this.openRewardUnavailableModal("error");
      }
      return;
    }
    this.openRewardUnavailableModal("notReady");
  }

  closeAdModal() {
    if (this.adModalCleanup) {
      this.adModalCleanup();
      this.adModalCleanup = null;
    }
  }

  openRewardMessageModal({ title, body }) {
    this.closeAdModal();
    const overlay = document.createElement("div");
    overlay.className = "pull-ad-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <div class="pull-ad-modal">
        <h3 class="pull-ad-modal__title">${escapeHtml(title)}</h3>
        <p class="pull-ad-modal__text">${escapeHtml(body)}</p>
        <button type="button" class="pull-btn pull-btn--hero pull-ad-modal__claim" data-role="close">OK</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const finish = () => {
      overlay.remove();
    };

    overlay.querySelector('[data-role="close"]').addEventListener("click", finish);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) finish();
    });

    this.adModalCleanup = () => {
      finish();
    };
  }

  openRewardUnavailableModal(status) {
    const messages = {
      notReady: {
        title: "Reward Not Ready",
        body: "The rewarded ad is still loading. Give it a moment and try again."
      },
      noAdPreloaded: {
        title: "Reward Unavailable",
        body: "No rewarded ad is ready right now. Please try again in a bit."
      },
      frequencyCapped: {
        title: "Reward Cooling Down",
        body: "Rewarded ads are temporarily capped right now. Please try again later."
      },
      dismissed: {
        title: "Reward Incomplete",
        body: "The ad was dismissed before completion, so no reward was granted."
      },
      error: {
        title: "Reward Unavailable",
        body: "The rewarded ad could not be shown right now. Please try again later."
      },
      timeout: {
        title: "Reward Timed Out",
        body: "The rewarded ad took too long to load. Please try again."
      },
      other: {
        title: "Reward Unavailable",
        body: "A rewarded ad is not available right now. Please try again later."
      }
    };

    const message = messages[status] || messages.other;
    this.openRewardMessageModal(message);
  }

  renderAll() {
    this.syncBannerQuery();
    this.syncBannerSelect();
    this.renderBannerHero();
    this.renderStats();
    this.renderLatestResults();
    this.renderHistory();
    this.renderInventory();
    this.activeGuideLink.href = this.activeBanner.guideUrl;
    this.activeGuideLink.textContent = `Read ${this.activeBanner.name} guide →`;
  }

  syncBannerQuery() {
    const url = new URL(window.location.href);
    url.searchParams.set("banner", this.activeBanner.id);
    window.history.replaceState({}, "", url);
  }

  syncBannerSelect() {
    if (!this.bannerSelect) return;
    if (this.bannerSelect.value !== this.activeBanner.id) {
      this.bannerSelect.value = this.activeBanner.id;
    }
  }

  renderBannerHero() {
    const banner = this.activeBanner;
    const hard = this.config.pity.fiveStarHard;
    const current = this.state.pity5;
    const softStart = Math.floor(hard * 0.82);
    const pct = Math.min(100, Math.round((current / (hard - 1)) * 100));
    const inSoftPity = current >= softStart;
    const guaranteedClass = this.state.featuredGuarantee ? " is-guaranteed" : "";

    const cur = this.currency;
    const gems = this.state.premiumCurrency;
    const wishes = this.wishesAffordable();
    const can1 = this.canAfford(1);
    const can10 = this.canAfford(10);
    const cdLeft = this.getAdCooldownRemainingMs();
    const adDisabled = cdLeft > 0 || this.rewardRequestPending;
    const adLabel = adDisabled
      ? (this.rewardRequestPending
          ? "Checking reward..."
          : `Ad (${this.formatCooldown(cdLeft)})`)
      : `Watch ad (+${formatNum(cur.adRewardAmount)})`;

    this.bannerHero.innerHTML = `
      <div class="pull-banner-hero__media" style="background-image:url('${banner.image || ""}')"></div>
      <div class="pull-banner-hero__content">
        <div class="pull-wallet" data-role="wallet">
          <div class="pull-wallet__row">
            <span class="pull-wallet__amount">${formatNum(gems)} ${escapeHtml(cur.premiumName)}</span>
            <span class="pull-wallet__hint">~${wishes} wish${wishes === 1 ? "" : "es"} (${cur.costPerWish} / ${escapeHtml(cur.ticketName)})</span>
          </div>
          <button type="button" class="pull-btn pull-btn--ad" data-action="watch-ad" ${adDisabled ? "disabled" : ""}>${escapeHtml(adLabel)}</button>
        </div>
        <h2 class="pull-banner-hero__name">${escapeHtml(banner.name)}</h2>
        <p class="pull-banner-hero__label">${escapeHtml(banner.label)}</p>
        <div class="pull-pity-row">
          <span class="pull-pity-label">Pity ${current}/${hard - 1}</span>
          <span class="pull-pity-label${guaranteedClass}">${this.state.featuredGuarantee ? "✓ Guaranteed" : "50/50"}</span>
          <span class="pull-pity-label">${this.state.totalPulls} pulls</span>
        </div>
        <div class="pull-pity-bar">
          <div class="pull-pity-fill${inSoftPity ? " is-soft-pity" : ""}" style="width:${pct}%"></div>
        </div>
        <div class="pull-action-row">
          <button class="pull-btn pull-btn--hero" data-action="pull-ten" ${can10 ? "" : "disabled"} title="${can10 ? "" : `Need ${10 * cur.costPerWish} ${cur.premiumName}`}">Pull ×10 (${formatNum(10 * cur.costPerWish)})</button>
          <button class="pull-btn pull-btn--primary" data-action="pull-one" ${can1 ? "" : "disabled"} title="${can1 ? "" : `Need ${cur.costPerWish} ${cur.premiumName}`}">×1 (${formatNum(cur.costPerWish)})</button>
          <button class="pull-btn pull-btn--secondary" data-action="reset-session">Reset progress</button>
        </div>
      </div>
    `;
  }

  renderStats() {
    const uniqueHits = this.config.banners.filter(
      (b) => (this.state.inventory[b.name] || 0) > 0
    ).length;
    this.statsNode.innerHTML = `
      <div class="pull-metric"><span>5★</span><strong>${this.state.rarityCounts[5]}</strong></div>
      <div class="pull-metric"><span>4★</span><strong>${this.state.rarityCounts[4]}</strong></div>
      <div class="pull-metric"><span>3★</span><strong>${this.state.rarityCounts[3]}</strong></div>
      <div class="pull-metric"><span>Rate-ups owned</span><strong>${uniqueHits}/${this.config.banners.length}</strong></div>
    `;
  }

  resultMeta(item) {
    if (item.type !== "character") return item.kind;
    if (item.featured) return "Featured";
    if (item.standard) return "Standard";
    return "5★";
  }

  renderLatestResults() {
    if (!this.state.recentResults.length) {
      this.latestResultsNode.innerHTML = `<p class="pull-empty">${this.canAfford(1) ? "Pull ×1 or ×10 to start." : `Earn ${this.currency.premiumName} (watch ad) or reset progress to try the sim.`}</p>`;
      return;
    }

    const newCount = this.lastPullCount;
    this.lastPullCount = 0;

    this.latestResultsNode.innerHTML = this.state.recentResults
      .slice(0, 10)
      .map((item, index) => {
        const isNew = index < newCount;
        const delayStyle = isNew ? `animation-delay:${index * 60}ms` : "";
        const image = item.image
          ? `<div class="pull-result-thumb"><img src="${item.image}" alt="${escapeHtml(item.name)}" loading="lazy"></div>`
          : `<div class="pull-result-thumb"><span class="pull-result-star">${item.rarity}★</span></div>`;
        const meta = this.resultMeta(item);

        return `
          <article class="pull-result-card${isNew ? " is-new" : ""}" data-rarity="${item.rarity}" style="${delayStyle}">
            ${image}
            <div class="pull-result-card__body">
              <span class="pull-rarity" data-rarity="${item.rarity}">${item.rarity}★</span>
              <h3 class="pull-result-name">${escapeHtml(item.name)}</h3>
              <p class="pull-result-meta">${escapeHtml(meta)}</p>
            </div>
          </article>
        `;
      })
      .join("");
  }

  renderHistory() {
    if (!this.state.recentResults.length) {
      this.historyNode.innerHTML = `<li>No pulls yet.</li>`;
      return;
    }

    this.historyNode.innerHTML = this.state.recentResults
      .slice(0, 8)
      .map((item, index) => {
        const feat = item.type === "character" && item.featured ? " ★" : "";
        const std = item.type === "character" && item.standard ? " (std)" : "";
        return `<li><strong>#${this.state.totalPulls - index}</strong> ${escapeHtml(item.name)} ${item.rarity}★${feat}${std}</li>`;
      })
      .join("");
  }

  renderInventory() {
    const bannerRows = this.config.banners.map((b) => ({
      name: b.name,
      count: this.state.inventory[b.name] || 0,
      guideUrl: b.guideUrl,
      tag: ""
    }));
    const standardRows = (this.config.standardFiveStarPool || []).map((s) => ({
      name: s.name,
      count: this.state.inventory[s.name] || 0,
      guideUrl: this.config.guideHubUrl,
      tag: "Standard"
    }));
    const entries = [...bannerRows, ...standardRows].filter((e) => e.count > 0).sort((a, b) => b.count - a.count);

    if (!entries.length) {
      this.inventoryNode.innerHTML = `<li>No rate-ups in inventory yet — keep pulling.</li>`;
      return;
    }

    this.inventoryNode.innerHTML = entries
      .map((e) => {
        const tag = e.tag ? ` <span class="pull-inv-tag">${escapeHtml(e.tag)}</span>` : "";
        return `<li><strong>${escapeHtml(e.name)}</strong> ×${e.count}${tag} <a href="${e.guideUrl}">guide</a></li>`;
      })
      .join("");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-pull-simulator]").forEach((root) => {
    const key = root.getAttribute("data-pull-simulator");
    const config = SIMULATOR_CONFIGS[key];
    if (!config) return;
    new PullSimulator(root, config);
  });
});
