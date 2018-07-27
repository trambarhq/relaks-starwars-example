import { h, render, Component } from 'preact';
import { AsyncComponent } from 'prelaks';

/** @jsx h */

class CharacterPage extends AsyncComponent {
    async renderAsync(meanwhile) {
        let { swapi, person } = this.props;
        var props = {
            homeworld: null,
            films: null,
            species: null,
            vehicles: null,
            starships: null,

            person,
            onReturn: this.props.onReturn,
        };
        meanwhile.show(<CharacterPageSync {...props} />);
        props.films = await swapi.fetchMultiple(person.films, { partial: 0.5 });
        meanwhile.show(<CharacterPageSync {...props} />);
        props.species = await swapi.fetchMultiple(person.species, { partial: 0.5 });
        meanwhile.show(<CharacterPageSync {...props} />);
        props.homeworld = await swapi.fetchOne(person.homeworld);
        meanwhile.show(<CharacterPageSync {...props} />);
        props.vehicles = await swapi.fetchMultiple(person.vehicles, { partial: 0.5 });
        meanwhile.show(<CharacterPageSync {...props} />);
        props.starships = await swapi.fetchMultiple(person.starships, { partial: 0.5 });
        meanwhile.show(<CharacterPageSync {...props} />);
        return <CharacterPageSync {...props} />;
    }
}

class CharacterPageSync extends Component {
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

    renderHomeworld() {
        let { person, homeworld } = this.props;
        var urls = person.homeworld ? [ person.homeworld ] : [];
        var homeworlds = {};
        if (homeworld) {
            homeworlds[urls[0]] = homeworld;
        }
        return this.renderList(urls, homeworlds, 'name');
    }

    renderFilms() {
        let { person, films } = this.props;
        return this.renderList(person.films, films, 'title');
    }

    renderSpecies() {
        let { person, species } = this.props;
        return this.renderList(person.species, species, 'name');
    }

    renderVehicles() {
        let { person, vehicles } = this.props;
        return this.renderList(person.vehicles, vehicles, 'name');
    }

    renderStarships() {
        let { person, starships } = this.props;
        return this.renderList(person.starships, starships, 'name');
    }

    renderList(urls, objects, field) {
        if (!urls || !urls.length) {
            return <ul className="empty"><li>none</li></ul>;
        }
        return (
            <ul>
            {
                urls.map((url) => {
                    var object = (objects) ? objects[url] : null;
                    if (object) {
                        var text = object[field];
                        return <li>{text}</li>;
                    } else {
                        return <li><span className="pending">...</span></li>;
                    }
                })
            }
            </ul>
        );
    }

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
