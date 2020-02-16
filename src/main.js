import { createElement } from 'react';
import { render } from 'react-dom';
import { DataSource } from './data-source.js';
import { FrontEnd } from './front-end.jsx';

window.addEventListener('load', initialize);

function initialize(evt) {
  const dataSource = new DataSource;
  const container = document.getElementById('react-container');
  const element = createElement(FrontEnd, { dataSource });
  render(element, container);
}
