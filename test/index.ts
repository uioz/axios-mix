import Axios from "axios";
import AxiosMix from "../src/index";
import MockAdapter from "axios-mock-adapter";

const axios = AxiosMix(Axios);
const mock = new MockAdapter(axios);

mock.onGet("/users").reply(200, {
  users: [{ id: 1, name: "John Smith" }],
});

Axios.get("/users").then(function (response) {
  console.log(response.data);
});

Axios("/users").then(function (response) {
  console.log(response.data);
});
