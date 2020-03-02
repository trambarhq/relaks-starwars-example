import React, { useState, useEffect, useMemo } from 'react';
import { useEventTime, useListener } from 'relaks';
import { SWAPI } from './swapi.js';
import { CharacterList } from './character-list.jsx';
import { CharacterPage } from './character-page.jsx';

import './style.scss';

export function FrontEnd(props) {
  const { dataSource } = props;
  const [ dataChanged, setDataChanged ] = useEventTime();
  const [ person, setPerson ] = useState(null);
  const swapi = useMemo(() => {
    return new SWAPI(dataSource);
  }, [ dataSource, dataChanged ]);

  const handlePersonSelect = useListener((evt) => {
    setPerson(evt.person);
  });
  const handlePersonUnselect = useListener((evt) => {
    setPerson(null);
  });

  useEffect(() => {
    dataSource.onChange = setDataChanged;
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
