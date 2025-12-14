# zus

> a lightweight front-end framework.

## Install

You can get it on npm.

```
npm install zus --save
```

## Usage

```js
import zus from 'zus'

const app = zus()

app.router(require('./router').default)

app.start('#root')
```
