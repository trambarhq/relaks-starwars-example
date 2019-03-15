import React from 'react';
import Relaks, { useProgress } from 'relaks/hooks';

const component = Relaks(CharacterPage);

/**
 * Retrieve remote data and render the synchronize half of this component
 *
 * @param  {Object}  aprops
 *
 * @return {React}
 */
async function CharacterPage(aprops) {
    const { swapi, person, onReturn } = aprops;
    const [ show ] = useProgress(); 
    const sprops = { person, onReturn };
    show(<CharacterPageSync {...sprops} />);
    sprops.films = await swapi.fetchMultiple(person.films, { minimum: '60%' });
    show(<CharacterPageSync {...sprops} />);
    sprops.species = await swapi.fetchMultiple(person.species, { minimum: '60%' });
    show(<CharacterPageSync {...sprops} />);
    sprops.homeworld = await swapi.fetchOne(person.homeworld);
    show(<CharacterPageSync {...sprops} />);
    sprops.vehicles = await swapi.fetchMultiple(person.vehicles, { minimum: '60%' });
    show(<CharacterPageSync {...sprops} />);
    sprops.starships = await swapi.fetchMultiple(person.starships, { minimum: '60%' });
    return <CharacterPageSync {...sprops} />;
}

/**
 * Render the component, making best effort using what props are given
 *
 * @return {ReactElement}
 */
function CharacterPageSync(sprops) {
    const { person, homeworld, films, species, vehicles, starships, onReturn } = sprops;

    const handleReturnClick = (evt) => {
        if (evt.button === 0) {
            if (onReturn) {
                onReturn();
            }
            evt.preventDefault();
        }
    };

    return (
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

    /**
     * Render a list of objects using their URLs as keys. Render "..." if an
     * object is not yet retrieved.
     *
     * @param  {Array<String>} urls
     * @param  {Object<Object>} objects
     * @param  {String} field
     *
     * @return {ReactElement}
     */    
    function renderList(urls, objects, field) {
        if (urls && !(urls instanceof Array)) {
            urls = [ urls ];
        }
        if (objects && !(objects instanceof Array)) {
            objects = [ objects ];
        }
        if (!urls || !urls.length) {
            return <ul className="empty"><li>none</li></ul>;
        }
        return (
            <ul>
            {
                urls.map((url, i) => {
                    let object = (objects) ? objects[i] : null;
                    if (object) {
                        let text = object[field];
                        return <li key={i}>{text}</li>;
                    } else {
                        return <li key={i}><span className="pending">...</span></li>;
                    }
                })
            }
            </ul>
        );
    }
}

export {
    component as default,
    component as CharacterPage,
    CharacterPageSync,
};
