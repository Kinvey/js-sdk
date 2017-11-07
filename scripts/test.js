const path = require('path');
const klaw = require('klaw');

klaw(path.join(__dirname, '../packages'), { depthLimit: 0 })
  .on('readable', function() {
    let item;
    while ((item = this.read())) {
      console.log(item.path);
    }
  });
