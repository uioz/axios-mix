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

/**
 * 该类型描述了拦截器的可赋值类型
 * T 泛型描述了拦截器首个参数
 */
export type Interceptor<T> =
  | SyncInterceptor<T>
  | AsyncInterceptor<T>
  | AsyncCatchInterceptor<T>
  | ManuallyInterceptor<T>
  | Array<
      | SyncInterceptor<T>
      | AsyncInterceptor<T>
      | AsyncCatchInterceptor<T>
      | ManuallyInterceptor<T>
    >;
