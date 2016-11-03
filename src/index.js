
import $ from 'cheerio';
import fs from 'fs';
import path from 'path';
import promisify from 'es6-promisify';
import s from 'underscore.string';
import osFonts from 'os-fonts';
import _ from 'lodash';
import levenshtein from 'fast-levenshtein';
import TextToSvg from 'text-to-svg';
import sharp from 'sharp';

const load = promisify(TextToSvg.load, TextToSvg);

const useTypes = [
  'user',
  'local',
  'network',
  'system'
];

const fontExtensions = [ 'otf', 'OTF', 'ttf', 'TTF', 'woff', 'WOFF' ];

let defaults = {
  text: '',
  fontNameOrPath: 'Arial',
  fontSize: '24px',
  fontColor: '#000',
  supportsFallback: true,
  resizeToFontSize: true,
  trim: true,
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

export function setDefaults(options) {
  defaults = _.defaultsDeep(options, defaults);
  return defaults;
}

export async function setOptions(options) {

  // clone to prevent interference
  options = _.cloneDeep(options);

  // set deep defaults
  options = _.defaultsDeep(options, defaults);

  // ensure `text` is a string
  if (!_.isString(options.text))
    throw new Error('`text` must be a String');

  // ensure `fontNameOrPath` is a string and not blank
  if (!_.isString(options.fontNameOrPath) || s.isBlank(options.fontNameOrPath))
    throw new Error('`fontNameOrPath` must be a String and not blank');

  // convert font size in pixels to number
  // and remove px, so we just convert to digits only
  if (_.isString(options.fontSize))
    options.fontSize = parseFloat(options.fontSize);

  // round to nearest whole pixel
  options.fontSize = Math.round(options.fontSize);

  // ensure it's a number greater than 0
  if (!_.isNumber(options.fontSize) || options.fontSize <= 0)
    throw new Error(
      '`fontSize` must be a Number or String that is a valid number greater than 0'
    );

  // ensure `fontColor` is a string
  if (!_.isString(options.fontColor) || s.isBlank(options.fontColor))
    throw new Error('`fontColor` must be a String and not blank');

  // ensure supportsFallback is a boolean else true
  if (!_.isBoolean(options.supportsFallback))
    throw new Error('`supportsFallback` must be a Boolean');

  // ensure resizeToFontSize is a boolean else true
  if (!_.isBoolean(options.resizeToFontSize))
    throw new Error('`resizeToFontSize` must be a Boolean');

  // ensure trim is a boolean else true
  if (!_.isBoolean(options.trim))
    throw new Error('`trim` must be a Boolean');

  // ensure trimTolerance is a number else 10
  if (!_.isNumber(options.trimTolerance)
    || options.trimTolerance < 1
    || options.trimTolerance > 99)
    throw new Error('`trimTolerance` must be a Number between 1 and 99 inclusive');

  // if `textToSvg.attributes.fill` is not set
  // then set it equal to `fontColor`
  if (!_.isString(options.textToSvg.attributes.fill))
    options.textToSvg.attributes.fill = options.fontColor;

  // if `textToSvg.fontSize` not set, then we will calculate
  // what the `fontSize` should be based off height of font
  if (!_.isNumber(options.textToSvg.fontSize))
    options.textToSvg.fontSize = options.fontSize;

  // if `fontNameOrPath` was not a valid font path (with smart detection)
  // then result to use `getClosestFontName` and `getFontPathByName`
  try {

    const ext = path.extname(options.fontNameOrPath);
    const fontName = path.basename(options.fontNameOrPath, ext);

    if (_.includes(fontExtensions, ext)) {

      const stats = await promisify(fs.stat, fs)(path.resolve(options.fontNameOrPath));

      if (!stats.isFile())
        throw new Error(`${path.resolve(options.fontNameOrPath)} was not a valid file`);

      options.fontPath = path.resolve(options.fontNameOrPath);
      options.fontName = fontName;

    } else {

      const fontDir = path.dirname(path.resolve(options.fontNameOrPath));

      let data = await Promise.all(
        _.map(fontExtensions, ext => {
          return new Promise(async (resolve, reject) => {
            try {
              const filePath = `${fontDir}/${fontName}.${ext}`;
              const stats = await promisify(fs.stat, fs)(filePath);
              resolve(stats.isFile() ? filePath : false);
            } catch (err) {
              resolve(false);
            }
          });
        })
      );

      // remove false matches
      data = _.compact(data);

      // if this was a directory path then throw an error that it was not found
      if (options.fontNameOrPath.indexOf(path.sep) !== -1 && data.length === 0)
        throw new Error(`\`fontNameOrPath\` "${options.fontNameOrPath}" file was not found`);

      if (data.length > 0) {
        options.fontName = fontName;
        options.fontPath = data[0];
      } else {
        options.fontName = await getClosestFontName(options.fontNameOrPath);
        options.fontPath = await getFontPathByName(options.fontName);
      }

    }

    return options;

  } catch (err) {
    throw err;
  }

}

function renderFallback(text, fontSize, fontColor, attrs) {
  console.log('renderFallback', 'text', text, 'fontSize', fontSize, 'fontColor', fontColor);
  console.log('attrs', attrs);
  attrs.title = text;
  attrs.alt = text;
  attrs.style = attrs.style || '';
  attrs.style += `color: ${fontColor};`;
  attrs.style += `font-size: ${fontSize / 2}px;`;
  attrs.style += `line-height: ${fontSize}px;`;
  attrs.style += 'text-align: center;';
  console.log('attrs now', attrs);
  return attrs;
}

function applyAttributes($el, attrs) {
  console.log('applyAttributes');
  console.log('$el', $el);
  console.log('attrs', attrs);
  _.each(_.keys(attrs), key => {
    console.log('key', key, 'value', attrs[key]);
    $el.attr(key, attrs[key]);
  });
  return $el;
}

export async function svg(options) {
  try {
    options = await setOptions(options);
    const textToSvg = await load(options.fontPath);
    const str = textToSvg.getSVG(options.text, options.textToSvg);
    let $svg = $(str);
    console.log('WOO BAZ options.attrs', options.attrs);
    $svg = applyAttributes($svg, options.attrs);
    return $.html($svg);
  } catch (err) {
    throw err;
  }
}

export async function img(options) {
  try {
    const str = await svg(options);
    const $svg = $(str);
    let $img = $('<img>');
    $img.attr('width', $svg.attr('width'));
    $img.attr('height', $svg.attr('height'));
    $img.attr('src', `data:image/svg+xml;base64,${new Buffer(str, 'utf8').toString('base64')}`);
    if (options.supportsFallback)
      options.attrs = renderFallback(
        options.text,
        $svg.attr('height'),
        options.fontColor,
        options.attrs
      );
    $img = applyAttributes($img, options.attrs);
    return $.html($img);
  } catch (err) {
    throw err;
  }
}

export async function png(options, scale) {

  // default scale it 1
  scale = scale || 1;

  if (!_.isNumber(scale))
    throw new Error('`scale` must be a Number');

  try {

    options = await setOptions(options);

    //
    // initially I tried to use the package `svgo`
    // to optimize the image and remove invisible whitespace
    // but this feature isn't available yet
    // https://github.com/svg/svgo/issues/67
    //
    // so instead what we have to do is multiply the scale itself by 1.25
    // to get a large enough svg that when rendered it will look OK after trimming
    // and then we render it as a png, trim it, then resize it down to the `fontSize`
    // with a width calculated based off the given aspect ratio
    //

    const fontSize = options.fontSize;
    options.fontSize = Math.round(fontSize * scale * 2);
    options.textToSvg.fontSize = options.fontSize;

    const str = await svg(options);

    const buf = new Buffer(str, 'utf8');

    const getImage = sharp(buf);
    if (options.trim)
      getImage.trim(options.trimTolerance);
    if (options.resizeToFontSize)
      getImage.resize(null, Math.round(fontSize * scale));

    const imageBuffer = await getImage.png().toBuffer();

    const metadata = await sharp(imageBuffer).metadata();

    let $img = $('<img>');
    $img.attr('width', Math.round(metadata.width / scale));
    $img.attr('height', Math.round(metadata.height / scale));
    $img.attr('src', `data:image/png;base64,${imageBuffer.toString('base64')}`);
    if (options.supportsFallback)
      options.attrs = renderFallback(
        options.text,
        Math.round(metadata.height / scale),
        options.fontColor,
        options.attrs
      );
    $img = applyAttributes($img, options.attrs);

    return $.html($img);

  } catch (err) {
    throw err;
  }
}

export async function png2x(options) {
  try {
    const str = await png(options, 2);
    return str;
  } catch (err) {
    throw err;
  }
}

export async function png3x(options) {
  try {
    const str = await png(options, 3);
    return str;
  } catch (err) {
    throw err;
  }
}

export async function getClosestFontName(fontNameOrPath) {
  try {
    const fontNames = await getAvailableFontNames();
    const fontNamesByDistance = _.sortBy(
      _.map(fontNames, name => {
        return {
          name,
          distance: levenshtein.get(fontNameOrPath.toLowerCase(), name.toLowerCase())
        };
      }),
      [ 'distance', 'name' ]
    );
    // if there were no matches or if the distance
    // of character difference is 50% different
    // than actual length of the font name, then reject it
    if (fontNamesByDistance.length === 0
      || fontNamesByDistance[0].distance > fontNameOrPath.length / 2)
      throw new Error(
        `"${fontNameOrPath}" was not found, did you forget to install it?`
      );
    return fontNamesByDistance[0].name;
  } catch (err) {
    throw err;
  }
}

export async function getFontPathByName(name) {
  try {
    const fontPathsByName = await getFontPathsByName();
    return fontPathsByName[name];
  } catch (err) {
    throw err;
  }
}

export async function getFontPathsByName() {
  try {
    const [ fontNames, fontPaths ] = await Promise.all([
      getAvailableFontNames(),
      getAvailableFontPaths()
    ]);
    return _.zipObject(fontNames, fontPaths);
  } catch (err) {
    throw err;
  }
}

export async function getAvailableFontPaths() {
  try {
    let fonts = await Promise.all(_.map(useTypes, osFonts.getAll));
    fonts = _.flatten(fonts);
    // filter out only fonts that match our extensions
    fonts = _.filter(fonts, fontPath => {
      let ext = path.extname(fontPath);
      if (ext.indexOf('.') === 0)
        ext = ext.substring(1);
      return _.includes(fontExtensions, ext);
    });
    // sort the fonts A-Z
    fonts = fonts.sort();
    return fonts;
  } catch (err) {
    throw err;
  }
}

export async function getAvailableFontNames() {
  try {
    const fontPaths = await getAvailableFontPaths();
    return _.map(
      fontPaths,
      fontPath => path.basename(
        fontPath,
        path.extname(fontPath)
      )
    );
  } catch (err) {
    throw err;
  }
}

export default {
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
};
