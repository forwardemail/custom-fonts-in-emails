const fs = require('node:fs');
const path = require('node:path');
const { Buffer } = require('node:buffer');
const { promisify } = require('node:util');
const $ = require('cheerio').default;
const sharp = require('sharp');
const TextToSvg = require('text-to-svg');
const _ = require('lodash');
const debug = require('debug')('custom-fonts-in-emails');
const isSANB = require('is-string-and-not-blank');
const levenshtein = require('fast-levenshtein');
const osFonts = require('os-fonts');
const pkgDir = require('pkg-dir');
const revisionHash = require('rev-hash');
const safeStringify = require('fast-safe-stringify');
const universalify = require('universalify');

const useTypes = ['user', 'local', 'network', 'system'];
const fontExtensions = ['otf', 'OTF', 'ttf', 'TTF', 'woff', 'WOFF'];
const customFontsCache = {};

const stat = promisify(fs.stat);

let defaults = {
  text: '',
  fontNameOrPath: 'Arial',
  fontSize: '24px',
  fontColor: '#000',
  backgroundColor: 'transparent',
  supportsFallback: true,
  resizeToFontSize: false,
  trim: false,
  trimTolerance: 10,
  attrs: {},
  textToSvg: {
    x: 0,
    y: 0,
    anchor: 'left top',
    attributes: {
      stroke: 'none'
    }
  }
};

const load = universalify.fromCallback(TextToSvg.load);

function setDefaults(options) {
  defaults = _.defaultsDeep(options, defaults);
  return defaults;
}

// eslint-disable-next-line complexity
async function setOptions(options) {
  // Clone to prevent interference
  options = _.cloneDeep(options);

  // Set deep defaults
  options = _.defaultsDeep(options, defaults);

  // Ensure `text` is a string
  if (!_.isString(options.text)) {
    throw new TypeError('`text` must be a String');
  }

  // Ensure `fontNameOrPath` is a string and not blank
  if (!isSANB(options.fontNameOrPath)) {
    throw new Error('`fontNameOrPath` must be a String and not blank');
  }

  // Convert font size in pixels to number
  // and remove px, so we just convert to digits only
  if (_.isString(options.fontSize)) {
    options.fontSize = Number.parseFloat(options.fontSize);
  }

  // Round to nearest whole pixel
  options.fontSize = Math.round(options.fontSize);

  // Ensure it's a number greater than 0
  if (!_.isNumber(options.fontSize) || options.fontSize <= 0) {
    throw new Error(
      '`fontSize` must be a Number or String that is a valid number > than 0'
    );
  }

  // Ensure `fontColor` is a string
  if (!isSANB(options.fontColor)) {
    throw new Error('`fontColor` must be a String and not blank');
  }

  // Ensure `backgroundColor` is a string
  if (!isSANB(options.backgroundColor)) {
    throw new Error('`backgroundColor` must be a String and not blank');
  }

  // Ensure supportsFallback is a boolean else true
  if (!_.isBoolean(options.supportsFallback)) {
    throw new TypeError('`supportsFallback` must be a Boolean');
  }

  // Ensure resizeToFontSize is a boolean else true
  if (!_.isBoolean(options.resizeToFontSize)) {
    throw new TypeError('`resizeToFontSize` must be a Boolean');
  }

  // Ensure trim is a boolean else true
  if (!_.isBoolean(options.trim)) {
    throw new TypeError('`trim` must be a Boolean');
  }

  // Ensure trimTolerance is a number else 10
  if (
    !_.isNumber(options.trimTolerance) ||
    options.trimTolerance < 1 ||
    options.trimTolerance > 99
  ) {
    throw new Error(
      '`trimTolerance` must be a Number between 1 and 99 inclusive'
    );
  }

  // If `textToSvg.attributes.fill` is not set
  // then set it equal to `fontColor`
  if (!_.isString(options.textToSvg.attributes.fill)) {
    options.textToSvg.attributes.fill = options.fontColor;
  }

  // If `textToSvg.fontSize` not set, then we will calculate
  // what the `fontSize` should be based off height of font
  if (!_.isNumber(options.textToSvg.fontSize)) {
    options.textToSvg.fontSize = options.fontSize;
  }

  // If `fontNameOrPath` was not a valid font path (with smart detection)
  // then result to use `getClosestFontName` and `getFontPathByName`
  const ext = path.extname(options.fontNameOrPath);
  const fontName = path.basename(options.fontNameOrPath, ext);

  if (_.includes(fontExtensions, ext)) {
    const stats = await stat(path.resolve(options.fontNameOrPath));
    if (!stats.isFile()) {
      throw new Error(
        `${path.resolve(options.fontNameOrPath)} was not a valid file`
      );
    }

    options.fontPath = path.resolve(options.fontNameOrPath);
    options.fontName = fontName;
  } else {
    const fontDir = path.dirname(path.resolve(options.fontNameOrPath));

    let data = await Promise.all(
      fontExtensions.map(async (ext) => {
        const filePath = `${fontDir}/${fontName}.${ext}`;
        try {
          const stats = await stat(filePath);
          return stats.isFile() ? filePath : false;
        } catch (err) {
          debug(err);
          return false;
        }
      })
    );

    // Remove false matches
    data = _.compact(data);

    // If this was a directory path then throw an error that it was not found
    if (options.fontNameOrPath.includes(path.sep) && data.length === 0) {
      throw new Error(
        `\`fontNameOrPath\` "${options.fontNameOrPath}" file was not found`
      );
    }

    if (data.length > 0) {
      options.fontName = fontName;
      options.fontPath = data[0];
    } else {
      options.fontName = await getClosestFontName(options.fontNameOrPath);
      options.fontPath = await getFontPathByName(options.fontName);
    }
  }

  return options;
}

// eslint-disable-next-line max-params
function renderFallback(text, fontSize, fontColor, backgroundColor, attrs) {
  attrs.title = text;
  attrs.alt = text;
  attrs.style = attrs.style || '';
  attrs.style += `color: ${fontColor};`;
  attrs.style += `font-size: ${fontSize / 2}px;`;
  attrs.style += `line-height: ${fontSize}px;`;
  attrs.style += 'text-align: center;';
  attrs.style += `background-color: ${backgroundColor};`;
  return attrs;
}

function applyAttributes($element, attrs) {
  _.each(_.keys(attrs), (key) => {
    $element.attr(key, attrs[key]);
  });
  return $element;
}

async function svg(options) {
  debug('svg', options);
  options = await setOptions(options);
  debug('options set', options);
  const hash = revisionHash(`svg:${safeStringify(options)}`);
  if (customFontsCache[hash]) {
    debug(`found customFontsCache result for ${hash}`, customFontsCache[hash]);
    return customFontsCache[hash];
  }

  debug('loading');
  const textToSvg = await load(options.fontPath);
  const string = textToSvg.getSVG(options.text, options.textToSvg);
  debug('string', string);
  let $svg = $(string);
  const $rect = $('<rect>');
  $rect.attr('width', $svg.attr('width'));
  $rect.attr('height', $svg.attr('height'));
  $rect.attr('fill', options.backgroundColor);
  $svg.prepend($rect);
  $svg.attr('width', Math.round(Number.parseFloat($svg.attr('width'))));
  $svg.attr('height', Math.round(Number.parseFloat($svg.attr('height'))));
  $svg.attr('viewBox', `0 0 ${$svg.attr('width')} ${$svg.attr('height')}`);
  $svg = applyAttributes($svg, options.attrs);
  const result = $.html($svg);
  customFontsCache[hash] = result;
  debug(`caching result for ${hash}`, customFontsCache[hash]);
  return result;
}

async function img(options) {
  options = await setOptions(options);
  const hash = revisionHash(`img:${safeStringify(options)}`);

  if (customFontsCache[hash]) {
    debug(`found customFontsCache result for ${hash}`, customFontsCache[hash]);
    return customFontsCache[hash];
  }

  const string = await svg(options);
  const $svg = $(string);
  let $img = $('<img>');
  $img.attr('width', $svg.attr('width'));
  $img.attr('height', $svg.attr('height'));
  $img.attr(
    'src',
    `data:image/svg+xml;base64,${Buffer.from(string, 'utf8').toString(
      'base64'
    )}`
  );
  if (options.supportsFallback) {
    options.attrs = renderFallback(
      options.text,
      $svg.attr('height'),
      options.fontColor,
      options.backgroundColor,
      options.attrs
    );
  }

  $img = applyAttributes($img, options.attrs);
  const result = $.html($img);
  customFontsCache[hash] = result;
  debug(`caching result for ${hash}`, result);
  return result;
}

async function png(options, scale = 1) {
  if (!_.isNumber(scale)) {
    throw new TypeError('`scale` must be a Number');
  }

  options = await setOptions(options);

  //
  // initially I tried to use the package `svgo`
  // to optimize the image and remove invisible whitespace
  // but this feature isn't available yet
  // https://github.com/svg/svgo/issues/67
  //

  const { fontSize } = options;
  options.fontSize = Math.round(fontSize * scale);
  options.textToSvg.fontSize = options.fontSize;

  const hash = revisionHash(`png:${safeStringify(options)}`);

  if (customFontsCache[hash]) {
    debug(`found customFontsCache result for ${hash}`, customFontsCache[hash]);
    return customFontsCache[hash];
  }

  const string = await svg(options);
  const buf = Buffer.from(string, 'utf8');

  const getImage = sharp(buf);

  if (options.trim) {
    getImage.trim(options.trimTolerance);
  }

  if (options.resizeToFontSize) {
    getImage.resize(null, Math.round(fontSize * scale));
  }

  const imageBuffer = await getImage.png().toBuffer();

  const metadata = await sharp(imageBuffer).metadata();

  let $img = $('<img>');
  $img.attr('width', Math.round(metadata.width / scale));
  $img.attr('height', Math.round(metadata.height / scale));
  $img.attr('src', `data:image/png;base64,${imageBuffer.toString('base64')}`);
  if (options.supportsFallback) {
    options.attrs = renderFallback(
      options.text,
      Math.round(metadata.height / scale),
      options.fontColor,
      options.backgroundColor,
      options.attrs
    );
  }

  $img = applyAttributes($img, options.attrs);
  const result = $.html($img);
  customFontsCache[hash] = result;
  debug(`caching result for ${hash}`, result);
  return result;
}

async function png2x(options) {
  return png(options, 2);
}

async function png3x(options) {
  return png(options, 3);
}

async function getClosestFontName(fontNameOrPath) {
  const hash = `closestFontName(${fontNameOrPath})`;
  if (customFontsCache[hash]) {
    return customFontsCache[hash];
  }

  const fontNames = await getAvailableFontNames();
  const fontNamesByDistance = _.sortBy(
    _.map(fontNames, (name) => ({
      name,
      distance: levenshtein.get(
        fontNameOrPath.toLowerCase(),
        name.toLowerCase()
      )
    })),
    ['distance', 'name']
  );
  // If there were no matches or if the distance
  // of character difference is 50% different
  // than actual length of the font name, then reject it
  if (
    fontNamesByDistance.length === 0 ||
    fontNamesByDistance[0].distance > fontNameOrPath.length / 2
  ) {
    throw new Error(
      `"${fontNameOrPath}" was not found, did you forget to install it?`
    );
  }

  customFontsCache[hash] = fontNamesByDistance[0].name;
  return fontNamesByDistance[0].name;
}

async function getFontPathByName(name) {
  const hash = `fontPathByName(${name})`;
  if (customFontsCache[hash]) {
    return customFontsCache[hash];
  }

  const fontPathsByName = await getFontPathsByName();
  customFontsCache[hash] = fontPathsByName[name];
  return fontPathsByName[name];
}

async function getFontPathsByName() {
  if (customFontsCache.fontPathsByName) {
    return customFontsCache.fontPathsByName;
  }

  const fontNames = await getAvailableFontNames();
  const fontPaths = await getAvailableFontPaths();
  const fontPathsByName = _.zipObject(fontNames, fontPaths);
  customFontsCache.fontPathsByName = fontPathsByName;
  return fontPathsByName;
}

async function getAvailableFontPaths() {
  if (customFontsCache.fontPaths) {
    return customFontsCache.fontPaths;
  }

  let fonts = await Promise.all(useTypes.map((type) => osFonts.getAll(type)));
  fonts = fonts.flat();
  const array = [];
  // Add fonts from system
  for (const element of fonts) {
    let ext = path.extname(element);
    if (ext.indexOf('.') === 0) {
      ext = ext.slice(1);
    }

    if (fontExtensions.includes(ext)) {
      array.push(element);
    }
  }

  // Add node_modules folder
  const packageDir = await pkgDir();
  const nodeModuleFonts = await osFonts.getFontsInDirectory(
    path.join(packageDir, 'node_modules')
  );
  for (const element of nodeModuleFonts) {
    let ext = path.extname(element);
    if (ext.indexOf('.') === 0) {
      ext = ext.slice(1);
    }

    if (fontExtensions.includes(ext)) {
      array.push(element);
    }
  }

  // Sort the fonts A-Z
  const fontPaths = array.sort();
  customFontsCache.fontPaths = fontPaths;
  return fontPaths;
}

async function getAvailableFontNames() {
  if (customFontsCache.fontNames) {
    return customFontsCache.fontNames;
  }

  const fontPaths = await getAvailableFontPaths();
  const fontNames = _.map(fontPaths, (fontPath) =>
    path.basename(fontPath, path.extname(fontPath))
  );
  customFontsCache.fontNames = fontNames;
  return fontNames;
}

module.exports = {
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
  getAvailableFontNames,
  customFontsCache
};
