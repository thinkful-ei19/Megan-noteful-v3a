'use strict';
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const Folder = require('../models/folder');
const seedFolders = require('../db/seed/folders');

const expect = chai.expect;

describe('Noteful API - Folders', function () {
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI);
  });
  
  beforeEach(function () {
    return Folder.insertMany(seedFolders);
  });
  
  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });
  
  after(function () {
    return mongoose.disconnect();
  });
  
  describe('GET /api/folders', function () {
  
    it('should return the correct number of folders and correct fields', function () {
      const dbPromise = Folder.find();
      const apiPromise = chai.request(app).get('/api/folders');
  
      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item) {
            expect(item).to.be.a('object');
            expect(item).to.have.keys('id', 'name');
          });
        });
    });
  
  });
  
  describe('GET /api/folders/:id', function () {
  
    it('should return correct folder for a given id', function () {
      let data;
      return Folder.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/folders/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
  
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name');
  
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
        });
    });
  
    it('should respond with a 400 for an invalid id', function () {
      const badId = '99-99-99';
  
      return chai.request(app)
        .get(`/api/folders/${badId}`)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });
  
    it('should respond with a 404 for non-existent id', function () {
  
      return chai.request(app)
        .get('/api/folders/AAAAAAAAAAAAAAAAAAAAAAAA')
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  
  });
  
  describe('POST /api/folders', function () {
  
    it('should create and return a new item when provided valid data', function () {
      const newFolder = {
        'name': 'Puppies',
      };
      let res;
      return chai.request(app)
        .post('/api/folders')
        .send(newFolder)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'name');
          return Folder.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.name).to.equal(data.name);
        });
    });
  
    it('should return an error when posting an object with a missing "name" field', function () {
      const newItem = {
        'foo': 'bar'
      };
  
      return chai.request(app)
        .post('/api/folders')
        .send(newItem)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });
  
  });
  
  describe('PUT /api/notes/:id', function () {
  
    it('should update the folder when provided proper valid data', function () {
      const updateFolderName = {
        'name': 'Wine'
      };
      let data;
      return Folder.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/folders/${data.id}`)
            .send(updateFolderName);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'name');
  
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(updateFolderName.title);
          expect(res.body.content).to.equal(updateFolderName.content);
        });
    });
  
  
    it('should respond with a 400 for improperly formatted id', function () {
      const updateFolderName = {
        'name':'Wine'
      };
      const badId = '99-99-99';
  
      return chai.request(app)
        .put(`/api/folders/${badId}`)
        .send(updateFolderName)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });
  
    it('should respond with a 404 for an invalid id', function () {
      const updateFolderName = {
        'name' : 'Wine'
      };
  
      return chai.request(app)
        .put('/api/folders/AAAAAAAAAAAAAAAAAAAAAAAA')
        .send(updateFolderName)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  
    it('should return an error when missing "name" field', function () {
      const updateFolderName = {
        'foo': 'bar'
      };
  
      return chai.request(app)
        .put('/api/folders/9999')
        .send(updateFolderName)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });
  
  });
  
  describe('DELETE  /api/folders/:id', function () {
  
    it('should delete an folder by id', function () {
      let data;
      return Folder.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).delete(`/api/folders/${data.id}`);
        })
        .then(function (res) {
          expect(res).to.have.status(204);
        });
    });
  
  });
  
});
  