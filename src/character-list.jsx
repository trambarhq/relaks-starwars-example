import { h, render, Component } from 'preact';
import { AsyncComponent } from 'prelaks';

/** @jsx h */

class CharacterList extends AsyncComponent {
    async renderAsync(meanwhile) {
        let { swapi } = this.props;
        var props = {
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
    render() {
        let { people } = this.props;
        if (!people) {
            return <h2>Loading...</h2>;
        }
        return (
            <ul className="character-list">
            {
                people.map((person) => {
                    var linkProps = {
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
            var url = evt.currentTarget.href;
            var person = this.props.people.find((person) => {
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
