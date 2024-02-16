import React, { ChangeEvent, FC, FormEvent, memo, useCallback, useEffect, useState, useMemo } from 'react';

import { ActionValue } from './grid/actions/Action';

interface Props {
    actionValues: ActionValue[];
    onSearch: (value: string) => void;
}

export const SearchBox: FC<Props> = memo(props => {
    const { actionValues, onSearch } = props;
    const [searchValue, setSearchValue] = useState('');
    const appliedSearch = useMemo(() => actionValues?.[0]?.value, [actionValues]);

    useEffect(() => {
        if (appliedSearch) {
            setSearchValue(appliedSearch);
        } else {
            setSearchValue('');
        }
    }, [appliedSearch]);

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
        },
        [onSearch, searchValue]
    );

    const onIconClick = useCallback(() => {
        onSearch(searchValue);
    }, [onSearch, searchValue]);

    const removeSearch = useCallback(() => {
        onSearch('');
        setSearchValue('');
    }, [onSearch]);

    return (
        <form className="grid-panel__search-form" onSubmit={onSubmit}>
            <div>
                <span className="grid-panel__input-group input-group">
                    <span className="input-group-addon" onClick={onIconClick}>
                        <i className="fa fa-search" />
                    </span>
                    <input
                        className="form-control grid-panel__search-input"
                        onChange={onChange}
                        placeholder="Search..."
                        size={25}
                        type="text"
                        value={searchValue}
                    />
                    {appliedSearch?.length > 0 && (
                        <span className="input-group-btn">
                            <button type="button" className="btn btn-default" onClick={removeSearch}>
                                <span className="fa fa-remove" />
                            </button>
                        </span>
                    )}
                </span>
            </div>
        </form>
    );
});
