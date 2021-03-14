import { AxiosMixRequestConfig } from "./index";
import { InterceptorProcessed, ManuallyInterceptorProcessed, ManuallyInterceptor } from "./interceptors";
export declare enum InterceptorType {
    IS_SYNC = 1,
    IS_ASYNC = 2,
    IS_ASYNC_CATCH = 3
}
export declare enum ManuallyInterceptorType {
    IS_SYNC = 2,
    IS_ASYNC = 3,
    IS_ASYNC_CATCH = 4
}
export declare const MAX_ARGS_OF_INTERCEPTOR = 3;
export declare const MIN_ARGS_OF_INTERCEPTOR = 1;
export declare function isManually(data: any): data is ManuallyInterceptor<any>;
export declare function beforeRequest(innerInterceptorQueue: Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>>, config: AxiosMixRequestConfig): Promise<unknown>;
