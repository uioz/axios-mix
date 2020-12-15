import Axios from "axios";
import AxiosMix from "../src/index";
import MockAdapter from "axios-mock-adapter";

const axios = AxiosMix(Axios);
const mock = new MockAdapter(axios);

mock.onGet("/users").reply(200, {
  users: [{ id: 1, name: "John Smith" }],
});

axios.interceptors.request
  .use
  // function (config) {
  //   debugger
  //   return config;
  // }
  // function (error) {
  //   console.log("request error");
  //   debugger;
  // }
  ();

axios.interceptors.response.use(
  function (response) {
    debugger;
    return new Promise((resolve, reject) => setTimeout(reject, 1000));
  },
  function (error) {
    debugger;
    return Promise.resolve("hello world");
  }
);

axios
  .get("/users")
  .then(function (response) {
    debugger;
    console.log(response.data);
  })
  .catch((error) => {
    debugger;
  });

// axios("/users").then(function (response) {
//   console.log(response.data);
// });
