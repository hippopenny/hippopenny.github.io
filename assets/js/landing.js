/* Homepage demos. Each loops while on screen; reduced-motion users see a static end state. */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var ICONS = {
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11l2-8H6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-1.5-3-5-3.5-5-1s3.5 1 5 1c1.5 0 5 1.5 5-1s-3.5-2-5 1z"/>'
  };

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function pill(kind, label) {
    return '<span class="hp-pill hp-pill--' + kind + '">' + (kind === "run" ? '<span class="hp-spin"></span>' : "") + label + "</span>";
  }

  // Runs scene.run() in a loop while the card is visible and the tab is active.
  function mount(node, scene) {
    if (reduce) { scene.final(node); return; }
    var visible = false, started = false;
    function gate() {
      return new Promise(function (resolve) {
        (function check() {
          if (visible && !document.hidden) resolve();
          else setTimeout(check, 250);
        })();
      });
    }
    function wait(ms) {
      return new Promise(function (r) { setTimeout(r, ms); }).then(gate);
    }
    function loop() {
      scene.run(node, wait).then(loop, function () {});
    }
    if (!("IntersectionObserver" in window)) { visible = true; loop(); return; }
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !started) { started = true; loop(); }
    }, { threshold: 0.2 }).observe(node);
  }

  /* ---------- Hero: agent activity feed ---------- */
  var EVENTS = [
    { i: "chat", c: 1, t: "Chat in character", m: "Wacky Warper · replied to a player", k: "ok", l: "Replied" },
    { i: "cal", t: "Book haircut · Sat 10:00", m: "Fade & Co · $45", k: "ok", l: "Booked" },
    { i: "doc", t: "Pay invoice INV-2040", m: "$1,240.00 · matched to PO-7730", k: "ok", l: "Paid" },
    { i: "coin", t: "Refund order #8812", m: "$2,900 · over $500 limit", k: "warn", l: "Needs approval" },
    { i: "db", t: "Export customer list", m: "Outside this user's permissions", k: "bad", l: "Blocked" },
    { i: "doc", t: "Match invoice INV-2041", m: "Desk chair: billed 4, received 3", k: "warn", l: "Flagged" },
    { i: "gift", c: 1, t: "Thank a player for a gift", m: "Wacky Warper · in-character reaction", k: "ok", l: "Sent" },
    { i: "cart", t: "Order lunch for 6", m: "Bao Corner · $86", k: "ok", l: "Ordered" },
    { i: "edit", t: "Update CRM contact", m: "Acme Co. · new billing email", k: "ok", l: "Updated" }
  ];
  function feedItem(ev, resolved) {
    var li = el("li", "hp-feed__item");
    li.innerHTML =
      '<span class="hp-feed__icon' + (ev.c ? " hp-feed__icon--char" : "") + '">' +
        (ev.c ? '<img src="/assets/images/wackywarper-icon-64x64.png" alt="" width="36" height="36">'
              : '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[ev.i] + "</svg>") + "</span>" +
      '<span class="hp-feed__text"><b>' + ev.t + "</b><span>" + ev.m + "</span></span>" +
      '<span class="hp-feed__st">' + (resolved ? pill(ev.k, ev.l) : pill("run", "Checking")) + "</span>";
    return li;
  }
  var feedIdx = 0;
  var feed = {
    final: function (node) {
      var list = node.querySelector(".hp-feed__list");
      EVENTS.slice(0, 5).forEach(function (ev) { list.appendChild(feedItem(ev, true)); });
    },
    run: function (node, wait) {
      var list = node.querySelector(".hp-feed__list");
      var ev = EVENTS[feedIdx++ % EVENTS.length];
      var li = feedItem(ev, false);
      li.classList.add("is-new");
      list.insertBefore(li, list.firstChild);
      var items = list.children;
      if (items.length > 5) {
        var last = items[items.length - 1];
        last.classList.add("is-out");
        setTimeout(function () { if (last.parentNode) last.parentNode.removeChild(last); }, 400);
      }
      return wait(900).then(function () {
        li.querySelector(".hp-feed__st").innerHTML = pill(ev.k, ev.l);
        return wait(1500);
      }).then(function () { li.classList.remove("is-new"); });
    }
  };

  /* ---------- Focus 1: permission and budget check ---------- */
  var REQUESTS = [
    { action: "Refund order #8790", who: "Acting for: support rep", amt: "$84",
      perm: ["ok", "Support reps can issue refunds"], budget: ["ok", "$84 of $500 per-action limit", 8],
      log: ["ok", "Recorded as A-1092"], result: ["ok", "✓ Executed"] },
    { action: "Refund order #8812", who: "Acting for: support rep", amt: "$2,900",
      perm: ["ok", "Support reps can issue refunds"], budget: ["bad", "$2,900 is over the $500 limit", 100],
      log: ["ok", "Recorded as A-1093"], result: ["warn", "Paused · sent to a manager for approval"] },
    { action: "Export all customer records", who: "Acting for: marketing intern", amt: "—",
      perm: ["bad", "Interns can't export customer data"], budget: ["skip", "Not reached", 0],
      log: ["ok", "Recorded as A-1094"], result: ["bad", "✕ Blocked"] }
  ];
  function setGuard(node, r, upto) {
    var f = function (k) { return node.querySelector('[data-f="' + k + '"]'); };
    f("action").textContent = r.action;
    f("who").textContent = r.who;
    f("amt").textContent = r.amt;
    ["perm", "budget", "log"].forEach(function (k, idx) {
      var li = node.querySelector('[data-c="' + k + '"]');
      li.className = "";
      f(k).textContent = "";
      if (idx < upto) { li.className = "is-" + r[k][0]; f(k).textContent = r[k][1]; }
    });
    var meter = node.querySelector(".hp-meter");
    meter.classList.toggle("is-over", upto > 1 && r.budget[0] === "bad");
    // Meter shows $0–$1,000; the marker at 50% is the $500 limit.
    meter.querySelector("i").style.width = (upto > 1 ? r.budget[2] : 0) + "%";
    var res = f("result");
    res.className = "hp-result" + (upto > 3 ? " is-" + r.result[0] : "");
    res.textContent = upto > 3 ? r.result[1] : "Waiting for checks…";
  }
  var guardIdx = 0;
  var guard = {
    final: function (node) { setGuard(node, REQUESTS[1], 4); },
    run: function (node, wait) {
      var r = REQUESTS[guardIdx++ % REQUESTS.length];
      var step = function (n) {
        return function () {
          setGuard(node, r, n);
          if (n < 3) node.querySelector('[data-c="' + ["perm", "budget", "log"][n] + '"]').className = "is-run";
          return wait(n === 0 ? 900 : 800);
        };
      };
      return step(0)().then(step(1)).then(step(2)).then(step(3)).then(function () {
        setGuard(node, r, 4);
        return wait(3200);
      });
    }
  };

  /* ---------- Focus 2: invoice matching ---------- */
  function matchReset(node) {
    node.querySelectorAll(".hp-match__row:not(.hp-match__row--head)").forEach(function (row) {
      row.className = "hp-match__row";
      row.querySelectorAll(".is-diff").forEach(function (s) { s.classList.remove("is-diff"); });
    });
  }
  function matchResolve(row) {
    var bad = row.getAttribute("data-bad");
    row.classList.remove("is-scan");
    row.classList.add(bad ? "is-bad" : "is-ok");
    if (bad) row.children[+bad].classList.add("is-diff");
    return !!bad;
  }
  var SUM_DONE = "3 of 4 lines matched · Desk chair: billed 4, received 3 → sent to AP for review";
  var match = {
    final: function (node) {
      matchReset(node);
      node.querySelectorAll(".hp-match__row:not(.hp-match__row--head)").forEach(matchResolve);
      var sum = node.querySelector('[data-f="sum"]');
      sum.className = "hp-result is-warn";
      sum.textContent = SUM_DONE;
    },
    run: function (node, wait) {
      var rows = [].slice.call(node.querySelectorAll(".hp-match__row:not(.hp-match__row--head)"));
      var sum = node.querySelector('[data-f="sum"]');
      matchReset(node);
      sum.className = "hp-result";
      sum.textContent = "Matching invoice to PO and receipt…";
      var p = wait(700);
      rows.forEach(function (row, i) {
        p = p.then(function () {
          row.classList.add("is-scan");
          sum.textContent = "Checking line " + (i + 1) + " of " + rows.length + "…";
          return wait(850);
        }).then(function () {
          matchResolve(row);
          return wait(250);
        });
      });
      return p.then(function () {
        sum.className = "hp-result is-warn";
        sum.textContent = SUM_DONE;
        return wait(3800);
      });
    }
  };

  /* ---------- Focus 3: assistant books a local business ---------- */
  var SLOTS = [["Sat 9:30", "Corner Cuts", "$42"], ["Sat 10:00", "Fade & Co", "$45"], ["Sat 11:15", "Corner Cuts", "$38"]];
  function slotsHtml(picked) {
    return '<div class="hp-slots">' + SLOTS.map(function (s, i) {
      return '<div class="hp-slot' + (i === picked ? " is-picked" : "") + '"><b>' + s[0] + "</b><span>" + s[1] + " · " + s[2] + "</span></div>";
    }).join("") + "</div>";
  }
  var BOOKED = '<div class="hp-booked"><span class="hp-ck"></span><div><b>Booked: Sat 10:00, haircut, $45</b><small>Fade & Co · confirmation sent to your phone</small></div></div>';
  function msg(log, who, html) {
    var m = el("div", "hp-msg hp-msg--" + who, html);
    log.appendChild(m);
    return m;
  }
  var chat = {
    final: function (node) {
      var log = node.querySelector(".hp-chat__log");
      msg(log, "user", "Book me a haircut Saturday morning, under $50.");
      msg(log, "bot", "3 open times at 2 places nearby:" + slotsHtml(1));
      msg(log, "user", "10:00 works.");
      msg(log, "bot", BOOKED);
    },
    run: function (node, wait) {
      var log = node.querySelector(".hp-chat__log");
      var typing = '<span class="hp-typing"><i></i><i></i><i></i></span>';
      var options;
      log.innerHTML = "";
      return wait(500).then(function () {
        msg(log, "user", "Book me a haircut Saturday morning, under $50.");
        return wait(700);
      }).then(function () {
        options = msg(log, "bot", typing);
        return wait(1300);
      }).then(function () {
        options.innerHTML = "3 open times at 2 places nearby:" + slotsHtml(-1);
        return wait(1800);
      }).then(function () {
        msg(log, "user", "10:00 works.");
        return wait(500);
      }).then(function () {
        options.querySelectorAll(".hp-slot")[1].classList.add("is-picked");
        return wait(600);
      }).then(function () {
        var m = msg(log, "bot", typing);
        return wait(1200).then(function () { m.innerHTML = BOOKED; });
      }).then(function () {
        return wait(3500);
      });
    }
  };

  var SCENES = { feed: feed, guard: guard, match: match, chat: chat };
  function init() {
    document.querySelectorAll(".hp [data-demo]").forEach(function (node) {
      var scene = SCENES[node.getAttribute("data-demo")];
      if (scene) mount(node, scene);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
