import { FetchAdapter } from '../types/fetch-adapter.type';
import { MappersRegistry } from '../types/mapper.type';
import { RequestHandler } from '../types/request-handler.type';
import { ResponseHandler } from '../types/response-handler.type';
import { PathVariablesHandler } from './path-variables-handler.type';

export interface HttypedClientConfig {
  baseUrl: string;
  requestInit?: RequestInit;
  fetchAdapter?: FetchAdapter;
  requestHandlers?: RequestHandler[];
  responseHandler?: ResponseHandler[];
  responseBodyMappers?: MappersRegistry;
  requestBodyMappers?: MappersRegistry;
  pathVariablesHandler?: PathVariablesHandler;
}