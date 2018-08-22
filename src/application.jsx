import { h, Component } from 'preact';
import DjangoDataSource from 'django-data-source';
import SWAPI from 'swapi';
import CharacterList from 'character-list';
import CharacterPage from 'character-page';

import 'style.scss';

/** @jsx h */

class Application extends Component {
    static displayName = 'Application';

    constructor() {
        super();
        this.state = {
            person: null,
            swapi: null,
        };
    }

    /**
     * Render the application
     *
     * @return {VNode}
     */
    render() {
        return (
            <div>
                {this.renderConfiguration()}
                {this.renderUserInterface()}
            </div>
        );
    }

    /**
     * Render the user interface
     *
     * @return {VNode|null}
     */
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

    /**
     * Render non-visual components
     *
     * @return {VNode}
     */
    renderConfiguration() {
        let props = { onChange: this.handleDataSourceChange };
        return (
            <div>
                <DjangoDataSource {...props} />
            </div>
        );
    }

    /**
     * Called when user selects a person
     *
     * @param  {Event} evt
     */
    handlePersonSelect = (evt) => {
        this.setState({ person: evt.person });
    }

    /**
     * Called when user clicks "Return to list" link
     *
     * @param  {Event} evt
     */
    handlePersonUnselect = (evt) => {
        this.setState({ person: null });
    }

    /**
     * Called when the data source changes
     *
     * @param  {Object} evt
     */
    handleDataSourceChange = (evt) => {
        this.setState({ swapi: new SWAPI(evt.target) });
    }
}

export {
    Application as default,
    Application
};
