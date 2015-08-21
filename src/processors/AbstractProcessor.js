export default class AbstractProcessor {
    constructor(preprocessor) {
        this.preprocessor = preprocessor;
    }

    hasDefined(key) {
        return this.preprocessor.hasDefined(key);
    }

    getDefined(key) {
        return this.preprocessor.getDefined(key);
    }
}
