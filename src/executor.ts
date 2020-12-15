import { AxiosMixRequestConfig } from "./index";
import { InnerInterceptorUnited, ManuallyInterceptor } from "./interceptors";

enum InterceptorType {
  IS_SYNC = 1,
  IS_ASYNC = 2,
  IS_ASYNC_CATCH = 3,
}

export function isManually(data: any): data is ManuallyInterceptor<any> {
  if (data?.manually === true && typeof data.interceptor === "function") {
    return true;
  }

  return false;
}

export function beforeRequest(
  innerInterceptorQueue: Array<InnerInterceptorUnited>,
  config: AxiosMixRequestConfig
) {
  // for (let item of innerInterceptorQueue) {
  //   if (isManually(item)) {
  //   }
  //   // @ts-ignore
  //   if (item.interceptor) {
  //     // @ts-ignore
  //     item = item.interceptor;
  //   }
  //   if (typeof item === "function") {
  //     switch (item.length) {
  //       case InterceptorType.IS_ASYNC:
  //         break;
  //       case InterceptorType.IS_ASYNC:
  //         break;
  //       case InterceptorType.IS_ASYNC_CATCH:
  //         break;
  //       default:
  //         throw new Error(
  //           `The maximum arguments of interceptor is 3 but got ${item.length}.`
  //         );
  //     }
  //   } else {
  //     throw new Error("unknow interceptor");
  //   }
  // }

  return config;
}
