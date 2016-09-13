# just-json

## Usage

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
let App = {}

let dbUrl = __dirname + '/stores/_schemas.json'

let collections = require('just-json')({
    url: dbUrl
})

App.DB = collections;
App._schemas = collections._schema;

// ...then in code

let Currencies = App.DB.select('currencies')

Currencies.findOne({
    _id: req.params.id
})

Currencies.save(saveData)
Currencies.update({
    _id: req.params.id
}, saveData)

```