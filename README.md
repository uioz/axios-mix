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

拦截器的设计于 `express` 中的中间件类似, 所有的拦截器外部定义如下:

```javascript
function(config,queue,next,value){
  next();
}
```

但是不同的拦截器的参数含义和控制流程是不同的.

### 前置拦截器



## 执行器

## extend

基于 `request.extend` 创建的实例会继承之前的拦截器, 同一个类型的拦截器会放置到一个队列中按照创建的先后顺序执行.  
于拦截器不同的是对外暴露的接口 `retry` 和 `cache` 并不会进行继承.

```javascript
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

```javascript
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
