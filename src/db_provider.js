/**
 * Just-JSON - small json-driven flat-files database system
 * based on diskdb (https://github.com/arvindr21/diskDB/)
 * (c) 2016, justpromotion.ru
 *
 * @author Ruslan Konev
 * https://github.com/ruslankonev/just-json
 *
 ********************************************************************/
'use strict';

const paginator = require('./paginator')();
const fs = require('fs');
const _ = require('lodash');
const uuid = require('node-uuid');
const winston = require('winston');

/**
 * Object instance
 ********************************************************************/
let _self = {
    // время кеша на процесс чтения данных из файла
    // чтобы небыло постоянного чтения файла из ФС
    cacheTime: 5,
    _schema: {
        url: '',
        content: {}
    },
    Models: []
};

let Opts = {
    dateBased: false,
    created_at: true,
    url: null,
};

/**
 * Путь к хранилищу данных из файла схемы
 ********************************************************************/
const __modelsPath = __appPath + '/stores/db/';



/**
 * Загрузка коллекций из файла схемы
 * @param  {array} collections содержание файла схемы
 * @return {object} target      получатель - this
 ********************************************************************/
var loadCollections = function (collections, target) {
    let items = [];
    target.timing = {};
    (Opts.dateBased === true) && winston.info('Use Date() based folder structure!');
    _.forEach(collections, function(item, key) {
        let checkModel = __modelsPath + key + '.json';
        // Если настройки дата-зависимые
        checkModel = modelDateBased(checkModel, key);
        // Если файла не существует — создаем пустой
        !isValidPath(checkModel) && writeToFile(checkModel);
        items[key] = require(checkModel);
        target.timing[key] = Date.now();
    });
    target.Models = items;
    return target;
};

/**
 * Обноление записей в коллекции
 ********************************************************************/
var updateFiltered = function(collection, query, data, multi) {
    // break 2 loops at once - multi : false
    loop: for (let i = collection.length - 1; i >= 0; i--) {
        let c = collection[i];
        for (let p in query) {
            if (p in c && c[p] == query[p]) {
                collection[i] = _.merge(c, data);
                if (!multi) {
                    break loop;
                }
            }
        }
    }
    return collection;
};

/**
 * Удаление записей из коллекции
 ********************************************************************/
var removeFiltered = function(collection, query, multi) {
    // break 2 loops at once -  multi : false
    loop: for (let i = collection.length - 1; i >= 0; i--) {
        let c = collection[i];
        for (let p in query) {
            if (p in c && c[p] == query[p]) {
                collection.splice(i, 1);
                if (!multi) {
                    break loop;
                }
            }
        }
    }
    return collection;
};

/**
 * Проверка на необходимость чтения данных из кеша
 ********************************************************************/
var checkCache = function (file, force) {
    let model = getModel(file);
    let modelTime = new Date(_self.timing[model]);
    modelTime.setMinutes(modelTime.getMinutes() + _self.cacheTime);
    if (Date.now() > modelTime.getTime() || force) {
        _self.timing[model] = Date.now();
        return readData(file);
    } else {
        return _self.Models[model];
    };
};

/**
 * Получение имени коллекции
 ********************************************************************/
var getModel = function(model) {
    if (Opts.dateBased == true) {
        return model
            .replace(__modelsPath, '')
            .replace('.json', '')
            .replace(getToday(), '')
            .replace('/', '');
    }
    return model
        .replace(__modelsPath, '')
        .replace('.json', '');
};

//  End of Helpers

/**
 * Соединение с коллекциями
 ********************************************************************/
var connect = function(schema) {
    Opts.url = schema + '.json';
    let _schema = {};
    if (isValidPath(schema + '.json')) {
        _schema.url = schema + '.json';
        _schema.content = require(_schema.url);

        _self._schema = _schema;
        if (_schema.content) {
            _self = loadCollections(_schema.content, _self);
        }
        return _self;
    } else {
        throw new Error(`The same model is already exist DB Path:
        [${Opts.url}]
        does not seem to be valid. Recheck the path and try again`);
    }
};

/******************************************************
 *
 *  Main object
 *
 *****************************************************/
var DB = function(opts) {

    _.merge(Opts, opts);

    Opts.url && connect(Opts.url);

    /**
     * Return methods
     * ------------------------------
     */
    return {

        _f: _self._f,

        _schema: _self._schema,

        connect: connect,

        /**
         * Динамичесское добавление моделей
         ********************************************************************/
        appendModel: function (name, fields, temporary) {
            if (_self.Models[name] != undefined) {
                throw new Error('The same model is already exist');
            } else {
                let checkModel = __modelsPath + ((temporary) ? 'tmp/' : '') + name + '.json';
                // Если настройки дата-зависимые
                checkModel = modelDateBased(checkModel, name);
                // Если файла не существует — создаем пустой
                !isValidPath(checkModel) && writeToFile(checkModel);
                _self.Models[name] = require(checkModel);
                _self.timing[name] = Date.now();
                _self._schema.content[name].fields = fields;
            }

            return this.select(name);
        },

        load: function(file) {
            _self._f = file;
            return _self;
        },

        select: function(model) {

            let _file = '';

            if (Opts.dateBased === true) {
                // console.log(this)
                // Если настройки дата-зависимые
                _file = __modelsPath + getToday() + '/' + model + '.json';
                // _file = modelDateBased(this._f, getModel(this._f));
                _file = modelDateBased(this._f, model);
            } else {
                _file = __modelsPath + model + '.json';
            }

            return {

                _f: _file,

                _schema: {
                    content: _self._schema.content[getModel(_file)]
                },

                /*********************************************************************
                 * Поиск запроса в объекте с lowercase'ом строковых значений в объекте
                 * поиска и запроса
                 ********************************************************************/
                search: function(query, one) {
                    let collection = checkCache(this._f);
                    let copyCollection = _.cloneDeep(collection);
                    objectLowercase(copyCollection);
                    if (!query) {
                        return collection;
                    } else {
                        let minifyQuery = query;
                        objectLowercase(minifyQuery);
                        let result = _.filter(copyCollection, minifyQuery);
                        if (JSON.stringify(result) !== JSON.stringify([])) {
                            let IDs = _.toArray(_.mapValues(result, '_id'));
                            let elements = _.filter(collection, function(item) {
                                return _.includes(IDs, item._id);
                            });

                            if (one) {
                                return elements[0];
                            } else {
                                return elements;
                            }
                        } else {
                            return [];
                        }

                    }
                },

                /*********************************************************************
                 * Получение всех данных из модели
                 ********************************************************************/
                read: function() {
                    return checkCache(this._f);
                },

                /*********************************************************************
                 * Чтение данных по ID из объекта
                 ********************************************************************/
                readById: function(id, key) {
                    let collection = checkCache(this._f);
                    key = key || '_id';
                    let resi = _.find(collection, {
                        // [key]: `"${id}"`
                        [key]: id
                    });
                    return resi;
                },

                /*********************************************************************
                 * Поиск данных по параметрам, чтение из файла,
                 * без указания параметров – вывод всех данных в коллекции
                 ********************************************************************/
                find: function(query) {
                    return this.search(query);
                },

                /*********************************************************************
                 * Поиск одной записи в коллекции, согласно запроса
                 ********************************************************************/
                findOne: function(query) {
                    return this.search(query, true);
                },

                /*********************************************************************
                 * Добавление записи в коллекцию
                 ********************************************************************/
                save: function(data) {
                    // Получаем текущую коллекцию
                    let collection = checkCache(this._f, true);
                    // Смотрим на ее модель — схему
                    let schema = _self._schema.content[getModel(this._f)].fields;

                    // если входные данные — МАССИВ
                    if (typeof data === 'object' && data.length) {
                        if (data.length === 1) {
                            if (data[0].length > 0) {
                                data = data[0];
                            }
                        }
                        Opts.created_at && !data['created_at'] && (data['created_at'] = new Date());
                        let retCollection = [];
                        for (let i = data.length - 1; i >= 0; i--) {
                            let d = data[i];
                            d._id = uuid.v4().replace(/-/g, '');
                            _self.Models[getModel(this._f)].push(d);
                            collection.push(d);
                            retCollection.push(d);
                        }
                        writeToFile(this._f, collection);
                        return retCollection;
                    } else if (typeof data === 'object' && _.size(data)) {
                        // если входные данные — Объект
                        _.forEach(schema, function(item) {
                            if (/|/i.test(item)) {
                                item = item.split(':')[0];
                            } else {
                                !data[item] && (data[item] = '');
                            }
                        });
                        data._id = uuid.v4().replace(/-/g, '');
                        Opts.created_at && !data.created_at && (data.created_at = new Date());
                        _self.Models[getModel(this._f)].push(data);
                        collection.push(data);
                        writeToFile(this._f, collection);
                        return data;
                    }

                    data._id = uuid.v4().replace(/-/g, '');
                    Opts.created_at && !data.created_at && (data.created_at = new Date());
                    collection.push(data);
                    writeToFile(this._f, collection);
                    return data;
                },

                /*********************************************************************
                 * Обновление записей в коллекции
                 *
                 * @param  {[type]} query   параметр выборки
                 * @param  {[type]} data    данные
                 * @param  {object} options {multi: false} - multiupdate - замена всех данных
                 ********************************************************************/
                update: function(query, data, options) {
                    // console.log('update query', query, data)
                    let ret = {},
                        collection = checkCache(this._f, true); // update

                    let records = _.find(collection, query);
                    // console.log('find records', records);
                    if (_.isObject(records) || _.isArray(records)) {
                        data.updated_at = new Date();
                        if (options && options.multi) {
                            collection = updateFiltered(collection, query, data, true);
                            ret.updated = records.length;
                            ret.inserted = 0;
                        } else {
                            collection = updateFiltered(collection, query, data, false);
                            // console.log('updated collection', collection);
                            ret.updated = 1;
                            ret.inserted = 0;
                        }
                    } else {
                        if (options && options.upsert) {
                            data._id = uuid.v4().replace(/-/g, '');
                            collection.push(data);
                            ret.updated = 0;
                            ret.inserted = 1;
                        } else {
                            ret.updated = 0;
                            ret.inserted = 0;
                        }
                    }
                    _self.Models[getModel(this._f)] = collection;
                    writeToFile(this._f, collection);
                    return ret;
                },

                /*********************************************************************
                 * Удаление записей из коллекции
                 * !!! Указание без параметров — приводит к удалению файла!!!
                 *
                 * @param  {[type]} query параметры выборки
                 * @param  {[type]} multi множественное удаление
                 ********************************************************************/
                remove: function(query, multi) {
                    if (query) {
                        let collection = checkCache(this._f, true);
                        if (typeof multi === 'undefined') {
                            multi = true;
                        }
                        try {
                            collection = removeFiltered(collection, query, multi);
                            _self.Models[getModel(this._f)] = collection;
                            writeToFile(this._f, collection);
                        } catch (err) {
                            return false;
                        }
                    } else {
                        removeFile(this._f);
                        delete _self.Models[getModel(this._f)];
                    }
                    return true;
                },

                /*********************************************************************
                 * Очистка БД
                 * Может использоваться при необходимости синчронизации с использованием
                 * вставки (метод save)
                 * Возможно потенциально опасна, сейчас используется только в дэве
                 * надо проверить, если надо как вести себя будет в реалтайме, для большого
                 * количества юзеров
                 ********************************************************************/
                empty: function(cb) {
                    _self.Models[getModel(this._f)] = [];
                    writeToFile(this._f);
                    cb();
                },

                /*********************************************************************
                 *  Получение первой записи исходя из заданной сортировки
                 *  Предустановленное значение 'asc'
                 ********************************************************************/
                first: function(order, query) {
                    !order && (order = 'asc');
                    let data = _.orderBy(this.search(query, true), 'created_at', order);
                    if (data[0]) {
                        return data[0];
                    }
                    return null;
                },

                /*********************************************************************
                 * Пагинация данных
                 * @param count   -   количество данных на страницу
                 * @param start   -   номер стартовой страницы
                 * @param filter  -   необходимая выборка по полям
                 *
                 * {
                 *     start: 1,
                 *     end: 4,
                 *     items: []
                 * }
                 ********************************************************************/
                paginate: function (count, filter, sort) {
                    let data;
                    if (filter) {
                        data = this.search(filter);
                    } else {
                        data = this.read();
                    }
                    if (sort) {
                        data = _.orderBy(data, 'created_at', sort);
                    }
                    let resp = paginator.paginate(count, data);
                    return resp;
                },

                /*********************************************************************
                 * Количество записей в коллекции
                 ********************************************************************/
                count: function() {
                    return (checkCache(this._f)).length;
                },

                /*********************************************************************
                 * Метод полной замены данных в файле и данных в памяти
                 * Использовать !КРАЙНЕ осторожно! - используется для синхронизации
                 * данных с сервером.
                 ********************************************************************/
                sync: function(data) {
                    let In = JSON.stringify(data);
                    let Has = JSON.stringify(checkCache(this._f));

                    if (In != Has) {
                        let model = getModel(this._f);
                        try {
                            writeToFile(this._f, data);
                            _self.Models[model] = data;
                            winston.info('Syncing', model, 'db');
                            return true;
                        } catch (err) {
                            return false;
                        }
                    } else {
                        return true;
                    }
                },

                /*********************************************************************
                 *  Импрот JSON-данных в выбранную модель.
                 *  полностью импортирует данные с добавлением внутреннего поля _id
                 ********************************************************************/
                importJSON: function (data) {
                    let schema = _self._schema.content[getModel(this._f)].fields;
                    // если входные данные — Объект
                    if (typeof data === 'object' && _.size(data)) {
                        // обходим данные и при необходимости расширяем нужными полями
                        _.forEach(data, function (content, index) {
                            _.forEach(schema, function (item) {
                                if (/|/i.test(item)) {
                                    item = item.split(':')[0];
                                } else {
                                    !data[index][item] && (data[index][item] = '');
                                }
                            });
                            data[index]._id = uuid.v4().replace(/-/g, '');
                            // проверяем на наличие полей created_at
                            Opts.created_at && !data[index].created_at && (data[index].created_at = new Date());
                        });
                        // пушим данные в память
                        _self.Models[getModel(this._f)].push(data);
                        // collection.push(content);
                        writeToFile(this._f, data);
                        return data;
                    }
                }
            };

        },

    };
};

module.exports = DB;
