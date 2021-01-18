import { AxiosRequestConfig, AxiosResponse } from "axios";
declare type NextHook = (data: any) => void;
export interface Interceptor<C> {
    <T>(base: C): Promise<T> | Error | C;
    <T>(base: C, next: NextHook): Promise<T> | Error | C;
    <T>(base: C, next: NextHook, value: any): Promise<T> | Error | C;
}
export interface InterceptorProcessed<C> {
    interceptor: Interceptor<C>;
    nextHandler: never;
    nextErrorHandler: never;
}
export interface ManuallyInterceptor<C> {
    manually: boolean;
    interceptor<T>(queue: Array<Interceptor<C>>, next: NextHook): Promise<T> | Error | C;
}
export interface ManuallyInterceptorProcessed<C> extends ManuallyInterceptor<C> {
    queue: Array<Interceptor<C>>;
    nextHandler: never;
    nextErrorHandler: never;
}
export declare type ExtendInterceptorUnited<T> = Interceptor<T> | ManuallyInterceptor<T>;
export declare type ExtendInterceptor<T> = ExtendInterceptorUnited<T> | Array<ExtendInterceptorUnited<T>>;
export interface OuterInterceptorOptions<R> {
    beforeRequest?: ExtendInterceptor<AxiosRequestConfig>;
    afterResponse?: ExtendInterceptor<AxiosResponse<R>>;
    failHandler?: ExtendInterceptor<any>;
    errorHandler?: ExtendInterceptor<any>;
}
export interface RawInterceptorQueue {
    beforeRequest: Array<Interceptor<any> | ManuallyInterceptor<any>>;
    afterResponse: Array<Interceptor<any> | ManuallyInterceptor<any>>;
    failHandler: Array<Interceptor<any> | ManuallyInterceptor<any>>;
    errorHandler: Array<Interceptor<any> | ManuallyInterceptor<any>>;
}
export interface InnerInterceptorQueue {
    beforeRequest: Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>>;
    afterResponse: Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>>;
    failHandler: Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>>;
    errorHandler: Array<InterceptorProcessed<any> | ManuallyInterceptorProcessed<any>>;
}
export declare function extend(): RawInterceptorQueue;
export declare function extend(interceptorOption: OuterInterceptorOptions<any>): RawInterceptorQueue;
export declare function extend(extendInterceptors: RawInterceptorQueue, innerInterceptors: RawInterceptorQueue): RawInterceptorQueue;
export declare function extend(extendInterceptors: InnerInterceptorQueue, innerInterceptors: InnerInterceptorQueue): InnerInterceptorQueue;
export declare function preProcess(rawInterceptorQueue: RawInterceptorQueue): InnerInterceptorQueue;
export {};
