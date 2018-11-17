class MongoError extends Error {
    constructor(func, user_id, db_error, ...params) {
        super(...params);
        this.func = func;
        this.user_id = user_id;
        this.message = db_error.message;
    }

    toString() {
        return `caller=${this.func} user_id=${this.user_id} error=${JSON.stringify(this.message)}`
    }
}

module.exports = MongoError;