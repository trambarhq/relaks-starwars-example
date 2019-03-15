import React from 'react';
import Relaks, { useProgress } from 'relaks/hooks';

/**
 * Retrieve remote data and render the synchronize half of this component
 *
 * @param  {Object}  aprops
 *
 * @return {ReactElement}
 */
async function CharacterList(aprops) {
    const { swapi, onSelect } = aprops;
    const [ show ] = useProgress(); 
    const sprops = { onSelect };
    show(<CharacterListSync {...sprops} />);
    sprops.people = await swapi.fetchList('/people/');
    sprops.people.more();
    return <CharacterListSync {...sprops} />;
}

/**
 * Render the component, making best effort using what props are given
 *
 * @return {ReactElement}
 */
function CharacterListSync(sprops) {
    const { people, onSelect } = sprops;

    const handleClick = (evt) => {
        if (evt.button === 0) {
            const url = evt.currentTarget.href;
            const person = people.find((person) => {
                return (person.url === url);
            });
            if (person && onSelect) {
                onSelect({ person });
            }
            evt.preventDefault();
        }
    };

    if (!people) {
        return <h2>Loading...</h2>;
    }
    return (
        <ul className="character-list">
            {people.map(renderPerson)}
        </ul>
    );

    function renderPerson(person, i) {
        const linkProps = {
            href: person.url,
            onClick: handleClick,
        };
        return (
            <li key={i}>
                <a {...linkProps}>{person.name}</a>
            </li>
        );        
    }
}

const asyncComponent = Relaks(CharacterList);
const syncComponent = CharacterListSync;

export {
    asyncComponent as default,
    asyncComponent as CharacterList,
    syncComponent as CharacterListSync,
};
