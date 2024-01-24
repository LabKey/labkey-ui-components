import React, { FC, useCallback } from 'react';

import { ALIQUOT_FILTER_MODE } from '../samples/constants';
import { DropdownButton, MenuHeader, MenuItem } from '../../dropdowns';

interface ViewMenuItemProps {
    currentFilterMode: ALIQUOT_FILTER_MODE;
    filterMode: ALIQUOT_FILTER_MODE;
    label: string;
    onClick: (filterMode: ALIQUOT_FILTER_MODE) => void;
}

const ViewMenuItem: FC<ViewMenuItemProps> = ({ currentFilterMode, filterMode, label, onClick }) => {
    const onClick_ = useCallback(() => onClick(filterMode), [filterMode, onClick]);
    return (
        <MenuItem active={filterMode === currentFilterMode} onClick={onClick_}>
            {label}
        </MenuItem>
    );
};

interface Props {
    aliquotFilterMode: ALIQUOT_FILTER_MODE;
    aliquotsLabel?: string;
    allLabel?: string;
    headerLabel?: string;
    samplesLabel?: string;
    updateAliquotFilter: (newMode?: ALIQUOT_FILTER_MODE) => void;
}

export const SampleAliquotViewSelector: FC<Props> = props => {
    const {
        aliquotsLabel = 'Aliquots Only',
        aliquotFilterMode = ALIQUOT_FILTER_MODE.all,
        allLabel = 'Samples and Aliquots',
        headerLabel = 'Show Samples',
        samplesLabel = 'Samples Only',
        updateAliquotFilter,
    } = props;
    let title = 'All Samples';

    if (aliquotFilterMode === ALIQUOT_FILTER_MODE.samples) {
        title = samplesLabel;
    } else if (aliquotFilterMode === ALIQUOT_FILTER_MODE.aliquots) {
        title = aliquotsLabel;
    } else if (aliquotFilterMode === ALIQUOT_FILTER_MODE.none) {
        title = 'None';
    }

    return (
        <DropdownButton buttonClassName="aliquot-view-selector" pullRight title={title}>
            <MenuHeader text={headerLabel} />
            <ViewMenuItem
                currentFilterMode={aliquotFilterMode}
                filterMode={ALIQUOT_FILTER_MODE.all}
                label={allLabel}
                onClick={updateAliquotFilter}
            />
            <ViewMenuItem
                currentFilterMode={aliquotFilterMode}
                filterMode={ALIQUOT_FILTER_MODE.samples}
                label={samplesLabel}
                onClick={updateAliquotFilter}
            />
            <ViewMenuItem
                currentFilterMode={aliquotFilterMode}
                filterMode={ALIQUOT_FILTER_MODE.aliquots}
                label={aliquotsLabel}
                onClick={updateAliquotFilter}
            />
        </DropdownButton>
    );
};
SampleAliquotViewSelector.displayName = 'SampleAliquotViewSelector';
