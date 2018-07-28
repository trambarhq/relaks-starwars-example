import { Component } from 'preact';

class DjangoDataSource extends Component {
    /**
     * Set initial state of component
     */
    constructor() {
        super();
        this.requests = [];
        this.state = { requests: this.requests };
    }

    /**
     * Render nothing
     *
     * @return {Null}
     */
    render() {
        return null;
    }

    /**
     * Trigger onChange on mount
     *
     * @return {[type]}
     */
    componentDidMount() {
        this.triggerChangeEvent();
    }

    /**
     * Call the onChange handler
     */
    triggerChangeEvent() {
        if (this.props.onChange) {
            this.props.onChange({ type: 'change', target: this });
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
            let request = this.findRequest(props);
            if (!request) {
                request = this.addRequest(props)

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
                    }).catch((err) => {
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

    /**
     * Fetch multiple JSON objects. If partial is specified, then immediately
     * resolve with cached results when there're sufficient numbers of objects.
     * An onChange will be trigger once the full set is retrieved.
     *
     * @param  {Array<String>} urls
     * @param  {Object} options
     *
     * @return {Promise<Object>}
     */
    fetchMultiple(urls, options) {
        // see which ones are cached already
        let results = {};
        let cached = 0;
        let promises = urls.map((url) => {
            let request = this.findRequest({ url, list: false });
            if (request && request.result) {
                results[url] = request.result;
                cached++;
            } else {
                return this.fetchOne(url);
            }
        });

        // wait for the complete set to arrive
        let completeSetPromise;
        if (cached < urls.length) {
            completeSetPromise = Promise.all(promises).then((objects) => {
                let completeSet = {};
                urls.forEach((url, index) => {
                    completeSet[url] = objects[index] || results[url];
                });
                return completeSet;
            });
        }

        // see whether partial result set should be immediately returned
        let partial = (options && options.partial !== undefined) ? options.partial : false;
        let minimum;
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
            return Promise.resolve(results);
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
        let request = this.findRequest(props);
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

    /**
     * Find an existing request
     *
     * @param  {Object} props
     *
     * @return {Object|undefined}
     */
    findRequest(props) {
        return this.requests.find((request) => {
            return match(request, props);
        });
    }

    /**
     * Add a request
     *
     * @param {Object} props
     */
    addRequest(props) {
        let request = Object.assign({ promise: null }, props);
        this.requests = [ request ].concat(this.requests);
        this.setState({ requests: this.requests });
        return request;
    }

    /**
     * Update a request
     *
     * @param  {Object} request
     * @param  {Object} props
     */
    updateRequest(request, props) {
        Object.assign(request, props);
        this.requests = this.requests.slice();
        this.setState({ requests: this.requests });
    }
}

function match(request, props) {
    for (let name in props) {
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
