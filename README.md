Relaks Star Wars Example
------------------------
This is an example demonstrating how to build a data-driven web page using [Relaks](https://github.com/trambarhq/relaks). 

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

Okay, let's dive into the code! In [main.js](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/main.js), you'll find the function `initialize()`. It's invoked when the HTML page emits a 'load' event. The function bootstraps the front-end. First it creates a `DjangoDataSource` ([django-data-source.js](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/django-data-source.js)) object. It then creates the React element `FrontEnd`, using the data source as a prop. Finally it renders the element into a DOM node.

```javascript
function initialize(evt) {
    let dataSource = new DjangoDataSource;
    let container = document.getElementById('react-container');
    let element = createElement(FrontEnd, { dataSource });
    render(element, container);
}
```

`FrontEnd` ([front-end.jsx](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/front-end.jsx)) is the root node of the client. It's a regular React component. Its render function is relatively simple:

```javascript
function FrontEnd(props) {
    const { dataSource } = props;
    const [ swapiChanged, setSWAPIChanged ] = useEventTime();
    const [ person, setPerson ] = useState(null);
    const swapi = useMemo(() => {
        return new SWAPI(dataSource);
    }, [ dataSource, swapiChanged ]);

    useEffect(() => {
        dataSource.onChange = setSWAPIChanged;

        return () => {
            dataSource.onChange = null;
        };
    }, [ dataSource ]);

    const handlePersonSelect = (evt) => { 
        setPerson(evt.person); 
    };
    const handlePersonUnselect = (evt) => { 
        setPerson(null); 
    };

    if (!person) {
        return <CharacterList swapi={swapi} onSelect={handlePersonSelect} />;
    } else {
        return <CharacterPage swapi={swapi} person={person} onReturn={handlePersonUnselect} />;
    }
}
```

When no character is selected, it renders `CharacterList`. When one is selected, it renders `CharacterPage`. Both components are wrapped by [React.memo()](https://reactjs.org/docs/react-api.html#reactmemo). They'll only rerender when they receive new props.

`swapi` is an instance of `SWAPI` ([swapi.js](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/swapi.js)). It's a wrapper around the data source object. It's maintained using the `useMemo` hook. When the value of `dataSource` or `swapiChanged` changes, a new instance of SWAPI is created. This forces rerendering of `CharacterPage` or  `CharacterList`.  

`swapiChanged` is a `Date` object. It's set by the `useEventTime` hook (which uses `useState` to store it). When `setSWAPIChanged` is invoked by `DjangoDataSource`, `swapiChanged` gets set to the current time.

Triggering the recreation of the wrapper object in this manner might seem roundabout. Why not store `swapi` in a state variable and have the event handler call the setter? The reason is we want to avoid storing values derived from props in a component's state. That often leads to buggy code. Consider this alternate implementation:

```javascript
function FrontEnd(props) {
    const { dataSource } = props;
    const [ swapi, setSWAPI ] = useState(() => {
        return new SWAPI(dataSource);
    });
    const [ person, setPerson ] = useState(null);

    useEffect(() => {
        dataSource.onChange = (evt) => {
            setSWAPI(new SWAPI(dataSource));
        };

        return () => {
            dataSource.onChange = null;
        };
    }, [ dataSource ]);

    /* ... */
}
```

That'll work, but only because in this example `FrontEnd` never receives new props. If it does receives a new `dataSource`, then the derived state would no longer be in sync. We avoid this problem by deriving the value in a `useMemo` hook with a dependency on a state variable.

## Character list

`CharacterList` ([character-list.jsx](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/character-list.jsx)) is a Relaks component.

```javascript
import React, { useCallback } from 'react';
import Relaks, { useProgress } from 'relaks';

async function CharacterList(aprops) {
    const { swapi, onSelect } = aprops;
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

const component = Relaks.memo(CharacterList);

export {
    component as CharacterList,
};
```


When the next page of data arrives, `DjangoDataSource` fires an `change` event. `renderAsync()` will get called again due to the prop change (namely `swapi`). `fetchList()` will return an array with more objects than before. `more()` is called and another request for data is made. The process repeats itself until we've reached the end of the list.

As the list of Star Wars characters isn't particularly long, retrieving the full list is pretty sensible. In a more sophisticated implementation, one that deals with larger data sets, `.more()` would be called in a `scroll` event handler instead.


`meanwhile.show()` operates on a timer. The promise returned by `renderAsync()` have a 50ms to fulfill itself before the component shows the contents given to `meanwhile.show()`. When data is cached and promises resolve rapidly, the loading message would not appear at all.

## Character page

**CharacterPage** ([character-page.jsx](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/character-page.jsx)) is another Relaks component. 

```javascript
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

In succession we retrieve the `films` in which the character appeared, his `species`, his `homeworld`, the `vehicles` he has driven, and the `starships` he has piloted. We wait each time for the data to arrive, then call `render()`. In this manner the page renders progressively. For the end-user, the page will feel responsive because things appears as soon as he clicks the link.

Data requests are ordered pragmatically. We know that the film list is likely the first piece of information a visitor seeks. We also know that the list is more likely to be fully cached. That's why it's fetched first. Conversely, we know the list of starships is at the bottom of the page, where it might not be visible initially. We can therefore fetch it last.

You will likely make similar decisions with your own code. Mouse-overs and pop-ups are frequently used to show supplemental details. These should always be fetched after the primary information. Since it takes a second or two for the user to position the mouse cursor (or his finger) over the button, there's ample time for the data to arrive.

The minimum percentage given to `fetchMultiple()` is another trick used to improve perceived responsiveness. It tells `DjangoDataSource` that we wish to receive a partial result-set immediately if 60% of the items requested can be found in the cache. That allows us to show a list that's largely complete instead of a blank. When the full result-set finally arrives, `DjangoDataSource` will emit a `change` event. Subsequent rerendering then fills in the gaps.

## Next step

The front-end in this example is fairly crude. In the [follow up example](https://github.com/trambarhq/relaks-starwars-example-sequel), we'll develop it into something that better resembles a production web-site.
