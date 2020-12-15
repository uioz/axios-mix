import { AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * 同步拦截器定义
 * 泛型 C 表示首个参数的类型
 */
export interface SyncInterceptor<C> {
  /**
   * 泛型 T 表示 Promise 返回的内容
   */
  <T>(base: C): Promise<T> | Error | C;
}

type NextHook = (data: any) => void;

/**
 * 异步拦截器定义
 * 泛型 C 表示首个参数的类型
 */
export interface AsyncInterceptor<C> {
  /**
   * 泛型 T 表示 Promise 返回的内容
   */
  <T>(base: C, next: NextHook): Promise<T> | Error | C;
}

/**
 * 参数拦截器
 * 泛型 C 表示首个参数的类型
 */
export interface AsyncCatchInterceptor<C> {
  /**
   * 泛型 T 表示 Promise 返回的内容
   */
  <T>(base: C, next: NextHook, value: any): Promise<T> | Error | C;
}

type Interceptors<T> =
  | SyncInterceptor<T>
  | AsyncInterceptor<T>
  | AsyncCatchInterceptor<T>;

/**
 * 手动拦截器
 * 泛型 C 表示首个参数的类型
 */
export interface ManuallyInterceptor<C> {
  /**
   * 泛型 T 表示 Promise 返回的内容
   */
  manually: boolean;
  interceptor<T>(
    queue: Array<Interceptors<C>>,
    next: NextHook
  ): Promise<T> | Error | C;
}

type UnitedInterceptor<T> =
  | SyncInterceptor<T>
  | AsyncInterceptor<T>
  | AsyncCatchInterceptor<T>
  | ManuallyInterceptor<T>;

/**
 * 该类型描述了拦截器的可赋值类型
 * T 泛型描述了拦截器首个参数
 */
export type Interceptor<T> = UnitedInterceptor<T> | Array<UnitedInterceptor<T>>;

export interface ExtendInterceptorOptions<R> {
  beforeRequest?: Interceptor<AxiosRequestConfig>;
  afterResponse?: Interceptor<AxiosResponse<R>>;
  failHandler?: Interceptor<any>;
  errorHandler?: Interceptor<any>;
}

export interface InnerInterceptor {
  beforeRequest: Array<UnitedInterceptor<any>>;
  afterResponse: Array<UnitedInterceptor<any>>;
  failHandler: Array<UnitedInterceptor<any>>;
  errorHandler: Array<UnitedInterceptor<any>>;
}

/**
 * 将内部队列和外部传入的队列进行合并然后创建一个新的队列
 * 如果只传入一个参数则外部拦截器和内部的空拦截器合并
 * 如果不传入参数则返回一个初始拦截器对象
 * @param extendInterceptor
 * @param innerInterceptor
 */
export function extend(
  extendInterceptor?: ExtendInterceptorOptions<any>,
  innerInterceptor?: InnerInterceptor
) {
  const data: InnerInterceptor = {
    beforeRequest: [],
    afterResponse: [],
    failHandler: [],
    errorHandler: [],
  };

  if (extendInterceptor) {
    innerInterceptor = innerInterceptor ?? data;

    for (const key of Object.keys(innerInterceptor) as Array<
      keyof InnerInterceptor
    >) {
      if (extendInterceptor[key]) {
        // @ts-ignore
        data[key] = innerInterceptor[key].concat(extendInterceptor[key]);
      }
    }
  }

  return data;
}
