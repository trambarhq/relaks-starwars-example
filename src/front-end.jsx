import React, { useState, useEffect, useMemo } from 'react';
import SWAPI from 'swapi';
import CharacterList from 'character-list';
import CharacterPage from 'character-page';

import 'style.scss';

function FrontEnd(props) {
    const { dataSource } = props;
    const [ swapiChange, setSWAPIChange ] = useState();
    const [ person, setPerson ] = useState(null);
    const swapi = useMemo(() => {
        return new SWAPI(dataSource);
    }, [ dataSource, swapiChange ]);

    useEffect(() => {
        dataSource.onChange = setSWAPIChange;

        return () => {
            dataSource.onChange = null;
        };
    });

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

export {
    FrontEnd as default,
    FrontEnd
};
