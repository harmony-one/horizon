const API = require('pm2').custom;

const descriptors = Object.getOwnPropertyDescriptors(API.prototype);

Object.keys(descriptors).forEach(name => {
  const descriptor = descriptors[name];
  if (/^[a-z]/.test(name) && typeof descriptor.value === 'function') {
    const method = descriptor.value;

    descriptor.value = function (...args) {
      // If last argument is function then we have callback
      if (typeof args[args.length - 1] === 'function') {
        return method.apply(this, args);
      } else {
        return new Promise((resolve, reject) => {
          args.push((error, value) => {
            if (error) {
              reject(error);
            } else {
              resolve(value);
            }
          });
          return method.apply(this, args);
        }).catch(error => {
          console.error(error);
          throw error;
        });
      }
    };
    Object.defineProperty(API.prototype, name, descriptor);
  }
});

module.exports = new API;
module.exports.custom = API;
