/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';

interface Props {
    onSearch: (value: string) => any;
    placeholder?: string;
}

interface State {
    value?: string;
}

export class SearchBox extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            value: '',
        };
    }

    onSearch = (evt: any) => {
        evt.preventDefault();
        this.props.onSearch(this.state.value);

        // reset the input value after it is has submitted
        this.setState(() => ({ value: '' }));
    };

    handleChange = (evt: any) => {
        const value = evt.target.value;
        this.setState(() => ({ value }));
    };

    render() {
        return (
            <form className="navbar__search-form" onSubmit={this.onSearch}>
                <div className="form-group">
                    <i className="fa fa-search navbar__search-icon" />
                    <input
                        type="text"
                        placeholder={this.props.placeholder || 'Enter Search Terms'}
                        className="navbar__search-input"
                        onChange={this.handleChange}
                        value={this.state.value}
                        size={34}
                    />
                </div>
            </form>
        );
    }
}
