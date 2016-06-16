/**********************************************************************
 *
 *  Пагинатор данных
 *
 *  var list = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"];
 *
 *  var pages = paginate(2, list);
 *
 **********************************************************************/
 /* global App */
'use strict';

/**********************************************************************
 *
 *  Dependencies
 *
 **********************************************************************/

function take(n, list) {
    return list.slice(0, n);
}

function drop(n, list) {
    return list.slice(n);
}

function concat(lists) {
    return Array.prototype.concat.apply(this, lists);
}

function divide(n, list) {
    if (list && list.length) {
        var head = take(n, list);
        var tail = drop(n, list);
        return concat.call([head], [divide(n, tail)]);
    } else return [];
}

/**********************************************************************
 *
 *  Functional
 *
 **********************************************************************/
module.exports = function(params) {

    return {
        paginate: function(n, list) {
            return divide(n, list).map(function(items, index) {
                var number = n * index;

                return {
                    start: number + 1,
                    end: number + items.length,
                    items: items
                };
            });
        }
    };

};
