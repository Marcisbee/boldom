(function () {
  const PAGES = {};
  const SCRIPTS = [];
  let LINKS = [];

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

        // Handle <script>
        if (js) {
          let script;
          const cachedScript = SCRIPTS.find(([text]) => text === js);
          if (!cachedScript) {
            script = createEl('script');
            script.innerHTML = js;
            SCRIPTS.push([js, script]);
          } else {
            script = cachedScript[1];
          }

          Object.assign(link, { script });
          document.body.appendChild(script);
          hasScript = true;
        }

        Object.assign(link, combined);
        LINKS.push(link);

        render(link);
      });
    });
  }

  function render(link) {
    if (!link.isConnected) return;

    const newHtml = new Function(`return \`${link.html}\``)();

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
    return source.replace(regex, function (match) {
      return match.substr(0, match.length - 1) + ';Boldom.action();' + added;
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
