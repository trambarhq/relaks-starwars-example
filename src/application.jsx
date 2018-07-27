import { h, render, Component } from 'preact';
import { DjangoDataSource } from 'django-data-source';
import { SWAPI } from 'swapi';
import { CharacterList } from 'character-list';
import { CharacterPage } from 'character-page';

import 'style.scss';

/** @jsx h */

class Application extends Component {
    constructor() {
        super();
        this.state = {
            person: null,
            swapi: null,
        };
    }

    render() {
        return (
            <div>
                {this.renderUserInterface()}
                {this.renderConfiguration()}
            </div>
        );
    }

    renderUserInterface() {
        let { swapi, person } = this.state;
        if (!swapi) {
            return null;
        }
        if (!person) {
            let props = { swapi, onSelect: this.handlePersonSelect };
            return <CharacterList {...props} />;
        } else {
            let props = { swapi, person, onReturn: this.handlePersonUnselect };
            return <CharacterPage {...props} />;
        }
    }

    renderConfiguration() {
        let props = { onChange: this.handleDataSourceChange };
        return (
            <div>
                <DjangoDataSource {...props} />
            </div>
        );
    }

    handlePersonSelect = (evt) => {
        this.setState({ person: evt.person });
    }

    handlePersonUnselect = (evt) => {
        this.setState({ person: null });
    }

    handleDataSourceChange = (evt) => {
        this.setState({ swapi: new SWAPI(evt.target) });
    }
}

export {
    Application as default,
    Application
};
