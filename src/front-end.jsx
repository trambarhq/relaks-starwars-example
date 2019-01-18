import { h, Component } from 'preact';
import SWAPI from 'swapi';
import CharacterList from 'character-list';
import CharacterPage from 'character-page';

import 'style.scss';

/** @jsx h */

class FrontEnd extends Component {
    static displayName = 'FrontEnd';

    constructor(props) {
        super(props);
        let { dataSource } = this.props;
        this.state = {
            person: null,
            swapi: new SWAPI(dataSource),
        };
    }

    /**
     * Render the application
     *
     * @return {VNode}
     */
    render() {
        let { swapi, person } = this.state;
        if (!person) {
            let props = { swapi, onSelect: this.handlePersonSelect };
            return <CharacterList {...props} />;
        } else {
            let props = { swapi, person, onReturn: this.handlePersonUnselect };
            return <CharacterPage {...props} />;
        }
    }

    componentDidMount() {
        let { dataSource } = this.props;
        dataSource.onChange = this.handleDataSourceChange;
    }

    componentWillUnmount() {
        let { dataSource } = this.props;
        dataSource.onChange = null;
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
    FrontEnd as default,
    FrontEnd
};
