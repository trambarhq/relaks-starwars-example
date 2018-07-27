import { Component } from 'preact';

const baseURL = 'https://swapi.co/api';

class SWAPI {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }

    fetchList(url, options) {
        url = expandURL(url);
        return this.dataSource.fetchList(url, options);
    }

    fetchOne(url, options) {
        url = expandURL(url);
        return this.dataSource.fetchOne(url, options);
    }

    fetchMultiple(urls, options) {
        urls = urls.map(expandURL);
        return this.dataSource.fetchMultiple(urls, options);
    }
}

function expandURL(url) {
    if (!/^https?:/.test(url)) {
        url = baseURL + url;
    }
    return url;
}

export {
    SWAPI as default,
    SWAPI,
};
