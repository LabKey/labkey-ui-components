/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { CSSProperties, FC, memo, useCallback, useMemo } from 'react';
import classNames from 'classnames';

import { Modal } from '../Modal';
import { formatBytes, getIconFontCls, isImage } from '../util/utils';
import { isLoading, LoadingState } from '../../public/LoadingState';
import { LoadingSpinner } from '../components/base/LoadingSpinner';
import { DropdownMenu, MenuItem } from '../dropdowns';
import { useEnterEscape } from '../../public/useEnterEscape';
import { useModalState } from '../hooks';

const now = (): number => new Date().valueOf();

export interface IAttachment {
    created?: number;
    description?: string;
    fileIcon?: string;
    iconFontCls?: string;
    loadingState?: LoadingState;
    name: string;
    size?: number;
    title?: string;
    unavailable?: boolean;
}

export interface AttachmentCardProps {
    allowDownload?: boolean;
    allowRemove?: boolean;
    attachment: IAttachment;
    copyNoun?: string;
    imageCls?: string;
    imageURL?: string;
    noun?: string;
    onCopyLink?: (attachment: IAttachment) => void;
    onDownload?: (attachment: IAttachment) => void;
    onRemove?: (attachment: IAttachment) => void;
    outerCls?: string;
    titleStyle?: CSSProperties;
}

export const AttachmentCard: FC<AttachmentCardProps> = memo(props => {
    const {
        attachment,
        imageURL,
        imageCls,
        onCopyLink,
        onRemove,
        onDownload,
        outerCls = '',
        noun = 'attachment',
        copyNoun = 'link',
        allowRemove = true,
        allowDownload = true,
        titleStyle,
    } = props;
    const titleClass = titleStyle?.backgroundColor ? 'attachment-card__name status-pill' : 'attachment-card__name ';
    const { close, open, show } = useModalState();

    const _onCopyLink = useCallback((): void => onCopyLink(attachment), [attachment, onCopyLink]);
    const onCopyKeyDown = useEnterEscape(_onCopyLink);

    const _onDownload = useCallback((): void => {
        if (allowDownload) {
            onDownload?.(attachment);
        }
    }, [allowDownload, attachment, onDownload]);
    const onDownloadKeyDown = useEnterEscape(_onDownload);

    const _onRemove = useCallback(() => {
        if (allowRemove) {
            onRemove?.(attachment);
        }
    }, [allowRemove, attachment, onRemove]);
    const onRemoveKeyDown = useEnterEscape(_onRemove);

    const _onBodyAction = useCallback(() => {
        if (!attachment || attachment.unavailable || isLoading(attachment.loadingState)) return;
        if (isImage(attachment.name)) open();
        else _onDownload();
    }, [attachment, open, _onDownload]);

    const onBodyKeyDown = useEnterEscape(_onBodyAction);

    const showMenu = useMemo(() => {
        return ((onCopyLink || allowDownload) && !attachment?.unavailable) || allowRemove;
    }, [onCopyLink, allowDownload, attachment, allowRemove]);

    if (!attachment) {
        return null;
    }

    const { iconFontCls, loadingState, name, title, size, description, unavailable } = attachment;
    const _iconFontCls = iconFontCls ?? getIconFontCls(name);
    const isLoaded = !isLoading(loadingState);
    const recentlyCreated = attachment.created ? attachment.created > now() - 30000 : false;
    const _isImage = isImage(attachment.name);
    const modalTitle = (
        <a className="clickable" onClick={_onDownload} title={'Download ' + noun}>
            {title ?? name}
        </a>
    );

    return (
        <>
            <div
                className={classNames('attachment-card ' + outerCls, {
                    'attachment-unavailable': unavailable,
                    'attachment-unavailable-wide': unavailable && !showMenu,
                })}
                title={name + (unavailable ? ' (unavailable)' : '')}
            >
                <div className="attachment-card__body" onClick={_onBodyAction} onKeyDown={onBodyKeyDown} tabIndex={0}>
                    <div className="attachment-card__icon">
                        {_isImage && !isLoaded && <LoadingSpinner msg="" />}
                        {_isImage && isLoaded && !unavailable && (
                            <img alt={name} className={`attachment-card__icon_img ${imageCls}`} src={imageURL} />
                        )}
                        {(!_isImage || unavailable) && <i className={`attachment-card__icon_tile ${_iconFontCls}`} />}
                    </div>
                    <div className="attachment-card__content">
                        <div className={titleClass} style={titleStyle}>
                            {title ?? name}
                        </div>
                        <div className="attachment-card__size">
                            {!isLoaded && <LoadingSpinner msg="Uploading..." />}
                            {isLoaded && recentlyCreated && (
                                <>
                                    <i className="fa fa-check-circle" /> File attached
                                </>
                            )}
                            {isLoaded && !recentlyCreated && size && formatBytes(size)}
                        </div>
                        {description && <div className="attachment-card__description">{description}</div>}
                    </div>
                </div>
                {isLoaded && showMenu && (
                    <DropdownMenu
                        className="attachment-card__menu"
                        label="Manage Attachment"
                        pullRight
                        title={<i className="fa fa-ellipsis-v" />}
                    >
                        {onCopyLink && !unavailable && (
                            <MenuItem onClick={_onCopyLink} onKeyDown={onCopyKeyDown}>
                                Copy {copyNoun}
                            </MenuItem>
                        )}
                        {allowDownload && !unavailable && (
                            <MenuItem onClick={_onDownload} onKeyDown={onDownloadKeyDown}>
                                Download
                            </MenuItem>
                        )}
                        {allowRemove && (
                            <MenuItem onClick={_onRemove} onKeyDown={onRemoveKeyDown}>
                                Remove {noun}
                            </MenuItem>
                        )}
                    </DropdownMenu>
                )}
            </div>

            {show && (
                <Modal bsSize="lg" cancelText="Dismiss" onCancel={close} title={modalTitle}>
                    <img alt={`${name} image`} className="attachment-card__img_modal" src={imageURL} title={name} />
                </Modal>
            )}
        </>
    );
});
AttachmentCard.displayName = 'AttachmentCard';
