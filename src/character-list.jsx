import React from 'react';
import Relaks, { useProgress } from 'relaks';

async function CharacterList(aprops) {
    const { swapi, onSelect } = aprops;
    const [ show ] = useProgress(); 

    const handleClick = (evt) => {
        if (evt.button === 0) {
            const url = evt.currentTarget.href;
            const person = people.find(person => person.url === url);
            if (person && onSelect) {
                onSelect({ person });
            }
            evt.preventDefault();
        }
    };

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
    component as default,
    component as CharacterList,
};
