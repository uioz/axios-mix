import Axios from "axios";
import AxiosMix from "../src/index";
import MockAdapter from "axios-mock-adapter";

describe("基础实例化测试", () => {
  test("直接基于 axios 进行实例化", () => {
    AxiosMix(Axios);
  });

  test("基于 axios.create 返回的实例", () => {
    AxiosMix(Axios.create());
  });
});

describe("包装后是否影响原有 axios 表现", () => {
  test("200 响应", async () => {
    const axios = AxiosMix(Axios);
    const mock = new MockAdapter(axios);

    const responseData = {
        users: [{ id: 1, name: "John Smith" }],
      },
      params = {
        hello: "world",
      };

    mock.onGet("/users", { params }).reply(200, responseData);

    const result = await axios.get("/users", { params });

    expect(result.status).toEqual(200);
    expect(result.data).toEqual(responseData);
  });

  test("400 响应", async () => {
    const axios = AxiosMix(Axios);
    const mock = new MockAdapter(axios);

    mock.onGet("/users").reply(404);

    try {
      await axios.get("/users");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.response.status).toEqual(404);
    }
  });

  test("网络错误", async () => {
    const axios = AxiosMix(Axios);
    const mock = new MockAdapter(axios);

    mock.onGet("/users").networkError();

    try {
      await axios.get("/users");
    } catch (error) {
      expect(error).not.toHaveProperty("response");
      expect(error.message).toEqual("Network Error");
    }
  });
});
