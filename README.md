Relaks Star Wars Example
------------------------
This is an example demonstrating how to build a data-driven web page using [Relaks](https://github.com/trambarhq/relaks). It uses data from [swapi.co](https://swapi.co/), a public Star Wars knowledge base powered by [Django](https://www.djangoproject.com/). Initially, it shows a list of Star Wars characters. When you click on a name, it displays additional information about him/her/it. You can see it in action [here](https://trambar.io/examples/starwars-iv/).

![Screenshot](docs/img/screenshot.png)

## Getting started

To see the code running in debug mode, first clone this repository. In the working folder, run `npm install`. Once that's done, run `npm run dev` to launch [WebPack Dev Server](https://webpack.js.org/configuration/dev-server/). A browser window should open automatically. If not, open one and enter `http://localhost:8080` as the location.

The example assume that you're familiar with React and the npm/WebPack tool-chain. If you're not, you should first consult the [React tutorial](https://reactjs.org/docs/getting-started.html). Also read [this document](docs/configuration.md) describing the example's configuration files.

## FrontEnd

Okay, let's dive into the code! In [main.js](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/main.js), you'll find the function `initialize()`. It's invoked when the HTML page emits a 'load' event. The function bootstraps the front-end.

```javascript
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
```

First it creates a `DataSource` ([data-source.js](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/data-source.js)) object. It then creates the React element `FrontEnd`, using the data source as a prop. Finally it renders the element into a DOM node.

`FrontEnd` ([front-end.jsx](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/front-end.jsx)) is the root node of the client. It's a regular React functional component. Its source code is listed below. We'll walk through the function line by line.

```javascript
import React, { useState, useEffect, useMemo } from 'react';
import { useEventTime, useListener } from 'relaks';
import { SWAPI } from './swapi.js';
import { CharacterList } from './character-list.jsx';
import { CharacterPage } from './character-page.jsx';

import './style.scss';

export function FrontEnd(props) {
  const { dataSource } = props;
  const [ dataChanged, setDataChanged ] = useEventTime();
  const swapi = useMemo(() => {
    return new SWAPI(dataSource);
  }, [ dataSource, dataChanged ]);
  const [ person, setPerson ] = useState(null);

  const handlePersonSelect = useListener((evt) => {
    setPerson(evt.person);
  });
  const handlePersonUnselect = useListener((evt) => {
    setPerson(null);
  });

  useEffect(() => {
    dataSource.onChange = setDataChanged;
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
```

The first line of `FrontEnd` simply places the component's props into local variables:

```javascript
  const { dataSource } = props;
```

We only have one: our data source object.

The next line invokes `useEventTime`, a utility hook provided by Relaks:

```javascript
  const [ dataChanged, setDataChanged ] = useEventTime();
```

`useEventTime` functions like [`useState`](https://reactjs.org/docs/hooks-state.html), only that its setter assigns the current time to the state variable. `dataChanged` is referenced by the code that immediately follows:

```javascript
  const swapi = useMemo(() => {
    return new SWAPI(dataSource);
  }, [ dataSource, dataChanged ]);
```

A [`useMemo`](https://reactjs.org/docs/hooks-reference.html#usememo) hook is used to maintain an instance of `SWAPI`. It's a proxy object for `DjangoDataSource`. It'll be passed down to sub-components that require remote data. `useMemo`  will recreate this object when either `dataSource` or `dataChanged` is different. This forces [memoized components](https://reactjs.org/docs/react-api.html#reactmemo) to rerender.

`useState` is then used to create the state variable `person`:

```javascript
  const [ person, setPerson ] = useState(null);
```

The setter function is invoked in callbacks given to sub-components:

```javascript
  const handlePersonSelect = useListener((evt) => {
    setPerson(evt.person);
  });
  const handlePersonUnselect = useListener((evt) => {
    setPerson(null);
  });
```

`useListener` is a utility hook provided by Relaks. It works like React's [`useCallback`](https://reactjs.org/docs/hooks-reference.html#usecallback), except there's no need to specify any dependencies. The function passed last to `useListener` is always the one that gets called. It's like using `useCallback` without specifying dependencies, only you don't get a different function object each time.  

Next, we attached a `change` event listener to `dataSource` in a [`useEffect`](https://reactjs.org/docs/hooks-reference.html#useeffect) hook:

```javascript
  useEffect(() => {
    dataSource.onChange = setDataChanged;
    return () => {
      dataSource.onChange = null;
    };
  }, [ dataSource ]);
```

When a `change` event occurs, `setDataChanged` will be called. During the next rendering cycle, `dataChanged` will be a brand new `Date` object. This causes `useMemo` to create a fresh copy of `swapi`. This in turn forces memoized, data-dependent sub-components to rerender.

The clean-up code is only provided here for the sake of completeness. `dataSource` won't actually change.

At the end of the function, one of two sub-components is returned: `CharacterPage` when a character is selected or `CharacterList` when no one is:

```javascript
  if (!person) {
    return <CharacterList swapi={swapi} onSelect={handlePersonSelect} />;
  } else {
    return <CharacterPage swapi={swapi} person={person} onReturn={handlePersonUnselect} />;
  }
```

Whew! I hope that wasn't too hard to understand. Let us move onto the actual visual components, ones that actually draw something.

## Character list

`CharacterList` ([character-list.jsx](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/character-list.jsx)) is a Relaks functional component. It's based on an [asynchronous JavaScript function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function). Its source code is listed below. Further down we'll do a break-down of what the function does.

```js
import React from 'react';
import Relaks, { useProgress, useListener } from 'relaks';

export async function CharacterList(props) {
  const { swapi, onSelect } = props;
  const [ show ] = useProgress();

  const handleClick = useListener((evt) => {
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

Once again we start out by assigning the component's props to local variables:

```javascript
  const { swapi, onSelect } = props;
```

The next line obtains the function `show` from the `useProgress` hook, provided by Relaks:

```javascript
  const [ show ] = useProgress();
```

As the name implies, the function is used to display contents as they become available over time.

An `onClick` handler is then created for selecting a character:

```javascript
  const handleClick = useListener((evt) => {
    if (evt.button === 0) {
      const url = evt.currentTarget.href;
      const person = people.find(person => person.url === url);
      if (person && onSelect) {
        onSelect({ person });
      }
      evt.preventDefault();
    }
  });
```

What follows is the "meat" of the component:

```javascript
  render();
  const people = await swapi.fetchList('/people/');
  render();
```

`render()` is called to give the component an initial appearance. An asynchronous request is then made to obtain the list of Star Wars characters from the remote server. When the data finally arrives, `render()` is called again to display it.

`render()` is a helper function that makes use of variables defined outside it (`people`, `show`, and `renderPerson`):

```javascript
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
```

The first time it's called, `people` is still `undefined`. Accordingly, it chooses to display a loading message. When it's called the second time, `people` will hold an array of objects. The actual character list can be rendered at this point.

By default, `swapi.fetchList()` will only fetch the first page (10 records). When `people.more()` is called, the data source will fetch the next page then emits a `change` event. Rerendering occurs and the subsequent call to `fetchList()` would immediately yield 20 records. `more()` gets called again and the next page is fetched. This continues until the full list has been obtained.

The above arrangement assumes that the list is relatively short. We know that there're less than 200 characters in the Star Wars universe. In a scenario where the number of records can be in the thousands, it would be more sensible to trigger the fetching operation in a scroll handler.

## Character page

**CharacterPage** ([character-page.jsx](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/character-page.jsx)) is another Relaks component. It's somewhat more complicated due to the need to load related data.

```js
import React from 'react';
import Relaks, { useProgress, useListener } from 'relaks';

export async function CharacterPage(props) {
  const { swapi, person, onReturn } = props;
  const [ show ] = useProgress();

  const handleReturnClick = useListener((evt) => {
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
```

Once again, we start by placing the component's props into local variables:

```javascript
  const { swapi, person, onReturn } = props;
```

Again, we obtain `show` from Relaks's `useProgress` hook:

```javascript
  const [ show ] = useProgress();
```

And again we create a callback for navigation purpose:

```javascript
  const handleReturnClick = useListener((evt) => {
    if (evt.button === 0) {
      if (onReturn) {
        onReturn();
      }
      evt.preventDefault();
    }
  });
```

The "meat" of the component is a bit meatier:

```javascript
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
```

During the first call to `render()`, `person` is already available. We know a lot about the Star Wars character in question (see [example](https://swapi.co/api/people/1/)): name, height, weight, and so forth. We also know in *how many* films he appeared in, *how many* vehicles he had driven and *how many* starships he had piloted. We don't know the names of these things but we know how many there are. We have enough information to create the full structure of the page. So we do that in `render()`:

```javascript
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
```

As soon as the user clicks on a link, he'll see the basic information. The variable `homeworld`, `films`, `species`, `vehicles`, and `starships` are all `undefined` initially. We can render the correct number of list items but not the actual text. Placeholders are still better than an empty space. And as the necessary objects are fetched, we call `render()` to display more and more information. Until we finally we have everything.

Data requests are ordered pragmatically. We know that the film list is likely the first piece of information a visitor seeks. We also know that the list is more likely to be fully cached. So we fetch it first. Conversely, we know the list of starships sits at the bottom of the page, where it won't be visible initially. We can therefore fetch it last.

The minimum percentage given to `fetchMultiple()` is another trick used to improve perceived responsiveness. It tells `DjangoDataSource` that we wish to receive a partial result-set immediately if 60% of the items requested can be found in the cache. That allows us to show a list that's largely complete instead of a blank. When the full result-set finally arrives, `DjangoDataSource` will emit a `change` event. Subsequent rerendering then fills in the gaps.

## Next step

Well, that's it! This example is fairly crude. It doesn't show all information available through swapi.co. The back button doesn't work as one expects. In the [follow up example](https://github.com/trambarhq/relaks-starwars-example-sequel), we'll develop it into something that better resembles a production web-site.
