
import chai from 'chai';
import dirtyChai from 'dirty-chai';

// setup global chai methods
chai.config.includeStack = true;
chai.config.showDiff = true;
chai.use(dirtyChai);
global.chai = chai;
global.AssertionError = chai.AssertionError;
global.Assertion = chai.Assertion;
global.expect = chai.expect;
global.assert = chai.assert;

