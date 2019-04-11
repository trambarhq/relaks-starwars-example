Relaks Star Wars Example
------------------------
This is an example demonstrating how to build a data-driven web page using [Relaks](https://github.com/trambarhq/relaks). Instead of React proper, we'll be using [Preact](https://preactjs.com/). Aside from different import statements and initiation code, the example would work the same way with React. Preact was chosen because the small size and simplicity of Relaks will likely appeal most to fans of Preact.

The data source for this example is [swapi.co](https://swapi.co/), a public Star Wars knowledge base powered by [Django](https://www.djangoproject.com/). The web page shows a list of Star Wars characters. When you click on a name, it shows additional information about him/her/it. You can see it in action [here](https://trambar.io/examples/starwars-iv/).

![Screenshot](docs/img/screenshot.png)

* [Getting started](#getting-started)
* [FrontEnd](#frontend)
* [Character list](#character-list)
* [Character page](#character-page)
* [Next step](#next-step)

## Getting started

To see the code running in debug mode, first clone this repository. In the working folder, run `npm install`. Once that's done, run `npm run start` to launch [WebPack Dev Server](https://webpack.js.org/configuration/dev-server/). Open a browser window and enter `http://localhost:8080` as the location.

The example assume that you're familiar with React and the npm/WebPack tool-chain. If you're not, you should first consult the [React tutorial](https://reactjs.org/docs/getting-started.html). Also read [this document](docs/configuration.md) describing the example's configuration files.

## FrontEnd

Okay, let's dive into the code! In [main.js](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/main.js), you'll find the function `initialize()`. It's invoked when the HTML page emits a 'load' event. The function bootstraps the front-end.

```javascript
import { createElement } from 'react';
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
```
First it creates a `DjangoDataSource` ([django-data-source.js](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/django-data-source.js)) object. It then creates the Preact element `FrontEnd`, using the data source as a prop. Finally it renders the element into a DOM node.

`FrontEnd` ([front-end.jsx](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/front-end.jsx)) is the root node of the client. It's a regular Preact component. Its `render()` method is relatively simple:

```javascript
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useEventTime } from 'relaks';
import { SWAPI } from 'swapi';
import CharacterList from 'character-list';
import CharacterPage from 'character-page';

import 'style.scss';

function FrontEnd(props) {
    const { dataSource } = props;
    const [ dataSourceChanged, setDataSourceChanged ] = useEventTime();
    const swapi = useMemo(() => {
        return new SWAPI(dataSource);
    }, [ dataSource, dataSourceChanged ]);
    const [ person, setPerson ] = useState(null);

    const handlePersonSelect = useCallback((evt) => {
        setPerson(evt.person);
    });
    const handlePersonUnselect = useCallback((evt) => {
        setPerson(null);
    });

    useEffect(() => {
        dataSource.onChange = setDataSourceChanged;
        return () => {
            dataSource.onChange = null;
        };
    });

    if (!person) {
        return <CharacterList swapi={swapi} onSelect={handlePersonSelect} />;
    } else {
        return <CharacterPage swapi={swapi} person={person} onReturn={handlePersonUnselect} />;
    }
}

export {
    FrontEnd
};
```

When no character is selected, it renders `CharacterList`. When one is selected, it renders `CharacterPage`. The object `swapi` is an instance of `SWAPI` ([swapi.js](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/swapi.js)) stored in `FrontEnd`'s state. It's a wrapper around the data source object. Whenever the data source emits a `change` event, `swapi` is recreated:

```javascript
/* ... */
```

The call to `setState()` causes the component to rerender. Because `swapi` is a new object, it would trip the change detection mechanism in `shouldComponentUpdate()` of [pure components](https://reactjs.org/docs/react-api.html#reactpurecomponent). Relaks components are pure components by default. Whenever a `change` event occurs, the `renderAsync()` method of `CharacterList` or `CharacterPage` will run.

The event handler is installed in `FrontEnd`'s `componentDidMount()` method:

```javascript
/* ... */
```

## Character list

`CharacterList` ([character-list.jsx](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/character-list.jsx)) is a Relaks component. It implements `renderAsync()`:

```js
async function CharacterList(props) {
    const { swapi, onSelect } = props;
    const [ show ] = useProgress();

    const handleClick = useCallback((evt) => {
        if (evt.button === 0) {
            const url = evt.currentTarget.href;
            const person = people.find(person => person.url === url);
            if (person && onSelect) {
                onSelect({ person });
            }
            evt.preventDefault();
        }
    });

    render();
    const people = await swapi.fetchList('/people/');
    render();

    people.more();

    function render() {
        if (!people) {
            show(<h2>Loading...</h2>);
        } else {
            show (
                <ul className="character-list">
                    {people.map(renderPerson)}
                </ul>
            );
        }
    }

    function renderPerson(person, i) {
        return (
            <li key={i}>
                <a href={person.url} onClick={handleClick}>{person.name}</a>
            </li>
        );
    }
}
```

Note the method's sole argument. The `meanwhile` object lets you control the component's behavior prior to the fulfillment of the promise returned by `renderAsync()`--i.e. while asynchronous operations are ongoing. Here, the method
asks that a `CharacterListSync` be shown (with `props.people` still undefined). It then makes a request for a list of people in the Star Wars universe and waits for the response. Execution of the method is halted at this point. When the data arrives, execution resumes. The method schedules the retrieval of the next page of data. It then return another `CharacterListSync`, this time with `props.people` set to an array of objects.

When the next page of data arrives, `DjangoDataSource` fires an `change` event. `renderAsync()` will get called again due to the prop change (namely `swapi`). `fetchList()` will return an array with more objects than before. `more()` is called and another request for data is made. The process repeats itself until we've reached the end of the list.

As the list of Star Wars characters isn't particularly long, retrieving the full list is pretty sensible. In a more sophisticated implementation, one that deals with larger data sets, `.more()` would be called in a `scroll` event handler instead.

`CharacterListSync` ([same file](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/character-list.jsx)) is a regular Preact component. It's the component that actually draws the interface, whereas the async component merely retrieves the needed data. Splitting up responsibilities in this way has some important benefits:

1. You can easily examine the retrieved data using React Developer Tools.
2. If the sync component extends `PureComponent` (not done in the example), it wouldn't rerender when the async component fetches the exact same data as before.
3. The sync component can be more easily tested using automated test tools (karma, enzyme, etc).
4. The sync component can be developed in isolation. Suppose our data retrieval code is still very buggy--or the backend isn't ready yet. A developer, whose expertise is perhaps mainly in layout and CSS, can still work on the component. All he has to do is export `CharacterListSync` as `CharacterList` and attach some dummy data as the sync component's default props.

The render method of `CharacterListSync` is entirely mundane:

```js
/* ... */
```

`meanwhile.show()` operates on a timer. The promise returned by `renderAsync()` have a 50ms to fulfill itself before the component shows the contents given to `meanwhile.show()`. When data is cached and promises resolve rapidly, the loading message would not appear at all.

## Character page

**CharacterPage** ([character-page.jsx](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/character-page.jsx)) is another Relaks component. Its `renderAsync()` method is slightly more complex:

```js
import React, { useCallback } from 'react';
import Relaks, { useProgress } from 'relaks';

async function CharacterPage(props) {
    const { swapi, person, onReturn } = props;
    const [ show ] = useProgress();

    const handleReturnClick = useCallback((evt) => {
        if (evt.button === 0) {
            if (onReturn) {
                onReturn();
            }
            evt.preventDefault();
        }
    });

    render();
    const films = await swapi.fetchMultiple(person.films, { minimum: '60%' });
    render();
    const species = await swapi.fetchMultiple(person.species, { minimum: '60%' });
    render();
    const homeworld = await swapi.fetchOne(person.homeworld);
    render();
    const vehicles = await swapi.fetchMultiple(person.vehicles, { minimum: '60%' });
    render();
    const starships = await swapi.fetchMultiple(person.starships, { minimum: '60%' });
    render();

    function render() {
        show(
            <div className="character-page">
                <a className="return-link" href="#" onClick={handleReturnClick}>
                    Return to list
                </a>
                <h1>{person.name}</h1>
                <div>Height: {person.height} cm</div>
                <div>Mass: {person.mass} kg</div>
                <div>Hair color: {person.hair_color}</div>
                <div>Skin color: {person.skin_color}</div>
                <div>Eye color: {person.eye_color}</div>
                <div>Birth year: {person.birth_year}</div>
                <h2>Homeworld</h2>
                {renderList(person.homeworld, homeworld, 'name')}
                <h2>Films</h2>
                {renderList(person.films, films, 'title')}
                <h2>Species</h2>
                {renderList(person.species, species, 'name')}
                <h2>Vehicles</h2>
                {renderList(person.vehicles, vehicles, 'name')}
                <h2>Starships</h2>
                {renderList(person.starships, starships, 'name')}
            </div>
        );
    }

    function renderList(urls, objects, field) {
        // handle single item
        if (urls && !(urls instanceof Array)) {
            urls = [ urls ];
        }
        if (objects && !(objects instanceof Array)) {
            objects = [ objects ];
        }

        if (!urls || !urls.length) {
            return (
                <ul className="empty">
                    <li>none</li>
                </ul>
            );
        } else {
            return (
                <ul>
                    {urls.map(renderItem)}
                </ul>                
            );
        }

        function renderItem(url, i) {
            let label;
            if (objects && objects[i]) {
                label = objects[i][field];
            } else {
                label = <span className="pending">...</span>;
            }
            return <li key={i}>{label}</li>;
        }
    }

}

const component = Relaks.memo(CharacterPage);

export {
    component as CharacterPage,
};
```

In succession we retrieve the `films` in which the character appeared, his `species`, his `homeworld`, the `vehicles` he has driven, and the `starships` he has piloted. We wait each time for the data to arrive, place it into `props` and call `meanwhile.show()`. In this manner the page renders progressively. For the end-user, the page will feel responsive because things appears as soon as he clicks the link.

Data requests are ordered pragmatically. We know that the film list is likely the first piece of information a visitor seeks. We also know that the list is more likely to be fully cached. That's why it's fetched first. Conversely, we know
the list of starships is at the bottom of the page, where it might not be visible initially. We can therefore fetch it last.

You will likely make similar decisions with your own code. Mouse-overs and pop-ups are frequently used to show supplemental details. These should always be fetched after the primary information. Since it takes a second or two for the user to position the mouse cursor (or his finger) over the button, there's ample time for the data to arrive.

The minimum percentage given to `fetchMultiple()` is another trick used to improve perceived responsiveness. It tells `DjangoDataSource` that we wish to receive a partial result-set immediately if 60% of the items requested can be found in the cache. That allows us to show a list that's largely complete instead of a blank. When the full result-set finally arrives, `DjangoDataSource` will emit a `change` event. Subsequent rerendering then fills in the gaps.

`CharacterPageSync` ([same file](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/character-page.jsx)) is responsible for drawing the page. There's nothing noteworthy about its `render()` method. It's just run-of-the-mill React code:

```javascript
/* ... */
```

## Next step

The front-end in this example is fairly crude. In the [follow up example](https://github.com/trambarhq/relaks-starwars-example-sequel), we'll develop it into something that better resembles a production web-site.
