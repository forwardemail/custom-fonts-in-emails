const path = require('path');
const _ = require('lodash');

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

const data = _.map(['svg', 'img', 'png', 'png2x', 'png3x'], (method) =>
  customFonts[method](options)
);
_.each(data, (string) => {
  console.log(`<br />\n${string}\n<br />`);
});
