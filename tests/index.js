/**********************************************************************
 *
 *  Just-JSON - small json-driven flat database
 *  inspired by diskdb (https://github.com/arvindr21/diskDB/)
 *  & flat-db (https://github.com/ndaidong/flat-db)
 *
 *  (c) 2016, justpromotion.ru
 *
 *  @author Ruslan Konev
 *  https://github.com/ruslankonev/just-json
 *
 ********************************************************************/
'use strict';

const DB = require('../dist/db2')

DB.configure({
    path: 'stores/db',
    schema: __dirname + '/_schemas.json'
});


// add collection
var Movie = DB.select('tosters');

console.log('\n\nDB :',DB);


// add item into "Movie" collection
let key = Movie.add({
    type: 'movie',
    title: 'The Godfather',
    director: 'Francis Ford Coppola',
    writer: 'Mario Puzo',
    imdb: 9.2
});

console.log('\n\n',key);
// this key is the unique ID of item
// you can use it to get item
// for example

let mov = Movie.get(key);
console.log('\n\n',mov); // output movie info

// you can also remove the above movie with key
// Movie.remove(key);
mov = Movie.get(key);
console.log('\n\n',mov); // null

console.log('\n\nCount is',Movie.count());

Movie.find()
    .matches('title', /he/i)
    .matches('type', /movie/i)
    .paginate(2)
    .run()
    .then( results => {
        console.log('\n\nfind results', results);
    });
