
import fs from 'fs';
import path from 'path';
import promisify from 'es6-promisify';
import s from 'underscore.string';
import osFonts from 'os-fonts';
import _ from 'lodash';
import levenshtein from 'fast-levenshtein';
// import svg2png from 'svg2png';
// import textToSvg from 'text-to-svg';

const useTypes = [
  'user',
  'local',
  'network',
  'system'
];

const fontExtensions = [ 'otf', 'ttf', 'woff' ];

let defaults = {
  text: '',
  fontNameOrPath: 'Arial',
  fontSizePx: '24px',
  fontColor: '#000',
  textToSvg: {
    x: 0,
    y: 0,
    anchor: 'left baseline',
    attributes: {
      stroke: 'none'
    }
  },
  attrs: []
};

export function setDefaults(options) {
  defaults = _.defaultsDeep(options, defaults);
  return defaults;
}

export function setOptions(options) {

  return new Promise(async (resolve, reject) => {

    // set deep defaults
    options = _.defaultsDeep(options, defaults);

    // ensure `text` is a string
    if (!_.isString(options.text))
      return reject(new Error('`text` must be a String'));

    // ensure `fontNameOrPath` is a string and not blank
    if (!_.isString(options.fontNameOrPath) || s.isBlank(options.fontNameOrPath))
      return reject(new Error('`fontNameOrPath` must be a String and not blank'));

    // convert font size in pixels to number
    // and remove px, so we just convert to digits only
    if (_.isString(options.fontSizePx))
      options.fontSizePx = parseInt(options.fontSizePx, 10);

    // ensure it's a number greater than 0
    if (!_.isNumber(options.fontSizePx) || options.fontSizePx <= 0)
      return reject(new Error(
        '`fontSizePx` must be a Number or String that is a valid number greater than 0'
      ));

    // ensure `fontColor` is a string
    if (!_.isString(options.fontColor) || s.isBlank(options.fontColor))
      return reject(new Error('`fontColor` must be a String and not blank'));

    // if `textToSvg.attributes.fill` is not set
    // then set it equal to `fontColor`
    if (!_.isString(options.textToSvg.attributes.fill))
      options.textToSvg.attributes.fill = options.fontColor;

    // if `textToSvg.fontSize` is not set
    // then set it equal to `fontSizePx` * 0.75
    if (!_.isString(options.textToSvg.fontSize))
      options.textToSvg.fontSize = options.fontSizePx * 0.75;

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

      resolve(options);

    } catch (err) {
      reject(err);
    }

  });

}

export async function svg(options) {

  try {
    options = await setOptions(options);
  } catch (err) {
    throw err;
  }

}

export function img(options) {

}

export function png(options) {

}

export function png2x(options) {

}

export function png3x(options) {

}

export function getClosestFontName(fontNameOrPath) {
  return new Promise(async (resolve, reject) => {
    try {
      const fontNames = await getAvailableFontNames();
      const fontNamesByDistance = _.sortBy(
        _.map(fontNames, name => {
          return {
            name,
            distance: levenshtein.get(fontNameOrPath.toLowerCase(), name.toLowerCase())
          };
        }),
        'distance'
      );
      // if there were no matches or if the distance
      // of character difference is 50% different
      // than actual length of the font name, then reject it
      if (fontNamesByDistance.length === 0
        || fontNamesByDistance[0].distance > fontNameOrPath.length / 2)
        return reject(new Error(
          `"${fontNameOrPath}" was not found, did you forget to install it?`
        ));
      resolve(fontNamesByDistance[0].name);
    } catch (err) {
      reject(err);
    }
  });
}

export function getFontPathByName(name) {
  return new Promise(async (resolve, reject) => {
    try {
      const fontPathsByName = await getFontPathsByName();
      resolve(fontPathsByName[name]);
    } catch (err) {
      reject(err);
    }
  });
}

export function getFontPathsByName() {
  return new Promise(async (resolve, reject) => {
    try {
      const [ fontNames, fontPaths ] = await Promise.all([
        getAvailableFontNames(),
        getAvailableFontPaths()
      ]);
      resolve(_.zipObject(fontNames, fontPaths));
    } catch (err) {
      reject(err);
    }
  });
}

export function getAvailableFontPaths() {
  return new Promise(async (resolve, reject) => {
    try {
      const fonts = await Promise.all(_.map(useTypes, osFonts.getAll));
      resolve(_.flatten(fonts));
    } catch (err) {
      reject(err);
    }
  });
}

export function getAvailableFontNames() {
  return new Promise(async (resolve, reject) => {
    try {
      const fontPaths = await getAvailableFontPaths();
      resolve(
        _.map(
          fontPaths,
          fontPath => path.basename(
            fontPath,
            path.extname(fontPath)
          )
        )
      );
    } catch (err) {
      reject(err);
    }
  });
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
