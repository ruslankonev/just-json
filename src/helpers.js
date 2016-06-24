/**
 *
 *  Just-Json helpers module
 *
 */
'use strict';

/**
 *  Dependencies
 */
const fs = require('fs');
const _ = require('lodash');
const winston = require('winston');


/**
 *  Module exports
 */
module.exports = function (config) {

    /**
     *  Functions
     */
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
        let month = (d.getMonth() + 1 < 10) ? d.getMonth() + 1 : '0' + (d.getMonth() + 1);
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
        if (config.dateBased === true) {
            // Проверяем создана ли директория
            !isValidPath(config._modelsPath + getToday()) && fs.mkdirSync(config._modelsPath + getToday());
            // Присваиваем новый путь переменной
            checkModel = config._modelsPath + getToday() + '/' + key + '.json';
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
    function readData(file) {
        if (!isValidPath(file) && config.dateBased === true) {
            if (!isValidPath(config._modelsPath + getToday())) {
                fs.mkdirSync(config._modelsPath + getToday());
            }
        }
        try {
            return JSON.parse(readFromFile(file));
        } catch (err) {
            winston.info('ERROR:', err);
        }
    };


    return {
        objectLowercase: objectLowercase,
        isValidPath: isValidPath,
        getToday: getToday,
        removeFile: removeFile,
        modelDateBased: modelDateBased,
        writeToFile: writeToFile,
        readFromFile: readFromFile,
        readData: readData,
    }
}
