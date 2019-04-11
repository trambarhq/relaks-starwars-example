import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useEventTime } from 'relaks';
import { SWAPI } from 'swapi';
import CharacterList from 'character-list';
import CharacterPage from 'character-page';

import 'style.scss';

function FrontEnd(props) {
    const { dataSource } = props;
    const [ dataSourceChanged, setDataSourceChanged ] = useEventTime();
    const [ person, setPerson ] = useState(null);
    const swapi = useMemo(() => {
        return new SWAPI(dataSource);
    }, [ dataSource, dataSourceChanged ]);

    const handlePersonSelect = useCallback((evt) => {
        setPerson(evt.person);
    });
    const handlePersonUnselect = useCallback((evt) => {
        setPerson(null);
    });

    useEffect(() => {
        dataSource.onChange = setDataSourceChanged;
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

export {
    FrontEnd
};
