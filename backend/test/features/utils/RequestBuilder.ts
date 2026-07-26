export class RequestBuilder {

    private event: any;

    constructor() {
        this.event = require('./lambda-request.json');
    }

    addQueryParams(params: object): this {
        this.event.query = { ...params };
        return this;
    }

    addPayload(payload: object): this {
        this.event.body = { ...payload }
        return this;
    }

    addHeaders(headers: object): this {
        this.event.headers = { ...headers };
        return this;
    }

    build(): object {
        return this.event;
    }
}