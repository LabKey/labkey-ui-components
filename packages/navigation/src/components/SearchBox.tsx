import * as React from 'react'

interface Props {
    onSearch: (value: string) => any
}

interface State {
    value?: string
}

export class SearchBox extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            value: ''
        }
    }

    onSearch = (evt: any) => {
        evt.preventDefault();
        this.props.onSearch(this.state.value);

        // reset the input value after it is has submitted
        this.setState(() => ({value: ''}));
    };

    handleChange = (evt: any) => {
        const value = evt.target.value;
        this.setState(() => ({value}));
    };

    render() {
        return (
            <form className={'navbar__search-form'} onSubmit={this.onSearch}>
                <div className={'form-group'}>
                    <i className={'fa fa-search navbar__search-icon'}/>
                    <input
                        type={"text"}
                        placeholder="Enter search terms"
                        className="navbar__search-input"
                        onChange={this.handleChange}
                        value={this.state.value}
                    />
                </div>
            </form>
        )
    }
}