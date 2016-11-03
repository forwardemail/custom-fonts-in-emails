
import _ from 'lodash';
import $ from 'cheerio';
import promisify from 'es6-promisify';
import fs from 'fs';
import path from 'path';
import customFonts from '../../lib';

const text = 'Hello World';
const fontSize = '24px';

describe('custom-fonts-in-emails', () => {

  it('should trim and resize', async () => {
    try {
      await customFonts.img({
        text,
        trim: true,
        resizeToFontSize: true
      });
    } catch (err) {
      throw err;
    }
  });

  _.each([ '', 0, 100 ], val => {
    it('should throw an error for invalid `options.trimTolerance` values', async () => {
      let e;
      try {
        await customFonts.setOptions({
          trimTolerance: val
        });
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.be.an('error');
      }
    });
  });

  _.each([ 'supportsFallback', 'resizeToFontSize', 'trim' ], opt => {
    it(`should throw an error for non-Boolean \`options.${opt}\``, async () => {
      let e;
      try {
        const opts = {};
        opts[opt] = '';
        await customFonts.setOptions(opts);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.be.an('error');
      }
    });
  });

  it('should get file in ./fonts folder if used wrong extension', async () => {
    try {
      const options = await customFonts.setOptions({
        fontNameOrPath: path.join(__dirname, '..', 'fixtures', 'GoudyBookletter1911.woff')
      });
      expect(options.fontName).to.equal('GoudyBookletter1911');
      expect(options.fontPath).to.equal(
        path.join(__dirname, '..', 'fixtures', 'GoudyBookletter1911.otf')
      );
    } catch (err) {
      throw err;
    }
  });

  it('should get file in ./fonts folder with correct extension', async () => {
    try {
      const options = await customFonts.setOptions({
        fontNameOrPath: path.join(__dirname, '..', 'fixtures', 'GoudyBookletter1911.otf')
      });
      expect(options.fontName).to.equal('GoudyBookletter1911');
      expect(options.fontPath).to.equal(
        path.join(__dirname, '..', 'fixtures', 'GoudyBookletter1911.otf')
      );
    } catch (err) {
      throw err;
    }
  });

  it('should get file in ./fonts folder without an extension', async () => {
    try {
      const options = await customFonts.setOptions({
        fontNameOrPath: path.join(__dirname, '..', 'fixtures', 'GoudyBookletter1911')
      });
      expect(options.fontName).to.equal('GoudyBookletter1911');
      expect(options.fontPath).to.equal(
        path.join(__dirname, '..', 'fixtures', 'GoudyBookletter1911.otf')
      );
    } catch (err) {
      throw err;
    }
  });

  it('should throw an error if we specify an invalid font file path', async () => {
    let e;
    try {
      await customFonts.setOptions({
        fontNameOrPath: path.join(__dirname, '..', 'fixtures', 'GoudyBookletter1912')
      });
    } catch (err) {
      e = err;
    } finally {
      expect(e).to.be.an('error');
    }
  });

  it('should have custom attributes when passing them', async () => {
    try {
      const svg = await customFonts.svg({
        text,
        attrs: {
          foo: 'bar'
        }
      });
      const $svg = $(svg);
      expect($svg.attr('foo')).to.equal('bar');
    } catch (err) {
      throw err;
    }
  });

  it('should return hello world svg', async () => {
    try {
      const svg = await customFonts.svg({
        text
      });
      const expectedSvg = await promisify(fs.readFile, fs)(
        path.join(__dirname, '..', 'fixtures', 'hello-world.svg'),
        'utf8'
      );
      expect(svg.trim()).to.equal(expectedSvg.trim());
    } catch (err) {
      throw err;
    }
  });

  it('should support custom background color for img', async () => {
    try {
      const str = await customFonts.img({
        text,
        backgroundColor: 'red'
      });
      const expectedColor = await promisify(fs.readFile, fs)(
        path.join(__dirname, '..', 'fixtures', 'color-img.html'),
        'utf8'
      );
      expect(str.trim()).to.equal(expectedColor.trim());
      //
      // TODO: it'd be cool to use these two packages
      // to accurately check the background color from sharp()
      // https://www.npmjs.com/package/color
      // https://www.npmjs.com/package/get-canvas-pixel-color
      //
    } catch (err) {
      throw err;
    }
  });

  it('should set alt, title, and style on img and png', async () => {
    try {
      await Promise.all(_.map([ 'img', 'png' ], method => {
        return new Promise(async (resolve, reject) => {
          try {
            const str = await customFonts[method]({ text });
            const $img = $(str);
            expect($img.attr('alt')).to.equal(text);
            expect($img.attr('title')).to.equal(text);
            expect($img.attr('style')).to.be.a('string').and.not.be.empty();
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      }));
    } catch (err) {
      throw err;
    }
  });

  it('should return hello world img', async () => {
    try {
      const img = await customFonts.img({ text });
      const expectedImg = await promisify(fs.readFile, fs)(
        path.join(__dirname, '..', 'fixtures', 'hello-world-img.html'),
        'utf8'
      );
      expect(img.trim()).to.equal(expectedImg.trim());
    } catch (err) {
      throw err;
    }
  });

  it('should return png@1x', async () => {
    try {
      const png = await customFonts.png({ text, fontSize });
      const expectedPng = await promisify(fs.readFile, fs)(
        path.join(__dirname, '..', 'fixtures', 'hello-world-png.html'),
        'utf8'
      );
      expect(png.trim()).to.equal(expectedPng.trim());
    } catch (err) {
      throw err;
    }
  });

  it('should throw an error if we pass an invalid scale to png', async () => {
    let e;
    try {
      await customFonts.png({ text }, 'foo');
    } catch (err) {
      e = err;
    } finally {
      expect(e).to.be.an('error');
      expect(e.message).to.equal('`scale` must be a Number');
    }
  });

  it('should return png@2x', async () => {
    try {
      const png = await customFonts.png2x({ text, fontSize });
      const expectedPng = await promisify(fs.readFile, fs)(
        path.join(__dirname, '..', 'fixtures', 'hello-world-png@2x.html'),
        'utf8'
      );
      expect(png.trim()).to.equal(expectedPng.trim());
    } catch (err) {
      throw err;
    }
  });

  it('should return png@3x', async () => {
    try {
      const png = await customFonts.png3x({ text, fontSize });
      const expectedPng = await promisify(fs.readFile, fs)(
        path.join(__dirname, '..', 'fixtures', 'hello-world-png@3x.html'),
        'utf8'
      );
      expect(png.trim()).to.equal(expectedPng.trim());
    } catch (err) {
      throw err;
    }
  });

  it('should throw an error if we did not have a close match at all', async () => {
    let e;
    try {
      await customFonts.getClosestFontName('Foo Bar Baz Beep');
    } catch (err) {
      e = err;
    } finally {
      expect(e).to.be.an('error');
    }
  });

  it('should return closest font name if we had a typo', async () => {
    try {
      const font = await customFonts.getClosestFontName('Gorgia');
      expect(font).to.be.a('string').and.to.equal('Georgia');
    } catch (err) {
      throw err;
    }
  });

  it('should get font paths by name', async () => {
    try {
      const fontPathsByName = await customFonts.getFontPathsByName();
      expect(fontPathsByName).to.be.an('object');
    } catch (err) {
      throw err;
    }
  });

  it('should get available font paths', async () => {
    try {
      const fontPaths = await customFonts.getAvailableFontPaths();
      expect(fontPaths)
        .to.be.an('array')
        .and.to.have.length.above(0);
    } catch (err) {
      throw err;
    }
  });

  it('should get available font names', async () => {
    try {
      const fontNames = await customFonts.getAvailableFontNames();
      expect(fontNames)
        .to.be.an('array')
        .and.to.have.length.above(0);
    } catch (err) {
      throw err;
    }
  });

  it('should return closest font path by name', async () => {
    try {
      const fontPath = await customFonts.getFontPathByName('Arial');
      expect(fontPath).to.be.a('string');
    } catch (err) {
      throw err;
    }
  });

});
