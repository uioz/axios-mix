import Axios from "axios";
import AxiosMix from "../src/index";
import MockAdapter from "axios-mock-adapter";

describe("axios.extend 与前置拦截器", () => {
  const TARGET_URL = "/users";

  test("同步拦截器", async () => {
    let FLAG_ONE = false;
    let FLAG_TWO = false;

    const axios = AxiosMix(Axios.create()).extend({
      beforeRequest(_config) {
        FLAG_ONE = true;
      },
    });

    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    await axios.get(TARGET_URL, {
      beforeRequest(config) {
        FLAG_TWO = true;
        return config;
      },
    });

    expect(FLAG_ONE).toEqual(true);
    expect(FLAG_TWO).toEqual(true);
  });

  test("extend 拦截器 return", async () => {
    let FLAG_ONE = false;
    let FLAG_TWO = false;

    const axios = AxiosMix(Axios.create()).extend({
      beforeRequest(config) {
        FLAG_ONE = true;
        return config;
      },
    });

    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    await axios.get(TARGET_URL, {
      beforeRequest(config) {
        FLAG_TWO = true;
        return config;
      },
    });

    expect(FLAG_ONE).toEqual(true);
    expect(FLAG_TWO).toEqual(false);
  });

  test("extend 拦截器 throw Error", async () => {
    let FLAG_ONE = false;

    const error = new Error();

    const axios = AxiosMix(Axios.create()).extend({
      beforeRequest(_config) {
        throw error;
      },
    });

    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    try {
      await axios.get(TARGET_URL, {
        beforeRequest(config) {
          return config;
        },
      });
      FLAG_ONE = true;
    } catch (e) {
      expect(FLAG_ONE).toEqual(false);
      expect(e).toStrictEqual(error);
    }
  });

  test("extend 拦截器 return Promise.resolve", async () => {
    const params = {
      "X-TEST": "test",
    };

    let FLAG_ONE = false;

    const axios = AxiosMix(Axios.create()).extend({
      beforeRequest(config) {
        return new Promise((resolve) => {
          config.params = params;

          resolve(config);
        });
      },
    });

    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    const response = await axios.get(TARGET_URL, {
      beforeRequest(config) {
        FLAG_ONE = true;
        return config;
      },
    });

    expect(response.config.params).toEqual(params);
    expect(FLAG_ONE).toEqual(false);
  });

  test("extend 拦截器 return Promise.reject", async () => {
    const error = new Error();

    let FLAG_ONE = false;

    const axios = AxiosMix(Axios.create()).extend({
      beforeRequest(_config) {
        return new Promise((_resolve, reject) => {
          reject(error);
        });
      },
    });

    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    try {
      await axios.get(TARGET_URL, {
        beforeRequest(config) {
          FLAG_ONE = true;
          return config;
        },
      });
      FLAG_ONE = true;
    } catch (e) {
      expect(FLAG_ONE).toEqual(false);
      expect(e).toStrictEqual(error);
    }
  });

  test("extend 和异步拦截器", async () => {
    let FLAG_ONE = false;
    let FLAG_TWO = false;

    const axios = AxiosMix(Axios.create()).extend({
      beforeRequest(_config, next) {
        FLAG_ONE = true;
        Promise.resolve().then(next);
      },
    });

    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    await axios.get(TARGET_URL, {
      beforeRequest(config) {
        FLAG_TWO = true;
        return config;
      },
    });

    expect(FLAG_ONE).toEqual(true);
    expect(FLAG_TWO).toEqual(true);
  });

  test("extend 和异步拦截器且携带参数有带参拦截器", async () => {
    let FLAG_ONE = false;

    const anyValue = "anyValue";

    const axios = AxiosMix(Axios.create()).extend({
      beforeRequest(_config, next) {
        Promise.resolve().then(() => {
          next(anyValue);
        });
      },
    });

    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    await axios.get(TARGET_URL, {
      beforeRequest(config, _next, value) {
        FLAG_ONE = true;

        expect(value).toEqual(anyValue);

        return config;
      },
    });

    expect(FLAG_ONE).toEqual(true);
  });

  test("extend 和异步拦截器且携带参数无带参拦截器", async () => {
    let FLAG_ONE = false;
    const anyValue = "anyValue";

    const axios = AxiosMix(Axios.create()).extend({
      beforeRequest(_config, next) {
        Promise.resolve().then(() => {
          next(anyValue);
        });
      },
    });

    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    try {
      await axios.get(TARGET_URL);
      FLAG_ONE = true;
    } catch (error) {
      expect(FLAG_ONE).toEqual(false);
      expect(error).toEqual(anyValue);
    }
  });

  test("extend 与多个同步拦截器", async () => {
    let FLAG_ONE = false;
    let FLAG_TWO = false;

    const axios = AxiosMix(Axios.create()).extend({
      beforeRequest: [
        (_config) => {
          FLAG_ONE = true;
        },
        (config) => {
          FLAG_TWO = true;
        },
      ],
    });

    const mock = new MockAdapter(axios);
    mock.onGet(TARGET_URL).reply(200);

    await axios.get(TARGET_URL);

    expect(FLAG_ONE).toEqual(true);
    expect(FLAG_TWO).toEqual(true);
  });
  // TODO: 尝试 多个拦截器与异步拦截器组合, 上述组合在和实例拦截器组合
});
