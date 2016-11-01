
# custom-fonts-in-emails

[![Slack Status][slack-image]][slack-url]
[![NPM version][npm-image]][npm-url]
[![Build Status][build-image]][build-url]
[![Code Coverage][codecoverage-image]][codecoverage-url]
[![Standard JS Style][standard-image]][standard-url]
[![MIT License][license-image]][license-url]

**An extremely easy way to use custom fonts in emails without having to use art software.**

* :art: Outputs optimized SVG, PNG, and Base64 inlined images with optional support for @2x and @3x Retina versions.
* :bulb: Automatic smart-detection of font names spelled incorrectly (or with the wrong extension) with 50% accurancy (uses [fast-levenshtein][fast-levenshtein] and checks for at least 50% distance match).
* :tada: Supports all WOFF, OTF, and TTF fonts (both with TrueType `glyf` and PostScript `cff` outlines).
* :crystal_ball: Detects user, local, network, and system fonts using [os-fonts][os-fonts] (e.g. you don't need to write `Arial.ttf`, you can just write `Arial`).
* :sparkles: Use with recommended packages [nodemailer][nodemailer] and [nodemailer-base64-to-s3][nodemailer-base64-to-s3], or simply use [CrocodileJS][crocodile-url] (has this built-in).
* :pear: Pairs great with [font-awesome-assets][font-awesome-assets] and [juice][juice] (see [CrocodileJS's][crocodile-url] usage as an example).

## Index

* [What does this do?](#what-does-this-do)
  - [Old Approach](#old-approach)
  - [New Approach](#new-approach)
* [Examples](#examples)
* [Install](#install)
* [Usage](#usage)
* [Options](#options)
* [API](#api)
* [License](#license)

> **Don't want to configure this yourself?**  Try [CrocodileJS][crocodile-url]!


## What does this do?

* Imagine you find a really cool font at sites such as [DaFont][dafont] or [Font Squirrel][font-squirrel]... such as [Fox in the snow][fox-in-the-snow].
* You want to use this font and write the text "Make more awesome" as a footer for the bottom of your emails.  **This package lets you do that with one line of code.**
* Let's go through the old and new way with this package...

### Old Approach

Here's the old, slow, and convoluted way you'd do this:

1. Typically you'd have to open Photoshop, GIMP, or Sketch (wait for the updates to finish), and then create an image with this text, select the font, color, and then save it as an image.
2. Then upload it somewhere or have to wait until it deploys to production so you have a valid non-local URL (which is prone to caching in Gmail &ndash; in other words... if you ever need to make a slight adjustment to it then you have to completely rename the file).
3. Reference the image in your HTML and try to rememember it's dimensions, or have to open up the art software again to get dimensions. What about Retina? What if you need to change the size or color of the font? What if you need to convert points to pixels? Just forget it...  It's too complicated and time consuming, and now your emails will look boring like they always did! :frowning: :rage:

### New Approach

:boom: You don't need to do that anymore! :smile: Here's how easy it is &ndash; and you can use any templating language, such as [Nunjucks][nunjucks], [EJS][ejs], or [Pug/Jade][pug]...

> Input:

```html
<footer>
  {{ customFonts.png2x({ text: 'Make more awesome', fontNameOrPath: 'fox in the snow' }) }}
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

It supports system-wide fonts out of the box, but you can pass a file path if you wish to use a custom non-standard font.  You can also customize its kerning, anchor, color/fill, stroke, font size (even in points if needed), add custom attributes to the HTML tag, and more!  See [Usage](#usage), [Options](#options), and the [API](#api) reference below for more info.

Of course you'll need to expose `customFont` to your email templates as a local variable, which is easy.

It even uses the [fast-levenshtein][fast-levenshtein] algorithm to detect the closest match to the spelling of a font (e.g. in case you mispellled `Arial` as `Arail`).

```js
import customFonts from 'custom-fonts-in-emails';

var locals = {
  customFonts
};

// ...
```


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
  setDefaults,
  setOptions,
  svg,
  img,
  png,
  png2x,
  png3x,
  getClosestFontName,
  getFontPathsByName,
  getFontPathByName,
  getAvailableFontPaths,
  getAvailableFontNames
} from 'custom-fonts-in-emails';
```


## Options

The `options` argument in all [API](#api) methods is an Object that accepts the following properties:

* `text` (String) - text to write using the font family specified in `fontNameOrPath` (defaults to an empty String of `''`)
* `fontNameOrPath` (String) - the name or file path of the font (defaults to `Arial`, by default we load user, local, network, and system fonts across any operating system using [os-fonts][os-fonts])
* `fontSizePx` (Number or String) - size of font in pixels (automatically sets `options.fontSize` equal to the converted value of pixels to points in `options`, defaults to `24px`, but you don't need to specify the affix `px`, as it is automatically stripped and converted to an integer using `parseInt` &ndash; must be greater than 0)
* `fontColor` (String) - a valid hex color or rgba value to render the SVG icon result with (defaults to `#000`).
* `textToSvg` (Object) - an object of the following options which gets passed to [text-to-svg][text-to-svg] (and subsequently [opentype.js][opentype.js]):
  - `x` (Number) - horizontal position of the beginning of the text. (defaults to `0`)
  - `y` (Number) - vertical position of the baseline of the text. (defaults to `0`)
  - `fontSize` (Number) - size of the text in points (defaults to `18` since `fontSizePx` is `24`, and `24 * 0.75 = 18`... whereas `1px` is equal to `0.75pt`, [source][source])
  - `anchor` (String) - anchor of object in coordinate (defaults to `left baseline`)
    * (`left`, `center`, `right`) + (`baseline`, `top`, `middle`, `bottom`)
  - `attributes` (Object) - key-value pairs of attributes of `path` element (defaults to `{ fill: '#000', stroke: 'none' }` &ndash; note that if you specify `fontColor` then it will set `fill` equal to `fontColor`, but it can be overridden this attribute explicitly!)
* `attrs` (Array) - an array containing attribute names and value pairs that will be applied to the returned tag (defaults to `[]`, e.g. `[ [ 'attrName', 'attrValue' ], ... ]`, **this is useful if you want to add custom CSS classes, style attributes, or other attributes in general to the returned tags**).


## API

### `customFonts.setDefaults(options)`

A function that accepts [options](#options) to set defaults for future use and returns the new package defaults.

### `customFonts.setOptions(options)`

A function that accepts [options](#options) and returns a Promise, which resolves with refined `options`.

* Automatically runs smart detection to find the nearest font file or path to `options.fontNameOrPath` using [fast-levenshtein][fast-levenshtein].
* Detects OTF, TTF, and WOFF font files (e.g. if you use the wrong extension it will auto-correct for you)
* If a match is not found within 50% of the character difference, it will throw an error.  Helpful in case you forget to install a font!
* Populates two extra properties based off detection, `options.fontName` and `options.fontPath`.

### `customFonts.svg(options)`

A function that accepts [options](#options) and returns a Promise, which resolves with a String of the `<svg>` HTML tag for the custom font.

This function takes the argument `options` and passes it to `customFonts.setOptions`.

### `customFonts.img(options)`

Same as `customFonts.svg`, except it returns the String as Base64 inlined data.

### `customFonts.png(options)`

Same as `customFonts.img`, except it returns Base64 inlined data for a PNG instead of an SVG.

### `customFonts.png2x(options)`

Same as `customFonts.png`, except it returns an image with twice as many pixels (it multiplies `fontSizePx * 2` and returns an image scaled to 1x for 2x retina support).

### `customFonts.png3x(options)`

Same as `customFonts.png`, except it returns an image with three as many pixels (it multiplies `fontSizePx * 3` and returns an image scaled to 1x for 3x retina support).

### `customFonts.getAvailableFontPaths()`

A function that returns a Promise, which resolves with an Array of file paths for all of the user, local, network, and system fonts available on the current operating system.

### `customFonts.getAvailableFontNames()`

The same as `customFonts.getAvailableFontPaths`, except it returns font names instead of font paths.


## Credits

Thanks to the public domain font [GoudyBookletter1911][goudybookletter1911] for test purposes.


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
[fast-levenshtein]: https://github.com/hiddentao/fast-levenshtein
[goudybookletter1911]: https://github.com/theleagueof/goudy-bookletter-1911
[font-awesome-assets]: https://github.com/crocodilejs/font-awesome-assets
[juice]: https://github.com/Automattic/juice
[build-image]: https://semaphoreci.com/api/v1/niftylettuce/custom-fonts-in-emails/branches/master/shields_badge.svg
[build-url]: https://semaphoreci.com/niftylettuce/custom-fonts-in-emails
[codecoverage-image]: https://codecov.io/gh/crocodilejs/custom-fonts-in-emails/branch/master/graph/badge.svg
[codecoverage-url]: https://codecov.io/gh/crocodilejs/custom-fonts-in-emails
