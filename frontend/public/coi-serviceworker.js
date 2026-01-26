/*! coi-serviceworker v0.1.7 - Guido Zuidhof, licensed under MIT */
let coepCredentialless = false;
if (typeof window === 'undefined') {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener("message", (ev) => {
    if (!ev.data) {
      return;
    } else if (ev.data.type === "deregister") {
      self.registration.unregister().then(() => {
        return self.clients.matchAll();
      }).then(clients => {
        clients.forEach((client) => client.navigate(client.url));
      });
    } else if (ev.data.type === "coepCredentialless") {
      coepCredentialless = ev.data.value;
    }
  });

  self.addEventListener("fetch", function (event) {
    const r = event.request;
    if (r.cache === "only-if-cached" && r.mode !== "same-origin") {
      return;
    }

    const request = (coepCredentialless && r.mode === "no-cors" && r.destination === "image") ?
      new Request(r, {
        credentials: "omit"
      }) : r;
    event.respondWith(
      fetch(request)
      .then((response) => {
        if (response.status === 0) {
          return response;
        }

        const newHeaders = new Headers(response.headers);
        newHeaders.set("Cross-Origin-Embedder-Policy", coepCredentialless ? "credentialless" : "require-corp");
        if (!newHeaders.get("Cross-Origin-Opener-Policy")) newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      })
      .catch((e) => console.error(e))
    );
  });
} else {
  (() => {
    // You can customize the behavior of this script through a global `coi` variable.
    const coi = {
      shouldRegister: () => true,
      shouldDeregister: () => false,
      coepCredentialless: () => false,
      doReload: () => window.location.hostname !== 'localhost',
      quiet: false,
      ...window.coi
    };

    const n = navigator;
    if (coi.shouldDeregister() && n.serviceWorker && n.serviceWorker.controller) {
      n.serviceWorker.controller.postMessage({
        type: "deregister"
      });
    }

    // If we're already coi: do nothing. Perhaps it's already registered?
    if (window.crossOriginIsolated) {
      return;
    }

    if (coi.shouldRegister()) {
      if (coi.doReload()) {
        n.serviceWorker && n.serviceWorker.register(window.document.currentScript.src).then(
          (registration) => {
            if (!coi.quiet) console.log("COI: registered, reloading page");
            registration.active && registration.active.postMessage({
              type: "coepCredentialless",
              value: coi.coepCredentialless()
            });
            window.location.reload();
          },
          (err) => {
            if (!coi.quiet) console.error("COI: ", err);
          }
        );
      }
    }
  })();
}
