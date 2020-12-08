import Axios from "axios";
import MockAdapter from "axios-mock-adapter";

const mock = new MockAdapter(Axios);

mock.onGet("/users").reply(200, {
  users: [{ id: 1, name: "John Smith" }],
});

Axios.get("/users").then(function (response) {
  console.log(response.data);
});
