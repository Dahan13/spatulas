# Aeon

> A lightweight date time picker built with web components that can be used anywhere

- **No dependencies 🌞** - a standalone vanilla JS web component
- **Lightweight 🌱** - 5kb gzipped
- **Use anywhere 🌍** - use standalone or directly in your framework of choice with no wrappers
- **Progressive enhancement 🥞** - if the code fails to load, fallbacks to a native picker or a simple text box
- **Accessible 👨‍👩‍👧‍👦‍** - works with mouse/touch/keyboard/screen readers and behaves as a native form element
- **Locale aware 🇺🇳** - uses the browser locale language and date format by default
- **Themeable 🎨** - pass in custom colour schemes
- **Browser support 🖥** - works in all modern browsers on all devices (and IE11 - with polyfills)

## Table of Contents

- [Examples](#examples)
- [Motivation](#motivation)
- [Install](#install)
- [Usage](#usage)
- [Options](#options)
- [API](#api)
- [Theming](#theming)
- [Contributions](#contributions)
- [Author](#author)
- [License](#license)

## Examples

- [A basic example](https://lamplightdev.github.io/aeon/)
- [Same example with IE11 support](https://lamplightdev.github.io/aeon/es5)
- [Storybook](https://lamplightdev.github.io/aeon/storybook/static/?path=/story/*) - experiment with all the options

## Motivation

I needed a progressively enhanced, lightweight date and time picker that functioned and looked consistent across all browsers, and that worked with or without a framework. The difference in support (no native picker on desktop Safari 👀) style and behaviour of native pickers rule them out, so web components seemed an obvious choice. The existing web component solutions tended to be too heavyweight, so Aeon was born.

## Install

Install using [npm](https://npmjs.com):

```sh
npm install --save @lamplightdev/aeon
```

or reference directly:

```html
<script src="https://unpkg.com/@lamplightdev/aeon">
```

## Usage

If you're using ESM modules - just import Aeon directly into your code:

```js
// if you're using a bundler that resolves node_modules
import '@lamplightdev/aeon';

// if you're using a bundler that doesn't resove node_modules
import 'path/to/node_modules/@lamplightdev/aeon/src/aeon.js';
```

Alternatively include Aeon in a script tag:

```html
<script type="module" src="https://unpkg.com/@lamplightdev/aeon"></script>

<!-- or for the ES5 version -->

<script src="https://unpkg.com/@lamplightdev/aeon/dist/aeon-es5.js"></script>
```

Then use the `<aeon-datepicker>` tag in your HTML wrapping a date input and optionally a time input to include a time picker too:

```html
<label for="date">Start date</label>

<aeon-datepicker>
  <input type="date" id="date" name="date" value="2020-03-20" />
</aeon-datepicker>

<aeon-datepicker>
  <input type="date" id="date" name="date" value="2020-03-20" />
  <input type="time" id="time" name="time" value="05:19" />
</aeon-datepicker>
```

- Initial values can be set directly on the wrapped date and time inputs.
- On selecting a date with the picker the component will update the wrapped date and time inputs with the selected values (`YYYY-MM-DD` and `HH:mm` respectively), so you can add Aeon to an existing form with no glue code necessary.
- Alternatively retrieve the values directly from the `<aeon-datepicker>` element or listen for changes (see [API](#api)).
- If the web component fails to load for whatever reason, the page will still display the native date and time elements if available, or a standard text input if not. Progressive enhancement FTW.

### IE11

If you need to support IE11, you'll need to use the es5 version of the script and a few polyfills. [See the ES5 example](https://lamplightdev.github.io/aeon/es5) for a working implementation, but at a minimum you'll need the following in the document `<head>`:

```html
<!-- include the general polyfills needed -->
<script
  crossorigin="anonymous"
  src="https://polyfill.io/v3/polyfill.min.js?features=Array.prototype.find%2CArray.prototype.includes%2CString.prototype.padStart"
></script>

<!-- include the web component polyfills needed -->
<script src="https://unpkg.com/@webcomponents/webcomponentsjs@%5E2/webcomponents-loader.js"></script>

<script>
  window.WebComponents = window.WebComponents || {
    waitFor: function(cb) {
      addEventListener('WebComponentsReady', cb);
    }
  };

  WebComponents.waitFor(function() {
    // when the web component polyfill is loaded
    // load the script
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.src = './dist/aeon-es5.js';
    head.appendChild(script);

    // if you want to theme the components, add the custom property here
    window.ShadyCSS &&
      window.ShadyCSS.styleDocument({ '--aeon-rgb': '170, 10, 10' });
  });
</script>
```

## Options

All Aeon options can be set declaratively as attributes on the `<aeon-datepicker>` tag, or set imperatively in code:

```html
<label for="date-start">Start Date</label>

<aeon-datepicker
  id="datepicker"
  locale="en-us"
  default-date="2020-01-01"
  default-time="09:30"
>
  <input
    id="date-start"
    name="date-start"
    type="date"
    value="2020-04-06"
    placeholder="Start date"
  />
  <input id="time-start" name="time-start" type="time" value="12:00" />
</aeon-datepicker>

<script>
  document.querySelector('#datepicker').locale = 'es';
</script>
```

Experiment with all options in the [Storybook](https://lamplightdev.github.io/aeon/storybook/static/?path=/story/*)

| Attribute       | Property      | Property type | Default            | Description                                                                                                                                                             |
| :-------------- | :------------ | :------------ | :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| default-date    | defaultDate   | String        | [now]              | If no value is set on the date input, the date shown in the date picker when opened, format `YYYY-MM-DD`                                                                |
| default-time    | defaultTime   | String        | [now]              | If no value is set on the time input, the time shown in the date picker when opened,format `HH:mm`                                                                      |
| start-day       | startDay      | Number        | `1` (Monday)       | Which day to start the week with in the calendar (0 - Sunday, 1 - Monday, etc.)                                                                                         |
| start-year      | startYear     | Number        | current year - 100 | The earliest year to show in the year dropdown                                                                                                                          |
| end-year        | endYear       | Number        | current year + 5   | The latest year to show in the year dropdown                                                                                                                            |
| locale          | locale        | String        | browser default    | The locale - this affects the language of the months and days as well as the format of the date and time shown - the format can be further configured using `dateStyle` |
| confirm-on-date | confirmOnDate | Boolean       | `false`            | If `true` and this is a date input only (no time input) then when a date is selected in the picker will close and the date will be updated                              |
| use-native      | useNative     | Boolean       | `false`            | If `true`, use the browser native inputs for date and time where available                                                                                              |
| date-style      | dateStyle     | Object        | locale default     | An object that controls how the date and time are shown - see note below                                                                                                |

### dateStyle

The date style object is passed as the `options` parameter to the [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/DateTimeFormat) constructor to control the formatting of the displayed date and time.

When setting as an attribute (`date-style`) this must be a JSON stringified value:

```html
<aeon-datepicker date-style='{"month":"long"}'>
  <input type="date" />
</aeon-datepicker>
```

## API

The `value` property is an object containing two fields, `date` (YYYY-MM-DD) and `time` (HH:mm) of the currently selected date and time:

```js
console.log(document.querySelector('aeon-datepicker').value);
/*
  logs:
  {
    date: '2020-03-20',
    time: '13:56
  }
*/
});
```

A `change` event is dispatched when a new date has been selected:

```js
document.querySelector('aeon-datepicker').addEventListener('change', event => {
  console.log(event.target.value);

  /*
  logs:
  {
    date: '2020-03-20',
    time: '13:56
  }
  */
});
```

## Theming

The foreground and background colours of the date picker can be configured using CSS custom properties. `--aeon-rgb` can be set to the RGB values of the foreground colour, while `--aeon-bgRgb` is used for the background colour.

These can be set for all components on the page by setting these properties on the `:root` element:

```css
:root {
  --aeon-rgb: 255, 255, 255;
  --aeon-bgRgb: 0, 0, 0;
}
```

or individually on each component either in a CSS rule or inline:

```html
<aeon-datepicker style="--aeon-rgb: 255, 255, 255; --aeon-bgRgb: 0, 0, 0;">
  <input type="date" id="date" name="date" value="2020-03-20" />
</aeon-datepicker>
```

## Contributions

Any contributions welcome!

## Author

Made by [@lamplightdev](https://twitter.com/lamplightdev), [lamplightdev.com](https://lamplightdev.com)

## License

[MIT License](https://oss.ninja/mit/lamplightdev)
