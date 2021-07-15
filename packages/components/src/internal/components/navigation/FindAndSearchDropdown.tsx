import React, { FC, memo, ReactNode, useCallback, useState } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { capitalizeFirstChar } from '../../util/utils';

import { FindByIdsModal } from './FindByIdsModal';

interface Props {
    title: ReactNode;
    findNounPlural?: string;
    onSearch?: (form: any) => void;
    onFindByIds?: (sessionKey: string) => void;
    className?: string;
}

export const FindAndSearchDropdown: FC<Props> = memo(props => {
    const { title = '', findNounPlural = 'samples', onFindByIds, className, onSearch } = props;

    const [showFindModal, setShowFindModal] = useState<boolean>(false);

    const onShowFind = useCallback(() => {
        setShowFindModal(true);
    }, [setShowFindModal]);

    const onHideFindModal = useCallback(() => {
        setShowFindModal(false);
    }, []);

    const onFind = useCallback((sessionKey: string) => {
        setShowFindModal(false);
        onFindByIds(sessionKey);
    }, [onFindByIds]);

    return (
        <>
            <DropdownButton
                id="find-and-search-menu"
                title={title}
                className={'navbar__find-and-search-button ' + className}
            >
                {!!onSearch && (
                    <MenuItem key="search" onClick={onSearch}>
                        <i className="fa fa-search" /> Search
                    </MenuItem>
                )}
                {!!onFindByIds && (
                    <MenuItem key="find" onClick={onShowFind}>
                        <i className="fa fa-barcode" /> Find {capitalizeFirstChar(findNounPlural)}
                    </MenuItem>
                )}
            </DropdownButton>
            {!!onFindByIds && (
                <FindByIdsModal
                    show={showFindModal}
                    onCancel={onHideFindModal}
                    onFind={onFind}
                    nounPlural={findNounPlural}
                />
            )}
        </>
    );
});
