/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback } from 'react';

interface Props {
    downloadUrl?: string;
    name: string;
    onDelete?: (name: string) => void;
}

export const FileAttachmentEntry: FC<Props> = memo(props => {
    const { downloadUrl, onDelete, name } = props;
    const onClick = useCallback(() => onDelete(name), [onDelete, name]);
    const deleteIconClassName = 'fa fa-times-circle clickable-text attached-file__remove-icon';
    return (
        <div className="attached-file__container">
            {onDelete && <button className={deleteIconClassName} onClick={onClick} title="Remove file" type="button" />}
            <span className="fa fa-file-text attached-file__icon" />
            {downloadUrl && (
                <strong>
                    <a href={downloadUrl} title={name}>
                        <div className="attached-file__filename">{name}</div>
                    </a>
                </strong>
            )}
            {!downloadUrl && <>{name}</>}
        </div>
    );
});
FileAttachmentEntry.displayName = 'FileAttachmentEntry';
