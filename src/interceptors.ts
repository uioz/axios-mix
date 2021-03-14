import { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  isManually,
  MAX_ARGS_OF_INTERCEPTOR,
  MIN_ARGS_OF_INTERCEPTOR,
  InterceptorType,
  ManuallyInterceptorType,
} from "./executor";

export type NextHook = (data: any) => void;

export interface Interceptor<C> {
  <T>(base: C, next: NextHook, value: any): Promise<T> | Error | C;
}

/**
 * 经过处理后的拦截器定义
 */
export interface InterceptorProcessed<C> {
  interceptor: Interceptor<C>;
  nextHandler: InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>;
  nextErrorHandler:
    | InterceptorProcessed<any>
    | ManuallyInterceptorProcessed<any>;
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
    queue: Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>>,
    base: C,
    next?: NextHook,
    value?: any
  ): Promise<T> | Error | C;
}

/**
 * 经过处理后的手动拦截器
 * 泛型 C 表示首个参数的类型
 */
export interface ManuallyInterceptorProcessed<C>
  extends ManuallyInterceptor<C> {
  queue: Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>>;
  nextHandler: InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>;
  nextErrorHandler:
    | InterceptorProcessed<any>
    | ManuallyInterceptorProcessed<any>;
}

/**
 * 该类型描述了拦截器的可赋值类型
 * T 泛型描述了拦截器首个参数
 */
export type ExtendInterceptor<T> =
  | Interceptor<T>
  | ManuallyInterceptor<T>
  | Array<Interceptor<T> | ManuallyInterceptor<T>>;

/**
 * 该接口描述了 axios-mix 支持外部参数的对象格式
 */
export interface OuterInterceptorOptions<R> {
  beforeRequest?: ExtendInterceptor<AxiosRequestConfig>;
  afterResponse?: ExtendInterceptor<AxiosResponse<R>>;
  localErrorHandler?: ExtendInterceptor<any>;
  errorHandler?: ExtendInterceptor<any>;
}

/**
 * 该接口描述了经过 extend 后转为统一队列的外部传入的参数
 */
export interface RawInterceptorObj {
  beforeRequest: Array<Interceptor<any> | ManuallyInterceptor<any>>;
  afterResponse: Array<Interceptor<any> | ManuallyInterceptor<any>>;
  localErrorHandler: Array<Interceptor<any> | ManuallyInterceptor<any>>;
  errorHandler: Array<Interceptor<any> | ManuallyInterceptor<any>>;
}

/**
 * 该接口描述了保存在 axios-mix 内部队列的类型.
 * 该对象上挂载的所有拦截器均经过编译处理.
 */
export interface InnerInterceptorObj {
  beforeRequest: Array<
    InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>
  >;
  afterResponse: Array<
    InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>
  >;
  localErrorHandler: Array<
    InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>
  >;
  errorHandler: Array<
    InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>
  >;
}

function check(item: Interceptor<any> | ManuallyInterceptor<any>) {
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
 * 调用后返回一个标准的拦截器对象
 */
export function formatter(): RawInterceptorObj;
/**
 * 将不规则的拦截器对象整理成标准的拦截器对象, 并对每一个拦截器进行检查是否符合格式
 * @param interceptorOption 不规则的拦截器对象
 */
export function formatter(
  interceptorOption: OuterInterceptorOptions<any>
): RawInterceptorObj;
/**
 * 将扩展源拦截器对象作为基础, 通过传入另一个拦截器对象创建一个新的拦截器对象.
 * 并对扩展的拦截器对象进行拦截器格式检查.
 * @param extendInterceptors 需要被扩展的拦截器对象
 * @param innerInterceptors 作为扩展源的拦截器对象
 */
export function formatter(
  extendInterceptors: RawInterceptorObj,
  innerInterceptors: RawInterceptorObj
): RawInterceptorObj;
/**
 * 将扩展源拦截器对象作为基础, 通过传入另一个拦截器对象创建一个新的拦截器对象.
 * 并对扩展的拦截器对象进行拦截器格式检查.
 * @param extendInterceptors 需要被扩展的拦截器对象
 * @param innerInterceptors 作为扩展源的拦截器对象
 */
export function formatter(
  extendInterceptors: InnerInterceptorObj,
  innerInterceptors: InnerInterceptorObj
): InnerInterceptorObj;
/**
 * TODO: waiting test
 * @param extendInterceptors 用于扩展的队列
 * @param innerInterceptors 被扩展的基础队列
 */
export function formatter(extendInterceptors?: any, innerInterceptors?: any) {
  const data = {
    beforeRequest: [],
    afterResponse: [],
    localErrorHandler: [],
    errorHandler: [],
  };

  if (extendInterceptors) {
    innerInterceptors = innerInterceptors ?? data;

    for (const key of Object.keys(innerInterceptors) as Array<
      keyof RawInterceptorObj
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
 * 将原始的队列在内部进行预编译处理, 转为统一的拦截器对象格式.
 * 该函数会修改原有队列.
 * @param interceptors 拦截器对象
 * @param handleManually 是否处理手动拦截器
 */
export function preCompile(
  interceptors: RawInterceptorObj,
  handleManually: boolean = false
): InnerInterceptorObj {
  for (const key of Object.keys(interceptors) as Array<
    keyof RawInterceptorObj
  >) {
    const queue = interceptors[key];

    let index = 0;
    let len = queue.length;

    if (len === 0) {
      continue;
    }

    let prevItem;
    let preErrorQueue = [];
    let preManuallyQueue = [];
    let manuallyInceptorCount = 0;

    while (index < len) {
      const IsManually = isManually(queue[index]);

      if (!handleManually && IsManually) {
        throw new Error("AxiosMix.extend doesn't handle Manually Interceptor!");
      }

      const item = (IsManually
        ? queue[index]
        : {
            interceptor: queue[index],
            nextHandler: undefined,
            nextErrorHandler: undefined,
          }) as InterceptorProcessed<any> & ManuallyInterceptorProcessed<any>;

      if (IsManually) {
        // 将 else 部分保存的元素移动到 queue 中
        item.queue = preManuallyQueue as any;
        // 将扫描过的内容替换为当前的元素
        // splice 的第二个参数最小值是 1 而 while 循环是从 0 开始的
        // 所以需要 + 1
        queue.splice(manuallyInceptorCount, index + 1, item);
        preManuallyQueue = [];
        // 由于数组本身被修改了, 所以重置 index 和 len
        // index 获取 manuallyInceptorCount 未自增前的值
        // 本次循环结束的 index++ 的值将会和 manuallyInceptorCount++ 相同
        // 这样做会让下次循环跳过队列中的手动拦截器(所有的拦截器都在队列靠前的位置)
        index = manuallyInceptorCount++;
        len = queue.length;
      } else {
        // 将当前项目放入手动拦截器队列中
        // 如果后面存在手动拦截器则将这个队列交由拦截器
        preManuallyQueue.push(item);
        // 对于非手动拦截器来说
        // 需要将队列中旧的元素与新创建的元素进行交换
        queue[index] = item;
      }

      // 如果有上次循环的元素
      // 则写入到当前元素的 handler 中
      if (prevItem) {
        prevItem.nextHandler = item;
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

      preErrorQueue.push(item);

      // 将之前的元素指向自己
      prevItem = item;

      index++;
    }
  }

  return interceptors as InnerInterceptorObj;
}

/**
 * 从给定的队列中找到第一个带参拦截器
 * @param nextQueue
 */
function searchInterceptorWithCatch(
  nextQueue: Array<
    InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>
  >
) {
  let outerIndex = 0,
    outerLen = nextQueue.length;
  while (outerIndex < outerLen) {
    const temp = nextQueue[outerIndex];

    if (isManually(temp)) {
      let innerIndex = 0,
        innerLen = temp.queue.length;

      // 如果手动拦截器的 queue 的长度为 0
      // 则判断手动拦截器本身是否带参拦截器
      if (innerLen === 0) {
        if (
          temp.interceptor.length === ManuallyInterceptorType.IS_ASYNC_CATCH
        ) {
          return temp;
        }
        outerIndex++;
        continue;
      }

      while (innerIndex < innerLen) {
        if (
          temp.queue[innerIndex].interceptor.length ===
          ManuallyInterceptorType.IS_ASYNC_CATCH
        ) {
          return temp.queue[innerIndex];
        }

        innerIndex++;
      }
    } else if (temp.interceptor.length === InterceptorType.IS_ASYNC_CATCH) {
      return temp;
    }

    outerIndex++;
  }
}

/**
 * 将给定的两个经过编译的队列合成为同一个队列.
 * 该函数不会修改原有队列.
 * @param prevQueue 要合并的首个队列
 * @param nextQueue 和合并的第二个队列
 */
export function joinCompiledInterceptorQueue(
  prevQueue: Array<
    InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>
  >,
  nextQueue: Array<
    InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>
  >
): Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>> {
  let prevQueueCopy;

  const firstInterceptorWithCatch = searchInterceptorWithCatch(nextQueue);

  if (firstInterceptorWithCatch) {
    let len = prevQueue.length,
      tempQueue = [];
    while (len--) {
      // 逆序查找没有 nextErrorHandler 的拦截器
      // 将这些拦截器 nextErrorHandler 指向下一个队列中的带参拦截器
      // 然后收集到一个临时数组中
      if (prevQueue[len].nextErrorHandler === undefined) {
        tempQueue.unshift({
          ...prevQueue[len],
          nextErrorHandler: firstInterceptorWithCatch,
        });
      } else {
        break;
      }
    }

    // 截取首个数组中未发生变化的部分
    // 在连接临时数组
    prevQueueCopy = prevQueue.slice(0, len).concat(tempQueue);
    // 重写最后一个数组元素的 nextHandler 的指向
    // 如果下一个队列首个元素是手动拦截器则从手动拦截器的 queue 从获取
    prevQueueCopy[prevQueueCopy.length - 1].nextHandler =
      isManually(nextQueue[0]) && nextQueue[0].queue.length
        ? nextQueue[0].queue[0]
        : nextQueue[0];
  } else {
    // 如果下一个队列中没有带参拦截器
    // 则首个队列去除最后一个元素与
    // 重写 nextHandler 的最后一个元素进行合并
    prevQueueCopy = prevQueue.slice(0, prevQueue.length - 1).concat({
      ...prevQueue[prevQueue.length - 1],
      nextHandler: nextQueue[0],
    });
  }

  // 如果下一个队列中首个元素是手动拦截器
  // 则重写下一个队列中的首个元素的 queue 属性
  if (isManually(nextQueue[0])) {
    const tempManually = {
      ...nextQueue.shift(),
    } as ManuallyInterceptorProcessed<any>;

    tempManually.queue = prevQueueCopy.concat(tempManually.queue);

    nextQueue.unshift(tempManually);
    // 如果下一个队列的首个拦截器是手动拦截器
    // 则说明上一个队列的所有元素被写入到了
    // 这个手动拦截器的 queue 参数中
    // 故此处直接返回下一个队列
    return nextQueue;
  }

  return prevQueueCopy.concat(nextQueue);
}
