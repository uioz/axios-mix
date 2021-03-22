import Axios from "axios";
import AxiosMix from "../src/index";
import MockAdapter from "axios-mock-adapter";

const TARGET_URL = "/users";

describe("axios.get with 前置同步拦截器", () => {
  test("单个拦截器", async () => {
    const axios = AxiosMix(Axios.create());
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

  test("拦截器 return 后中止后续拦截器执行", async () => {
    const params = { "X-TEST-ONE": "test" };
    const axios = AxiosMix(Axios.create());
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL, { params }).reply(200);

    const response = await axios.get(TARGET_URL, {
      beforeRequest: [
        (config) => {
          config.params = params;
          return config;
        },
        (config) => {
          // 这个函数不会被调用
          config.params["X-TEST-TWO"] = "test";
          return config;
        },
      ],
    });

    // 首个拦截器返回, 则后续拦截器不执行
    expect(response.config.params).toHaveProperty("X-TEST-ONE");
    expect(response.config.params).not.toHaveProperty("X-TEST-TWO");
  });

  test("不 return 情况下多个拦截器执行", async () => {
    const axios = AxiosMix(Axios.create());
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    await axios.get(TARGET_URL, {
      beforeRequest: [
        (config) => {
          expect(config).toEqual(expect.anything());
        },
        (config) => {
          expect(config).toEqual(expect.anything());
        },
      ],
    });
  });

  test("拦截器抛出错误和异常", async () => {
    const axios = AxiosMix(Axios.create());
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    try {
      await axios.get(TARGET_URL, {
        beforeRequest() {
          throw new Error("error");
        },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    try {
      await axios.get(TARGET_URL, {
        beforeRequest(config) {
          throw "error";
        },
      });
    } catch (error) {
      expect(error).toEqual("error");
    }
  });

  test("拦截器返回 Promise.resolve", async () => {
    const axios = AxiosMix(Axios.create());
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    const headers = {
      "X-TEST": "test",
    };

    const response = await axios.get(TARGET_URL, {
      beforeRequest(config) {
        return new Promise((resolve) => {
          config.headers = headers;
          resolve(config);
        });
      },
    });

    expect(response.config.headers).toEqual(headers);
  });

  test("拦截器返回 Promise.reject", async () => {
    const axios = AxiosMix(Axios.create());
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    const error = new Error("error");

    try {
      await axios.get(TARGET_URL, {
        beforeRequest(config) {
          return Promise.reject(error);
        },
      });
    } catch (error) {
      expect(error).toEqual(error);
    }
  });
});

describe("axios.get with 前置异步拦截器", () => {
  test("单个拦截器", async () => {
    const axios = AxiosMix(Axios.create());
    const params = { "X-TEST": "test" };
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL, { params }).reply(200);
  });
});
