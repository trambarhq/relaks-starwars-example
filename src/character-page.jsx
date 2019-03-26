import React from 'react';
import Relaks, { useProgress } from 'relaks';

async function CharacterPage(props) {
    const { swapi, person, onReturn } = props;
    const [ show ] = useProgress(); 

    const handleReturnClick = (evt) => {
        if (evt.button === 0) {
            if (onReturn) {
                onReturn();
            }
            evt.preventDefault();
        }
    };

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
                {
                    urls.map((url, i) => {
                        let label;
                        if (objects && objects[i]) {
                            label = objects[i][field];
                        } else {
                            label = <span className="pending">...</span>;
                        }
                        return <li key={i}>{label}</li>;
                    })
                }
                </ul>                
            );
        }
    }
}

const component = Relaks.memo(CharacterPage);

export {
    component as default,
    component as CharacterPage,
};
