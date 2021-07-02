import React, { FC, memo, ReactNode, useCallback, useState } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { FindByIdsModal } from './FindByIdsModal';
import { FindFieldType } from './constants';

interface Props {
    title: ReactNode
    nounPlural: string
    onFindByIds: (fieldType: FindFieldType, ids: string[], queryId: string) => void
    className?: string
}

export const FindByIdsDropdown: FC<Props> = memo(({title = '', nounPlural = 'samples', onFindByIds, className}) => {

    const [showFindModal, setShowFindModal] = useState<boolean>(false);

    const onShowFind = useCallback(() => {
        setShowFindModal(true);
    }, [setShowFindModal]);

    const onHideFindModal = useCallback(() => {
        setShowFindModal(false);
    }, [setShowFindModal]);

    return (
        <>
            <DropdownButton
                id={'find-samples-menu'}
                title={title}
                className={"navbar__find-samples-button " + className}>
                <MenuItem
                    key={'find'}
                    onClick={onShowFind}
                >
                    <i className="fa fa-barcode"/> Find {nounPlural}
                </MenuItem>
            </DropdownButton>
            <FindByIdsModal show={showFindModal} onCancel={onHideFindModal} onFind={onFindByIds} nounPlural={nounPlural}/>
        </>
    )
})
