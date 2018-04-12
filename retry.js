const retry = (worker, maxround = 10, timeout = 500) =>
  [...new Array(maxround).keys()].reduce(
    (promise, round) =>
      promise.catch(err =>
        new Promise(resolve => setTimeout(resolve, timeout))
          .then(_ => console.log(`Retry: ${round + 1}`))
          .then(_ => worker())
      ),
    worker()
  );

const myPromiseShouldBeRetried = () =>
  new Promise((resolve, reject) => {
    const random = Math.random();
    console.log(random);
    random >= 0.89 ? resolve('foo') : reject('bar');
  });

retry(myPromiseShouldBeRetried, 15, 1000)
  .then(x => console.log(`SUCCESS ${x}`))
  .catch(err => console.log(`FAILED ${err}`)); 
