import { AxiosRequestConfig, AxiosResponse } from "axios";
import { isManually } from "./executor";

type NextHook = (data: any) => void;

export interface Interceptor<C> {
  <T>(base: C): Promise<T> | Error | C;
  <T>(base: C, next: NextHook): Promise<T> | Error | C;
  <T>(base: C, next: NextHook, value: any): Promise<T> | Error | C;
}

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
    queue: Array<Interceptor<C>>,
    next: NextHook
  ): Promise<T> | Error | C;
}

/**
 * 经过处理后的手动拦截器
 * 泛型 C 表示首个参数的类型
 */
export interface ManuallyInterceptorProcessed<C> {
  /**
   * 泛型 T 表示 Promise 返回的内容
   */
  manually: boolean;
  queue: Array<Interceptor<C>>;
  interceptor<T>(
    queue: Array<Interceptor<C>>,
    next: NextHook
  ): Promise<T> | Error | C;
}

export type ExtendInterceptorUnited<T> =
  | Interceptor<T>
  | ManuallyInterceptor<T>;

/**
 * 该类型描述了拦截器的可赋值类型
 * T 泛型描述了拦截器首个参数
 */
export type ExtendInterceptor<T> =
  | ExtendInterceptorUnited<T>
  | Array<ExtendInterceptorUnited<T>>;

/**
 * 该接口描述了如何给定拦截器
 */
export interface ExtendInterceptorOptions<R> {
  beforeRequest?: ExtendInterceptor<AxiosRequestConfig>;
  afterResponse?: ExtendInterceptor<AxiosResponse<R>>;
  failHandler?: ExtendInterceptor<any>;
  errorHandler?: ExtendInterceptor<any>;
}

export type InnerInterceptorUnited =
  | Interceptor<any>
  | ManuallyInterceptorProcessed<any>;

/**
 * 该接口描述了保存在 axios-mix 内部队列的类型
 */
export interface InnerInterceptorQueue {
  beforeRequest: Array<InnerInterceptorUnited>;
  afterResponse: Array<InnerInterceptorUnited>;
  failHandler: Array<InnerInterceptorUnited>;
  errorHandler: Array<InnerInterceptorUnited>;
}

/**
 * TODO: waiting test
 * 将内部队列和外部传入的队列进行合并然后创建一个新的队列
 * 如果只传入一个参数则外部拦截器和内部的空拦截器合并
 * 如果不传入参数则返回一个初始拦截器对象
 * **注意**: 该函数仅用于合并, 不会去处理那些非函数的特殊拦截器
 * @param extendInterceptors
 * @param innerInterceptors
 */
export function extend(
  extendInterceptors?: ExtendInterceptorOptions<any>,
  innerInterceptors?: InnerInterceptorQueue
) {
  const data: InnerInterceptorQueue = {
    beforeRequest: [],
    afterResponse: [],
    failHandler: [],
    errorHandler: [],
  };

  if (extendInterceptors) {
    innerInterceptors = innerInterceptors ?? data;

    for (const key of Object.keys(innerInterceptors) as Array<
      keyof InnerInterceptorQueue
    >) {
      if (extendInterceptors[key]) {
        // @ts-ignore
        data[key] = innerInterceptors[key].concat(extendInterceptors[key]);
      }
    }
  }

  return data;
}

/**
 * TODO: waiting test
 * 将特殊的非函数拦截器进行预处理
 * @param extendInterceptors
 * @param innerInterceptors
 */
export function preProcess(innerInterceptorQueue: InnerInterceptorQueue) {
  for (const key of Object.keys(innerInterceptorQueue) as Array<
    keyof InnerInterceptorQueue
  >) {
    const queue = innerInterceptorQueue[key];

    let len = queue.length;
    let manuallyInceptor: ManuallyInterceptorProcessed<any>;

    // [function(){},{manaually:true,interceptor:function(){}}]
    // =>
    // [{manaually:true,interceptor:function(){},queue:[function(){}]}]
    while (len--) {
      const item = queue[len];
      if (isManually(item)) {
        // 逆向迭代的过程中发现了新的手动拦截器
        // 则停止继续处理, 将刚才处理完成的单个手动拦截器
        // 替换掉所迭代过的整个范围中的所有元素
        // 然后退出迭代
        // @ts-ignore
        if (manuallyInceptor) {
          queue.splice(len + 1, queue.length, manuallyInceptor);
          break;
        }

        manuallyInceptor = {
          ...item,
          queue: [],
        };
        // @ts-ignore
      } else if (manuallyInceptor) {
        // @ts-ignore
        manuallyInceptor.queue.push(item);
      }
    }
  }

  return innerInterceptorQueue;
}
