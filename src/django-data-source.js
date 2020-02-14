class DjangoDataSource {
  constructor() {
    this.queries = [];
  }

  /**
   * Call the onChange handler
   */
  triggerChangeEvent() {
    if (this.onChange) {
      this.onChange({ type: 'change', target: this });
    }
  }

  /**
   * Fetch one object at the URL.
   *
   * @param  {String} url
   *
   * @return {Promise<Object>}
   */
  fetchOne(url) {
    return this.fetch(url);
  }

  /**
   * Fetch a list of objects at the given URL. If page is specified in
   * options, then objects in that page are returned. Otherwise object from
   * the all objects are returned through multiple calls. A method named
   * more() will be attached to be array, which initially contains only
   * objects in the first page. Calling .more() retrieves the those in the
   * next unretrieved page.
   *
   * @param  {String} url
   * @param  {Object|undefined} options
   *
   * @return {Promise<Array>}
   */
  fetchList(url, options) {
    let page = (options && options.page !== undefined) ? options.page : 0;
    if (page) {
      // fetch a page if page number is specified
      url = appendPage(url, page);
      return this.fetch(url).then((response) => {
        return response.results;
      });
    } else {
      // fetch pages on demand, concatenating them
      let props = { url, list: true };
      let query = this.findQuery(props);
      if (!query) {
        query = this.addQuery(props)

        // create fetch function
        let nextURL = url;
        let previousResults = [];
        let currentPage = 1;
        let currentPromise = null;
        let fetchNextPage = () => {
          if (currentPromise) {
            return currentPromise;
          }
          currentPromise = this.fetch(nextURL).then((response) => {
            // append retrieved objects to list
            let results = previousResults.concat(response.results);
            let promise = Promise.resolve(results);
            this.updateQuery(query, { results, promise });

            // attach function to results so caller can ask for more results
            results.more = fetchNextPage;

            // set up the next call
            nextURL = response.next;
            previousResults = results;
            currentPromise = (nextURL) ? null : promise;

            // inform parent component that more data is available
            if (currentPage++ > 1) {
              this.triggerChangeEvent();
            }
            return results;
          }).catch((err) => {
            currentPromise = null;
            throw err;
          });
          return currentPromise;
        };

        // call it for the first page
        query.promise = fetchNextPage();
      }
      return query.promise;
    }
  }

  /**
   * Fetch multiple JSON objects. If minimum is specified, then immediately
   * resolve with cached results when there're sufficient numbers of objects.
   * An onChange will be trigger once the full set is retrieved.
   *
   * @param  {Array<String>} urls
   * @param  {Object} options
   *
   * @return {Promise<Array>}
   */
  fetchMultiple(urls, options) {
    // see which ones are cached already
    var _this = this;
    var cached = 0;
    var fetchOptions = {};
    for (var name in options) {
      if (name !== 'minimum') {
        fetchOptions[name] = options[name];
      }
    }
    var promises = urls.map(function(url) {
      var props = { url: url, type: 'object' };
      var query = _this.findQuery(props);
      if (query && query.object) {
        cached++;
        return query.object;
      } else {
        return _this.fetchOne(url, fetchOptions);
      }
    });

    // wait for the complete list to arrive
    var completeListPromise;
    if (cached < urls.length) {
      completeListPromise = Promise.all(promises);
    }

    // see whether partial result set should be immediately returned
    let minimum = getMinimum(options, urls.length, urls.length);
    if (cached < minimum && completeListPromise) {
      return completeListPromise;
    } else {
      if (completeListPromise) {
        // return partial list then fire change event when complete list arrives
        completeListPromise.then(() => {
          this.triggerChangeEvent();
        });
        return promises.map(function(object) {
          if (object.then instanceof Function) {
            return null;  // a promise--don't return it
          } else {
            return object;
          }
        });
      } else {
        // list is complete already
        return promises;
      }
    }
  }

  /**
   * Fetch JSON object at URL
   *
   * @param  {String} url
   *
   * @return {Promise<Object>}
   */
  fetch(url) {
    let props = { url, list: false };
    let query = this.findQuery(props);
    if (!query) {
      query = this.addQuery(props)
      query.promise = fetch(url).then((response) => {
        return response.json().then((result) => {
          this.updateQuery(query, { result });
          return result;
        });
      });
    }
    return query.promise;
  }

  /**
   * Find an existing query
   *
   * @param  {Object} props
   *
   * @return {Object|undefined}
   */
  findQuery(props) {
    return this.queries.find((query) => {
      return match(query, props);
    });
  }

  /**
   * Add a query
   *
   * @param {Object} props
   */
  addQuery(props) {
    let query = Object.assign({ promise: null }, props);
    this.queries = [ query ].concat(this.queries);
    return query;
  }

  /**
   * Update a query
   *
   * @param  {Object} query
   * @param  {Object} props
   */
  updateQuery(query, props) {
    Object.assign(query, props);
  }
}

function match(query, props) {
  for (let name in props) {
    if (query[name] !== props[name]) {
      return false;
    }
  }
  return true;
}

function appendPage(url, page) {
  if (page === 1) {
    return url;
  } else {
    let qi = url.indexOf('?');
    let sep = (qi === -1) ? '?' : '&';
    return `${url}${sep}page=${page}`;
  }
}

function getMinimum(options, total, def) {
  let minimum = (options) ? options.minimum : undefined;
  if (typeof(minimum) === 'string') {
    if (minimum.charAt(minimum.length - 1) === '%') {
      let percent = parseInt(minimum);
      minimum = Math.ceil(total * (percent / 100));
    }
  }
  if (minimum < 0) {
    minimum = total - minimum;
    if (minimum < 1) {
      minimum = 1;
    }
  }
  return minimum || def;
}

export {
  DjangoDataSource as default,
  DjangoDataSource,
};
