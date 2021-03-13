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

  return config;
}
