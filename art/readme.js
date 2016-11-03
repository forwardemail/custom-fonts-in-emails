
import path from 'path';
import _ from 'lodash';
import customFonts from '../lib';

const options = {
  text: 'Make something people want',
  fontNameOrPath: path.join(__dirname, '..', 'test', 'fixtures', 'GoudyBookletter1911'),
  fontColor: 'white',
  backgroundColor: '#ff6600',
  fontSize: 40
};

const promises = _.map([ 'svg', 'img', 'png', 'png2x', 'png3x' ], method => {
  return customFonts[method](options);
});

async function start() {
  try {
    const data = await Promise.all(promises);
    _.each(data, str => {
      console.log(`<br />\n${str}\n<br />`);
    });
  } catch (err) {
    throw err;
  }
}

start();

