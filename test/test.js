const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const $ = require('cheerio');
const _ = require('lodash');
const revisionHash = require('rev-hash');
const safeStringify = require('fast-safe-stringify');
const test = require('ava');

const customFonts = require('..');

const text = 'Hello World';
const fontSize = '24px';

const readFile = promisify(fs.readFile);

test('should trim and resize', async t => {
  await t.notThrowsAsync(
    customFonts.img({
      text,
      trim: true,
      resizeToFontSize: true
    })
  );
});

_.each(['', 0, 100], val => {
  test(`throws for invalid options.trimTolerance value of "${val}"`, async t => {
    await t.throwsAsync(
      customFonts.setOptions({
        trimTolerance: val
      })
    );
  });
});

_.each(['supportsFallback', 'resizeToFontSize', 'trim'], opt => {
  test(`throws for non-Boolean \`options.${opt}\``, async t => {
    const opts = {};
    opts[opt] = '';
    await t.throwsAsync(customFonts.setOptions(opts));
  });
});

test('should get file in ./fonts folder if used wrong extension', async t => {
  const options = await customFonts.setOptions({
    fontNameOrPath: path.join(__dirname, 'fixtures', 'GoudyBookletter1911.woff')
  });
  t.is(options.fontName, 'GoudyBookletter1911');
  t.is(
    options.fontPath,
    path.join(__dirname, 'fixtures', 'GoudyBookletter1911.otf')
  );
});

test('should get file in ./fonts folder with correct extension', async t => {
  const options = await customFonts.setOptions({
    fontNameOrPath: path.join(__dirname, 'fixtures', 'GoudyBookletter1911.otf')
  });
  t.is(options.fontName, 'GoudyBookletter1911');
  t.is(
    options.fontPath,
    path.join(__dirname, 'fixtures', 'GoudyBookletter1911.otf')
  );
});

test('should get file in ./fonts folder without an extension', async t => {
  const options = await customFonts.setOptions({
    fontNameOrPath: path.join(__dirname, 'fixtures', 'GoudyBookletter1911')
  });
  t.is(options.fontName, 'GoudyBookletter1911');
  t.is(
    options.fontPath,
    path.join(__dirname, 'fixtures', 'GoudyBookletter1911.otf')
  );
});

test('throws if we specify an invalid font file path', async t => {
  await t.throwsAsync(
    customFonts.setOptions({
      fontNameOrPath: path.join(__dirname, 'fixtures', 'GoudyBookletter1912')
    })
  );
});

test('should have custom attributes when passing them', async t => {
  const svg = await customFonts.svg({
    text,
    attrs: {
      foo: 'bar'
    }
  });
  const $svg = $(svg);
  t.is($svg.attr('foo'), 'bar');
});

test('should return hello world svg', async t => {
  const svg = await customFonts.svg({
    text
  });
  const expectedSvg = await readFile(
    path.join(__dirname, 'fixtures', 'hello-world.svg'),
    'utf8'
  );
  t.is(svg.trim(), expectedSvg.trim());
});

test('should support custom background color for img', async t => {
  const str = await customFonts.img({
    text,
    backgroundColor: 'red'
  });
  const expectedColor = await readFile(
    path.join(__dirname, 'fixtures', 'color-img.html'),
    'utf8'
  );
  t.is(str.trim(), expectedColor.trim());
  //
  // TODO: it'd be cool to use these two packages
  // to accurately check the background color from sharp()
  // https://www.npmjs.com/package/color
  // https://www.npmjs.com/package/get-canvas-pixel-color
  //
});

_.each(['img', 'png'], method => {
  test(`should set alt, title, and style on ${method}`, async t => {
    const str = await customFonts[method]({ text });
    const $img = $(str);
    t.is($img.attr('alt'), text);
    t.is($img.attr('title'), text);
    t.true(
      typeof $img.attr('style') === 'string' && $img.attr('style').trim() !== ''
    );
  });
});

test('should return hello world img', async t => {
  const img = await customFonts.img({ text });
  const expectedImg = await readFile(
    path.join(__dirname, 'fixtures', 'hello-world-img.html'),
    'utf8'
  );
  t.is(img.trim(), expectedImg.trim());
});

test('should return png@1x', async t => {
  const png = await customFonts.png({ text, fontSize });
  const expectedPng = await readFile(
    path.join(__dirname, 'fixtures', 'hello-world-png.html'),
    'utf8'
  );
  t.is(png.trim(), expectedPng.trim());
});

test('throws if we pass an invalid scale to png', async t => {
  const error = await t.throwsAsync(customFonts.png({ text }, 'foo'));
  t.is(error.message, '`scale` must be a Number');
});

test('should return png@2x', async t => {
  const png = await customFonts.png2x({ text, fontSize });
  const expectedPng = await readFile(
    path.join(__dirname, 'fixtures', 'hello-world-png@2x.html'),
    'utf8'
  );
  t.is(png.trim(), expectedPng.trim());
});

test('should return png@3x', async t => {
  const png = await customFonts.png3x({ text, fontSize });
  const expectedPng = await readFile(
    path.join(__dirname, 'fixtures', 'hello-world-png@3x.html'),
    'utf8'
  );
  t.is(png.trim(), expectedPng.trim());
});

test('throws if we did not have a close match at all', async t => {
  await t.throwsAsync(customFonts.getClosestFontName('Foo Bar Baz Beep'));
});

test('should return closest font name if we had a typo', async t => {
  const font = await customFonts.getClosestFontName('Gorgia');
  t.is(font, 'Georgia');
});

test('should get font paths by name', async t => {
  const fontPathsByName = await customFonts.getFontPathsByName();
  t.true(typeof fontPathsByName === 'object');
});

test('should get available font paths', async t => {
  const fontPaths = await customFonts.getAvailableFontPaths();
  t.true(Array.isArray(fontPaths) && fontPaths.length > 0);
});

test('should get available font names', async t => {
  const fontNames = await customFonts.getAvailableFontNames();
  t.true(Array.isArray(fontNames) && fontNames.length > 0);
});

test('should return closest font path by name', async t => {
  const fontPath = await customFonts.getFontPathByName('Arial');
  t.true(typeof fontPath === 'string');
});

test('should get file in node_modules folder if used wrong extension', async t => {
  const options = await customFonts.setOptions({
    fontNameOrPath: 'Bitter Bold'
  });
  t.is(options.fontName, 'Bitter-Bold');
  t.is(
    options.fontPath,
    path.join(
      __dirname,
      '..',
      'node_modules',
      'bitter-font',
      'fonts',
      'Bold',
      'Bitter-Bold.woff'
    )
  );
});

test('should get file in node_modules folder with correct extension', async t => {
  const options = await customFonts.setOptions({
    fontNameOrPath: 'Bitter-Bold.ttf'
  });
  t.is(options.fontName, 'Bitter-Bold');
  t.is(
    options.fontPath,
    path.join(
      __dirname,
      '..',
      'node_modules',
      'bitter-font',
      'fonts',
      'Bold',
      'Bitter-Bold.woff'
    )
  );
});

test('should get file in node_modules folder without an extension', async t => {
  const options = await customFonts.setOptions({
    fontNameOrPath: 'Bitter-Bold'
  });
  t.is(options.fontName, 'Bitter-Bold');
  t.is(
    options.fontPath,
    path.join(
      __dirname,
      '..',
      'node_modules',
      'bitter-font',
      'fonts',
      'Bold',
      'Bitter-Bold.woff'
    )
  );
});

test('should store to cache', async t => {
  const options = await customFonts.setOptions({
    text,
    attrs: {
      baz: 'boop'
    }
  });
  const svg = await customFonts.svg(options);
  const hash = revisionHash(`svg:${safeStringify(options)}`);
  t.is(customFonts.customFontsCache[hash], svg);
});
