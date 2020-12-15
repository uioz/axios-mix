import { AxiosRequestConfig, AxiosResponse } from "axios";
declare type NextHook = (data: any) => void;
export interface Interceptor<C> {
    <T>(base: C): Promise<T> | Error | C;
    <T>(base: C, next: NextHook): Promise<T> | Error | C;
    <T>(base: C, next: NextHook, value: any): Promise<T> | Error | C;
}
export interface ManuallyInterceptor<C> {
    manually: boolean;
    interceptor<T>(queue: Array<Interceptor<C>>, next: NextHook): Promise<T> | Error | C;
}
export interface ManuallyInterceptorProcessed<C> {
    manually: boolean;
    queue: Array<Interceptor<C>>;
    interceptor<T>(queue: Array<Interceptor<C>>, next: NextHook): Promise<T> | Error | C;
}
export declare type ExtendInterceptorUnited<T> = Interceptor<T> | ManuallyInterceptor<T>;
export declare type ExtendInterceptor<T> = ExtendInterceptorUnited<T> | Array<ExtendInterceptorUnited<T>>;
export interface ExtendInterceptorOptions<R> {
    beforeRequest?: ExtendInterceptor<AxiosRequestConfig>;
    afterResponse?: ExtendInterceptor<AxiosResponse<R>>;
    failHandler?: ExtendInterceptor<any>;
    errorHandler?: ExtendInterceptor<any>;
}
export declare type InnerInterceptorUnited = Interceptor<any> | ManuallyInterceptorProcessed<any>;
export interface InnerInterceptorQueue {
    beforeRequest: Array<InnerInterceptorUnited>;
    afterResponse: Array<InnerInterceptorUnited>;
    failHandler: Array<InnerInterceptorUnited>;
    errorHandler: Array<InnerInterceptorUnited>;
}
export declare function extend(extendInterceptors?: ExtendInterceptorOptions<any>, innerInterceptors?: InnerInterceptorQueue): InnerInterceptorQueue;
export declare function preProcess(innerInterceptorQueue: InnerInterceptorQueue): InnerInterceptorQueue;
export {};
