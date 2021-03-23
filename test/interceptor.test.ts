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
    const error = new Error("error");

    try {
      await axios.get(TARGET_URL, {
        beforeRequest(_config) {
          throw error;
        },
      });
    } catch (e) {
      expect(e).toStrictEqual(error);
    }

    try {
      await axios.get(TARGET_URL, {
        beforeRequest(config) {
          throw "error";
        },
      });
    } catch (e) {
      expect(e).toEqual("error");
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
    } catch (e) {
      expect(e).toStrictEqual(error);
    }
  });
});

describe("axios.get with 前置异步拦截器", () => {
  test("单个拦截器", async () => {
    const axios = AxiosMix(Axios.create());
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    const startTime = Date.now();
    const delay = 1000;

    await axios.get(TARGET_URL, {
      beforeRequest(_config, next) {
        setTimeout(next, delay);
      },
    });

    const endTime = Date.now();

    expect(endTime - startTime).toBeGreaterThanOrEqual(delay);
  });

  test("next 钩子传参且无错误处理拦截器", async () => {
    const axios = AxiosMix(Axios.create());
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    const anyValue = "anyvalue";

    try {
      await axios.get(TARGET_URL, {
        beforeRequest(_config, next) {
          next(anyValue);
        },
      });
    } catch (e) {
      expect(e).toEqual(anyValue);
    }
  });

  test("先 return 后调用 next 钩子", async () => {
    const axios = AxiosMix(Axios.create());
    const mock = new MockAdapter(axios);
    const responseBody = {
      timeStamp: Date.now(),
    };
    mock.onGet(TARGET_URL).reply(200, responseBody);

    const result = await axios.get(TARGET_URL, {
      beforeRequest(config, next) {
        Promise.resolve().then(() => {
          next("this will cuz an error if call successfully");
        });
        return config;
      },
    });

    expect(result.data).toEqual(responseBody);
  });

  test("先 return Promise.resolve 后调用 next 钩子", async () => {
    const axios = AxiosMix(Axios.create());
    const mock = new MockAdapter(axios);
    const params = { "X-TEST": "test" };
    mock.onGet(TARGET_URL, { params }).reply(200);

    const result = await axios.get(TARGET_URL, {
      beforeRequest(config, next) {
        Promise.resolve().then(() => {
          try {
            Object.defineProperty(config, "params", {
              value: { "X-TEST-ERROR": "error" },
              writable: false,
            });
          } catch (e) {
            // that will cuz error while redefine property with Object.defineProperty
            expect(e).toBeInstanceOf(Error);
          }

          next();
        });

        //that will call first down below
        Object.defineProperty(config, "params", {
          value: params,
          writable: false,
          configurable: false,
        });

        return Promise.resolve(config);
      },
    });

    expect(result.config.params).toEqual(params);
  });

  test("先 return Promise.reject 后调用 next 钩子", async () => {
    const axios = AxiosMix(Axios.create());
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    try {
      await axios.get(TARGET_URL, {
        beforeRequest(_config, next) {
          Promise.resolve().then(next);
          return Promise.reject("error");
        },
      });
    } catch (e) {
      expect(e).toEqual("error");
    }
  });

  test("先抛出错误后调用 next 钩子", async () => {
    const axios = AxiosMix(Axios.create());
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    const error = new Error("error");

    try {
      await axios.get(TARGET_URL, {
        beforeRequest(_config, next) {
          Promise.resolve().then(next);
          throw error;
        },
      });
    } catch (e) {
      expect(e).toStrictEqual(error);
    }
  });

  test("多个拦截器", async () => {
    const axios = AxiosMix(Axios.create());
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    const delay = 100;
    const startTime = Date.now();
    let count = 0;

    await axios.get(TARGET_URL, {
      beforeRequest: [
        (_config, next) => {
          count++;
          setTimeout(next, delay);
        },
        (_config, next) => {
          count++;
          setTimeout(next, delay);
        },
        (_config, next) => {
          count++;
          setTimeout(next, delay);
        },
      ],
    });

    const endTime = Date.now();

    expect(endTime - startTime).toBeGreaterThanOrEqual(delay * 3);
    expect(count).toEqual(3);
  });
});

describe("axios.get with 前置带参拦截器", () => {
  test("处理异步拦截器传入的参数", async () => {
    const axios = AxiosMix(Axios.create());
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    const anyValue = Symbol();

    await axios.get(TARGET_URL, {
      beforeRequest: [
        (_config, next) => {
          next(anyValue);
        },
        (_config, next, value) => {
          expect(value).toStrictEqual(anyValue);
          next();
        },
      ],
    });
  });

  test("跳过队列中非带参拦截器", async () => {
    const axios = AxiosMix(Axios.create());
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    const anyValue = Symbol();

    let CALL_ON_SECOND_FLAG: boolean = false;
    let CALL_ON_THIRD_FLAG: boolean = false;

    await axios.get(TARGET_URL, {
      beforeRequest: [
        (_config, next) => {
          next(anyValue);
        },
        (_config) => {
          CALL_ON_SECOND_FLAG = true;
        },
        (_config, next) => {
          CALL_ON_THIRD_FLAG = true;
          next();
        },
        (_config, next, value) => {
          expect(value).toStrictEqual(anyValue);
          next();
        },
      ],
    });

    expect(CALL_ON_SECOND_FLAG).toEqual(false);
    expect(CALL_ON_THIRD_FLAG).toEqual(false);
  });
});

describe("axios.get with 前置手动拦截器", () => {
  test("单个拦截器", async () => {
    const axios = AxiosMix(Axios.create());
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    await axios.get(TARGET_URL, {
      beforeRequest: {
        manually: true,
        interceptor(queue, config) {
          expect(queue).toHaveLength(0);
        },
      },
    });
  });

  test("抛出错误", async () => {
    const axios = AxiosMix(Axios.create());
    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    const error = new Error();

    try {
      await axios.get(TARGET_URL, {
        beforeRequest: {
          manually: true,
          interceptor(_queue, _config) {
            throw error;
          },
        },
      });
    } catch (e) {
      expect(e).toStrictEqual(error);
    }
  });
});
