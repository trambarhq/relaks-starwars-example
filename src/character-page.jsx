import { h, Component } from 'preact';
import { AsyncComponent } from 'relaks/preact';

/** @jsx h */

class CharacterPage extends AsyncComponent {
    static displayName = 'CharacterPage';

    /**
     * Retrieve remote data and render the synchronize half of this component
     *
     * @param  {Meanwhile}  meanwhile
     *
     * @return {VNode}
     */
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
        props.films = await swapi.fetchMultiple(person.films, { minimum: '60%' });
        meanwhile.show(<CharacterPageSync {...props} />);
        props.species = await swapi.fetchMultiple(person.species, { minimum: '60%' });
        meanwhile.show(<CharacterPageSync {...props} />);
        props.homeworld = await swapi.fetchOne(person.homeworld);
        meanwhile.show(<CharacterPageSync {...props} />);
        props.vehicles = await swapi.fetchMultiple(person.vehicles, { minimum: '60%' });
        meanwhile.show(<CharacterPageSync {...props} />);
        props.starships = await swapi.fetchMultiple(person.starships, { minimum: '60%' });
        meanwhile.show(<CharacterPageSync {...props} />);
        return <CharacterPageSync {...props} />;
    }
}

class CharacterPageSync extends Component {
    static displayName = 'CharacterPageSync';

    /**
     * Render the component, making best effort using what props are given
     *
     * @return {VNode}
     */
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

    /**
     * Render name of character's homeworld
     *
     * @return {VNode}
     */
    renderHomeworld() {
        let { person, homeworld } = this.props;
        let urls = person.homeworld ? [ person.homeworld ] : [];
        let homeworlds = homeworld ? [ homeworld ] : [];
        return this.renderList(urls, homeworlds, 'name');
    }

    /**
     * Render list of films in which the character appears
     *
     * @return {VNode}
     */
    renderFilms() {
        let { person, films } = this.props;
        return this.renderList(person.films, films, 'title');
    }

    /**
     * Render list of species to which the character belong
     *
     * @return {VNode}
     */
    renderSpecies() {
        let { person, species } = this.props;
        return this.renderList(person.species, species, 'name');
    }

    /**
     * Render list of vehicles the character has driven
     *
     * @return {VNode}
     */
    renderVehicles() {
        let { person, vehicles } = this.props;
        return this.renderList(person.vehicles, vehicles, 'name');
    }

    /**
     * Render list of starships the character has flown
     *
     * @return {VNode}
     */
    renderStarships() {
        let { person, starships } = this.props;
        return this.renderList(person.starships, starships, 'name');
    }

    /**
     * Render a list of objects using their URLs as keys. Render "..." if an
     * object is not yet retrieved.
     *
     * @param  {Array<String>} urls
     * @param  {Object<Object>} objects
     * @param  {String} field
     *
     * @return {VNode}
     */
    renderList(urls, objects, field) {
        if (!urls || !urls.length) {
            return <ul className="empty"><li>none</li></ul>;
        }
        return (
            <ul>
            {
                urls.map((url, index) => {
                    let object = (objects) ? objects[index] : null;
                    if (object) {
                        let text = object[field];
                        return <li>{text}</li>;
                    } else {
                        return <li><span className="pending">...</span></li>;
                    }
                })
            }
            </ul>
        );
    }

    /**
     * Called when user clicks the "Return to list" link
     *
     * @param  {Event} evt
     */
    handleReturnClick = (evt) => {
        if (evt.button === 0) {
            if (this.props.onReturn) {
                this.props.onReturn({
                    type: 'return',
                    target: this,
                });
            }
            evt.preventDefault();
        }
    }
}

export {
    CharacterPage as default,
    CharacterPage,
    CharacterPageSync,
};
