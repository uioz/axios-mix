# axios-mix

`axios-mix` 是一款基于 `axios` 的扩展, 在不修改原有 `axios` API 的前提上为 `axios` 添加了三个实用的功能.

1. 更加丰富的拦截器 API, 允许用户更加合理的组织全局和单次请求的拦截器逻辑
2. 简单友好的缓存 API, 允许用户在全局或者单次请求时进行客户端缓存控制
3. 请求失败后允许重试 API, 允许用户在全局或者单次请求配置对应的请求重试逻辑

`axios-mix` 基于 `proxy` 设计, 请确保你的浏览器支持 `proxy` API.

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

| 名称              | 作用                                                                              |
| ----------------- | --------------------------------------------------------------------------------- |
| beforeRequest     | 在请求前执行拦截                                                                  |
| afterResponse     | 在请求后执行拦截                                                                  |
| localErrorHandler | 当请求失败后错误交由 localErrorHandler 处理, 这个错误拦截会在 errorHandler 前执行 |
| errorHandler      | 当请求失败后错误交由 errorHandler 处理, 这个错误拦截会在 localErrorHandler 后执行 |

## 为什么存在两个错误拦截?

通常我们对错误拦截有两种需求:

1. 在错误的时候做一些全局性质的修改, 例如弹出一个全局对话框
2. 在错误的时候重置一些状态, 服务端返回了 `404` 提示前端资源不存在, 前端决定在页面上禁用某些内容

如果只有一个错误拦截器, 如果我们编写了第一种类型的程序, 那么第二种类型的拦截就会非常棘手, 我们只能:

1. 在第一种拦截中编写大量的判断来决定是否执行全局逻辑
2. 屏蔽掉第一种拦截器, 然后针对本次请求定制一个错误拦截, 但是你很可能需要复用全局逻辑

如果可以区分开全局副作用和局部副作用那么代码的复用就会简单许多:

- localErrorHandler 中只允许编写局部副作用的代码
- errorHandler 中只允许编写全局副作用的代码

## 拦截器定义

拦截器的设计于 `express` 中的中间件类似, 不同类型的拦截器定义如下:

- config 是由 `axios-mix` 实例传入, 不同类型的拦截器所传入的值不同
- next 调用后控制权交由下一个拦截器
- value 由上一个拦截器通过 `next(value)` 传入的值

**tips**: 参数一旦达到了 2 个这意味着这是一个异步拦截器.

```javascript
function(config,next,value){
  next();
}
```

这个版本同样是异步拦截器, 但是和上一个版本不同, 它无法处理传入的数据, 但是可以基于 `next(value)` 传递数据.

- config 由 `axios-mix` 实例传入的参数, 不同拦截器传入的参数不同
- next 调用后控制权交由下一个拦截器

```javascript
function(config,next){
  next(value);
}
```

这个版本的是同步拦截器, 你可以看出它没有 `next` 钩子.

- config 由 `axios-mix` 实例传入的参数, 不同拦截器传入的参数不同

```javascript
function(config){}
```

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
    errorHandler: () => {},
  },
  {
    retry: () => {},
    cache: () => {},
  }
);
```

基于 `request.extend` 创建的实例会继承之前的拦截器, 同一个类型的拦截器会放置到一个队列中按照创建的先后顺序执行.  
不过对外暴露的接口 `retry` 和 `cache` 并不会进行继承.

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

// or 使用数组一次性传入多个拦截器

request.get("/user", {
  beforeRequest: [
    function (config) {
      // do something
    },
    function (config) {
      // do something
    },
  ],
});
```

- 返回 `Promise.resolve` 则 `resolve` 的结果作为本次请求 then 的内容
- 返回 `Promise.reject` 则 `reject` 的内容作为本次请求的 `catch` 的内容
- 返回 config 则本次请求使用重载后的 `config` 进行请求
- 抛出错误则交由 `localErrorHandler` 在交由 `errorHandler` 处理
- 不返回任何内容即 `undefined` 则执行下个拦截器

**注意**: 请牢记前置拦截器的主要目的是重载本次请求的配置, 函数一旦 `return` 则后续拦截器不再执行. 如果所有拦截器执行完毕都没有返回参数则使用本次请求的默认配置.

#### 异步拦截器

异步拦截器使用了和 `express` 类似的 API 设计, 函数多了一个 `next` 参数, 如果当前异步任务执行完毕, 调用 `next` 则会将控制权交由下一个拦截器.

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
    // or
    next();
  },
});
```

异步拦截器并不意味着不处理函数的返回值, 如果 `return` 语句返回了一个可以被处理的值或者抛出了错误且先于 `next` 钩子的执行, 那么就会按照同步执行器的逻辑处理从而无视 `next` 的调用.

反之如果什么都不返回则视为进入了异步状态, 此时只有 `next` 钩子调用后控制权才会交由下个拦截器.

```javascript
request.get("/user", {
  beforeRequest: function (config, next) {
    next();
  },
});
```

和 `express` 类似你可以向 `next` 传入一个参数.

一旦使用 `next` 且传入参数则 `axios-mix` 会去查找下一个可以接收参数的拦截器, 这意味着如果中间存在同步拦截器或者不接受参数的异步拦截器则这些拦截器不会执行.

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

**注意**: 如果没有找到接收该参数的拦截器, 则将该参数视为错误, 然后交由 `localErrorHandler` 和 `errorHandler` 处理.

**注意**: 上述规则只适用于传入参数, 参数如果是 `next(undefined)` 则认为没有传入参数.

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
- 抛出错误则交由 `localErrorHandler` 在交由 `errorHandler` 处理

和前置拦截器类似你也可以传入一个数组到 `afterResponse` 上.

后置拦截器的 **异步版本** **异步带参数版本** 的 `next` 钩子的用法和前置拦截器的用法一致, 请查看同步拦截器的用法.

### 局部错误拦截器(localErrorHandler)

**警告**: localErrorHandler 只能用在局部的错误处理上无法通过 `extend` 方法进行继承.

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

这样我们在 `localErrorHandler` 中就知道错误的来源.

```javascript
request.get("/user", {
  localErrorHandler: function (error) {
    if (error instanceof BeforeRequestError) {
      // do something
    }
  },
});
```

第二个不同就是错误会封装在错误拦截器内部, 下方我们请求了一个不存在的地址:

```javascript
request
  .get("/user", {
    localErrorHandler: function (error) {
      // 不做处理
      console.log(error);
    },
  })
  .then((result) => {
    // 错误封装到了错误拦截中, 由于本次请求是一个失败的请求故没有返回值
    if (result === undefined) {
      // true
    }
  });

request
  .get("/user", {
    localErrorHandler: function () {
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
    // do something
  }
});
```

下面是局部错误拦截器的完整定义, 相对于前置后置拦截器只少了一种用法:

```javascript
request.get("/user", {
  localErrorHandler: function (error) {
    return Promise.resolve();
    // or
    return Promise.reject();
    // or
    throw new Error("do something");
  },
});
```

局部错误拦截器主要的目的是处理错误, 所以没有主动抛出错误的设计, 所以原本在前置后置拦截器中的错误处理在此处的含义完全不同.

- `Promise.resolve()` 定义和前置拦截器相同
- `Promise.reject()` 定义和前置拦截器相同
- `new Error("do something")` 拦截器本身错误或者超出该拦截器的处理范围, 相当于 `next(new Error("do something"))`

局部错误拦截器的异步版本的执行规则和前置/后置拦截器相同, 上述的操作可以控制错误执行的流程, 但是使用前必须仔细考虑, 因为这会影响后续的拦截器执行, 下方的第二个拦截器同步返回了一个值导致整个请求结束, 那么后续的错误拦截无法执行.

```javascript
request.get("/user", {
  localErrorHandler: [
    function (error, next) {
      next("hello world");
    },
    function (error, next, value) {
      console.log(value); // hello world
      return Promise.resolve("success");
    },
    function (error, next, value) {
      // 这里不会执行, 因为上一个拦截器的 `Promise.resolve()` 已经将整个请求完成
    },
  ],
});
```

当 localErrorHandler 执行完成后则开始执行 `errorHandler`, 这里就存在一个问题交由 `errorHandler` 的错误应该是哪个?

这个问题要看 `localErrorHandler` 中最后一个 `next` 的使用方式:

- 如果 `next` 提供的参数, 那么交由 `errorHandler` 的参数就是 `next` 传入的值
- 如果 `next` 没有提供参数, 那么交由 `errorHandler` 的参数就是原本的错误
- 如果 `localErrorHandler` 不存在则 `errorHandler` 将会直接拿到错误

### 全局错误拦截器(errorHandler)

**建议**: 只建议在处理全局错误时候使用, 请区分局部错误拦截器和全局错误拦截器.

从代码形式上看全局错误拦截器的定义和 `localErrorHandler` 是一样的, 这里只有一点需要牢记, 即错误默认会留在错误拦截器中, 想要打破这一点需要手动抛出错误:

```javascript
request
  .get("/user", {
    errorHandler: [
      function (error) {
        throw new Error("hello world");
        // or
        return Promise.reject(new Error());
      },
    ],
  })
  .catch((error) => {
    console.log(error);
  });
```

如果异步拦截器调用了 `next(value)` 而没有对应的接收器则该参数会作为错误抛出.

### 手动拦截器与拦截器队列参数

手动拦截器可以在 `axios.get` 或者 `axios.post` 等请求方法提供的拦截器中定义:

```javascript
axiosMix.get("url", {
  beforeRequest: {
    intercpetor: function (queue, config, next, value) {},
    manually: true,
  },
});
```

手动拦截器被设计用于打破固定的执行顺序的时候使用, 在这个拦截器前的所有其他拦截器将会作为手动拦截器的首个参数, 例如基于 `extend` 或者作为请求选项的队列.

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

手动拦截器不能在 `extend` 方法中使用, 如果尝试将手动拦截器传入 `extend` 方法中会抛出一个错误.

<!-- TODO: extend 改为 merge 而 extend 则用于基于当前 axios 配置和 axiosMix 通过传入的 axios 实例将拦截写入到该 axios 实例上 -->

### 手动拦截器参数

手动拦截器的首个参数被替换为了 `queue`, 剩余的参数顺序和含义和普通的拦截器定义一致:

```javascript
function (queue,config) {};
function (queue,config,next) {};
function (queue,config,next,value) {};
```

`queue` 存放该手动拦截器前的所有拦截器, 这些拦截器在内部经过编译处理, 队列中的所有的元素是对象而不是一开始由用户传入的函数, 该对象定义如下:

```javascript
{
  interceptor:function(){}, // 拦截器本身, 由用户传入
  nextHandler:function(){}, // 下一个拦截器, undefined 则表示最后一个拦截器
  nextErrorHandler:function(){}, // 下一个带参拦截器, undefined 则表示最后一个拦截器
  manually:false, // 该属性也可能不存在和 false 一样均表示非手动拦截器
}
```

## 拦截器的上下文绑定

## 执行器

# cache

有时候我们想对请求进行缓存而 `axiosMix` 提供了这种自由组织缓存的能力.

缓存的关键一共有两点:

- 本次请求是否需要缓存
- 缓存到哪里

对于缓存到哪里的问题 `axiosMix` 对外暴露了接口, 当新建 `axiosMix` 实例的时候你可以通过 `option.cache` 来决定:

```javascript
axiosMix(axios, {
  cache(path, response) {},
});
```

然后请求时候提供的参数告诉 `axiosMix` 本次请求需要缓存:

```javascript
axiosMix.get("xxx", {
  cache: true,
});
```

如果一个请求决定要缓存, 每当响应完成后 `option.cache` 就会被调用传入两个参数:

```javascript
{
  cache(path,processedResponse,rawResponse){
    // 你应该在这里写入缓存
  }
}
```

第一个参数就是本次请求的路径, 第二个参数是经过 `afterResponse` 处理后的对象, 第三个则是 `axios` 原本的响应对象.

`option.cache` 会在本次请求的 `then` 前, 但是在所有 `afterResponse` 执行完成后调用, 如果 `afterResponse` 执行的过程中发生了错误那么 `cache` 不会被调用.

当然 `axiosMix` 本身并不知道本次请求是否存在缓存, 对于标识缓存的请求, 每次请求前同样会调用 `option.cache` 此时只会传入 `path` 作为查询的条件:

```
{
  cache(path){
    // 在这里查询缓存, 只要返回值非 `undefined` 都会作为本次请求的结果
  }
}
```

另外通过 `extend` 你可以重写存储, 然后生成一个新的 `axiosMix` 实例而不影响原有的配置:

```javascript
axiosMix.extend(
  {},
  {
    cache(path, processedResponse, rawResponse) {},
  }
);
```

# peer

# rollup

# retry
