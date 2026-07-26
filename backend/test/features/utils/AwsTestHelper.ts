export const buildRequest = (action: string, payload: object) => {
    const event = require('./lambda-request.json');
    event.action = action;
    event.payload = payload;
    return event;
};
