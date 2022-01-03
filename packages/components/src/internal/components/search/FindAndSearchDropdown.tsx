import React, { FC, memo, ReactNode, useCallback, useState } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { capitalizeFirstChar } from '../../util/utils';

import { FindByIdsModal } from './FindByIdsModal';
import { getCurrentAppProperties, getPrimaryAppProperties, isSampleFinderEnabled } from '../../app/utils';
import { SAMPLE_ID_FIND_FIELD, UNIQUE_ID_FIND_FIELD } from '../samples/constants';
import { FindField } from '../samples/models';
import { createProductUrl } from '../../url/AppURL';
import { FIND_SAMPLES_BY_FILTER_HREF } from '../../app/constants';

interface Props {
    title: ReactNode;
    findNounPlural?: string;
    onSearch?: (form: any) => void;
    onFindByIds?: (sessionKey: string) => void;
    className?: string;
}

export const FindAndSearchDropdown: FC<Props> = memo(props => {
    const { title = '', findNounPlural = 'samples', onFindByIds, className, onSearch } = props;

    const [findField, setFindField] = useState<FindField>(undefined);
    const [showFindModal, setShowFindModal] = useState<boolean>(false);

    const onShowFind = useCallback((findField: FindField) => {
        setFindField(findField);
        setShowFindModal(true);
    }, [setShowFindModal]);

    const onHideFindModal = useCallback(() => {
        setFindField(undefined);
        setShowFindModal(false);
    }, []);

    const onFind = useCallback(
        (sessionKey: string) => {
            setShowFindModal(false);
            onFindByIds(sessionKey);
        },
        [onFindByIds]
    );

    const capNoun = capitalizeFirstChar(findNounPlural);

    return (
        <>
            <DropdownButton
                id="find-and-search-menu"
                title={title}
                className={'navbar__find-and-search-button ' + className}
            >
                {!!onFindByIds && (
                    <>
                        <MenuItem key="findByBarcode" onClick={() => onShowFind(UNIQUE_ID_FIND_FIELD)}>
                            <i className="fa fa-barcode" /> Find {capNoun} by Barcode
                        </MenuItem>
                        <MenuItem key="findById" onClick={() => onShowFind(SAMPLE_ID_FIND_FIELD)}>
                            <i className="fa fa-hashtag" /> Find {capNoun} by ID
                        </MenuItem>
                    </>
                )}
                {isSampleFinderEnabled() && (
                    <MenuItem key="sampleFinder" href={createProductUrl(getPrimaryAppProperties().productId, getCurrentAppProperties().productId, FIND_SAMPLES_BY_FILTER_HREF.toHref()) as string}>
                        <i className="fa fa-sitemap" /> Sample Finder
                    </MenuItem>
                )}
                {!!onSearch && (
                    <MenuItem key="search" onClick={onSearch}>
                        <i className="fa fa-search" /> Search
                    </MenuItem>
                )}

            </DropdownButton>
            {!!onFindByIds && showFindModal && (
                <FindByIdsModal
                    show
                    onCancel={onHideFindModal}
                    onFind={onFind}
                    nounPlural={findNounPlural}
                    initialField={findField}
                />
            )}
        </>
    );
});
