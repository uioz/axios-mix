import { AxiosMixRequestConfig } from "./index";
import { InnerInterceptorUnited, ManuallyInterceptor } from "./interceptors";
export declare const MAX_ARGS_OF_INTERCEPTOR = 3;
export declare const MIN_ARGS_OF_INTERCEPTOR = 1;
export declare function isManually(data: any): data is ManuallyInterceptor<any>;
export declare function beforeRequest(innerInterceptorQueue: Array<InnerInterceptorUnited>, config: AxiosMixRequestConfig): AxiosMixRequestConfig<any>;
