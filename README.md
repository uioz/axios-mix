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

### 手动拦截器与拦截器队列参数

拦截器是可以继承的, 这个我们稍后会解释, 简单来讲通过 `axios-mix` 实例的 `extend` 方法, 它可以复用当前 `axios-mix` 实例的配置然后生成一个新的实例, 这样做会将多个同一类型的拦截器放置到队列中执行.

有时候我们不想按照 `axios-mix` 默认的执行顺序来触发拦截器, 而想手动控制拦截器的执行, 这个时候我们可以用一个对象将拦截器(函数)包裹起来:

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

### 前置拦截器

```typescript
request.get('/user',{
  beforeRequest:function():void | Array<()=>void | { manually:boolean,intercpetor:()=>void }> | { manually:boolean,intercpetor:()=>void }
})
```

### 后置拦截器

### 局部错误拦截器

### 全局错误拦截器

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

## 执行器
