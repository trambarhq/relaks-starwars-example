import React, { useState, useEffect, useMemo } from 'react';
import SWAPI from 'swapi';
import CharacterList from 'character-list';
import CharacterPage from 'character-page';

import 'style.scss';

/**
 * Render the front-end
 *
 * @return {ReactElement}
 */
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

    const handlePersonSelect = (evt) => { setPerson(evt.person) };
    const handlePersonUnselect = (evt) => { setPerson(null) };

    if (!person) {
        const pprops = { swapi, onSelect: handlePersonSelect };
        return <CharacterList {...pprops} />;
    } else {
        const pprops = { swapi, person, onReturn: handlePersonUnselect };
        return <CharacterPage {...pprops} />;
    }
}

export {
    FrontEnd as default,
    FrontEnd
};
