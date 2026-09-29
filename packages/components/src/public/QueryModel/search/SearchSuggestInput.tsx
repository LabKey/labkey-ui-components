/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, {
    ChangeEvent,
    FC,
    FormEvent,
    KeyboardEvent,
    memo,
    MouseEvent,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useState,
} from 'react';
import classNames from 'classnames';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../../internal/APIWrapper';
import { ActionValue } from '../grid/actions/Action';
import { QueryModel } from '../QueryModel';

import { FilterSuggestion } from './models';
import { useSearchSuggestions } from './useSearchSuggestions';

// Longest Enter waits for pending suggestions before applying the best one available
export const PENDING_ENTER_TIMEOUT_MS = 1500;

const KIND_ICONS: Record<FilterSuggestion['kind'], string> = {
    compose: 'fa-sliders',
    filter: 'fa-filter',
    search: 'fa-search',
};

interface SuggestionOptionProps {
    active: boolean;
    id: string;
    index: number;
    isDefault: boolean;
    onApply: (index: number) => void;
    onHover: (index: number) => void;
    suggestion: FilterSuggestion;
}

const SuggestionOption: FC<SuggestionOptionProps> = memo(props => {
    const { active, id, index, isDefault, onApply, onHover, suggestion } = props;

    // Keep focus in the input so the click isn't lost to a blur that closes the menu
    const onMouseDown = useCallback((event: MouseEvent<HTMLLIElement>) => event.preventDefault(), []);
    const onClick = useCallback(() => onApply(index), [index, onApply]);
    const onMouseEnter = useCallback(() => onHover(index), [index, onHover]);

    return (
        <li
            aria-selected={active}
            className={classNames('grid-panel__search-suggestion', { active })}
            id={id}
            onClick={onClick}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            role="option"
        >
            <i className={classNames('fa', KIND_ICONS[suggestion.kind], 'grid-panel__search-suggestion-icon')} />
            <span className="grid-panel__search-suggestion-label">{suggestion.label}</span>
            {isDefault && <span className="grid-panel__search-suggestion-hint">Enter</span>}
        </li>
    );
});

SuggestionOption.displayName = 'SuggestionOption';

interface Props {
    actionValues: ActionValue[];
    api?: ComponentsAPIWrapper;
    model: QueryModel;
    onApplySuggestion: (suggestion: FilterSuggestion) => void;
    onSearch: (value: string) => void;
}

/**
 * Search input that offers targeted filters for the typed term, with the Q filter ("Search all columns") last.
 * Implements the WAI-ARIA combobox pattern: focus stays in the input and aria-activedescendant tracks the option.
 */
export const SearchSuggestInput: FC<Props> = memo(props => {
    const { actionValues, api = getDefaultAPIWrapper(), model, onApplySuggestion, onSearch } = props;
    const [text, setText] = useState('');
    const [open, setOpen] = useState(false);
    // -1 means nothing is explicitly highlighted, so Enter takes the top suggestion once it is known
    const [activeIndex, setActiveIndex] = useState(-1);
    const [pendingEnter, setPendingEnter] = useState(false);
    const appliedSearch = useMemo(() => actionValues?.[0]?.value, [actionValues]);
    const { loading, suggestions } = useSearchSuggestions(api, model, text, open);
    const baseId = useId();
    const listId = `${baseId}-suggestions`;
    const trimmed = text.trim();
    const showMenu = open && trimmed.length > 0;

    useEffect(() => {
        setText(appliedSearch ?? '');
    }, [appliedSearch]);

    // A highlight chosen from an earlier list would otherwise land on whatever now occupies that position
    useEffect(() => {
        setActiveIndex(-1);
    }, [suggestions]);

    const apply = useCallback(
        (suggestion: FilterSuggestion) => {
            setOpen(false);
            setPendingEnter(false);
            setActiveIndex(-1);
            // A Q filter keeps its text in the box; other filters show as chips, so clear the box for them
            if (suggestion.kind !== 'search') setText('');
            onApplySuggestion(suggestion);
        },
        [onApplySuggestion]
    );

    const applyIndex = useCallback((index: number) => apply(suggestions[index]), [apply, suggestions]);

    const submit = useCallback(() => {
        if (!trimmed) {
            if (appliedSearch) onSearch('');
            return;
        }

        if (activeIndex >= 0 && suggestions[activeIndex]) {
            apply(suggestions[activeIndex]);
        } else if (loading) {
            setOpen(true);
            setPendingEnter(true);
        } else {
            apply(suggestions[0]);
        }
    }, [activeIndex, appliedSearch, apply, loading, onSearch, suggestions, trimmed]);

    useEffect(() => {
        if (!pendingEnter) return undefined;
        if (!loading) {
            apply(suggestions[0]);
            return undefined;
        }

        const timer = setTimeout(() => apply(suggestions[0]), PENDING_ENTER_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [apply, loading, pendingEnter, suggestions]);

    const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setText(event.target.value);
        setActiveIndex(-1);
        setPendingEnter(false);
        setOpen(true);
    }, []);

    const onKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    setOpen(true);
                    setActiveIndex(index => Math.min(index + 1, suggestions.length - 1));
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setActiveIndex(index => Math.max(index - 1, 0));
                    break;
                case 'Enter':
                    event.preventDefault();
                    submit();
                    break;
                case 'Escape':
                    if (showMenu) {
                        setOpen(false);
                        setActiveIndex(-1);
                    } else {
                        setText('');
                    }
                    break;
                case 'Tab':
                    setOpen(false);
                    break;
            }
        },
        [showMenu, submit, suggestions.length]
    );

    const onFocus = useCallback(() => {
        if (trimmed) setOpen(true);
    }, [trimmed]);

    const onBlur = useCallback(() => {
        setOpen(false);
        setActiveIndex(-1);
        setPendingEnter(false);
    }, []);

    const onSubmit = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            submit();
        },
        [submit]
    );

    const removeSearch = useCallback(() => {
        onSearch('');
        setText('');
    }, [onSearch]);

    const optionId = useCallback((index: number) => `${baseId}-option-${index}`, [baseId]);

    return (
        <form className="grid-panel__search-form grid-panel__search-suggest" onSubmit={onSubmit}>
            <div>
                <span className="grid-panel__input-group input-group">
                    <span className="input-group-addon" onClick={submit}>
                        <i className="fa fa-search" />
                    </span>
                    <input
                        aria-activedescendant={showMenu && activeIndex >= 0 ? optionId(activeIndex) : undefined}
                        aria-autocomplete="list"
                        aria-controls={listId}
                        aria-expanded={showMenu}
                        aria-label="Search in grid"
                        autoComplete="off"
                        className="form-control grid-panel__search-input"
                        onBlur={onBlur}
                        onChange={onChange}
                        onFocus={onFocus}
                        onKeyDown={onKeyDown}
                        placeholder="Search..."
                        role="combobox"
                        size={25}
                        type="text"
                        value={text}
                    />
                    {appliedSearch?.length > 0 && (
                        <span className="input-group-btn">
                            <button className="btn btn-default" onClick={removeSearch} type="button">
                                <span className="fa fa-remove" />
                            </button>
                        </span>
                    )}
                </span>
                {showMenu && (
                    <ul className="grid-panel__search-suggestions" id={listId} role="listbox">
                        {suggestions.map((suggestion, index) => (
                            <SuggestionOption
                                active={index === activeIndex}
                                id={optionId(index)}
                                index={index}
                                isDefault={index === 0 && activeIndex === -1 && !loading}
                                key={optionId(index)}
                                onApply={applyIndex}
                                onHover={setActiveIndex}
                                suggestion={suggestion}
                            />
                        ))}
                        {loading && (
                            <li className="grid-panel__search-suggestion-loading" role="presentation">
                                <i className="fa fa-spinner fa-pulse" /> Loading suggestions...
                            </li>
                        )}
                    </ul>
                )}
                <span aria-live="polite" className="sr-only">
                    {showMenu && !loading ? `${suggestions.length} suggestions available` : ''}
                </span>
            </div>
        </form>
    );
});

SearchSuggestInput.displayName = 'SearchSuggestInput';
