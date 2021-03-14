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

  function executor(
    resolve: (value: unknown) => void,
    reject: (reason?: any) => void,
    currentInterceptor: currentInterceptor
  ) {
    if (!currentInterceptor) {
    } else if (isManually(currentInterceptor)) {
      switch (currentInterceptor.interceptor.length) {
        case ManuallyInterceptorType.IS_SYNC:
          const result = currentInterceptor.interceptor(
            currentInterceptor.queue,
            config
          );

          if (result === undefined) {
            // 如果没有返回任何内容, 则执行下一个拦截器
            executor(resolve, reject, currentInterceptor.nextHandler);
          } else {
            // 如果此处返回的是 Promise 无需判断其是 Promise.reject 还是 Promise.resolve
            // 如果是 Promise.resolve 则 Promise 的最终状态还会是 <rejected>
            resolve(result);
          }

        case ManuallyInterceptorType.IS_ASYNC:
        // TODO:
        case ManuallyInterceptorType.IS_ASYNC_CATCH:
          break;
      }
    } else {
    }
  }

  return new Promise((resolve, reject) =>
    executor(resolve, reject, innerInterceptorQueue.pop())
  );

  // for (let item of innerInterceptorQueue) {
  //   if (isManually(item)) {
  //   }

  //   // handle situation like {manaually:false,interceptor:function(){}}
  //   // @ts-ignore
  //   if (item.interceptor) {
  //     // @ts-ignore
  //     item = item.interceptor;
  //   }
  //   if (typeof item === "function") {
  //     switch (item.length) {
  //       case InterceptorType.IS_SYNC:
  //         try {
  //           const result = item(config);

  //           if (result) {
  //             return result;
  //           }

  //           return config;
  //         } catch (error) {
  //           error.config = config;
  //           throw error;
  //         }
  //       case InterceptorType.IS_ASYNC:
  //         break;
  //       case InterceptorType.IS_ASYNC_CATCH:
  //         break;
  //     }
  //   }
  // }

  // return config;
}
