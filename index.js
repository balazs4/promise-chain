const query = param =>
  new Promise((resolve, reject) => {
    if (param === 2) {
      console.log(`rejecting ${param} retry maybe?`);
      return reject({
        errorMessage: 'Lorem ipsum',
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
        LastEvaluatedKey: param === 7
      });
    }, 500);
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
          if (res.LastEvaluatedKey === true) leftOver.push(param * 2);
        })
        .catch(err => {
          if (err.retryable === true) leftOver.push(param + 1);
          else throw err;
        });
    }, Promise.resolve())
    .then(_ => leftOver);
};

const result = [];
const derHammer = reducer(query, result.push.bind(result));

const allDates = Object.freeze([...Array(10).keys()]);
const maxRetries = 5;

[...Array(maxRetries + 1).keys()]
  .reduce(
    (p, retry) =>
      p.then(x => {
        if (x.length === 0) {
          return p;
        }
        console.log(`>> retry #${retry + 1}, ${x.length} remaining`);
        return new Promise(resolve => setTimeout(resolve, 500)).then(_ =>
          derHammer(x)
        );
      }),
    derHammer(allDates)
  )
  .then(x => {
    if (x.length !== 0) {
      throw new Error('Giving up...FAILED');
    }
  })
  .then(_ => console.log(result))
  .catch(err => console.log(err.message));
