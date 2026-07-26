export const getInputPayload = (input: string) => require(`./../input/${input}.json`);
export const getExpectedResponse = (response: string) => require(`./../output/${response}.json`);
export const getExpectedErrorResponse = (errorResponse: string) => require(`./../output/error/${errorResponse}.json`);
export const getMockData = (mock: string) => require(`./../mockData/${mock}.json`);

export interface IRequest {
    action: string;
    payload: object;
};

export const buildRequest = (action: string, payload: any) => {
    return {
        action: action,
        payload: payload.payload,
        path: payload.path || {}
    };
};
