(function () {
  // Cliente minimalista del WebSocket de Streamer.bot con reconexión automática.
  class StreamerBot {
    constructor(opts) {
      this.opts = opts;
      this.ws = null;
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
      if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj));
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
      const ev = msg.event;
      if (!ev) return;
      const d = msg.data || {};
      if (ev.source === 'Twitch' && ev.type === 'ChatMessage') {
        const m = d.message || {};
        const text = typeof m === 'string' ? m : m.message;
        const user = m.displayName || m.username || 'anon';
        if (text) this.opts.onChat(String(user), String(text));
      } else if (ev.source === 'General' && ev.type === 'Custom') {
        this.opts.onCustom(d.data !== undefined && typeof d.data === 'object' ? d.data : d);
      }
    }
  }
  window.StreamerBot = StreamerBot;
})();
