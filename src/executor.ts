import { AxiosMixRequestConfig } from "./index";
import {
  InterceptorProcessed,
  ManuallyInterceptorProcessed,
  ManuallyInterceptor,
} from "./interceptors";

export enum InterceptorType {
  IS_SYNC = 1,
  IS_ASYNC = 2,
  IS_ASYNC_CATCH = 3,
}

export enum ManuallyInterceptorType {
  IS_SYNC = 2,
  IS_ASYNC = 3,
  IS_ASYNC_CATCH = 4,
}

export const MAX_ARGS_OF_INTERCEPTOR = 3;
export const MIN_ARGS_OF_INTERCEPTOR = 1;

export function isManually(data: any): data is ManuallyInterceptor<any> {
  if (data?.manually === true && typeof data.interceptor === "function") {
    return true;
  }

  return false;
}

export function beforeRequest(
  innerInterceptorQueue: Array<
    InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>
  >,
  config: AxiosMixRequestConfig
) {
  type currentInterceptor =
    | InterceptorProcessed<any>
    | ManuallyInterceptorProcessed<any>
    | undefined;

  /**
   *
   * @param resolve
   * @param reject
   * @param currentInterceptor
   * @param value 上个异步拦截器 next 钩子传入的参数
   * @returns
   */
  function executor(
    resolve: (value: unknown) => void,
    reject: (reason?: any) => void,
    currentInterceptor: currentInterceptor,
    value?: unknown
  ): void {
    let stopNext = false;

    /**
     * nextHandler only execute when have currentInterceptor
     * @returns
     */
    function nextHandler() {
      // 如果已经处理了返回值, 则无视钩子的调用
      if (stopNext) {
        return void 0;
      }

      // 如果没有返回内容则执行下个钩子
      if (value === undefined) {
        // @ts-ignore
        return executor(resolve, reject, currentInterceptor.nextHandler);
      }
      // 否则执行下个带参拦截器
      return executor(
        resolve,
        reject,
        // @ts-ignore
        currentInterceptor.nextErrorHandler,
        value
      );
    }

    // 如果查询到队列尾也没有拦截器
    if (currentInterceptor === undefined) {
      // 异步拦截器没有携带参数
      if (value === undefined) {
        return resolve(config);
      }

      // 且上个异步拦截器携带了参数
      return reject(value);
    } else if (isManually(currentInterceptor)) {
      switch (currentInterceptor.interceptor.length) {
        case ManuallyInterceptorType.IS_SYNC:
          try {
            const result = currentInterceptor.interceptor(
              currentInterceptor.queue,
              config
            );

            if (result === undefined) {
              // 如果没有返回任何内容, 则执行下一个拦截器
              return executor(resolve, reject, currentInterceptor.nextHandler);
            }
            // 如果此处返回的是 Promise 无需判断其是 Promise.reject 还是 Promise.resolve
            // 如果是 Promise.resolve 则 Promise 的最终状态还会是 <rejected>
            return resolve(result);
          } catch (error) {
            return reject(error);
          }
        case ManuallyInterceptorType.IS_ASYNC:
          try {
            const result: unknown = currentInterceptor.interceptor(
              currentInterceptor.queue,
              config,
              nextHandler
            );

            // 如果返回了内容则交由 axios 处理
            if (result !== undefined) {
              stopNext = true;
              return resolve(result);
            }
          } catch (error) {
            stopNext = true;
            return reject(error);
          }
          break;
        case ManuallyInterceptorType.IS_ASYNC_CATCH:
          try {
            const result: unknown = currentInterceptor.interceptor(
              currentInterceptor.queue,
              config,
              nextHandler,
              value
            );
            // 如果返回了内容则交由 axios 处理
            if (result !== undefined) {
              stopNext = true;
              return resolve(result);
            }
          } catch (error) {
            stopNext = true;
            return reject(error);
          }
          break;
      }
    } else {
      switch (currentInterceptor.interceptor.length) {
        case InterceptorType.IS_SYNC:
          try {
            const result = currentInterceptor.interceptor(config);

            if (result === undefined) {
              return executor(resolve, reject, currentInterceptor.nextHandler);
            }

            return resolve(result);
          } catch (error) {
            return reject(error);
          }
        case InterceptorType.IS_ASYNC:
          try {
            const result: unknown = currentInterceptor.interceptor(
              config,
              nextHandler
            );

            // 如果返回了内容则交由 axios 处理
            if (result !== undefined) {
              stopNext = true;
              return resolve(result);
            }
          } catch (error) {
            stopNext = true;
            return reject(error);
          }

          break;
        case InterceptorType.IS_ASYNC_CATCH:
          try {
            const result: unknown = currentInterceptor.interceptor(
              config,
              nextHandler,
              value
            );
            // 如果返回了内容则交由 axios 处理
            if (result !== undefined) {
              stopNext = true;
              return resolve(result);
            }
          } catch (error) {
            stopNext = true;
            return reject(error);
          }
          break;
      }
    }
  }

  return new Promise((resolve, reject) =>
    executor(resolve, reject, innerInterceptorQueue.pop())
  );
}
