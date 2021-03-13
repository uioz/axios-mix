import {
  AxiosInstance,
  AxiosPromise,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

import * as executor from "./executor";

import {
  OuterInterceptorOptions,
  formatter,
  InnerInterceptorObj,
  preCompile,
  joinCompiledInterceptorQueue,
} from "./interceptors";

export type AxiosMixRequestConfig<R = any> = OuterInterceptorOptions<R> &
  AxiosRequestConfig;

/**
 * 利用新的拦截器定义重写 axios 方法定义
 */
export interface AxiosMixInstance extends AxiosInstance {
  (config: AxiosMixRequestConfig): AxiosPromise;
  (url: string, config?: AxiosMixRequestConfig): AxiosPromise;
  request<T = any, R = AxiosResponse<T>>(
    config: AxiosMixRequestConfig<R>
  ): Promise<R>;
  get<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosMixRequestConfig<R>
  ): Promise<R>;
  delete<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosMixRequestConfig<R>
  ): Promise<R>;
  head<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosMixRequestConfig<R>
  ): Promise<R>;
  options<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosMixRequestConfig<R>
  ): Promise<R>;
  post<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosMixRequestConfig<R>
  ): Promise<R>;
  put<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosMixRequestConfig<R>
  ): Promise<R>;
  patch<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosMixRequestConfig<R>
  ): Promise<R>;
}

export interface Options {
  cache?: any;
  retry?: any;
}

/**
 * 实例方法扩展定义
 */
export interface ExtendAxiosInstance extends AxiosMixInstance {
  extend(
    interceptors: OuterInterceptorOptions<any>,
    options?: Options
  ): ExtendAxiosInstance;
  inject: any;
  eject: any;
}

function AxiosMix(axios: AxiosInstance, options?: Options) {
  interface innerOption {
    _extend?: boolean;
    queue: InnerInterceptorObj;
  }

  const interceptorsQueue: InnerInterceptorObj =
    (options as innerOption)?.queue ?? formatter();

  if (!(options as innerOption)?._extend) {
    axios.interceptors.request.use(function (config: any) {
      return config?._beforeRequestHandler(config) ?? config;
    });
    axios.interceptors.response.use(
      function (response: any) {
        return response?.config?._afterResponseHandler(response) ?? response;
      },
      function (error: any) {
        return error?.config?._errorHandler(error) ?? error;
      }
    );
  }

  function beforeRequestMixin(config: any, beforeRequest: any) {
    if (beforeRequest) {
      // 需要将外部传入的 Raw 进行预处理
      beforeRequest = preCompile(formatter({ beforeRequest }), true).beforeRequest;
    }

    config._beforeRequestHandler = function (config: any) {
      return executor.beforeRequest(
        beforeRequest
          ? joinCompiledInterceptorQueue(
              interceptorsQueue.beforeRequest,
              beforeRequest
            )
          : interceptorsQueue.beforeRequest,
        config
      );
    };
  }

  function afterResponseMixin(config: any, afterResponse: any) {
    config._afterResponseHandler = function (response: any) {
      return response;
    };
  }

  function errorMixin(config: any, localErrorHandler: any, errorHandler: any) {
    config._errorHandler = function (error: any) {
      return error;
    };
  }

  return new Proxy<ExtendAxiosInstance>(axios as any, {
    get(target, key) {
      switch (key) {
        case "request":
          return function ({
            beforeRequest,
            afterResponse,
            localErrorHandler,
            errorHandler,
            ...rest
          }: any = {}) {
            beforeRequestMixin(rest, beforeRequest);
            afterResponseMixin(rest, afterResponse);
            errorMixin(rest, localErrorHandler, errorHandler);
            return target[key](rest);
          };
        case "get":
        case "delete":
        case "head":
        case "options":
          return function (
            url: any,
            {
              beforeRequest,
              afterResponse,
              localErrorHandler,
              errorHandler,
              ...rest
            }: any = {}
          ) {
            beforeRequestMixin(rest, beforeRequest);
            afterResponseMixin(rest, afterResponse);
            errorMixin(rest, localErrorHandler, errorHandler);
            return target[key](url, rest);
          };
        case "post":
        case "put":
        case "patch":
          return function (
            url: any,
            data: any,
            {
              beforeRequest,
              afterResponse,
              localErrorHandler,
              errorHandler,
              ...rest
            }: any = {}
          ) {
            beforeRequestMixin(rest, beforeRequest);
            afterResponseMixin(rest, afterResponse);
            errorHandler(rest, localErrorHandler, errorHandler);
            return target[key](url, data, rest);
          };
        case "extend":
          return function (
            interceptor: OuterInterceptorOptions<any>,
            o?: Options
          ) {
            return AxiosMix(target, {
              ...options,
              ...o,
              // @ts-ignore
              queue: preCompile(formatter(interceptor, interceptorsQueue)),
              _extend: true,
            });
          };
        default:
          // @ts-ignore
          return target[key];
      }
    },
  });
}

export default AxiosMix;
