const query = param =>
  new Promise((resolve, reject) => {
    if (param === 2) {
      console.log(`rejecting ${param} retry maybe?`);
      return reject({
        errorMessage: 'Two is not supported',
        retryable: true
      });
    }
    setTimeout(() => {
      const LastEvaluatedKey = param === 1;
      console.log(
        `resolving ${param} ${
          LastEvaluatedKey === true ? 'pagination needed' : ''
        }`
      );
      resolve({
        Items: [...Array(param + 1).keys()],
        LastEvaluatedKey: param === 1
      });
    }, 1000);
  });

const reducer = (promiseFactory, storeResult) => params => {
  let leftOver = params.slice();
  return params
    .reduce((prom, param) => {
      leftOver = leftOver.filter(x => x !== param);
      return prom
        .then(_ => promiseFactory(param))
        .then(res => {
          storeResult(res.Items);
          if (res.LastEvaluatedKey === true) leftOver.push(16);
        })
        .catch(err => {
          if (err.retryable === true) leftOver.push(16);
          else throw err;
        });
    }, Promise.resolve())
    .then(_ => leftOver);
};

const result = [];
const derHammer = reducer(query, result.push.bind(result));

const allDates = Object.freeze([...Array(10).keys()]);
const maxRetries = 8;

[...Array(maxRetries).keys()]
  .reduce(
    (p, retry) =>
      p.then(x => {
        if (retry === 0) {
          console.log(`very first try...${x.length} remaining`);
          return derHammer(x);
        }
        if (x.length === 0) {
          return p;
        }
        console.log(
          `retry ${retry}, ${x.length} remaining after 500 millisecond`
        );
        return new Promise(resolve => setTimeout(resolve, 500)).then(_ =>
          derHammer(x)
        );
      }),
    Promise.resolve(allDates)
  )
  .then(_ => console.log(result))
  .catch(err => console.log(err));
