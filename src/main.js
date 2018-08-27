import 'preact/devtools';
import { h, render } from 'preact';
import { Application } from 'application';
import DjangoDataSource from 'django-data-source';

window.addEventListener('load', initialize);

function initialize(evt) {
    let dataSource = new DjangoDataSource;
    let appContainer = document.getElementById('app-container');
    if (!appContainer) {
        throw new Error('Unable to find app element in DOM');
    }
    let appElement = h(Application, { dataSource });
    render(appElement, appContainer);
}
