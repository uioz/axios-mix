import Axios from "axios";
import AxiosMix from "../src/index";
import MockAdapter from "axios-mock-adapter";

const axios = AxiosMix(Axios);
const mock = new MockAdapter(axios);

mock.onGet("/users").reply(200, {
  users: [{ id: 1, name: "John Smith" }],
});

axios.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    console.log("request error");
    debugger;
  }
);

axios.interceptors.response.use(
  function (response) {
    debugger
    return response;
  },
  function (error) {
    console.log("response error");
    debugger;
  }
);

axios
  .get("/users")
  .then(function (response) {
    console.log(response.data);
  })
  .catch(() => {});

axios("/test").then(function (response) {
  console.log(response.data);
});
