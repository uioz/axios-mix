import {
  AxiosInstance,
  AxiosPromise,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

import * as executor from "./executor";

import {
  OuterInterceptorOptions,
  extend,
  InnerInterceptorQueue,
  preProcess,
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

function MarkIdOnConfig(config: any, id: number) {
  if (config) {
    config._id = id;
  } else {
    config = { _id: id };
  }
  return config;
}

function AxiosMix(axios: AxiosInstance, options?: Options) {
  interface innerOption {
    id: number;
    queue: InnerInterceptorQueue;
  }

  const interceptorsQueue: InnerInterceptorQueue =
    (options as innerOption)?.queue ?? extend();

  // 配置当前作用域的唯一 ID
  // 唯一 ID 是由外部传入的
  // 如果没有唯一 ID 则初始化为 1
  const id =
    typeof (options as innerOption)?.id === "number"
      ? (options as innerOption).id
      : 1;

  axios.interceptors.request.use(function (config: any) {
    // extend 作用域 id 和请求 id 不一致不拦截
    if (config._id !== id) {
      return config;
    }

    return executor.beforeRequest(interceptorsQueue.beforeRequest, config);
  });

  axios.interceptors.response.use(
    function (response: any) {
      // extend 作用域 id 和请求 id 不一致不拦截
      if (response.config._id !== id) {
        return response;
      }

      return response;
    },
    function (error: any) {
      // extend 作用域 id 和请求 id 不一致不拦截
      if (error.config._id !== id) {
        return error;
      }

      return error;
    }
  );

  return new Proxy<ExtendAxiosInstance>(axios as any, {
    get(target, key) {
      switch (key) {
        case "request":
          return function (config: any) {
            return target[key](MarkIdOnConfig(config, id));
          };
        case "get":
        case "delete":
        case "head":
        case "options":
          return function (url: any, config: any) {
            return target[key](url, MarkIdOnConfig(config, id));
          };
        case "post":
        case "put":
        case "patch":
          return function (url: any, data: any, config: any) {
            return target[key](url, data, MarkIdOnConfig(config, id));
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
              //    内外合并 预处理   统一外部格式
              queue: extend(preProcess(extend(interceptor)), interceptorsQueue),
              id: id + 1,
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
