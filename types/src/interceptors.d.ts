import { AxiosRequestConfig, AxiosResponse } from "axios";
export declare type NextHook = (data: any) => void;
export interface Interceptor<C> {
    <T>(base: C, next?: NextHook, value?: any): Promise<T> | C;
}
export interface InterceptorProcessed<C> {
    interceptor: Interceptor<C>;
    nextHandler: InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>;
    nextErrorHandler: InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>;
}
export interface ManuallyInterceptor<C> {
    manually: boolean;
    interceptor<T>(queue: Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>>, base: C, next?: NextHook, value?: any): Promise<T> | C;
}
export interface ManuallyInterceptorProcessed<C> extends ManuallyInterceptor<C> {
    queue: Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>>;
    nextHandler: InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>;
    nextErrorHandler: InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>;
}
export declare type ExtendInterceptor<T> = Interceptor<T> | ManuallyInterceptor<T> | Array<Interceptor<T> | ManuallyInterceptor<T>>;
export interface OuterInterceptorOptions<R> {
    beforeRequest?: ExtendInterceptor<AxiosRequestConfig>;
    afterResponse?: ExtendInterceptor<AxiosResponse<R>>;
    localErrorHandler?: ExtendInterceptor<any>;
    errorHandler?: ExtendInterceptor<any>;
}
export interface RawInterceptorObj {
    beforeRequest: Array<Interceptor<any> | ManuallyInterceptor<any>>;
    afterResponse: Array<Interceptor<any> | ManuallyInterceptor<any>>;
    localErrorHandler: Array<Interceptor<any> | ManuallyInterceptor<any>>;
    errorHandler: Array<Interceptor<any> | ManuallyInterceptor<any>>;
}
export interface InnerInterceptorObj {
    beforeRequest: Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>>;
    afterResponse: Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>>;
    localErrorHandler: Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>>;
    errorHandler: Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>>;
}
export declare function formatter(): RawInterceptorObj;
export declare function formatter(interceptorOption: OuterInterceptorOptions<any>): RawInterceptorObj;
export declare function formatter(extendInterceptors: RawInterceptorObj, innerInterceptors: RawInterceptorObj): RawInterceptorObj;
export declare function formatter(extendInterceptors: InnerInterceptorObj, innerInterceptors: InnerInterceptorObj): InnerInterceptorObj;
export declare function preCompile(interceptors: RawInterceptorObj, handleManually?: boolean): InnerInterceptorObj;
export declare function joinCompiledInterceptorQueue(prevQueue: Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>>, nextQueue: Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>>): Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>>;
