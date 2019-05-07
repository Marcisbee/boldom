(function () {
  const PAGES = {};
  const USE_CACHE = {
    links: true,
  };
  let LINKS = [];
  let AWAIT = [];

  function createEl(name) {
    return document.createElement(name);
  }

  function load(path, cb) {
    if (typeof PAGES[path] !== 'undefined') {
      return cb(null, PAGES[path]);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('GET', path, true);
    xhr.onreadystatechange = function () {
      if (this.readyState !== 4 || this.status !== 200) return cb(this);

      PAGES[path] = this.responseText;
      cb(null, PAGES[path]);
    };
    xhr.send();
  }

  function scan() {
    LINKS = LINKS.filter((node) => node.isConnected);

    if (typeof Boldom.errorHandler === 'function') {
      Boldom.errorHandler();
      window.onerror = Boldom.errorHandler;
    }

    const links = Array.prototype.slice.call(
      document.body.querySelectorAll('link[href]')
    ).filter((link) => !link.tagged)
      .map((link) => (link.tagged = true, link));

    links.forEach((link) => {
      load(link.href, (err, data) => {
        if (err) return;

        const { css, js } = combined = extract(data);

        // Handle <style>
        if (css) {
          combined.html = `${combined.html}<style scoped>${css}</style>`;
        }

        Object.assign(link, combined);
        LINKS.push(link);

        // Handle <script>
        let awaitNumber = -1;
        let script;
        if (js) {
          awaitNumber = AWAIT.push(link) - 1;
          script = createEl('script');
          script.type = 'module';
          script.innerHTML = `${js}; Boldom.register(${awaitNumber}, function () { return \`${combined.html}\` })`;

          Object.assign(link, { script });
          document.body.appendChild(script);
          hasScript = true;
        }

        if (!script) {
          link.renderer = new Function(`return \`${combined.html}\``);
          render(link);
        }
      });
    });
  }

  function patch(from, to, parent) {
    const max = Math.max(from.length, to.length);

    for (let ii = 0; ii < max; ii++) {
      if (typeof from[ii] === 'undefined') {
        // Add node
        parent.appendChild(to[ii]);
        continue;
      }

      if (typeof to[ii] === 'undefined') {
        // Remove node
        parent.removeChild(from[ii]);
        continue;
      }

      if (!from[ii].isEqualNode(to[ii])) {
        // Modify node
        if (from[ii].nodeType !== to[ii].nodeType || from[ii].nodeName !== to[ii].nodeName) {
          parent.replaceChild(to[ii], from[ii]);
          continue;
        }

        if (from[ii].nodeType === 3) {
          from[ii].nodeValue = to[ii].nodeValue;
          continue;
        }

        const fromAttr = Object.values(from[ii].attributes).map((e) => e.name);
        const toAttr = Object.values(to[ii].attributes).map((e) => e.name);
        const combined = toAttr.reduce((acc, key) => {
          if (acc.indexOf(key) >= 0) return acc;
          return acc.concat(key);
        }, fromAttr.slice());

        for (let nn = 0; nn < combined.length; nn++) {
          const key = combined[nn];
          if (!to[ii].hasAttribute(key)) {
            // Remove attr
            from[ii].removeAttribute(key);
            continue;
          }

          // Add attr
          from[ii].setAttribute(key, to[ii].getAttribute(key));
          continue;
        }

        if (from[ii].childNodes.length > 0 || to[ii].childNodes.length > 0) {
          patch(
            Array.prototype.slice.call(from[ii].childNodes),
            Array.prototype.slice.call(to[ii].childNodes),
            from[ii]
          );
        }
      }
    }
  }

  function render(link) {
    if (!link.isConnected) return;

    let newHtml;
    try {
      newHtml = link.renderer();
    }
    catch (err) {
      if (typeof Boldom.errorHandler === 'function') {
        Boldom.errorHandler(err);
      }
    }

    if (newHtml !== link.tempHtml) {
      link.tempHtml = newHtml;
      if (!link.anchor) {
        link.anchor = createEl('component');
        link.parentNode.insertBefore(link.anchor, link.nextSibling);
      }

      patch(
        Array.prototype.slice.call(link.anchor.childNodes),
        Array.prototype.slice.call(
          new DOMParser().parseFromString(newHtml, 'text/html').body.childNodes
        ),
        link.anchor
      );

      scan();
    }
  }

  function addAction(source, regex, added = '}') {
    return source.replace(regex, function (match, name) {
      return 'window.' + name + ' = ' + match.substr(0, match.length - 1) + ';Boldom.action();' + added;
    });
  }

  function extract(source) {
    let js = '';
    let css = '';
    const html = source
      .trim()
      .replace(/\<script(?:.*[^>]|)\>([\W\w]*)\<\/script\>/g, function (_, data) {
        js = data.trim();
        return '';
      })
      .replace(/\<style(?:.*[^>]|)\>([\W\w]*)\<\/style\>/g, function (_, data) {
        css = data.trim();
        return '';
      })
      .trim();

    js = addAction(js, /function\s*([A-z0-9]+)?\s*\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)\s*\{(?:[^}{]+|\{(?:[^}{]+|\{[^}{]*\})*\})*\}/gi);

    return { css, html, js };
  }

  const Boldom = {
    action: () => LINKS.forEach(render),
    preload: (name, content) => PAGES[name] = content,
    enableCache: (name) => USE_CACHE[name] = true,
    disableCache: (name) => USE_CACHE[name] = false,
    register: (id, template) => {
      AWAIT[id].renderer = template;
      render(AWAIT[id]);
    },
    errorHandler: null,
    scan,
    render,
    load,
  };

  if (typeof window !== 'undefined') window.Boldom = Boldom;

  document.addEventListener('DOMContentLoaded', () => {
    scan();
  });

  var styleReset = createEl('style');
  styleReset.innerHTML = 'component { display: inline; }';
  document.head.appendChild(styleReset);
})();
