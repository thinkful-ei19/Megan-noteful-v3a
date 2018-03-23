'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const Tag = require('../models/tag');
const Note = require('../models/note');


router.get('/tags', (req, res, next) => {

  Tag.find()
    .sort('name')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
  
});

//Get Tags By ID:
router.get('/tags/:id', (req, res, next) => {
  const { id } = req.params;
    
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
    
  Tag.findById(id)
    .then(result => {
      console.log('findById:', id, result);
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      console.error(err);
      next(err);
    });
});


//POST/Create New Tag:
router.post('/tags', (req, res, next) => {
  const { name } = req.body;
    
  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
    
  const newTag = { name };
    
  Tag.create(newTag)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});

//PUT/Update Tags:
router.put('/tags/:id', (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
    
  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
    
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
    
  const updateItem = { name };
     
    
  Tag.findByIdAndUpdate(id, updateItem, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});


//Delete Folders:
router.delete('/tags/:id', (req, res, next) => {
  const { id } = req.params;

  console.log(id);
    
  Tag.findByIdAndRemove(id)
    .then(()=>{
      Note.findByIdAndUpdate(id,
        {$pull:{'tags':{'id':id}}});
    })
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      next(err);
    });
});  





module.exports = router;