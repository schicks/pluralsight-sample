const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const morgan = require('morgan');
app.use(morgan('dev'))

const Database = require('./database.js');

//constants
const APP_PORT = 5000;
const API_PREFIX = '/rest/api';

// query functionality
app.get(apiRoute`/questions/all`, async (req, res, next) => {
  console.warn(req.query);
  try {
    res.send(await DB.query({...req.query, offset:0, size:NaN}));
  } catch (e) {next(e)}
});

app.get(apiRoute`/questions?`, async (req, res) => {
  try {
    res.send(await DB.query(req.query));
  } catch (e) {next(e)}
});

app.get(apiRoute`/questions/count?`, async (req, res) => {
  res.send({count: await DB.query({...req.query, offset:0, size:NaN}).length});
});

// delete functionality

app.delete(apiRoute`/questions/:id`, async (req, res, next) => {
  try {
    throw Error("Not Implemented Yet")
    await DB.delete(req.params.id)
  } catch (e) {
    console.error(`Error while attempting to delete question ${req.params.id}; ${e}`)
    next(e);
  }
});

// create functionality

app.put(apiRoute`/questions`, async (req, res, next) => {
  try {
    throw Error("Not Implemented Yet")
    await DB.create(req.body);
  } catch (e) {
    console.error(`Error while attempting to create question ${req.body}; ${e}`);
    next(e);
  }
});

//edit functionality
app.post(apiRoute`/questions/:id`, async (req, res, next) => {
  try {
    throw Error("Not Implemented Yet")
    await DB.update(req.params.id, req.body);
  } catch (e) {
    console.error(`Error while attempting to edit question ${req.params.id}; ${e}`);
    next(e);
  }
})


// Utility functions
function apiRoute(strings) {
  if (strings.length > 1) throw new Error('ApiRoutes cannot be interpolated')
  return API_PREFIX+strings[0]
}

//set up database

const DB = Database('./code_challenge_question_dump.csv');

//start listening

DB.lock.then(() => app.listen(APP_PORT, () => console.log(`Pluralsight API server started on port ${APP_PORT}`)))
.catch(e => console.error(`Pluralsight API encountered an error; ${e}`))
