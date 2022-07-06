const { familySync, GLIBC } = require('detect-libc');

module.exports = {
  verbose: true,
  failFast: true,
  serial: true,
  // <https://github.com/lovell/sharp/issues/3164#issuecomment-1168328811>
  workerThreads: familySync() !== GLIBC
};
