const fs = require('fs');
const path = require('path');
const chai = require('chai');
const dirtyChai = require('dirty-chai');
const _ = require('lodash');
const $ = require('cheerio');

// eslint-disable-next-line unicorn/import-index
const customFonts = require('../../');

chai.use(dirtyChai);

const { expect } = chai;

const text = 'Hello World';
const fontSize = '24px';

describe('custom-fonts-in-emails', () => {
  it('should trim and resize', () => {
    customFonts.img({
      text,
      trim: true,
      resizeToFontSize: true
    });
  });

  _.each(['', 0, 100], val => {
    it('throws for invalid `options.trimTolerance` values', () => {
      let e;
      try {
        customFonts.setOptions({
          trimTolerance: val
        });
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.be.an('error');
      }
    });
  });

  _.each(['supportsFallback', 'resizeToFontSize', 'trim'], opt => {
    it(`throws for non-Boolean \`options.${opt}\``, () => {
      let e;
      try {
        const opts = {};
        opts[opt] = '';
        customFonts.setOptions(opts);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.be.an('error');
      }
    });
  });

  it('should get file in ./fonts folder if used wrong extension', () => {
    const options = customFonts.setOptions({
      fontNameOrPath: path.join(
        __dirname,
        '..',
        'fixtures',
        'GoudyBookletter1911.woff'
      )
    });
    expect(options.fontName).to.equal('GoudyBookletter1911');
    expect(options.fontPath).to.equal(
      path.join(__dirname, '..', 'fixtures', 'GoudyBookletter1911.otf')
    );
  });

  it('should get file in ./fonts folder with correct extension', () => {
    const options = customFonts.setOptions({
      fontNameOrPath: path.join(
        __dirname,
        '..',
        'fixtures',
        'GoudyBookletter1911.otf'
      )
    });
    expect(options.fontName).to.equal('GoudyBookletter1911');
    expect(options.fontPath).to.equal(
      path.join(__dirname, '..', 'fixtures', 'GoudyBookletter1911.otf')
    );
  });

  it('should get file in ./fonts folder without an extension', () => {
    const options = customFonts.setOptions({
      fontNameOrPath: path.join(
        __dirname,
        '..',
        'fixtures',
        'GoudyBookletter1911'
      )
    });
    expect(options.fontName).to.equal('GoudyBookletter1911');
    expect(options.fontPath).to.equal(
      path.join(__dirname, '..', 'fixtures', 'GoudyBookletter1911.otf')
    );
  });

  it('throws if we specify an invalid font file path', () => {
    let e;
    try {
      customFonts.setOptions({
        fontNameOrPath: path.join(
          __dirname,
          '..',
          'fixtures',
          'GoudyBookletter1912'
        )
      });
    } catch (err) {
      e = err;
    } finally {
      expect(e).to.be.an('error');
    }
  });

  it('should have custom attributes when passing them', () => {
    const svg = customFonts.svg({
      text,
      attrs: {
        foo: 'bar'
      }
    });
    const $svg = $(svg);
    expect($svg.attr('foo')).to.equal('bar');
  });

  it('should return hello world svg', () => {
    const svg = customFonts.svg({
      text
    });
    const expectedSvg = fs.readFileSync(
      path.join(__dirname, '..', 'fixtures', 'hello-world.svg'),
      'utf8'
    );
    expect(svg.trim()).to.equal(expectedSvg.trim());
  });

  it('should support custom background color for img', () => {
    const str = customFonts.img({
      text,
      backgroundColor: 'red'
    });
    const expectedColor = fs.readFileSync(
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
  });

  it('should set alt, title, and style on img and png', () => {
    _.map(['img', 'png'], method => {
      const str = customFonts[method]({ text });
      const $img = $(str);
      expect($img.attr('alt')).to.equal(text);
      expect($img.attr('title')).to.equal(text);
      expect($img.attr('style'))
        .to.be.a('string')
        .and.not.be.empty();
    });
  });

  it('should return hello world img', () => {
    const img = customFonts.img({ text });
    const expectedImg = fs.readFileSync(
      path.join(__dirname, '..', 'fixtures', 'hello-world-img.html'),
      'utf8'
    );
    expect(img.trim()).to.equal(expectedImg.trim());
  });

  it('should return png@1x', () => {
    const png = customFonts.png({ text, fontSize });
    const expectedPng = fs.readFileSync(
      path.join(__dirname, '..', 'fixtures', 'hello-world-png.html'),
      'utf8'
    );
    expect(png.trim()).to.equal(expectedPng.trim());
  });

  it('throws if we pass an invalid scale to png', () => {
    let e;
    try {
      customFonts.png({ text }, 'foo');
    } catch (err) {
      e = err;
    } finally {
      expect(e).to.be.an('error');
      expect(e.message).to.equal('`scale` must be a Number');
    }
  });

  it('should return png@2x', () => {
    const png = customFonts.png2x({ text, fontSize });
    const expectedPng = fs.readFileSync(
      path.join(__dirname, '..', 'fixtures', 'hello-world-png@2x.html'),
      'utf8'
    );
    expect(png.trim()).to.equal(expectedPng.trim());
  });

  it('should return png@3x', () => {
    const png = customFonts.png3x({ text, fontSize });
    const expectedPng = fs.readFileSync(
      path.join(__dirname, '..', 'fixtures', 'hello-world-png@3x.html'),
      'utf8'
    );
    expect(png.trim()).to.equal(expectedPng.trim());
  });

  it('throws if we did not have a close match at all', () => {
    let e;
    try {
      customFonts.getClosestFontName('Foo Bar Baz Beep');
    } catch (err) {
      e = err;
    } finally {
      expect(e).to.be.an('error');
    }
  });

  it('should return closest font name if we had a typo', () => {
    const font = customFonts.getClosestFontName('Gorgia');
    expect(font)
      .to.be.a('string')
      .and.to.equal('Georgia');
  });

  it('should get font paths by name', () => {
    const fontPathsByName = customFonts.getFontPathsByName();
    expect(fontPathsByName).to.be.an('object');
  });

  it('should get available font paths', () => {
    const fontPaths = customFonts.getAvailableFontPaths();
    expect(fontPaths)
      .to.be.an('array')
      .and.to.have.length.above(0);
  });

  it('should get available font names', () => {
    const fontNames = customFonts.getAvailableFontNames();
    expect(fontNames)
      .to.be.an('array')
      .and.to.have.length.above(0);
  });

  it('should return closest font path by name', () => {
    const fontPath = customFonts.getFontPathByName('Arial');
    expect(fontPath).to.be.a('string');
  });

  it('should get file in node_modules folder if used wrong extension', () => {
    const options = customFonts.setOptions({
      fontNameOrPath: 'Bitter Bold'
    });
    expect(options.fontName).to.equal('Bitter-Bold');
    expect(options.fontPath).to.equal(
      path.join(
        __dirname,
        '..',
        '..',
        'node_modules',
        'bitter-font',
        'fonts',
        'Bold',
        'Bitter-Bold.woff'
      )
    );
  });

  it('should get file in node_modules folder with correct extension', () => {
    const options = customFonts.setOptions({
      fontNameOrPath: 'Bitter-Bold.ttf'
    });
    expect(options.fontName).to.equal('Bitter-Bold');
    expect(options.fontPath).to.equal(
      path.join(
        __dirname,
        '..',
        '..',
        'node_modules',
        'bitter-font',
        'fonts',
        'Bold',
        'Bitter-Bold.woff'
      )
    );
  });

  it('should get file in node_modules folder without an extension', () => {
    const options = customFonts.setOptions({
      fontNameOrPath: 'Bitter-Bold'
    });
    expect(options.fontName).to.equal('Bitter-Bold');
    expect(options.fontPath).to.equal(
      path.join(
        __dirname,
        '..',
        '..',
        'node_modules',
        'bitter-font',
        'fonts',
        'Bold',
        'Bitter-Bold.woff'
      )
    );
  });
});
