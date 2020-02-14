const baseURL = 'https://swapi.co/api';

class SWAPI {
  /**
   * Remember the data source
   */
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Fetch one object from data source
   *
   * @param  {String} url
   * @param  {Object} options
   *
   * @return {Promise<Object>}
   */
  fetchOne(url, options) {
    url = expandURL(url);
    return this.dataSource.fetchOne(url, options);
  }

  /**
   * Fetch a list of objects from data source
   *
   * @param  {String} url
   * @param  {Object} options
   *
   * @return {Promise<Array>}
   */
  fetchList(url, options) {
    url = expandURL(url);
    return this.dataSource.fetchList(url, options);
  }

  /**
   * Fetch multiple objects from data source
   *
   * @param  {Array<String>} urls
   * @param  {Object} options
   *
   * @return {Promise<Object>}
   */
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
  SWAPI,
};
