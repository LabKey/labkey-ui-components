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
import React, { ChangeEvent, FC, FormEvent, memo, useCallback, useState } from 'react';
import { FindAndSearchDropdown } from './FindAndSearchDropdown';

interface Props {
    onSearch: (value: string) => void;
    placeholder?: string;
    onFindByIds?: () => void;
    findNounPlural?: string;
}

export const SearchBox: FC<Props> = memo(props => {
    const { onSearch, placeholder, onFindByIds, findNounPlural } = props;

    const [searchValue, setSearchValue] = useState('');

    const showFindByIds = !!onFindByIds;

    const onChange = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            setSearchValue(evt.target.value);
        },
        [setSearchValue]
    );

    const onSubmit = useCallback(
        (evt: FormEvent<HTMLFormElement>) => {
            evt.preventDefault();
            onSearch(searchValue);

            // reset the input value after it is has submitted
            setSearchValue('');
        },
        [onSearch, searchValue]
    );

    return (
        <form className="navbar__search-form" onSubmit={onSubmit}>
            <div className="form-group">
                <i className="fa fa-search navbar__search-icon" />
                <span className={"navbar__input-group " + (showFindByIds ? 'input-group': '')}>
                    <input
                        className="form-control navbar__search-input"
                        onChange={onChange}
                        placeholder={placeholder ?? 'Enter Search Terms'}
                        size={34}
                        type="text"
                        value={searchValue}
                    />
                    {showFindByIds &&
                    <span className="input-group-btn">
                        <FindAndSearchDropdown title={''} onFindByIds={onFindByIds} findNounPlural={findNounPlural}/>
                    </span>
                    }
                </span>
            </div>
        </form>
    );
});
