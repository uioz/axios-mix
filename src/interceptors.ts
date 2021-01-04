import { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  isManually,
  MAX_ARGS_OF_INTERCEPTOR,
  MIN_ARGS_OF_INTERCEPTOR,
  InterceptorType,
  ManuallyInterceptorType,
} from "./executor";

type NextHook = (data: any) => void;

export interface Interceptor<C> {
  <T>(base: C): Promise<T> | Error | C;
  <T>(base: C, next: NextHook): Promise<T> | Error | C;
  <T>(base: C, next: NextHook, value: any): Promise<T> | Error | C;
}

/**
 * 经过处理后的拦截器定义
 */
export interface InterceptorProcessed<C> {
  interceptor: Interceptor<C>;
  nextHandler: never;
  nextErrorHandler: never;
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
export interface ManuallyInterceptorProcessed<C>
  extends ManuallyInterceptor<C> {
  queue: Array<Interceptor<C>>;
  nextHandler: never;
  nextErrorHandler: never;
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
 * 该接口描述了 axios-mix 支持外部参数的对象格式
 */
export interface OuterInterceptorOptions<R> {
  beforeRequest?: ExtendInterceptor<AxiosRequestConfig>;
  afterResponse?: ExtendInterceptor<AxiosResponse<R>>;
  failHandler?: ExtendInterceptor<any>;
  errorHandler?: ExtendInterceptor<any>;
}

/**
 * 该接口描述了经过 extend 后转为统一队列的外部传入的参数
 */
export interface OuterInterceptorQueue {
  beforeRequest: Array<Interceptor<any> | ManuallyInterceptor<any>>;
  afterResponse: Array<Interceptor<any> | ManuallyInterceptor<any>>;
  failHandler: Array<Interceptor<any> | ManuallyInterceptor<any>>;
  errorHandler: Array<Interceptor<any> | ManuallyInterceptor<any>>;
}

/**
 * 该接口描述了保存在 axios-mix 内部队列的类型
 */
export interface InnerInterceptorQueue {
  beforeRequest: Array<
    InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>
  >;
  afterResponse: Array<
    InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>
  >;
  failHandler: Array<
    InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>
  >;
  errorHandler: Array<
    InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>
  >;
}

function check(item: ExtendInterceptorUnited<any>) {
  function checkArgs(args: number) {
    if (args > MAX_ARGS_OF_INTERCEPTOR) {
      throw new Error(
        `The maximum arguments of interceptor is ${MAX_ARGS_OF_INTERCEPTOR} but got ${args}.`
      );
    } else if (args < MIN_ARGS_OF_INTERCEPTOR) {
      throw new Error(
        `The minimum arguments of interceptor is ${MIN_ARGS_OF_INTERCEPTOR} but got ${args}.`
      );
    }
  }

  if (typeof item === "function") {
    return checkArgs(item.length);
  } else if (isManually(item)) {
    // 手动拦截器比其他拦截多个一个参数
    return checkArgs(item.interceptor.length - 1);
    // @ts-ignore
  } else if (typeof item?.interceptor === "function") {
    // @ts-ignore
    return checkArgs(item.interceptor.length);
  } else {
    throw new Error("unknow interceptor type");
  }
}

/**
 * TODO: waiting test
 * 将内部队列和外部传入的队列进行合并然后创建一个新的队列
 * 如果只传入一个参数则外部拦截器和内部的空拦截器合并
 * 如果不传入参数则返回一个初始拦截器对象
 * **注意**: 该函数仅用于合并, 不会去处理那些非函数的特殊拦截器
 * @param extendInterceptors 用于扩展的队列
 * @param innerInterceptors 被扩展的基础队列
 */
export function extend(
  extendInterceptors?: OuterInterceptorOptions<any>,
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
      const queue = extendInterceptors[key];
      if (queue) {
        if (Array.isArray(queue)) {
          for (const item of queue) {
            check(item);
          }
        } else {
          check(queue);
        }

        // @ts-ignore
        data[key] = innerInterceptors[key].concat(extendInterceptors[key]);
      }
    }
  }

  return data;
}

/**
 * TODO: waiting test
 * 将特殊的非函数拦截器进行预处理.
 * @param extendInterceptors
 * @param innerInterceptors
 */
export function preProcess(innerInterceptorQueue: InnerInterceptorQueue) {
  for (const key of Object.keys(innerInterceptorQueue) as Array<
    keyof InnerInterceptorQueue
  >) {
    const queue = innerInterceptorQueue[key];

    let index = 0;
    let len = queue.length;

    let prevItem;
    let preErrorQueue = [];
    let preManuallyQueue = [];
    let manuallyInceptorCount = 0;

    while (index < len) {
      const IsManually = isManually(queue[index]);
      const item = IsManually
        ? queue[index]
        : {
            interceptor: queue[index],
            nextHandler: undefined,
            nextErrorHandler: undefined,
          };

      // 如果有上次循环的元素
      // 则写入到当前元素的 handler 中
      if (prevItem) {
        prevItem.nextHandler = item;
      }

      if (IsManually) {
        // 将 else 部分保存的元素移动到 queue 中
        item.queue = preManuallyQueue;
        // 将扫描过的内容替换为当前的元素
        queue.splice(manuallyInceptorCount, index, item);
        preManuallyQueue = [];
        // 由于数组本身被修改了, 所以重置 index 和 len

        // index 获取 manuallyInceptorCount 未自增前的值
        // 在随后的 index++ 中会变为 manuallyInceptorCount 自增后的值
        // 这样做将会跳过队列中已经存在的手动拦截器
        index = manuallyInceptorCount++;
        len = queue.length;
      } else {
        preManuallyQueue.push(item);
      }

      // 如果当前是错误拦截器
      // 则将之前存储的所有拦截器的引用指向自己
      if (
        IsManually
          ? ManuallyInterceptorType.IS_ASYNC_CATCH === item.interceptor.length
          : InterceptorType.IS_ASYNC_CATCH === item.interceptor.length
      ) {
        for (const prevItem of preErrorQueue) {
          prevItem.nextErrorHandler = item;
        }
        preErrorQueue = [];
      }
      //
      preErrorQueue.push(item);

      // 将之前的元素指向自己
      prevItem = item;

      index++;
    }
  }

  return innerInterceptorQueue;
}
