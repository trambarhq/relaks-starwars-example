import React from 'react';
import { render } from 'react-dom';
import { FrontEnd } from 'front-end';
import DjangoDataSource from 'django-data-source';

window.addEventListener('load', initialize);

function initialize(evt) {
    let dataSource = new DjangoDataSource;
    let container = document.getElementById('react-container');
    let element = React.createElement(FrontEnd, { dataSource });
    render(element, container);
}
