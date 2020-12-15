import {
  AxiosInstance,
  AxiosPromise,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";



/**
 * 拦截器定义
 */
export interface AxiosMixRequestConfig extends AxiosRequestConfig {
  beforeRequest?: any;
  afterResponse?: any;
  failHandler?: any;
  errorHandler?: any;
}

/**
 * 利用新的拦截器定义重写 axios 方法定义
 */
export interface AxiosMixInstance extends AxiosInstance {
  (config: AxiosMixRequestConfig): AxiosPromise;
  (url: string, config?: AxiosMixRequestConfig): AxiosPromise;
  request<T = any, R = AxiosResponse<T>>(
    config: AxiosMixRequestConfig
  ): Promise<R>;
  get<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosMixRequestConfig
  ): Promise<R>;
  delete<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosMixRequestConfig
  ): Promise<R>;
  head<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosMixRequestConfig
  ): Promise<R>;
  options<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosMixRequestConfig
  ): Promise<R>;
  post<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosMixRequestConfig
  ): Promise<R>;
  put<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosMixRequestConfig
  ): Promise<R>;
  patch<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosMixRequestConfig
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
  cache: any;
  retry: any;
}

function AxiosMix(axios: AxiosInstance, options?: Options) {
  const interceptorsQueue = {
    request: [],
    get: [],
    delete: [],
    head: [],
    options: [],
    post: [],
    put: [],
    patch: [],
  };

  axios.interceptors.request.use(function (config: AxiosMixRequestConfig) {
    return config;
  });

  axios.interceptors.response.use(
    function (response) {
      return response;
    },
    function (error) {}
  );

  return new Proxy<ExtendAxiosInstance>(axios as any, {
    get(target, key) {
      if (isExtendedKeySet(key)) {
        switch (key) {
          case "extend":
            return function () {};
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
