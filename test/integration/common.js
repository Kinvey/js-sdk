var uid = (size = 10) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (let i = 0; i < size; i += 1) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  
    return text;
  }
  
  var randomString = (size = 18, prefix = '') => {
    return `${prefix}${uid(size)}`;
  }
  
  
  if (typeof module === 'object') {
    module.exports = {};
  }