const fs = require('fs-extra');
const _ = require('lodash');

const DEFAULT_QUESTIONS_QUERY_ARGS = { // gives arguements default values and demonstrates structure of query parameters
  offset: 0,
  size:10,
  sort: {
    key:'id', 
    //^ id is a synthetic column that represents a primary key. It is initialized as the position in csv, but is persistent
    // so that GET requests remain cacheable in the presence of create/delete. It is unique and not editable.
    order:'desc',
  },
  filter: {
    id:'',
    question:'', 
    answer:'',
    distractors:'',
  },
};

const stringCompare = f => v => {
  if (typeof v === 'number') return parseFloat(f) === v; // filters on numeric fields have to be exact
  return v.toLowerCase().includes(f); // filters on string fields are case insensitive string matching
}

function alike(value, filter) {
  /**
   * Handles boilerplate of comparing a filter string to a value.
   */
  if (!filter && filter !== 0) return true
  if (value === undefined) return false
  const filter_list = filter.split(',').map(s => stringCompare(s.trim().toLowerCase()));
  if (Array.isArray(value)) { // in the case of distractors we will accept there being any value that meets the filter
    return filter_list.every(f => value.some(f))
  } else return filter_list.every(f => f(value))
}

class Database {
  /**
   * Class representing interactions with the csv file.
   */

  static validateField(str) {
    if (!(typeof str === 'string' && !str.includes('|'))) throw new Error("Invalid field")
    return true
  }

  static validateRecord(record) {
    const {question, answer, distractors} = record;
    try {
      Database.validateField(question)
      Database.validateField(answer)
      distractors.every(Database.validateField)
    } catch (e) {
      throw new Error(`Invalid record: ${e}`)
    }
    const copied = {...record};
    delete copied.question;
    delete copied.answer;
    delete copied.distractors;
    if (Object.keys(copied).length !== 0) throw new Error("Invalid record: Invalid keys")
    return true
  }

  bind(func) {
    /**
     * Factored out generalization of the pattern for binding a function to the database and making it obey and update the lock.
     */
    return (...args) => {
      const progress = this.lock.then(func.bind(this, ...args));
      this.lock = progress.catch(e => null) // we never want errors to propogate into the lock
      return progress // we do want to return promises with uncaught errors so the api can decide how to handle them
    }
  }

  constructor(csv_location) {
    this.bind = this.bind.bind(this);
    this.get = this.bind(this.get);
    this.delete = this.bind(this.delete);
    this.create = this.bind(this.create);
    this.update = this.bind(this.update);

    this.nextId = 0;

    this.lock = fs.readFile(csv_location)
    .then(data => {
      console.log(`Initializing database for file at ${csv_location}`);
      this.data = new Map(data.toString().split('\n')
      .filter(id => id)
      .map(datum => {
        const [question, answer, distractors] = datum.split('|').map(s => s.trim());
        const id = (this.nextId++);
        return [
          id,
          {
            id,
            question,
            answer:parseFloat(answer),
            distractors:distractors.split(',').map(s => parseFloat(s.trim()))
          }
        ]
      }))
    })
    .then(() => console.log("Database initialized"))
    .catch(e => {
      console.error(`Error while initializing database; ${e}`);
      throw e
    })
  }

  query(provided_args) {
    let {offset, size, sort, filter} = {...DEFAULT_QUESTIONS_QUERY_ARGS, ...provided_args};
    offset = parseInt(offset);
    size = parseInt(size);
    const filtered = Array.from(this.data.values())
    .filter(datum => Object.entries(filter).every(([k, v]) => alike(datum[k], v))); // TODO protect against bad filters
    return _.orderBy(
      filtered.slice(offset || 0, size ? Math.min(size + offset, filtered.length+1) : (filtered.length+1)),
      sort.key, // TODO protect against bad sorts
      sort.order
    )
  }

  get(id) {
    return this.data.get(id)
  }

  delete(id) {
    if (!this.data.has(id)) throw new Error("No such record")
    return this.data.delete(id)
  }

  create({question='', answer='', distractors}) {
    const new_record = {id: (this.nextId++), question, answer, distractors: distractors ? distractors : []} // ternary rather than default to avoid a mutable default argument
    Database.validateRecord(new_record)
    return this.data.set(new_record.id, new_record)
  }

  update(id, {question, answer, distractors}) {
    if (!this.data.has(id)) throw new Error("No such record")
    const updated = {...this.data.get(id)}

    if (distractors && distractors.every(Database.validateField)) updated.distractors = distractors
    if (Database.validateField(question)) updated.question = question
    if (Database.validateField(answer)) updated.answer = answer
    
    return this.data.set(id, updated)
  }
}

module.exports = csv_location => new Database(csv_location); // factory function to avoid exposing class