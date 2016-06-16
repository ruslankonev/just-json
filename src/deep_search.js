'use strict';

const _ = require('lodash');
var toStr = Object.prototype.toString;

function toString(type) {
    return toStr.call(type);
}

function isString(obj) {
    return typeof obj === 'string' || toString(obj) === "[object String]";
}

function isObject(obj) {
    return typeof obj === 'object' && toString(obj) === "[object Object]";
}

function isArray(obj) {
    return obj !== null && typeof obj === 'object' && typeof obj.length === 'number' && toString(obj) === '[object Array]';
}

/*
function isNumber(value) {
    return typeof value === 'number' || toString(value) === "[object Number]";
}

function isBoolean(obj) {
    return typeof obj === 'boolean' || toString(obj) === '[object Boolean]';
}
*/

/**
 * Мега-бомба конструкция - найдет все на любой глубине
 * поиск значений по строковому ключу в объекте
 * Не спотыкается об "массивы обектов" - рекурсия наше все =)
 * @param  {string} needle  то что ищем
 * @param  {object} obj     где ищем
 * @return [ values ]       массив значений
 */
var deepSearch = function(needle, obj) {
    var Results = [];

    function rollingObject(needle, obj) {
        _.forEach(Object.keys(obj), function(item, i) {
            if (item !== needle && isArray(obj[item]) || item !== needle && isObject(obj[item])) {
                rollingObject(needle, obj[item]);
            } else if (item === needle) {
                Results.push(obj[item]);
            };
        });
    }
    rollingObject(needle, obj);
    return Results;
};

module.exports = deepSearch;
