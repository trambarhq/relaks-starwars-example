import { Component } from 'preact';

class DjangoDataSource extends Component {
    constructor() {
        super();
        this.requests = [];
        this.state = { requests: this.requests };
    }

    render(props, state) {
        return null;
    }

    componentDidMount() {
        this.triggerChangeEvent();
    }

    triggerChangeEvent() {
        if (this.props.onChange) {
            this.props.onChange({ type: 'change', target: this });
        }
    }

    fetchOne(url) {
        return this.fetch(url);
    }

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
            var request = this.findRequest(props);
            if (!request) {
                request = this.addRequest(props)

                // create fetch function
                var nextURL = url;
                var previousResults = [];
                var currentPage = 1;
                var currentPromise = null;
                var fetchNextPage = () => {
                    if (currentPromise) {
                        return currentPromise;
                    }
                    currentPromise = this.fetch(nextURL).then((response) => {
                        // append retrieved objects to list
                        let results = previousResults.concat(response.results);
                        let promise = Promise.resolve(results);
                        this.updateRequest(request, { results, promise });

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
                    }, (err) => {
                        currentPromise = null;
                        throw err;
                    });
                    return currentPromise;
                };

                // call it for the first page
                request.promise = fetchNextPage();
            }
            return request.promise;
        }
    }

    fetchMultiple(urls, options) {
        // see which ones are cached already
        var results = {};
        var promises = {};
        var cached = 0;
        urls.forEach((url) => {
            let request = this.findRequest({ url, list: false });
            if (request && request.result) {
                results[url] = request.result;
                cached++;
            } else {
                promises[url] = this.fetchOne(url);
            }
        });

        // wait for the complete set to arrive
        var completeSetPromise;
        if (cached < urls.length) {
            completeSetPromise = new Promise((resolve, reject) => {
                urls.forEach((url) => {
                    let promise = promises[url];
                    if (promise) {
                        promise.then((result) => {
                            results[url] = result;
                            cached++;
                            if (cached === urls.length) {
                                resolve(results);
                            }
                        }, (err) => {
                            if (reject) {
                                reject(err);
                                reject = null;
                            }
                        });
                    }
                });
            });
        }

        // see whether partial result set should be immediately returned
        let partial = (options && options.partial !== undefined) ? options.partial : false;
        var minimum;
        if (typeof(partial) === 'number') {
            minimum = urls.length * partial;
        } else if (partial) {
            minimum = 1;
        } else {
            minimum = urls.length;
        }
        if (cached < minimum && completeSetPromise) {
            return completeSetPromise;
        } else {
            // return partial set then fire change event when complete set arrives
            if (completeSetPromise) {
                completeSetPromise.then(() => {
                    this.triggerChangeEvent();
                });
            }
            return Promise.resolve(Object.assign({}, results));
        }
    }

    fetch(url) {
        let props = { url, list: false };
        var request = this.findRequest(props);
        if (!request) {
            request = this.addRequest(props)
            request.promise = fetch(url).then((response) => {
                return response.json().then((result) => {
                    this.updateRequest(request, { result });
                    return result;
                });
            });
        }
        return request.promise;
    }

    findRequest(props) {
        return this.requests.find((request) => {
            return match(request, props);
        });
    }

    addRequest(props) {
        var request = Object.assign({ promise: null }, props);
        this.requests = this.requests.concat(request);
        this.setState({ requests: this.requests });
        return request;
    }

    updateRequest(request, props) {
        Object.assign(request, props);
        this.requests = this.requests.slice();
        this.setState({ requests: this.requests });
    }
}

function match(request, props) {
    for (var name in props) {
        if (request[name] !== props[name]) {
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

export {
    DjangoDataSource as default,
    DjangoDataSource
};
