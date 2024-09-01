import nodeFetch from 'node-fetch';
import 'reflect-metadata';
import 'whatwg-fetch';

import { configureTesting } from '@aspectjs/common/testing';
import { abstract } from '@aspectjs/common/utils';
import { AspectError, getWeaver, WeaverModule } from '@aspectjs/core';
import { HttypedClientFactory } from '../client-factory/client.factory';
import { HttypedClientAspect } from '../public_api';
import { MapperContext, MappersRegistry } from '../types/mapper.type';
import { Body } from './body.annotation';
import { Post } from './fetch/post.annotation';
import { HttypedClient } from './http-client.annotation';

interface IHttpClientApi {
  method(...args: any[]): Promise<any>;
}

const TEST_BASE_URL = 'http://testBaseUrl';

describe('@Body() on a method parameter', () => {
  let fetchAdapter: typeof nodeFetch & jest.SpyInstance;
  let httypedClientFactory: HttypedClientFactory;
  let api: IHttpClientApi;
  let responseBodyMappers: MappersRegistry;
  let requestBodyMappers: MappersRegistry;
  let httypedClientAspect: HttypedClientAspect;
  beforeEach(() => {
    fetchAdapter = jest.fn((..._args: any[]) => {
      return Promise.resolve(new Response('{}') as any);
    });
    configureTesting(WeaverModule);
    responseBodyMappers = new MappersRegistry();
    requestBodyMappers = new MappersRegistry();

    httypedClientFactory = new HttypedClientFactory({
      baseUrl: TEST_BASE_URL,
      fetchAdapter: fetchAdapter,
      requestBodyMappers,
      responseBodyMappers,
    });

    @HttypedClient()
    abstract class HttpClientApi implements IHttpClientApi {
      @Post('/test')
      async method(@Body() body: string) {
        return abstract<object>();
      }
    }

    api = httypedClientFactory.create(HttpClientApi);
    httypedClientAspect = getWeaver().getAspects(HttypedClientAspect)[0]!;
  });

  describe('when the method is not annotated with a fetch annotation', () => {
    it('throws an error', () => {
      @HttypedClient()
      abstract class HttpClientApi implements IHttpClientApi {
        async method(@Body() arg?: string) {
          return abstract();
        }
      }
      expect(() =>
        httypedClientFactory.create(HttpClientApi).method(),
      ).toThrowError(
        new AspectError(
          httypedClientAspect,
          `method HttpClientApi.method is missing a fetch annotation`,
        ),
      );
    });
  });

  it('calls the http adapter with the provided body', async () => {
    expect(fetchAdapter).not.toBeCalled();
    await api.method('rest-body');

    expect(fetchAdapter).toBeCalledTimes(1);
    expect(fetchAdapter.mock.calls[0][1].body).toEqual('rest-body');
  });

  describe('when the aspect is given a mapper', () => {
    describe('that does not accept the given body', () => {
      beforeEach(() => {
        requestBodyMappers.add({
          accepts(obj, mapperContext) {
            return typeof obj === 'boolean';
          },
          map(body, mapperContext) {
            return false;
          },
        });
      });

      it('calls the http adapter with original body', async () => {
        expect(fetchAdapter).not.toBeCalled();
        await api.method('rest-body');

        expect(fetchAdapter).toBeCalledTimes(1);
        expect(fetchAdapter.mock.calls[0][1].body).toEqual('rest-body');
      });
    });
    describe('that accepts the given body', () => {
      const map = jest.fn();

      beforeEach(() => {
        requestBodyMappers.add({
          accepts(obj, mapperContext) {
            return typeof obj === 'string';
          },
          map(body: string, mapperContext) {
            map(body, mapperContext);
            return body.toUpperCase();
          },
        });
      });

      it('calls the http adapter with the mapped body', () => {
        expect(fetchAdapter).not.toBeCalled();
        api.method('rest-body');

        expect(fetchAdapter).toBeCalledTimes(1);
        expect(fetchAdapter.mock.calls[0][1].body).toEqual('REST-BODY');
      });

      it('calls the mapper with proper type hint', () => {
        api.method('rest-body');
        expect(map).toBeCalled();
        const mapperContext = map.mock.calls[0][1] as MapperContext;
        expect(mapperContext.typeHint).toEqual(String);
        expect(mapperContext.mappers).toEqual(expect.any(MappersRegistry));
      });
    });
  });
});