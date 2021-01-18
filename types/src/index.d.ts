import { AxiosInstance, AxiosPromise, AxiosRequestConfig, AxiosResponse } from "axios";
import { OuterInterceptorOptions } from "./interceptors";
export declare type AxiosMixRequestConfig<R = any> = OuterInterceptorOptions<R> & AxiosRequestConfig;
export interface AxiosMixInstance extends AxiosInstance {
    (config: AxiosMixRequestConfig): AxiosPromise;
    (url: string, config?: AxiosMixRequestConfig): AxiosPromise;
    request<T = any, R = AxiosResponse<T>>(config: AxiosMixRequestConfig<R>): Promise<R>;
    get<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosMixRequestConfig<R>): Promise<R>;
    delete<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosMixRequestConfig<R>): Promise<R>;
    head<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosMixRequestConfig<R>): Promise<R>;
    options<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosMixRequestConfig<R>): Promise<R>;
    post<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosMixRequestConfig<R>): Promise<R>;
    put<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosMixRequestConfig<R>): Promise<R>;
    patch<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosMixRequestConfig<R>): Promise<R>;
}
export interface Options {
    cache?: any;
    retry?: any;
}
export interface ExtendAxiosInstance extends AxiosMixInstance {
    extend(interceptors: OuterInterceptorOptions<any>, options?: Options): ExtendAxiosInstance;
    inject: any;
    eject: any;
}
declare function AxiosMix(axios: AxiosInstance, options?: Options): ExtendAxiosInstance;
export default AxiosMix;
