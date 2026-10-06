(function () {
  // Cliente minimalista del WebSocket de Streamer.bot con reconexión automática.
  class StreamerBot {
    constructor(opts) {
      this.opts = opts;
      this.ws = null;
      this.actionRequestId = 0;
      this.actionRequests = new Set();
    }

    connect() {
      const o = this.opts;
      const path = o.endpoint.startsWith('/') ? o.endpoint : '/' + o.endpoint;
      const url = (o.ssl ? 'wss://' : 'ws://') + o.host + ':' + o.port + path;
      let ws;
      try {
        ws = new WebSocket(url);
      } catch (e) {
        this.retry();
        return;
      }
      this.ws = ws;
      ws.onclose = () => {
        this.opts.onStatus(false);
        this.retry();
      };
      ws.onerror = () => {};
      ws.onmessage = (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch (e) { return; }
        this.handle(msg);
      };
    }

    retry() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.connect(), 3000);
    }

    send(obj) {
      if (!this.ws || this.ws.readyState !== 1) return false;
      try {
        this.ws.send(JSON.stringify(obj));
        return true;
      } catch (e) {
        console.warn('Streamer.bot: no se pudo enviar la solicitud WebSocket', e);
        return false;
      }
    }

    doAction(actionId, args = {}) {
      if (!actionId) return;
      const id = `minigames-action-${++this.actionRequestId}`;
      if (!this.send({ request: 'DoAction', id, action: { id: actionId }, args })) {
        console.warn('Streamer.bot: no se pudo ejecutar la acción; WebSocket desconectado');
        return;
      }
      this.actionRequests.add(id);
    }

    subscribe() {
      this.send({
        request: 'Subscribe',
        id: 'sub',
        events: { Twitch: ['ChatMessage'], General: ['Custom'] }
      });
      this.opts.onStatus(true);
    }

    handle(msg) {
      if (msg.request === 'Hello') {
        const a = msg.authentication;
        if (a && this.opts.password) {
          const secret = Util.sha256Base64(this.opts.password + a.salt);
          const authentication = Util.sha256Base64(secret + a.challenge);
          this.send({ request: 'Authenticate', id: 'auth', authentication });
        } else {
          this.subscribe();
        }
        return;
      }
      if (msg.id === 'auth') {
        if (msg.status === 'ok' || msg.status === 200) this.subscribe();
        else console.warn('Streamer.bot: autenticación fallida', msg);
        return;
      }
      if (this.actionRequests.has(msg.id)) {
        this.actionRequests.delete(msg.id);
        if (msg.status !== 'ok' && msg.status !== 200) console.warn('Streamer.bot: DoAction falló', msg);
        return;
      }
      const ev = msg.event;
      if (!ev) {
        // CPH.WebsocketBroadcastJson envia el JSON tal cual, sin envoltorio de evento.
        if (!msg.request && !msg.status && (msg.game !== undefined || msg.games !== undefined || msg.action !== undefined)) this.opts.onCustom(msg);
        return;
      }
      const d = msg.data || {};
      if (ev.source === 'Twitch' && ev.type === 'ChatMessage') {
        const m = d.message && typeof d.message === 'object' ? d.message : {};
        const text = typeof d.text === 'string' ? d.text
          : typeof d.message === 'string' ? d.message : m.message;
        const u = d.user && typeof d.user === 'object' ? d.user : {};
        const user = u.name || u.login || m.displayName || m.username || 'anon';
        if (text) this.opts.onChat(String(user), String(text));
      } else if (ev.source === 'General' && ev.type === 'Custom') {
        this.opts.onCustom(d.data !== undefined && typeof d.data === 'object' ? d.data : d);
      }
    }
  }
  window.StreamerBot = StreamerBot;
})();
