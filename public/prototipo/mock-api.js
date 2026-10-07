(function () {
  "use strict";

  const STORAGE_KEY = "gotrade_prototype_state_" + (new URLSearchParams(location.search).get("tenant") || "default");
  const now = Date.now();

  const defaultUser = {
    id: "prototype-user",
    email: "demo@tradingpro.io",
    name: "Conta Demonstração",
    prefs: {
      defaultSymbol: "BTCUSDT",
      defaultAmount: 25,
      defaultCloseType: "01:00",
      emailOnTrade: false,
      bot: { stopWin: 120, stopLoss: 60, strategy: "momentum" },
    },
    brokerConnected: true,
    brokerPartner: "prototipo",
    brokerProvider: "deriv",
    brokerAppId: "1089",
    brokerAccountType: "demo",
    brokerVerified: true,
    isAdmin: false,
    createdAt: new Date(now - 86_400_000 * 45).toISOString(),
    termsAccepted: "prototype-v1",
  };

  const seededTrades = [
    trade("TP-1048", "BTCUSDT", "BUY", 25, "WIN", 20, now - 11 * 60_000),
    trade("TP-1047", "ETHUSDT", "SELL", 25, "WIN", 19.5, now - 24 * 60_000),
    trade("TP-1046", "BTCUSDT", "SELL", 25, "LOSS", -25, now - 42 * 60_000),
    trade("TP-1045", "SOLUSDT", "BUY", 50, "WIN", 39, now - 64 * 60_000),
    trade("TP-1044", "ETHUSDT", "BUY", 25, "WIN", 20.25, now - 91 * 60_000),
    trade("TP-1043", "BTCUSDT", "BUY", 25, "LOSS", -25, now - 118 * 60_000),
  ];

  const initialState = {
    user: defaultUser,
    balance: 12_547.82,
    bot: stoppedBot(),
    trades: seededTrades,
    tickets: [
      {
        id: "SUP-231",
        subject: "Como ajustar o Stop Win?",
        status: "open",
        createdAt: new Date(now - 86_400_000).toISOString(),
        updatedAt: new Date(now - 3_600_000).toISOString(),
        messages: [
          {
            id: "MSG-1",
            from: "user",
            authorName: "Conta Demonstração",
            text: "Quero testar uma meta mais conservadora para a sessão.",
            ts: new Date(now - 86_400_000).toISOString(),
            createdAt: new Date(now - 86_400_000).toISOString(),
            files: [],
          },
          {
            id: "MSG-2",
            from: "admin",
            authorName: "Equipe TradingPro",
            text: "Você pode reduzir o Stop Win nas configurações do robô antes de iniciar.",
            ts: new Date(now - 3_600_000).toISOString(),
            createdAt: new Date(now - 3_600_000).toISOString(),
            files: [],
          },
        ],
      },
    ],
    checkoutPolls: 0,
  };

  const state = loadState();
  const listeners = new Map();
  let tickTimer = null;
  let tickSymbol = "BTCUSDT";
  let tickPrice = 67_842.35;

  const socket = {
    on(event, handler) {
      const handlers = listeners.get(event) || new Set();
      handlers.add(handler);
      listeners.set(event, handlers);
      return socket;
    },
    off(event, handler) {
      listeners.get(event)?.delete(handler);
      return socket;
    },
    emit(event, payload) {
      if (event === "subscribe") {
        tickSymbol = payload || tickSymbol;
        startTicks();
        return socket;
      }
      if (event === "unsubscribe") {
        stopTicks();
        return socket;
      }
      dispatch(event, payload);
      return socket;
    },
    disconnect() {
      stopTicks();
      listeners.clear();
    },
    _dispatch: dispatch,
  };

  window.__TRADINGPRO_PROTOTYPE_SOCKET__ = socket;

  function dispatch(event, payload) {
    for (const handler of listeners.get(event) || []) handler(payload);
  }

  function startTicks() {
    if (tickTimer) return;
    tickTimer = window.setInterval(function () {
      tickPrice = Math.max(100, tickPrice + (Math.random() - 0.48) * 18);
      dispatch("tick", { pair: tickSymbol, time: Date.now(), price: Number(tickPrice.toFixed(2)) });
    }, 1_500);
  }

  function stopTicks() {
    if (tickTimer) window.clearInterval(tickTimer);
    tickTimer = null;
  }

  function trade(id, symbol, direction, amount, result, delta, createdAt) {
    return {
      id,
      symbol,
      direction,
      amount,
      realAmount: amount,
      stake: amount,
      closeType: "01:00",
      result,
      status: result,
      delta,
      pnl: delta,
      createdAt: new Date(createdAt).toISOString(),
      openTime: createdAt,
      requestTime: createdAt - 1_000,
      closeTime: createdAt + 60_000,
    };
  }

  function stoppedBot() {
    return {
      running: false,
      pendingStop: false,
      pnl: 0,
      capital: 12_547.82,
      startCapital: 12_547.82,
      wins: 0,
      losses: 0,
      draws: 0,
      trades: 0,
      level: 1,
      ladderState: "BASE",
      lastSignal: null,
      winRate: null,
      cycleExposure: 0,
      recentOps: [],
      log: [],
      analysis: { kind: "collecting", textKey: "an.analyzing", detailKey: "an.collecting" },
      config: { stopWin: 120, stopLoss: 60 },
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      return saved ? { ...initialState, ...saved } : structuredClone(initialState);
    } catch {
      return structuredClone(initialState);
    }
  }

  function saveState() {
    if (window.__GOTRADE_PREVIEW__) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function json(data, status) {
    return new Response(JSON.stringify(data), {
      status: status || 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  function parseBody(options) {
    try {
      return JSON.parse(options?.body || "{}");
    } catch {
      return {};
    }
  }

  function makeCandles(symbol) {
    const bases = { BTCUSDT: 67_842, ETHUSDT: 3_842, SOLUSDT: 178.4, EURUSD: 1.1742 };
    const base = bases[symbol] || 1_250;
    const candles = [];
    let close = base * 0.992;
    const start = Math.floor(Date.now() / 1_000) - 120 * 60;
    for (let index = 0; index < 120; index += 1) {
      const open = close;
      const drift = Math.sin(index / 8) * base * 0.0007 + (Math.random() - 0.44) * base * 0.0015;
      close = Math.max(0.0001, open + drift);
      const spread = Math.abs(drift) + base * (0.0003 + Math.random() * 0.0006);
      candles.push({
        time: start + index * 60,
        open: Number(open.toFixed(5)),
        high: Number((Math.max(open, close) + spread).toFixed(5)),
        low: Number((Math.min(open, close) - spread).toFixed(5)),
        close: Number(close.toFixed(5)),
      });
    }
    tickPrice = close;
    return { symbol, interval: "1m", candles };
  }

  function brokerCatalog() {
    return {
      default: "deriv",
      brokers: [
        { id: "deriv", label: "Deriv", hint: "Conta demonstrativa conectada para o protótipo.", fields: [] },
        {
          id: "xglobal",
          label: "XGlobal",
          hint: "Conexão simulada. Nenhum token é enviado.",
          fields: [
            { key: "apiToken", label: "Token da API", type: "secret", required: true },
            { key: "partner", label: "Código do parceiro", type: "text", required: false },
          ],
        },
        {
          id: "bybit",
          label: "Bybit",
          hint: "Conexão simulada em ambiente de demonstração.",
          fields: [
            { key: "apiKey", label: "API Key", type: "text", required: true },
            { key: "apiToken", label: "API Secret", type: "secret", required: true },
          ],
        },
      ],
    };
  }

  async function mockApi(url, options) {
    const method = (options?.method || "GET").toUpperCase();
    const path = url.pathname.replace(/^\/api/, "");
    const body = parseBody(options);

    if (path === "/auth/login" && method === "POST") {
      return json({ token: "prototype-token", user: state.user });
    }
    if (path === "/auth/me") return json({ user: state.user });
    if (path === "/auth/logout") return json({ ok: true });
    if (path === "/auth/forgot") return json({ ok: true });
    if (path === "/auth/reset") return json({ token: "prototype-token", user: state.user });

    if (path === "/terms" && method === "GET") {
      return json({ version: "prototype-v1", text: "Termos demonstrativos para navegação do protótipo visual." });
    }
    if (path === "/terms/accept") {
      state.user.termsAccepted = "prototype-v1";
      saveState();
      return json({ user: state.user });
    }

    if (path === "/checkout/config") {
      return json({ priceCents: 9_700, planName: "TradingPro", pix: true, card: true, cardPublicKey: "prototype" });
    }
    if (path === "/checkout/coupon") {
      const code = String(body.coupon || "DEMO").toUpperCase();
      return json({
        coupon: { code, type: "percent", value: 20, discountCents: 1_940, amountCents: 7_760 },
        planName: "TradingPro",
      });
    }
    if (path === "/checkout" && method === "POST") {
      state.checkoutPolls = 0;
      saveState();
      return json({
        orderId: "TP-PROTOTYPE-001",
        status: body.method === "pix" ? "pendente" : "pago",
        method: body.method || "pix",
        amountCents: 9_700,
        originalAmountCents: 9_700,
        discountCents: 0,
        planName: "TradingPro",
        pixCode: "00020126580014BR.GOV.BCB.PIX0136PROTOTIPO-TRADINGPRO-SEM-COBRANCA520400005303986540597.005802BR5925TRADINGPRO PROTOTIPO6009SAO PAULO62070503***6304DEMO",
        email: body.email || state.user.email,
      });
    }
    if (/^\/checkout\/[^/]+\/status$/.test(path)) {
      state.checkoutPolls += 1;
      saveState();
      return json({ status: state.checkoutPolls > 0 ? "pago" : "pendente", email: state.user.email });
    }

    if (path === "/settings/profile" && method === "PATCH") {
      state.user.name = body.name || state.user.name;
      saveState();
      return json({ user: state.user });
    }
    if (path === "/settings/prefs" && method === "PUT") {
      state.user.prefs = { ...state.user.prefs, ...body };
      saveState();
      return json({ user: state.user });
    }
    if (path === "/settings/broker" && method === "PUT") {
      state.user = {
        ...state.user,
        brokerConnected: true,
        brokerProvider: body.provider || "xglobal",
        brokerAccountType: body.accountType || "demo",
        brokerVerified: true,
      };
      saveState();
      return json({ user: state.user });
    }
    if (path === "/settings/broker" && method === "DELETE") {
      state.user = { ...state.user, brokerConnected: false, brokerProvider: null, brokerAccountType: null };
      saveState();
      return json({ user: state.user });
    }
    if (path === "/settings/deriv/oauth-start") return json({ url: "/prototipo/app/settings" });
    if (path === "/settings/deriv/oauth-callback") return json({ user: state.user });
    if (path === "/settings/deriv/accounts") {
      return json({
        accounts: [
          { accountType: "demo", currency: "USD", balance: state.balance },
          { accountType: "real", currency: "USD", balance: 8_204.16 },
        ],
      });
    }
    if (path === "/settings/deriv/account-type" && method === "PUT") {
      state.user.brokerAccountType = body.accountType || "demo";
      saveState();
      return json({ user: state.user });
    }

    if (path === "/brokers") return json(brokerCatalog());
    if (path === "/broker/me") return json({ id: "PROTO-001", currency: "USD", type: "DEMO" });
    if (path === "/wallets") {
      return json([
        { id: "wallet-demo", type: "DEMO", currency: "USD", balance: state.balance },
        { id: "wallet-real", type: "REAL", currency: "USD", balance: 8_204.16 },
      ]);
    }
    if (path === "/symbols") {
      return json([
        { ticker: "BTCUSDT", name: "Bitcoin / USDT", type: "Cripto", minTradeAmount: 1, allowedCloseTypes: ["01:00", "02:00", "05:00"] },
        { ticker: "ETHUSDT", name: "Ethereum / USDT", type: "Cripto", minTradeAmount: 1, allowedCloseTypes: ["01:00", "02:00", "05:00"] },
        { ticker: "SOLUSDT", name: "Solana / USDT", type: "Cripto", minTradeAmount: 1, allowedCloseTypes: ["01:00", "02:00", "05:00"] },
        { ticker: "EURUSD", name: "EUR / USD", type: "Forex", minTradeAmount: 1, allowedCloseTypes: ["01:00", "05:00", "15:00"] },
      ]);
    }
    if (path.startsWith("/candles/")) return json(makeCandles(decodeURIComponent(path.slice(9))));
    if (path.startsWith("/prices/")) {
      const symbol = decodeURIComponent(path.slice(8));
      return json({ symbol, ticks: [{ time: Date.now(), price: tickPrice }] });
    }

    if (path === "/trades/open" && method === "POST") {
      const createdAt = Date.now();
      const opened = trade(`TP-${Math.floor(Math.random() * 8_000 + 2_000)}`, body.symbol || "BTCUSDT", body.direction || "BUY", Number(body.amount || 25), "OPEN", 0, createdAt);
      opened.status = "OPEN";
      opened.result = "OPEN";
      opened.closeTime = createdAt + 3_500;
      state.trades.unshift(opened);
      saveState();
      return json(opened);
    }
    if (path === "/trades") return json({ data: state.trades });
    if (/^\/trades\/[^/]+$/.test(path)) {
      const id = decodeURIComponent(path.split("/").pop());
      const found = state.trades.find((item) => String(item.id) === String(id));
      if (!found) return json({ error: "Operação não encontrada" }, 404);
      if (found.status === "OPEN" && Date.now() >= found.closeTime) {
        found.status = "WIN";
        found.result = "WIN";
        found.delta = Number((found.amount * 0.8).toFixed(2));
        found.pnl = found.delta;
        saveState();
      }
      return json(found);
    }

    if (path === "/bot" && method === "GET") return json(state.bot);
    if (path === "/bot/precheck" && method === "POST") {
      const amount = Number(body.amount || 25);
      return json({
        modo: body.mode || "moderado",
        graus: Number(body.maxRecDeg || 2),
        escada: [amount, amount * 2.25, amount * 5.06],
        exposicao: Number((amount * 8.31).toFixed(2)),
        saldo: state.balance,
        limiteDiario: Number((state.balance * 0.05).toFixed(2)),
        arriscadoHoje: 75,
        riscoSessao: Number((amount * 8.31).toFixed(2)),
        riscoTotalDia: Number((75 + amount * 8.31).toFixed(2)),
        pctDoSaldo: Number((((75 + amount * 8.31) / state.balance) * 100).toFixed(2)),
        exigeCiencia: false,
        avisos: [],
      });
    }
    if (path === "/bot/start" && method === "POST") {
      state.bot = {
        ...stoppedBot(),
        running: true,
        capital: state.balance + 34.6,
        startCapital: state.balance,
        pnl: 34.6,
        wins: 4,
        losses: 1,
        draws: 0,
        trades: 5,
        winRate: 0.8,
        lastSignal: 0.78,
        cycleExposure: Number(body.amount || 25),
        recentOps: [
          { direction: "BUY", result: "WIN", delta: 20 },
          { direction: "SELL", result: "LOSS", delta: -25 },
          { direction: "BUY", result: "WIN", delta: 39.6 },
        ],
        log: [
          { t: Date.now() - 12_000, level: "signal", message: "Sinal de compra confirmado em BTCUSDT" },
          { t: Date.now() - 8_000, level: "info", message: "Ordem demonstrativa enviada" },
          { t: Date.now() - 2_000, level: "result", message: "Operação encerrada com resultado positivo" },
        ],
        analysis: { kind: "collecting", textKey: "an.analyzing", detailKey: "an.collecting" },
        config: { stopWin: Number(body.stopWin || 120), stopLoss: Number(body.stopLoss || 60) },
      };
      saveState();
      window.setTimeout(() => socket._dispatch("bot", { type: "status", status: state.bot }), 30);
      return json(state.bot);
    }
    if (path === "/bot/stop" && method === "POST") {
      const summary = {
        kind: "stop_win",
        reason: "Sessão demonstrativa encerrada",
        pnl: state.bot.pnl || 34.6,
        wins: state.bot.wins || 4,
        losses: state.bot.losses || 1,
        draws: 0,
        trades: state.bot.trades || 5,
        capitalInicial: state.bot.startCapital || state.balance,
        capitalFinal: state.bot.capital || state.balance + 34.6,
      };
      state.bot = stoppedBot();
      saveState();
      window.setTimeout(() => socket._dispatch("bot", { type: "stopped", status: state.bot, summary }), 30);
      return json(state.bot);
    }
    if (path === "/bot/sessions") {
      return json({
        sessions: [
          session(now - 86_400_000, 146.4, 12, 3),
          session(now - 2 * 86_400_000, -42.5, 7, 5),
          session(now - 4 * 86_400_000, 98.8, 9, 2),
          session(now - 7 * 86_400_000, 64.2, 8, 3),
        ],
      });
    }
    if (path === "/bot/logs") {
      return new Response('{"ts":' + Date.now() + ',"type":"prototype","message":"log demonstrativo"}\n', {
        headers: { "Content-Type": "application/x-ndjson" },
      });
    }

    if (path === "/meta") return json({ closeTypes: ["01:00", "02:00", "05:00", "15:00", "30:00"], priceSlot: 1, partnerConfigured: true });
    if (path === "/account/cancellation" && method === "POST") return json({ ok: true });
    if (path === "/account/cancellation") return json({ permitido: true, janelaDias: 7, motivo: null });

    if (path === "/support/tickets" && method === "GET") return json({ tickets: state.tickets });
    if (path === "/support/tickets" && method === "POST") {
      const ticket = {
        id: `SUP-${Math.floor(Math.random() * 800 + 200)}`,
        subject: body.subject || "Novo chamado",
        status: "open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [{ id: `MSG-${Date.now()}`, from: "user", authorName: state.user.name, text: body.text || "", ts: new Date().toISOString(), createdAt: new Date().toISOString(), files: body.files || [] }],
      };
      state.tickets.unshift(ticket);
      saveState();
      return json({ ticket });
    }
    if (/^\/support\/tickets\/[^/]+\/messages$/.test(path)) {
      const id = path.split("/")[3];
      const ticket = state.tickets.find((item) => item.id === id);
      if (ticket) {
        ticket.messages.push({ id: `MSG-${Date.now()}`, from: "user", authorName: state.user.name, text: body.text || "", ts: new Date().toISOString(), createdAt: new Date().toISOString(), files: body.files || [] });
        ticket.updatedAt = new Date().toISOString();
        saveState();
      }
      return json({ ticket });
    }
    if (/^\/support\/tickets\/[^/]+$/.test(path)) {
      const id = path.split("/").pop();
      return json({ ticket: state.tickets.find((item) => item.id === id) || state.tickets[0] });
    }

    return json({ ok: true, prototype: true });
  }

  function session(startTs, pnl, wins, losses) {
    return {
      startTs,
      endTs: startTs + 42 * 60_000,
      reason: pnl >= 0 ? "stop_win" : "stop_loss",
      kind: pnl >= 0 ? "stop_win" : "stop_loss",
      pnl,
      wins,
      losses,
      draws: 0,
      trades: wins + losses,
      capitalInicial: 12_000,
      capitalFinal: 12_000 + pnl,
    };
  }

  const realFetch = window.fetch.bind(window);
  window.fetch = function (input, options) {
    const raw = typeof input === "string" || input instanceof URL ? String(input) : input.url;
    const url = new URL(raw, window.location.href);
    if (url.pathname.startsWith("/api/")) return Promise.resolve(mockApi(url, options || {}));
    if (url.hostname === "api.pagar.me") return Promise.resolve(json({ id: "card_prototype_token" }));
    return realFetch(input, options);
  };

  localStorage.setItem("tp_lang_chosen", "1");
  localStorage.setItem("tp_tour_done", "1");

})();
