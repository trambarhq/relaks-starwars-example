import 'preact/devtools';
import { h, render } from 'preact';
import { FrontEnd } from 'front-end';
import DjangoDataSource from 'django-data-source';

window.addEventListener('load', initialize);

function initialize(evt) {
    let dataSource = new DjangoDataSource;
    let container = document.getElementById('react-container');
    let element = h(FrontEnd, { dataSource });
    render(element, container);
}
