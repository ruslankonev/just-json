# just-json

## Root object props & methods

```js
DB = {
    schemas: {
        // ...listing of schemas
    },
    config(opts) {
        // GET or SET database configs
        let opts = {
            path: 'stores/db',
            schema: './_schemas.json'
        }
    },
    select(collection, schema),
    removeCollection(name),
    emptyCollection(name),
    reset()
}
```

## Collection methods

* `add(item)` — add record to collection
* `save(item)` — alias for add method
* `get(id, fields)` — retrieve record from collection
* `update(id, data)` — update record with [id]
* `remove(id)` — remove record with [id]
* `sync(data)` — synchronize/replace data in current collection
* `count()` — get count of records in current collection
* `find()` — Promise-based method `.find().run().then()` with finder model. Search methods see bellow.

## Finder methods

* `equals(key, val)`
* `notEqual(key, val)`
* `gt(key, val)`
* `gte(key, val)`
* `lt(key, val)`
* `lte(key, val)`
* `matches(key, reg)`
* `paginate(count, sort)`
* `one()`
* `run()`


## Usage example

**_schemas.json**
```json
{
    "currencies": {
        "title": "Валюты",
        "fields": [
            "tag|text|Тег",
            "name|text|Название"
        ]
    },
    "currates": {
        "title": "Ставки валют",
        "fields": [
            "currency|select|Валюта",
            "rate|text|Ставка",
            "created_at|date|Дата"
        ],
        "dependencies": {
            "currency": "currencies:tag,name"
        }
    }
}
```

**app.js**
```js
const DB = require('just-json')

DB.configure({
    path: 'stores/db',
    schema: __dirname + '/_schemas.json'
});

// add collection
var Movie = DB.select('tosters');

// add item into "Movie" collection
let key = Movie.add({
    type: 'movie',
    title: 'The Godfather',
    director: 'Francis Ford Coppola',
    writer: 'Mario Puzo',
    imdb: 9.2
});


let mov = Movie.get(key);   // return value of [_id] field
console.log('\n\n', mov);
Movie.remove(key);  // remove item

mov = Movie.get(key);   // try to get again
console.log('\n\n', mov);    // return -> null

// add a record again
let key = Movie.add({
    type: 'movie',
    title: 'The Godfather',
    director: 'Francis Ford Coppola',
    writer: 'Mario Puzo',
    imdb: 9.2
});

console.log('\n\nCount is', Movie.count()); // -> 1

// test find method
Movie.find()
    .matches('title', /he/i)
    .matches('type', /movie/i)
    .paginate(2)
    .run()
    .then( results => {
        console.log('\n\nFind results', results);
    });
```
