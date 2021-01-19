import Axios, { AxiosRequestConfig } from "axios";
import AxiosMix from "../src/index";
import MockAdapter from "axios-mock-adapter";

let axios = AxiosMix(Axios);
const mock = new MockAdapter(axios);

mock.onGet("/users").reply(200, {
  users: [{ id: 1, name: "John Smith" }],
});

// 基本扩展 1
axios = axios.extend({
  beforeRequest: function con(config) {
    return config;
  },
});

// 基本扩展 2
// axios.extend({
//   beforeRequest: [
//     function one(config, next) {
//       return config;
//     },
//     function two(config, next, value) {
//       return config;
//     },
//   ],
// });

// extend 方法不支持手动拦截器 pass
// axios = axios.extend({
//   beforeRequest: [
//     {
//       manually: true,
//       interceptor(queue: any, config: AxiosRequestConfig) {
//         return config;
//       },
//     },
//   ],
// });

// 最后一个是手动拦截器 pass
// axios = axios.extend({
//   beforeRequest: [
//     function one(config: AxiosRequestConfig) {
//       return config;
//     },
//     function two(config: AxiosRequestConfig, next: NextHook) {
//       next(undefined);
//       return config;
//     },
//     {
//       manually: true,
//       interceptor(queue: any, config: AxiosRequestConfig) {
//         return config;
//       },
//     },
//   ],
// });

// 最后一个是手动拦截器(带参) pass
// axios = axios.extend({
//   beforeRequest: [
//     function one(config: AxiosRequestConfig) {
//       return config;
//     },
//     function two(config: AxiosRequestConfig, next: NextHook) {
//       next(undefined);
//       return config;
//     },
//     {
//       manually: true,
//       interceptor(queue, config, next, value) {
//         return config;
//       },
//     },
//   ],
// });

// 第一个是手动拦截器(带参) pass
// axios = axios.extend({
//   beforeRequest: [
//     {
//       manually: true,
//       interceptor(queue, config, next, value) {
//         return config;
//       },
//     },
//     function one(config: AxiosRequestConfig) {
//       return config;
//     },
//     function two(config: AxiosRequestConfig, next: NextHook) {
//       next(undefined);
//       return config;
//     },
//   ],
// });

// 分离两个手动拦截器(第二个带参) pass
// axios = axios.extend({
//   beforeRequest: [
//     function one(config: AxiosRequestConfig) {
//       return config;
//     },
//     {
//       manually: true,
//       interceptor(queue, config) {
//         return config;
//       },
//     },
//     function two(config, next) {
//       next(undefined);
//       return config;
//     },
//     {
//       manually: true,
//       interceptor(queue, config, next, value) {
//         return config;
//       },
//     },
//   ],
// });

// 连续两个手动拦截器(第二个带参) pass
// axios = axios.extend({
//   beforeRequest: [
//     function one(config: AxiosRequestConfig) {
//       return config;
//     },
//     {
//       manually: true,
//       interceptor(queue, config) {
//         return config;
//       },
//     },
//     {
//       manually: true,
//       interceptor(queue, config, next, value) {
//         return config;
//       },
//     },
//   ],
// });

// axios.interceptors.request.use(
//   function (config) {
//     debugger;
//     return config;
//   },
//   function (error) {
//     console.log("request error");
//     debugger;
//   }
// );

// axios.interceptors.response.use(
//   function (response) {
//     debugger;
//     return new Promise((resolve, reject) => setTimeout(reject, 1000));
//   },
//   function (error) {
//     debugger;
//     return Promise.resolve("hello world");
//   }
// );

// axios
//   .get("/users")
//   .then(function (response) {
//     debugger;
//     console.log(response.data);
//   })
//   .catch((error) => {
//     debugger;
//   });

axios.get("/users").then(function (response) {
  console.log(response.data);
});
