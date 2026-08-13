import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const h = vi.hoisted(() => ({
  request: [] as Array<(config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig>,
  response: [] as Array<
    (response: unknown) => unknown
  >,
  responseError: [] as Array<(error: unknown) => unknown>,
}));

vi.mock('axios', () => ({
  default: {
    create: () => ({
      interceptors: {
        request: { use: (fn: never) => h.request.push(fn) },
        response: {
          use: (fn: never, errFn: never) => {
            h.response.push(fn);
            h.responseError.push(errFn);
          },
        },
      },
    }),
  },
}));

import client from './client';

const requestHandler = h.request[0];
const responseHandler = h.response[0];
const responseErrorHandler = h.responseError[0];

describe('shared/api/client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates an axios instance', () => {
    expect(client).toBeDefined();
  });

  describe('request interceptor', () => {
    it('adds a Bearer token when one is stored', () => {
      localStorage.setItem('mtto_token', 'my-token');
      const config: InternalAxiosRequestConfig = { headers: {} as never } as InternalAxiosRequestConfig;
      const result = requestHandler(config);
      expect(result.headers.Authorization).toBe('Bearer my-token');
    });

    it('leaves the request untouched when no token is stored', () => {
      const config: InternalAxiosRequestConfig = { headers: {} as never } as InternalAxiosRequestConfig;
      const result = requestHandler(config);
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor', () => {
    it('passes successful responses through', () => {
      const response = { data: {} };
      expect(responseHandler(response)).toBe(response);
    });

    it('clears the session and redirects to /login on 401', () => {
      const locationStub = { href: 'http://localhost/dashboard' };
      Object.defineProperty(window, 'location', {
        value: locationStub,
        writable: true,
      });
      localStorage.setItem('mtto_token', 'expired');

      const result = responseErrorHandler({
        response: { status: 401 },
      } as AxiosError);

      expect(localStorage.getItem('mtto_token')).toBeNull();
      expect(locationStub.href).toBe('/login');
      return expect(result).rejects.toBeTruthy();
    });

    it('rejects errors that are not 401 without redirecting', () => {
      const error = { response: { status: 500 } } as AxiosError;
      return expect(responseErrorHandler(error)).rejects.toBe(error);
    });
  });
});
