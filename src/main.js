import { createElement } from 'react';
import { render } from 'react-dom';
import { FrontEnd } from 'front-end';
import DjangoDataSource from 'django-data-source';

window.addEventListener('load', initialize);

function initialize(evt) {
  const dataSource = new DjangoDataSource;
  const container = document.getElementById('react-container');
  const element = createElement(FrontEnd, { dataSource });
  render(element, container);
}
