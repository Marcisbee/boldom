# <img src='./assets/logo.png' height='60' alt='Boldom' />

**Boldom** is a 1kb JS/HTML framework.

**NOTE!** This is meant for being used in small projects, that would require minimal js usage. And need to be run on server, will not work over file://.

This framework is based on Template Literals, global scope (yes! You heard me, this framework utilizes global window scope) and plain old HTML. I build this as an experiment of an idea of using THE platform to build front end.

Also should mention that this is a runtime framework, no compilation or build process needed.

[![npm version](https://img.shields.io/npm/v/boldom.svg?style=flat-square)](https://www.npmjs.com/package/boldom)
[![boldom workspace on slack](https://img.shields.io/badge/slack-boldom-3eb891.svg?style=flat-square)](https://join.slack.com/t/radijs/shared_invite/enQtMjk3NTE2NjYxMTI2LWFmMTM5NTgwZDI5NmFlYzMzYmMxZjBhMGY0MGM2MzY5NmExY2Y0ODBjNDNmYjYxZWYxMjEyNjJhNjA5OTJjNzQ)


## Installation

To install the stable version:

```
npm install --save boldom
```

This assumes you are using [npm](https://www.npmjs.com/) as your package manager.

If you're not, you can [access it on unpkg](https://unpkg.com/boldom) like so

```html
<script src="https://unpkg.com/boldom"></script>
```

Altho it's not required, it's nice to import `style-scoped` too for scoped css usage

```html
<script src="https://unpkg.com/style-scoped@0.1.0/scoped.min.js"></script>
```

#### Browser Compatibility

Every evergreen browser and older ones that support [ES6 Template Literals](https://caniuse.com/#feat=template-literals).

## Documentation

Here we don't make use Compilers, Bundles, Virtual dom, Hyperscript, State management or any other fancy stuff. We use the platform (tools we are provided already, like plain old HTML for example).

So what does Boldom component looks like? It's just an html file, stripped down a bit.

**counter.html**
```html
<script>
  var count = 0;

  function increment() {
    count += 1;
  }

  function decrement() {
    count -= 1;
  }
</script>

<style>
  h1 {
    font-size: ${count + 4}rem;
  }
</style>

<h1>${count}</h1>

<button onclick="decrement()" ${count <= 0 && 'disabled' }>-</button>
<button onclick="increment()">+</button>
```

This is what counter component looks like. Think of it as a HTML parsed as [Template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) (that `${count ...}` syntax for using JS in your HTML) and injected directly into dom... well that's exactly what it is.

One thing might not be clear is how view gets updated here. You see boldom makes use of `window` scope. Every variable defined in `script` tag is added to window scope by default (browser it self does it). That is how we can access variables and functions in HTML (no `this`, `self` etc.). Only thing done by Boldom is that in every function defined in components root scope, it injects another function call that updates view. And that's the whole framework idea right there.

Ok so we've seen how component looks, but how the hell we can use it ? We just need to inject that component in dom using `link` (it must be defined inside `body`):

```html
<body>
  <link href="./count.html" />
</body>
```

See [examples section](/examples) for more demos.

That's all there is to it.

## Caveats

- Using `style-scoped` it's not possible to use `:root` css for css variables.
- `type="module"` cannot be used in `script` tag as it breaks scope.
- Should not be used for intensive animations, cause it uses `innerHTML`.
- Props cannot be passed to component.


## Stay In Touch

- [Slack](https://join.slack.com/t/radijs/shared_invite/enQtMjk3NTE2NjYxMTI2LWFmMTM5NTgwZDI5NmFlYzMzYmMxZjBhMGY0MGM2MzY5NmExY2Y0ODBjNDNmYjYxZWYxMjEyNjJhNjA5OTJjNzQ)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, Marcis (Marcisbee) Bergmanis
