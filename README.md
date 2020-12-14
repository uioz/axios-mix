# axios-mix

# peer

# rollup

# basic usage

```javascript
import AxiosMix from "axios-mix";
import axios from "axios";

const request = AxiosMix(Axios);
// or
const request = AxiosMix(axios.create());
```

# interceptors

拦截器分为四种:

| 名称          | 作用                                                                        |
| ------------- | --------------------------------------------------------------------------- |
| beforeRequest | 在请求前执行拦截                                                            |
| afterResponse | 在请求后执行拦截                                                            |
| failHandler   | 当请求失败后错误交由 failHandler 处理, 这个错误拦截会在 errorHandler 前执行 |
| errorHandler  | 当请求失败后错误交由 errorHandler 处理, 这个错误拦截会在 failHandler 后执行 |

## 为什么存在两个错误拦截?

通常我们对错误拦截有两种需求:

1. 在错误的时候做一些全局性质的修改, 例如弹出一个全局对话框
2. 在错误的时候重置一些状态, 服务端返回了 `404` 提示前端资源不存在, 前端决定在页面上禁用某些内容

如果只有一个错误拦截器, 如果我们编写了第一种类型的程序, 那么第二种类型的拦截就会非常棘手, 我们只能:

1. 在第一种拦截中编写大量的判断来决定是否执行全局逻辑
2. 屏蔽掉第一种所有的拦截器, 然后针对本次请求再编写一个全局错误拦截(如果你需要全局拦截的逻辑)

如果可以区分开全局副作用和局部副作用那么代码的复用就会简单许多:

- failHandler 中只允许编写局部副作用的代码
- errorHandler 中只允许编写全局副作用的代码

## 拦截器定义

拦截器的设计于 `express` 中的中间件类似, 不同类型的拦截器定义如下:

```javascript
function(config,next,value){
  next();
}
```

- config 由 `axios-mix` 实例传入的参数, 不同拦截器传入的参数不同
- next 调用后控制权交由下一个拦截器
- value 由上一个拦截器通过 `next(value)` 传入的值

**tips**: 参数一旦达到了 2 个这意味着这是一个异步拦截器.

```javascript
function(config,next){
  next();
}
```

- config 由 `axios-mix` 实例传入的参数, 不同拦截器传入的参数不同
- next 调用后控制权交由下一个拦截器

这个版本同样是异步拦截器, 但是和上一个版本不同, 它无法处理传入的数据, 但是可以基于 `next(value)` 传递数据.

```javascript
function(config){}
```

- config 由 `axios-mix` 实例传入的参数, 不同拦截器传入的参数不同

这个版本的是同步拦截器, 你可以看出它没有 `next` 钩子.

## extend

什么是 `extend`?

```javascript
import AxiosMix from "axios-mix";
import axios from "axios";

const request = AxiosMix(Axios);
// or
const request = AxiosMix(axios.create());

// 下面就是 extend 方法
request.extend(
  {
    beforeRequest: () => {},
    afterResponse: () => {},
    failHandler: () => {},
    errorHandler: () => {},
  },
  {
    retry: () => {},
    cache: () => {},
  }
);
```

基于 `request.extend` 创建的实例会继承之前的拦截器, 同一个类型的拦截器会放置到一个队列中按照创建的先后顺序执行.  
于拦截器不同的是对外暴露的接口 `retry` 和 `cache` 并不会进行继承.

### 完整语法

```javascript
request.extend(
  {
    beforeRequest: [
      function (config) {},
      function (config, next) {},
      function (config, next, value) {},
      {
        function(queue, config, next) {},
        manually: true,
      },
    ],
    afterResponse: function (config) {},
    failHandler: function (config, next) {},
    errorHandler: function (config, next, value) {},
  },
  {
    retry: () => {},
    cache: () => {},
  }
);
```

## 拦截器

### 前置拦截器

前置拦截器本质是 `axios.interceptors.request.use` 的一层包装, 前面我们已经提到拦截器本身分为异步和同步拦截器, 对于同步拦截器来说, 你可以做如下的几种事情:

```javascript
request.get("/user", {
  beforeRequest: function (config) {
    return Promise.resolve();
    // or
    return Promise.reject();
    // or
    return config;
    // or
    throw new Error("do something");
  },
});
```

- 返回 `Promise.resolve` 则 `resolve` 的结果作为本次请求 then 的内容
- 返回 `Promise.reject` 则 `reject` 的内容作为本次请求的 `catch` 的内容
- 返回 config 则本次请求使用重载后的 `config` 进行请求
- 抛出错误则交由 `failHandler` 在交由 `errorHandler` 处理

我们还可以向 `beforeRequest` 传入一个数组, 数组中可以包含多个拦截器, 包括后面提到的 **异步拦截器** 和 **手动拦截器** .

```javascript
request.get("/user", {
  beforeRequest: [function (config) {}],
});
```

对于异步拦截器来说, 只新增了一个规则即 `next` 钩子的设计, 可以不使用 `next` 钩子, 在这种情况下如果返回值符合同步拦截器的定义, 则作用效果和前置拦截器一致, 将无视 `next` 的调用.

```javascript
request.get("/user", {
  beforeRequest: function (config, next) {
    return Promise.resolve();
    // or
    return Promise.reject();
    // or
    return config;
    // or
    throw new Error("do something");
  },
});
```

但是如果返回值是 `undefined` 即函数的默认返回值则进入异步状态, 只有当 `next` 钩子调用后下一个钩子才会执行:

```javascript
request.get("/user", {
  beforeRequest: function (config, next) {
    next();
  },
});
```

**注意**: 一旦 `next` 调用则返回值将会被抛弃.

和 `express` 类似, 基于 `next` 我们可以将参数传入到下一个拦截器中:

```javascript
request.get("/user", {
  beforeRequest: function (config, next) {
    next("hello world");
  },
});
```

```javascript
request.get("/user", {
  beforeRequest: [
    function (config, next) {
      next("hello world");
    },
    function (config, next, value) {
      console.log(value); // hello world
    },
  ],
});
```

**注意**: 一旦使用 `next` 且传入参数则 `axios-mix` 会去查找下一个可以接收参数的拦截器, 这意味着如果中间存在同步拦截器或者不接受参数的异步拦截器则这些拦截器不会执行.

如果没有找到接收该参数的拦截器, 则将该参数视为错误, 然后交由 `failHandler` 和 `errorHandler` 处理.

**注意**: 上述规则只适用于传入参数, 参数如果是 `next(undefined)` 和 `next(null)` 则认为没有传入参数.

### 后置拦截器

后置拦截器本质是 `axios.interceptors.response.use` 的一层包装, 对于该类型的同步拦截器来说你可以做如下的事情:

```javascript
request.get("/user", {
  afterResponse: function (response, next) {
    return Promise.resolve();
    // or
    return Promise.reject();
    // or
    return response;
    // or
    throw new Error("do something");
  },
});
```

- 返回 `Promise.resolve` 则 `resolve` 的结果作为本次请求 then 的内容
- 返回 `Promise.reject` 则 `reject` 的内容作为本次请求的 `catch` 的内容
- 返回 response 相当于调用 `Promise.resolve(response)`
- 抛出错误则交由 `failHandler` 在交由 `errorHandler` 处理

和前置拦截器类似你也可以传入一个数组到 `afterResponse` 上.

后置拦截器的 **异步版本** **异步带参数版本** 的 `next` 钩子的用法和前置拦截器的用法一致, 请查看同步拦截器的用法.

### 局部错误拦截器(failHandler)

**提示**: 只将 failHandler 用在局部的错误处理上, 最好是只针对当前请求有效的错误拦截.

错误拦截器和前置后置拦截器有很多相似的地方, 首个区别就是拦截器第一个参数不同, 我们有很多类型的错误:

- 前置同步拦截器抛出的错误
- 前置异步拦截器 `next` 传入参数但是没有拦截
- 后置同步拦截器抛出的错误
- 后置异步拦截器 `next` 传入参数但是没有拦截
- axios 抛出的错误

上述的内容会作为首个参数传入到拦截器中, 如果是这样我们就无法判断错误的类型是由谁发出, 所以建议抛出的错误应该是一个继承自 `Error` 的对象:

```javascript
class BeforeRequestError extends Error {}

// 在同步拦截器中
function(config){
  throw new BeforeRequestError('hello world');
}
```

这样我们在 `failHandler` 中就知道错误的来源.

```javascript
request.get("/user", {
  failHandler: function (error) {
    if (error instanceof BeforeRequestError) {
      // do something
    }
  },
});
```

第二个不同就是错误会封装在错误拦截器内部而不会影响到外部的请求, 我们假设下方的这个请求的结果是失败的:

```javascript
request
  .get("/user", {
    failHandler: function (error) {
      console.log(error);
    },
  })
  .then((result) => {
    if (result === undefined) {
      // true
    }
  });

request
  .get("/user", {
    failHandler: function () {
      return Promise.resolve("hello world");
    },
  })
  .then((result) => {
    if (result === "hello world") {
      // true
    }
  });
```

这样的设计优势是当我们发起请求后, 只需要将逻辑同步的编写 `then` 部分即可, 原本应该本 `catch` 的内容则交由拦截器去处理:

```javascript
request.get("/user").then((result) => {
  if (result) {
    
  }
});
```

下面是局部错误拦截器的完整定义, 相对于前置后置拦截器只少了一种用法:

```javascript
request.get("/user", {
  failHandler: function (error) {
    return Promise.resolve();
    // or
    return Promise.reject();
    // or
    throw new Error("do something");
  },
});
```

错误拦截器本质是处理错误, 而不是抛出错误, 所以原本在前置后置拦截器中的错误处理在此处的含义完全不同.

- `Promise.resolve()` 定义和前置拦截器相同
- `Promise.reject()` 定义和前置拦截器相同
- `new Error("do something")` 表示拦截器本身抛出的错误或者超出该拦截器的处理范围, 相当于 `Promise.reject(new Error("do something"))`

虽然错误拦截具有一定的控制能力, 但是使用前必须仔细考虑, 因为一旦使用上述规则就意味着后续的错误拦截器将无法执行, 这可能会造成意料之外的效果.

局部错误拦截器的异步版本的执行规则和前置后置拦截器类似, 同时请不要忘记如果异步拦截器先 `return` 且符合 `failHandler` 的同步版本的返回值的定义则执行同步流程, 这会导致后续的拦截器彻底无法执行:

```javascript
request.get("/user", {
  failHanlder: [
    function (error, next) {
      next("hello world");
    },
    function (error, next, value) {
      console.log(value); // hello world
      return Promise.resolve();
    },
    function (error, next, value) {
      // 这里不会执行, 因为上一个拦截器的 `Promise.resolve()` 已经将整个请求完成
    },
  ],
});
```

当 failHandler 执行完成后则开始执行 `errorHandler`, 这里就存在一个问题交由 `errorHandler` 的错误应该是哪个?

这个问题要看 `failHandler` 中最后一个 `next` 的使用方式:

- 如果 `next` 提供的参数, 那么交由 `errorHandler` 的参数就是 `next` 传入的值
- 如果 `next` 没有提供参数, 那么交由 `errorHandler` 的参数就是原本的错误

如果没有使用异步拦截器则交由 `errorHandler` 的参数就是原本的错误.

### 全局错误拦截器(errorHandler)

errorHandler 和 fail

### 手动拦截器与拦截器队列参数

拦截器是可以继承的, 简单来讲通过 `axios-mix` 实例的 `extend` 方法, 它可以复用当前 `axios-mix` 实例的配置然后生成一个新的实例, 这样做会将多个同一类型的拦截器放置到队列中执行.

有时候我们不想按照 `axios-mix` 默认的执行顺序来触发拦截器, 而想手动控制拦截器的执行, 或者不执行之前定义的拦截器, 这个时候我们可以用一个对象将拦截器(函数)包裹起来:

```javascript
{
  intercpetor:function(queue){},
  manually:true
}
```

这样在当前定义的 `intercpetor` 所对应的拦截器的第一个参数将会是 `queue` 它存放了当前拦截器之前的所有非手动拦截器的列表, 你可以手动执行它们.

**注意**:`axios-mix` 会假设你定义的函数的首个参数是 `queue` 然后通过剩余的参数来判断你的拦截器类型.

例子, 假设存在如下队列:

```javascript
[
  function () {},
  function () {},
  { manually: true, intercpetor: function (queue) {} },
  function () {},
  function () {},
  { manually: true, intercpetor: function (queue) {} },
];
```

第三个手动拦截器的 `queue` 将包含第一个和第二个拦截器, 第六个手动拦截器会包含第四个和第五个拦截器.

## 拦截器的上下文绑定

## 执行器
