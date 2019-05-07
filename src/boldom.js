(function () {
  const PAGES = {};
  const SCRIPTS = [];
  const USE_CACHE = {
    scripts: true,
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
        if (js) {
          awaitNumber = AWAIT.push(link) - 1;
          let script;
          const cachedScript = USE_CACHE.scripts && SCRIPTS.find(([text]) => text === js);
          if (!cachedScript) {
            script = createEl('script');
            script.type = 'module';
            script.innerHTML = `${js}; Boldom.register(${awaitNumber}, function () { return \`${combined.html}\` })`;
            USE_CACHE.scripts && SCRIPTS.push([js, script]);
          } else {
            script = cachedScript[1];
          }

          Object.assign(link, { script });
          document.body.appendChild(script);
          hasScript = true;
        }

        if (awaitNumber < 0) {
          render(link);
        }
      });
    });
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
      if (link.anchor) {
        link.anchor.parentNode.removeChild(link.anchor);
        link.anchor = null;
      }

      if (!link.anchor) {
        link.anchor = createEl('component');
        link.parentNode.insertBefore(link.anchor, link.nextSibling);
      }

      // @TODO: Create diffing for dom
      // var parser = new DOMParser();
      // var doc = parser.parseFromString(newHtml, 'text/html');

      // Array.prototype.slice.call(doc.body.childNodes)
      //   .forEach((node) => link.anchor.append(node));

      link.anchor.innerHTML = newHtml;

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
