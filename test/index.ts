import Axios from "axios";
import AxiosMix from "../src/index";
import MockAdapter from "axios-mock-adapter";

const axios = AxiosMix(Axios);
const mock = new MockAdapter(axios);

mock.onGet("/users").reply(500, {
  users: [{ id: 1, name: "John Smith" }],
});

// axios.interceptors.request.use(
//   function (config) {
//     return config;
//   },
//   function (error) {
//     console.log("request error");
//     debugger;
//   }
// );

axios.interceptors.response.use(
  function (response) {
    debugger;
    return response;
  },
  function (error) {
    return Promise.resolve("hello world");
    debugger;
  }
);

axios.get("/users").then(function (response) {
  debugger;
  console.log(response.data);
});

// axios("/users").then(function (response) {
//   console.log(response.data);
// });
