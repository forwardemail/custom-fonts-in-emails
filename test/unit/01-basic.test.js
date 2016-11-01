
import path from 'path';
import customFonts from '../../lib';

describe('custom-fonts-in-emails', () => {

  /*
  it('should set defaults', () => {
    // customFonts.setDefaults
  });
  */

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

  /*
  it('should return svg', () => {
    // svg
  });

  it('should return img', () => {
    // img
  });

  it('should return png@1x', () => {
    // png
  });

  it('should return png@2x', () => {
    // png2x
  });

  it('should return png@3x', () => {
    // png3x
  });
  */

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
