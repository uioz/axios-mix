import { AxiosInstance, AxiosPromise, AxiosRequestConfig, AxiosResponse } from "axios";
import { ExtendInterceptorOptions } from "./interceptors";
export declare type AxiosMixRequestConfig<R = any> = ExtendInterceptorOptions<R> & AxiosRequestConfig;
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
export interface ExtendAxiosInstance extends AxiosMixInstance {
    extend(interceptors: ExtendInterceptorOptions<any>): void;
    inject: any;
    eject: any;
}
export interface Options {
    cache?: any;
    retry?: any;
}
interface innerOption {
    id?: number;
    queue?: ExtendInterceptorOptions<any>;
}
declare function AxiosMix(axios: AxiosInstance, options?: Options & innerOption): ExtendAxiosInstance;
export default AxiosMix;
