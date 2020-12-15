import {
  AxiosInstance,
  AxiosPromise,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

import {
  ExtendInterceptorOptions,
  extend,
  InnerInterceptor,
} from "./interceptors";

export type AxiosMixRequestConfig<R = any> = ExtendInterceptorOptions<R> &
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

/**
 * 实例方法扩展定义
 */
export interface ExtendAxiosInstance extends AxiosMixInstance {
  extend: any;
  inject: any;
  eject: any;
}

type ProxyKeys =
  | "request"
  | "get"
  | "delete"
  | "head"
  | "options"
  | "post"
  | "put"
  | "patch";

// 重写方法签名
const ProxyKeySet = new Set<ProxyKeys>([
  "request",
  "get",
  "delete",
  "head",
  "options",
  "post",
  "put",
  "patch",
]);

type ExtendedKeys = "extend" | "inject" | "eject";

// 扩展方法签名
const ExtendedKeySet = new Set<ExtendedKeys>(["extend", "inject", "eject"]);

function isProxyKeySet(key: any): key is ProxyKeys {
  return ProxyKeySet.has(key);
}

function isExtendedKeySet(key: any): key is ExtendedKeys {
  return ExtendedKeySet.has(key);
}

export interface Options {
  cache?: any;
  retry?: any;
  queue?: ExtendInterceptorOptions<any>;
}

interface innerOption {
  id?: number;
}

function AxiosMix(axios: AxiosInstance, options?: Options & innerOption) {
  const interceptorsQueue: InnerInterceptor = extend(options?.queue);

  // 配置当前作用域的唯一 ID
  // 唯一 ID 是由外部传入的
  // 如果没有唯一 ID 则初始化为 1
  const id = typeof options?.id === "number" ? options.id : 1;

  // 只有首次创建的 AxiosMix 会创建拦截器
  // 而基于该 AxiosMix.extend 扩展的实例
  // 不会添加拦截器
  if (id === 1) {
    axios.interceptors.request.use(function (config: any) {
      if (config._id !== id) {
        return config;
      }

      return config;
    });

    axios.interceptors.response.use(
      function (response: any) {
        if (response.config._id !== id) {
          return response;
        }

        return response;
      },
      function (error: any) {
        if (error.config._id !== id) {
          return error;
        }

        return error;
      }
    );
  }

  return new Proxy<ExtendAxiosInstance>(axios as any, {
    get(target, key) {
      if (isProxyKeySet(key)) {
        switch (key) {
          case "request":
            return function (config: any) {
              if (config) {
                config._id = id;
              } else {
                config = { _id: id };
              }
              return target[key](config);
            };
          case "get":
          case "delete":
          case "head":
          case "options":
            return function (url: any, config: any) {
              if (config) {
                config._id = id;
              } else {
                config = { _id: id };
              }
              return target[key](url, config);
            };
          case "post":
          case "put":
          case "patch":
            return function (url: any, data: any, config: any) {
              if (config) {
                config._id = id;
              } else {
                config = { _id: id };
              }
              return target[key](url, data, config);
            };
        }
      } else if (isExtendedKeySet(key)) {
        switch (key) {
          case "extend":
            return function (
              interceptor: ExtendInterceptorOptions<any>,
              o: Options
            ) {
              return AxiosMix(target, {
                ...options,
                ...o,
                queue: interceptor,
                id: id + 1,
              });
            };
            // TODO: 取消掉 inject 和 eject
          case "inject":
            return function () {};
          case "eject":
            return function () {};
        }
      }

      // 透明代理
      // @ts-ignore
      return target[key];
    },
  });
}

export default AxiosMix;
