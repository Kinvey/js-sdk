import { expect } from 'chai';
import { Acl } from '../src/acl';

describe('Acl', function() {
  describe('creator', function() {
    it('should return undefined', function() {
      const acl = new Acl();
      expect(acl.creator).to.be.undefined;
    });

    it('should return the creator', function() {
      const creator = 'creator';
      const acl = new Acl({ creator });
      expect(acl.creator).to.equal(creator);
    });
  });

  describe('readers', function() {
    it('should return an empty array', function() {
      const acl = new Acl();
      expect(acl.readers).to.deep.equal([]);
    });

    it('should return the readers', function() {
      const readers = ['reader'];
      const acl = new Acl({ r: readers });
      expect(acl.readers).to.deep.equal(readers);
    });
  });

  describe('writers', function() {
    it('should return an empty array', function() {
      const acl = new Acl();
      expect(acl.writers).to.deep.equal([]);
    });

    it('should return the writers', function() {
      const writers = ['writer'];
      const acl = new Acl({ w: writers });
      expect(acl.writers).to.deep.equal(writers);
    });
  });

  describe('readerGroups', function() {
    it('should return an empty array', function() {
      const acl = new Acl();
      expect(acl.readerGroups).to.deep.equal([]);
    });

    it('should return the readerGroups', function() {
      const readers = ['reader'];
      const acl = new Acl({ groups: { r: readers } });
      expect(acl.readerGroups).to.deep.equal(readers);
    });
  });

  describe('writerGroups', function() {
    it('should return an empty array', function() {
      const acl = new Acl();
      expect(acl.writerGroups).to.deep.equal([]);
    });

    it('should return the writerGroups', function() {
      const writers = ['writer'];
      const acl = new Acl({ groups: { w: writers } });
      expect(acl.writerGroups).to.deep.equal(writers);
    });
  });

  describe('addReader()', function() {
    it('should add a reader', function() {
      const reader = 'reader';
      const acl = new Acl();
      acl.addReader(reader);
      expect(acl.readers).to.include(reader);
    });
  });

  describe('removeReader()', function() {
    it('should remove a reader', function() {
      const reader = 'reader';
      const acl = new Acl({ r: [reader] });
      acl.removeReader(reader);
      expect(acl.readers).to.not.include(reader);
    });
  });

  describe('addWriter()', function() {
    it('should add a writer', function() {
      const writer = 'writer';
      const acl = new Acl();
      acl.addWriter(writer);
      expect(acl.writers).to.include(writer);
    });
  });

  describe('removeWriter()', function() {
    it('should do nothing if a writer does not exist', function() {
      const writer = 'writer';
      const acl = new Acl();
      acl.removeWriter(writer);
      expect(acl.writers).to.not.include(writer);
    });

    it('should remove a writer', function() {
      const writer = 'writer';
      const acl = new Acl({ w: [writer] });
      acl.removeWriter(writer);
      expect(acl.writers).to.not.include(writer);
    });
  });

  describe('addReaderGroup()', function() {
    it('should add a reader', function() {
      const reader = 'reader';
      const acl = new Acl();
      acl.addReaderGroup(reader);
      expect(acl.readerGroups).to.include(reader);
    });
  });

  describe('removeReaderGroup()', function() {
    it('should remove a reader', function() {
      const reader = 'reader';
      const acl = new Acl({ groups: { r: [reader] } });
      acl.removeReaderGroup(reader);
      expect(acl.readerGroups).to.not.include(reader);
    });
  });

  describe('addWriterGroup()', function() {
    it('should add a writer', function() {
      const writer = 'writer';
      const acl = new Acl();
      acl.addWriterGroup(writer);
      expect(acl.writerGroups).to.include(writer);
    });
  });

  describe('removeWriterGroup()', function() {
    it('should remove a writer', function() {
      const writer = 'writer';
      const acl = new Acl({ groups: { w: [writer] } });
      acl.removeWriterGroup(writer);
      expect(acl.writerGroups).to.not.include(writer);
    });
  });
});
