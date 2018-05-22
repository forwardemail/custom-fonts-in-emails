const path = require('path');
const _ = require('lodash');

// eslint-disable-next-line unicorn/import-index
const customFonts = require('../');

const options = {
  text: 'Make something people want',
  fontNameOrPath: path.join(
    __dirname,
    '..',
    'test',
    'fixtures',
    'GoudyBookletter1911'
  ),
  fontColor: 'white',
  backgroundColor: '#ff6600',
  fontSize: 40
};

const data = _.map(['svg', 'img', 'png', 'png2x', 'png3x'], method => {
  return customFonts[method](options);
});
_.each(data, str => {
  console.log(`<br />\n${str}\n<br />`);
});
