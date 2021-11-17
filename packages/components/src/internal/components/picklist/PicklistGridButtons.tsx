import React, { ComponentType, FC, memo } from 'react';

import { RequiresModelAndActions } from '../../../public/QueryModel/withQueryModels';
import { User } from '../base/models/User';

import { Picklist } from './models';

interface GridButtonProps {
    user: User;
    AdditionalGridButtons?: ComponentType<RequiresModelAndActions>;
    picklist: Picklist;
    afterSampleActionComplete: () => void;
}

export const PicklistGridButtons: FC<GridButtonProps & RequiresModelAndActions> = memo(props => {
    const { AdditionalGridButtons } = props;

    return (
        <>
            {AdditionalGridButtons !== undefined && (
                <div className="btn-group gridbar-buttons">
                    <AdditionalGridButtons {...props} />
                </div>
            )}
        </>
    );
});
