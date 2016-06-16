/*******************************************************
 *
 *  Just-JSON helper functions
 *
 ******************************************************/
'use strict';

/*******************************************************
 *
 *  Dependencies
 *
 *****************************************************/
const fs = require('fs');
const _ = require('lodash');


/*******************************************************
 *
 *  Functions
 *
 *****************************************************/
module.exports = function() {

    /**
     *  Object lowercase
     ********************************************/
    function objectLowercase(obj, caller) {
        _.forEach(obj, function(key, n) {
            if (_.isObject(key)) {
                key = objectLowercase(key);
            } else {
                if (_.isString(key)) {
                    key = key.toLowerCase();
                }
            }
            obj[n] = key;
        });
        return obj;
    };

    /**
     *  Path validating
     ********************************************/
    function isValidPath(path) {
        try {
            fs.accessSync(path, fs.F_OK);
            return true;
        } catch (e) {
            return false;
        }
    };

    /**
     *  Get current date
     ********************************************/
    function getToday() {
        let d = new Date();
        let month = (d.getMonth() + 1 < 10)
            ? d.getMonth() + 1
            : '0' + (d.getMonth() + 1);
        return d.getDate() + '.' + month + '.' + d.getFullYear();
    };

    /**
     * Delete file
     ********************************************/
    function removeFile(file) {
        return fs.unlinkSync(file);
    };

    /**
     *  Make path to json-file is date-based
     ********************************************/
    function modelDateBased(checkModel, key) {
        if (Opts.dateBased === true) {
            // Проверяем создана ли директория
            !isValidPath(__modelsPath + getToday()) && fs.mkdirSync(__modelsPath + getToday());
            // Присваиваем новый путь переменной
            checkModel = __modelsPath + getToday() + '/' + key + '.json';
        }
        return checkModel;
    };

    /**
     *  Writing data to file
     ********************************************/
    function writeToFile(outputFilename, content) {
        if (!content) {
            content = [];
        }
        fs.writeFileSync(outputFilename, JSON.stringify(content, null, 0));
    };

    /**
     *  Reading from file
     ********************************************/
    function readFromFile(file) {
        winston.info('read from file', file);
        return fs.readFileSync(file, 'utf-8');
    };

    /**
     *  Read function
     ********************************************/
    function readData(_f) {
        if (!isValidPath(_f) && Opts.dateBased === true) {
            if (!isValidPath(__modelsPath + getToday())) {
                fs.mkdirSync(__modelsPath + getToday());
            }
        }
        try {
            return JSON.parse(readFromFile(_f));
        } catch (err) {
            winston.info('ERROR:', err);
        }
    };


    /**************************************************
     *
     *  Module Exports
     *
     *************************************************/
    return {
        listModels: _listModels,
        listModel: _listModel,
        new: _new,
        show: _show,
        create: _create,
        edit: _edit,
        update: _update,
    };
}