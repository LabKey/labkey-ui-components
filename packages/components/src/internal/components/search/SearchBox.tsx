/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ChangeEvent, FC, FormEvent, memo, useCallback, useState } from 'react';

import { FindAndSearchDropdown } from './FindAndSearchDropdown';

interface Props {
    onSearch: (value: string) => void;
    placeholder?: string;
    onFindByIds?: (sessionKey: string) => void;
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

            // reset the input value after it has been submitted
            setSearchValue('');
        },
        [onSearch, searchValue]
    );

    return (
        <form className="navbar__search-form" onSubmit={onSubmit}>
            <div className="form-group">
                <i className="fa fa-search navbar__search-icon" />
                <span className={'navbar__input-group ' + (showFindByIds ? 'input-group' : '')}>
                    <input
                        aria-label="Search in application"
                        className="form-control navbar__search-input"
                        onChange={onChange}
                        placeholder={placeholder ?? 'Enter Search Terms'}
                        size={34}
                        type="text"
                        value={searchValue}
                    />
                    {showFindByIds && (
                        <span className="input-group-btn">
                            <FindAndSearchDropdown title="" onFindByIds={onFindByIds} findNounPlural={findNounPlural} />
                        </span>
                    )}
                </span>
            </div>
        </form>
    );
});
