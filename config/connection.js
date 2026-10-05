const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://127.0.0.1:27017');
const state = {
    db: null,
};

module.exports.connect = function (done) {
    const dbname = 'shopping';

    return client.connect()
        .then(() => {
            state.db = client.db(dbname);
            if (done) {
                done(null);
            }
            return state.db;
        }, (err) => {
            if (done) {
                done(err);
                return undefined;
            }
            throw err;
        });
};

module.exports.getDb = function () {
    if (!state.db) {
        throw new Error('Database is not connected. Call connect() first.');
    }
    return state.db;
};