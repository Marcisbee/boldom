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

## State

State in Boldom is split into 3 different approaches: Local state, Global state and Store.

#### Local state

It is just a variable that can be changed, so this should be `var` or `let`.

```html
<script>
  var count = 21;
</script>

<h1>${count}</h1>
```

Remember that calling `count` variable in html event attributes will not work as `count` is not defined globally. Instead use template variable (`${variable}`).

```diff
<button
-   onclick="alert(count)">
+   onclick="alert(${count})">
  Get count
</button>
```

#### Global state

It is also just a variable that can be changed, but it should also be rewritable so we should use `var` when creating global variables.

```html
<script>
  export var count = 21;
</script>
```

But in this case where `count` variable is exported to global scope, we can use it like so.

```html
<button onclick="alert(count)">
  Get count
</button>
```

There's no real functional difference between the approaches. Only that in exported case `count` variable is accessible in `window` scope and can be overwritten by other value with the same name.

#### Store

This is state manager that syncs state across multiple components. If one component changes variable, then all components using store are updated.

```html
<script>
  store.name = 'John Doe';
</script>

<h1>${store.name}</h1>
```

Store value can be changed as regular variable with basic assignment operator (=).

## Functions

Same export logic applies for functions. Exported functions are accessable from global scope. That is why we can use them.

```html
<script>
  var count = 0;
  export function increment() {
    count += 1;
  }
</script>

<h1>${count}</h1>
<button onclick="increment()">+</button>
```

## Style

Styles should work as usual.

```html
<style>
  h1 {
    color: red;
  }
</style>

<h1>Hello World</h1>
```

But we can also do interesting stuff like changing style using variables. If variable changes, style gets updated too.

```html
<script>
  var index = 0;
  var colors = ['red', 'green', 'blue'];

  setInterval(function () {
    index = (index + 1) % colors.length;
  }, 1000);
</script>

<style>
  h1 {
    color: ${colors[index]};
  }
</style>

<h1>Hello World</h1>
```

Now in this example, every second h1 will change it's colors.

## Events

Events can be triggered on html tags.

We can also get event object using `event` variable.

```html
<button onclick="console.log(event)">Get event</button>
```

Same applies for current `button` element node in this example by using `this` variable.

```html
<button onclick="console.log(this)">Get this reference</button>
```

## Example

So what does Boldom component looks like? It's just an html file, stripped down a bit.

**counter.html**
```html
<script>
  var count = 0;

  export function increment() {
    count += 1;
  }

  export function decrement() {
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

Ok so we've seen how component looks, but how the hell we can use it ? We just need to inject that component in dom using `link` (it must be defined inside `body`):

```html
<body>
  <link href="./count.html" />
</body>
```

See [examples section](/examples) for more demos.


## Architecture

This is framework taks advantage of global scope and default html functionality. For example html has option to already trigger javascript code from props like `onclick` for example this works if you try this in html.

```html
<image src="hello.png" onclick="alert('Hi')"/>
```

But for it to work, we need functions to be global scope. So we export them to global scope using es6 `export` syntax.

```js
export function sayHi() {
  console.log('hi');
}
```

becomes:

```js
window.sayHi = function sayHi() {
  console.log('hi');
}
```

Same happens with all exported variables, not just functions.

So now that there is `increment` variable on global scope, we can do this in html:

```html
<button onclick="sayHi()">Say hi</button>
```

Now that we know why we're making use of global scope, let me quickly show what happens in template engine.

For a while now we have this thing called [Template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals). That basically allows us to write multi line strings and use variables inside it like so:

```js
const count = 2;
const template = `
  <h1>${count}</h1>
`;
```

That is basically what happens when boldom is parsing imported html files, that is why we can use that syntax.

And what about updates?
Good question.
We inject `Boldom.action()` in every function found in components `script` tag. So whenever any function is called in component it triggers update. And it's just simple and small dom patch algo that applies new dom tree to old one (So that buttons/inputs etc. don't lose focus and state and is a bit more faster than innerHTML).

That's all there is to it.

## Caveats

- Exported variables and functions used in `<script>` tag should be defined before being used.
- Props cannot be passed to component (yet).


## Stay In Touch

- [Slack](https://join.slack.com/t/radijs/shared_invite/enQtMjk3NTE2NjYxMTI2LWFmMTM5NTgwZDI5NmFlYzMzYmMxZjBhMGY0MGM2MzY5NmExY2Y0ODBjNDNmYjYxZWYxMjEyNjJhNjA5OTJjNzQ)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, Marcis (Marcisbee) Bergmanis
