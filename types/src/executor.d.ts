import { AxiosMixRequestConfig } from "./index";
import { InnerInterceptorUnited, ManuallyInterceptor } from "./interceptors";
export declare function isManually(data: any): data is ManuallyInterceptor<any>;
export declare function beforeRequest(innerInterceptorQueue: Array<InnerInterceptorUnited>, config: AxiosMixRequestConfig): AxiosMixRequestConfig<any>;
