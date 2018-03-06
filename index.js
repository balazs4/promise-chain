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
      console.log(`resolving ${param}`);
      resolve({
        Items: [...Array(param + 1).keys()],
        LastEvaluatedKey: param === 1
      });
    }, 1000);
  });

const reducer = (promiseFactory, storeResult) => params =>
  params.slice().reduce((prom, _) => {
    const param = params.shift(); // remove the current item from the array
    return prom
      .then(_ => promiseFactory(param))
      .then(res => {
        storeResult(res.Items);
        if (res.LastEvaluatedKey === true) params.push(10);
      })
      .catch(err => {
        if (err.retryable === true)
          params.push(9); // may should be pushed at the first index, if items are getting popped
        else throw err;
      });
  }, Promise.resolve());

const result = [];
const derHammer = reducer(query, result.push.bind(result));

const allDates = [...Array(5).keys()];
const maxRetries = 8;

[...Array(maxRetries).keys()]
  .reduce(
    (p, retry) =>
      p.then(_ => {
        if (retry === 0) {
          console.log(`very first try...${allDates.length} remaining`);
          return derHammer(allDates);
        }
        if (allDates.length === 0) {
          return p;
        }
        console.log(
          `retry ${retry}, ${allDates.length} remaining after 500 millisecond`
        );
        return new Promise(resolve => setTimeout(resolve, 500)).then(_ =>
          derHammer(allDates)
        );
      }),
    Promise.resolve()
  )
  .then(_ => console.log(result))
  .catch(err => console.log(err));
