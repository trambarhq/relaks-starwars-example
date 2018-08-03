# Relaks Star Wars Example

This is an example demonstrating how to build a data-driven web page using
Relaks. [Relaks](https://github.com/chung-leong/relaks) is a [React](https://reactjs.org/)
component that let you implement an asynchronous render method. In lieu of
a `ReactElement`, `renderAsync()` returns a [promise](https://promisesaplus.com/)
of a `ReactElement`. When the promise resolves itself, the element is rendered.

This example actually employs [Preact](https://preactjs.com/). Aside from
different import statements and initiation code, the example would work the same
way with React. Preact was chosen because the small size and simplicity of
Relaks will likely appeal most to developer using Preact.

The data source for this example is [swapi.co](https://swapi.co/), a public
Star Wars knowledge base powered by [Django](https://www.djangoproject.com/).
The web page shows a list of Star Wars characters. When you click on a name, it
shows additional information about him/her/it. You can see it in action
[here](https://trambar.io/examples/starwars-iv/).

## Getting started

To see the code running in debug mode, first clone this repository. In the
working folder, run `npm install`. Once that's done, run `npm run start` to
launch [WebPack Dev Server](https://webpack.js.org/configuration/dev-server/).
Open a browser window and enter `http://localhost:8080` as the location.

## Application Structure

Okay, let's dive into the code! **Application**
([application.jsx](https://github.com/chung-leong/relaks-starwars-example/blob/master/src/application.jsx))
is the root node of the app. It's a regular Preact component. Its render
function is very simple. It calls one method to render the user interface and
another to render components that aren't visible:

```js
render() {
    return (
        <div>
            {this.renderUserInterface()}
            {this.renderConfiguration()}
        </div>
    );
}
```

`renderUserInterface()` is also quite straight forward. It renders a
**CharacterPage** component when a character is selected. Otherwise it renders
a **CharacterList**. Note how both components receives `swapi`. That's the
interface through which they retrieve needed data from [swapi.co](https://swapi.co/).

```js
renderUserInterface() {
    let { swapi, person } = this.state;
    if (!swapi) {
        return null;
    }
    if (!person) {
        let props = { swapi, onSelect: this.handlePersonSelect };
        return <CharacterList {...props} />;
    } else {
        let props = { swapi, person, onReturn: this.handlePersonUnselect };
        return <CharacterPage {...props} />;
    }
}
```

`renderConfiguration()` is even simpler. It renders just a single component:
**DjangoDataSource**. This component is responsible for retrieving remote data.
Its presence in the component tree means you can easily examine its state using
[React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi).

```js
renderConfiguration() {
    let props = { onChange: this.handleDataSourceChange };
    return (
        <div>
            <DjangoDataSource {...props} />
        </div>
    );
}
```

**DjangoDataSource** accepts an `onChange` handler. It's triggered whenever new
data becomes available--that is to say, when rerunning a query might produce
different data than before. The handler is triggered when the component is
mounted, to start the initial data loading process.

Here's the method handle the event:

```js
handleDataSourceChange = (evt) => {
    this.setState({ swapi: new SWAPI(evt.target) });
}
```

**SWAPI** ([swapi.js](https://github.com/chung-leong/relaks-starwars-example/blob/master/src/swapi.js))
is a proxy object. Its main purpose is to let other components access methods of
**DjangoDataSource**. While **DjangoDataSource** sits at the root of the
component tree, **SWAPI** is meant to be passed throughout the tree, to any
component that needs remote data.

The proxy object serves a second critical function. Because it's recreated
whenever an `onChange` event occurs, it'll trip the `shouldComponentUpdate()`
methods of ["pure" components](https://reactjs.org/docs/react-api.html#reactpurecomponent),
as they usually make the determination based on a shallow comparison.

While **DjangoDataSource** is supposed to be reusable, something that you might
obtain from npmjs.com, the proxy object is project specific. You would write it
(and name it however you like). It's a place where you can place your debugging
code, convenience methods, and perhaps additional information needed by
components of your app. For instance, it could be where native promises returned
by the third-party code are converted to more powerful ones like
[Bluebird](http://bluebirdjs.com).

## Character List

**CharacterList** ([character-list.jsx](https://github.com/chung-leong/relaks-starwars-example/blob/master/src/character-list.jsx))
is a Relaks component. It implements `renderAsync()`:

```js
async renderAsync(meanwhile) {
    let { swapi } = this.props;
    let props = {
        people: null,
        onSelect: this.props.onSelect,
    };
    meanwhile.show(<CharacterListSync {...props} />);
    props.people = await swapi.fetchList('/people/');
    props.people.more();
    return <CharacterListSync {...props} />;
}
```

Note the method's one parameter. The **Meanwhile** object lets you control the
component's behavior in the time prior to the resolution of the promise it
returns--i.e. while the asynchronous operation is ongoing. Here, the method
asks that a **CharacterListSync** be shown (with a prop still missing). It then
makes a request for a list of people in the Star Wars universe and waits for the
response. Execution of the method is halted at this point. When the data arrives,
execution resumes. The method schedules the retrieval of the next page of data.
It then return another **CharacterListSync**, this time with `props.people` set
to an array of objects.

When the next page of data arrives, **DjangoDataSource** fires an onChange
event. `renderAsync()` will get called again due to a prop change. `fetchList()`
will return an array with more objects than before. `more()` is called and
another request for data is made. The process repeats itself until we've
reached the end of the list.

As the list of Star Wars characters isn't particularly long, retrieving the full
list is pretty sensible. In a more sophisticated implementation, one that deals
with large data sets, `.more()` would likely be called in `onScroll` handler
instead.

**CharacterListSync** ([in the same file](https://github.com/chung-leong/relaks-starwars-example/blob/master/src/character-list.jsx))
is a regular Preact component. It's the component that actually draws the
interface, while the async component merely retrieves data. Splitting up
responsibilities in this way has some important benefits:

1. You can easily examine the retrieved data during React Developer Tools.
2. If the sync component extends **PureComponent** (not done in the example), it
   wouldn't rerender when the async component fetches the exact same data as
   before.
3. The sync component can be more easily tested using automated test tools
   (karma, enzyme, etc).
4. The sync component can be developed in isolation. Suppose our data retrieval
   code is still very buggy--or the backend isn't ready yet. A developer, whose
   expertise is perhaps mainly in layout and CSS, can still work on the
   component. All he has to do is export **CharacterListSync** as
   **CharacterList** and attach some dummy data as the sync component's default
   props.

The render method of **CharacterListSync** is entirely mundane:

```js
render() {
    let { people } = this.props;
    if (!people) {
        return <h2>Loading...</h2>;
    }
    return (
        <ul className="character-list">
        {
            people.map((person) => {
                let linkProps = {
                    href: person.url,
                    onClick: this.handleClick,
                };
                return (
                    <li>
                        <a {...linkProps}>{person.name}</a>
                    </li>
                );
            })
        }
        </ul>
    );
}
```

`Meanwhile.show()` operates on a timer. The promise returned by `renderAsync()`
have a 50ms to resolve itself before the component shows the contents given to
`Meanwhile.show()`. When data is cached and promises fulfill rapidly, the
loading message would not appear at all.

## Character Page

**CharacterPage** ([character-page.jsx](https://github.com/chung-leong/relaks-starwars-example/blob/master/src/character-page.jsx))
is another Relaks component. Its `renderAsync()` method is slightly more complex:

```js
async renderAsync(meanwhile) {
        let { swapi, person } = this.props;
        let props = {
            homeworld: null,
            films: null,
            species: null,
            vehicles: null,
            starships: null,

            person,
            onReturn: this.props.onReturn,
        };
        meanwhile.show(<CharacterPageSync {...props} />);
        props.films = await swapi.fetchMultiple(person.films, { partial: 0.4 });
        meanwhile.show(<CharacterPageSync {...props} />);
        props.species = await swapi.fetchMultiple(person.species, { partial: 0.4 });
        meanwhile.show(<CharacterPageSync {...props} />);
        props.homeworld = await swapi.fetchOne(person.homeworld);
        meanwhile.show(<CharacterPageSync {...props} />);
        props.vehicles = await swapi.fetchMultiple(person.vehicles, { partial: 0.4 });
        meanwhile.show(<CharacterPageSync {...props} />);
        props.starships = await swapi.fetchMultiple(person.starships, { partial: 0.4 });
        meanwhile.show(<CharacterPageSync {...props} />);
        return <CharacterPageSync {...props} />;
    }
```

In succession we retrieve the films in which the character appeared, his
species, his homeworld, and vehicles he has driven or piloted. We wait each time
for the data to arrive, place it into `props` and call `Meanwhile.show()`. In
this manner the page renders progressively. For the end-user, the page will feel
responsive because things appears as soon as he clicks the link.

Data requests are ordered pragmatically. We know that the film list is likely
the first piece of information the user seeks. We also know that the list is
likely to be fully cached. That's why it's retrieved first. Conversely, we know
the list of starships is at the bottom of the page, where it might not be
visible initially. We can therefore retrieve it last.

You will likely make similar decisions with your own app. Mouse-overs and
pop-ups are frequently used to show supplemental details. These should always
be fetched after the primary information. Since it takes a second or two for
the user to position the mouse cursor (or his finger) over the button, there's
ample time for the data to arrive.

**CharacterPageSync** is responsible for drawing the page. There's nothing
noteworthy about its `render()` method. It's just run-of-the-mill React code:

```js
render() {
    let { person } = this.props;
    let linkProps = {
        className: 'return-link',
        href: '#',
        onClick: this.handleReturnClick,
    };
    return (
        <div className="character-page">
            <a {...linkProps}>Return to list</a>
            <h1>{person.name}</h1>
            <div>Height: {person.height} cm</div>
            <div>Mass: {person.mass} kg</div>
            <div>Hair color: {person.hair_color}</div>
            <div>Skin color: {person.skin_color}</div>
            <div>Eye color: {person.eye_color}</div>
            <div>Birth year: {person.birth_year}</div>
            <h2>Homeworld</h2>
            {this.renderHomeworld()}
            <h2>Films</h2>
            {this.renderFilms()}
            <h2>Species</h2>
            {this.renderSpecies()}
            <h2>Vehicles</h2>
            {this.renderVehicles()}
            <h2>Starships</h2>
            {this.renderStarships()}
        </div>
    );
}
```
