import { h, render, Component } from 'preact';
import { AsyncComponent } from 'prelaks';

/** @jsx h */

class CharacterList extends AsyncComponent {
    static displayName = 'CharacterList';

    /**
     * Retrieve remote data and render the synchronize half of this component
     *
     * @param  {Meanwhile}  meanwhile
     *
     * @return {VNode}
     */
    async renderAsync(meanwhile) {
        let { swapi } = this.props;
        let props = {
            people: null,
            onSelect: this.props.onSelect,
        };
        meanwhile.show(<CharacterListSync {...props} />);
        props.people = await swapi.fetchList('/people/');
        props.people.more();
        return <CharacterListSync {...props} />;
    }
}

class CharacterListSync extends Component {
    static displayName = 'CharacterListSync';

    /**
     * Render the component, making best effort using what props are given
     *
     * @return {VNode}
     */
    render() {
        let { people } = this.props;
        if (!people) {
            return <h2>Loading...</h2>;
        }
        return (
            <ul className="character-list">
            {
                people.map((person) => {
                    let linkProps = {
                        href: person.url,
                        onClick: this.handleClick,
                    };
                    return (
                        <li>
                            <a {...linkProps}>{person.name}</a>
                        </li>
                    );
                })
            }
            </ul>
        );
    }

    handleClick = (evt) => {
        if (evt.button === 0) {
            let url = evt.currentTarget.href;
            let person = this.props.people.find((person) => {
                return (person.url === url);
            });
            if (person && this.props.onSelect) {
                this.props.onSelect({
                    type: 'select',
                    target: this,
                    person,
                });
            }
            evt.preventDefault();
        }
    }
}

export {
    CharacterList as default,
    CharacterList,
    CharacterListSync
};
