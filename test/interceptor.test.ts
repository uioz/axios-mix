import Axios from "axios";
import AxiosMix from "../src/index";
import MockAdapter from "axios-mock-adapter";

describe("前置拦截器", () => {
  const axios = AxiosMix(Axios.create());
  const TARGET_URL = "/users";

  test("axios.get with 单个同步拦截器", async () => {
    const params = { "X-TEST": "test" };
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL, { params }).reply(200);

    const response = await axios.get(TARGET_URL, {
      beforeRequest(config) {
        // rewrite headers
        config.params = params;

        return config;
      },
    });
    expect(response.config.params).toEqual(params);
  });

  test("axios.get with 多个同步拦截器", () => {
    const params = { "X-TEST": "test" };
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL, { params }).reply(200);

    const response = await axios.get(TARGET_URL,{
      beforeRequest:[
        ()=>{
          
        }
      ]
    })

  });

  test("拦截器返回 Promise.resolve", () => {});
  test("拦截器返回 Promise.reject", () => {});
  test("拦截器返回 new Error", () => {});
  test("拦截器抛出错误", () => {});
});
