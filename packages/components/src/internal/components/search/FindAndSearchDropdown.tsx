import React, { FC, memo, ReactNode, useCallback, useState } from 'react';

import { capitalizeFirstChar } from '../../util/utils';

import { getCurrentAppProperties, getPrimaryAppProperties } from '../../app/utils';
import { SAMPLE_ID_FIND_FIELD, UNIQUE_ID_FIND_FIELD } from '../samples/constants';
import { FindField } from '../samples/models';
import { createProductUrl } from '../../url/AppURL';
import { FIND_SAMPLES_BY_FILTER_HREF } from '../../app/constants';
import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { DropdownButton, MenuItem } from '../../dropdowns';

import { FindByIdsModal } from './FindByIdsModal';
import { SAMPLE_FILTER_METRIC_AREA } from './utils';

interface Props {
    api?: ComponentsAPIWrapper;
    className?: string;
    findNounPlural?: string;
    onFindByIds?: (sessionKey: string) => void;
    onSearch?: () => void;
    title: ReactNode;
}

export const FindAndSearchDropdown: FC<Props> = memo(props => {
    const { title = '', findNounPlural = 'samples', onFindByIds, className, onSearch, api } = props;

    const [findField, setFindField] = useState<FindField>(undefined);
    const [showFindModal, setShowFindModal] = useState<boolean>(false);

    const onShowFind = useCallback(
        (findField: FindField) => {
            setFindField(findField);
            setShowFindModal(true);
        },
        [setShowFindModal]
    );

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

    const onSampleFinder = useCallback(() => {
        api.query.incrementClientSideMetricCount(SAMPLE_FILTER_METRIC_AREA, 'headerMenuNavigation');
    }, [api]);

    const capNoun = capitalizeFirstChar(findNounPlural);
    const findByBarcodeClicked = useCallback(() => onShowFind(UNIQUE_ID_FIND_FIELD), []);
    const findByIdClicked = useCallback(() => onShowFind(SAMPLE_ID_FIND_FIELD), []);

    return (
        <>
            <DropdownButton title={title} buttonClassName={'navbar__find-and-search-button ' + className}>
                {!!onFindByIds && (
                    <>
                        <MenuItem onClick={findByBarcodeClicked}>
                            <i className="fa fa-barcode" /> Find {capNoun} by Barcode
                        </MenuItem>
                        <MenuItem onClick={findByIdClicked}>
                            <i className="fa fa-hashtag" /> Find {capNoun} by ID
                        </MenuItem>
                    </>
                )}
                <MenuItem
                    onClick={onSampleFinder}
                    href={
                        createProductUrl(
                            getPrimaryAppProperties()?.productId,
                            getCurrentAppProperties()?.productId,
                            FIND_SAMPLES_BY_FILTER_HREF.toHref()
                        ) as string
                    }
                >
                    <i className="fa fa-sitemap" /> Sample Finder
                </MenuItem>
                {!!onSearch && (
                    <MenuItem onClick={onSearch}>
                        <i className="fa fa-search" /> Search
                    </MenuItem>
                )}
            </DropdownButton>
            {!!onFindByIds && showFindModal && (
                <FindByIdsModal
                    onCancel={onHideFindModal}
                    onFind={onFind}
                    nounPlural={findNounPlural}
                    initialField={findField}
                />
            )}
        </>
    );
});

FindAndSearchDropdown.defaultProps = {
    api: getDefaultAPIWrapper(),
};
