
# custom-fonts-in-emails

[![Slack Status][slack-image]][slack-url]
[![NPM version][npm-image]][npm-url]
[![Standard JS Style][standard-image]][standard-url]
[![MIT License][license-image]][license-url]

**An extremely easy way to use custom fonts in emails without having to use art software.**

Imagine you find a really cool font like at at sites like [DaFont][dafont] and [Font Squirrel][font-squirrel]... such as [Fox in the snow][fox-in-the-snow].

You want to use this font and write the text "Make more awesome" as a footer for the bottom of your emails.  Let's go through the old and new way with this package...

## Old Approach

Here's the old, slow, and convoluted way you'd do this:

1. Typically you'd have to open Photoshop, GIMP, or Sketch (wait for the updates to finish), and then create an image with this text, select the font, color, and then save it as an image.
2. Then upload it somewhere or have to wait until it deploys to production so you have a valid non-local URL (which is prone to caching in Gmail &ndash; in other words... if you ever need to make a slight adjustment to it then you have to completely rename the file).
3. Reference the image in your HTML and try to rememember it's dimensions, or have to open up the art software again to get dimensions. What about Retina? What if you need to change the size or color of the font? What if you need to convert points to pixels? Just forget it...  It's too complicated and time consuming, and now your emails will look boring like they always did! :frowning: :rage:

## New Approach

:boom: You don't need to do that anymore! :smile: Here's how easy it is &ndash; and you can use any templating language, such as [Nunjucks][nunjucks], [EJS][ejs], or [Pug/Jade][pug]...

> Input:

```html
<footer>
  {{ customFonts.png2x('Make more awesome', 'fox in the snow') }}
</footer>
```

> Output:

```html
<footer>
  <img src="TODO" width="TODO" height="TODO" title="Make more awesome" alt="Make more awesome" />
</footer>
```

> Rendered:

<footer>
  <img src="TODO" width="TODO" height="TODO" title="Make more awesome" alt="Make more awesome" />
</footer>

---

You can now use any font in your emails &ndash; without having to use art software like Photoshop or Sketch!

It supports system-wide fonts out of the box, but you can pass a file path if you wish to use a custom non-standard font.  You can also customize its kerning, anchor, color/fill, stroke, font size (even in points if needed), add custom attributes to the HTML tag, and more!  See [Usage](#usage) below for its full API reference and documentation.

Of course you'll need to expose `customFont` to your email templates as a local variable, which is easy.

```js
import customFonts from 'custom-fonts-in-emails';

var locals = {
  customFonts
};

// ...
```


## Index

* [Examples](#examples)
* [Install](#install)
* [Usage](#usage)
* [License](#license)

> **Don't want to configure this yourself?**  Try [CrocodileJS][crocodile-url]!


## Examples

> TODO


## Install

```bash
npm install -s custom-fonts-in-emails
```


## Usage

```js
import customFonts from 'custom-fonts-in-emails';
```

or

```js
import {
  svg,
  img,
  png,
  png2x,
  png3x,
  fontsAvailable
} from 'custom-fonts-in-emails';
```

### `customFonts.svg(text, fontNameOrPath, fontSizePx, fontColor, fontStroke, options, attrs)`

Accepts the following arguments and returns an `<svg>` tag:

* `text` (String) - text to write using the font family specified in `fontNameOrPath`
* `fontNameOrPath` (String) - the name or file path of the font (by default we load system fonts across any operating system using [os-fonts][os-fonts])
* `fontSizePx` (Number or String) - height of font in pixels (automatically sets `options.fontSize` equal to the converted value of pixels to points in `options`, defaults to `24px`)
* `fontColor` (String) - a valid hex color or rgba value to render the SVG icon result with (defaults to `#000`).
* `options` (Object) - an object of options which gets passed to [text-to-svg][text-to-svg] (and subsequently [opentype.js][opentype.js]).
  - `x` (Number) - horizontal position of the beginning of the text. (defaults to `0`)
  - `y` (Number) - vertical position of the baseline of the text. (defaults to `0`)
  - `fontSize` (Number) - size of the text in points (defaults to `18` since `fontSizePx` is `24`, and `24 * 0.75 = 18`... whereas `1px` is equal to `0.75pt`, [source][source])
  - `anchor` (String) - anchor of object in coordinate (defaults to `left baseline`)
    * (`left`, `center`, `right`) + (`baseline`, `top`, `middle`, `bottom`)
  - `attributes` (Object) - key-value pairs of attributes of `path` element (defaults to `{ fill: '#000', stroke: 'none' }` &ndash; note that if you specify `fontColor` then it will set `fill` equal to `fontColor`, but it can be overridden this attribute explicitly!)
* `attrs` (Array) - an array containing attribute names and value pairs that will be applied to the returned tag (e.g. `[ [ 'attrName', 'attrValue' ], ... ]`, **this is useful if you want to add custom CSS classes, style attributes, or other attributes in general to the returned tags**).

### `customFonts.img(text, fontNameOrPath, fontSizePx, fontColor, fontStroke, options, attrs)`

Passes to `customFonts.svg` and returns an image tag with Base64 inlined data.

### `customFonts.png(text, fontNameOrPath, fontSizePx, fontColor, fontStroke, options, attrs)`

Same as `customFonts.img` except it returns a PNG instead of an SVG.

### `customFonts.png2x(text, fontNameOrPath, fontSizePx, fontColor, fontStroke, options, attrs)`

Same as `customFonts.png` except it automatically returns an image with twice as many pixels (it multiplies `fontSizePx * 2` and returns an image scaled to 1x for 2x retina support).

### `customFonts.png3x(text, fontNameOrPath, fontSizePx, fontColor, fontStroke, options, attrs)`

Same as `customFonts.png` except it automatically returns an image with three times as many pixels (it multiplies `fontSizePx * 3` and returns an image scaled to 1x for 3x retina support).

### `customFonts.fontsAvailable`

An array of all of the system-wide fonts on the current operating system.


## License

[MIT][license-url]


[license-image]: http://img.shields.io/badge/license-MIT-blue.svg
[license-url]: LICENSE
[npm-image]: https://img.shields.io/npm/v/custom-fonts-in-emails.svg
[npm-url]: https://npmjs.org/package/custom-fonts-in-emails
[crocodile-url]: https://crocodilejs.com
[standard-image]: https://img.shields.io/badge/code%20style-standard%2Bes7-brightgreen.svg
[standard-url]: https://github.com/crocodilejs/eslint-config-crocodile
[slack-image]: http://slack.crocodilejs.com/badge.svg
[slack-url]: http://slack.crocodilejs.com
[node]: https://nodejs.org
[nodemailer]: https://github.com/nodemailer/nodemailer
[nodemailer-base64-to-s3]: https://github.com/crocodilejs/nodemailer-base64-to-s3
[fox-in-the-snow]: http://www.dafont.com/fox-in-the-snow.font
[dafont]: http://www.dafont.com/
[font-squirrel]: https://www.fontsquirrel.com/
[nunjucks]: https://github.com/mozilla/nunjucks
[ejs]: https://github.com/mde/ejs
[pug]: https://github.com/pugjs/pug
[font-awesome-assets]: https://github.com/crocodilejs/font-awesome-assets
[text-to-svg]: https://github.com/shrhdk/text-to-svg
[opentype.js]: https://github.com/nodebox/opentype.js
[os-fonts]: https://github.com/vutran/os-fonts
[source]: https://www.w3.org/TR/CSS21/syndata.html#x39
