import React, { FC } from 'react';

interface Props {
    fieldName?: string;
    value: string;
}

const INTERNAL_SPACES_PATTERN = /\S\s\s+\S/;

export const InternalSpacesWarning: FC<Props> = ({ value, fieldName = 'name' }) => {
    if (INTERNAL_SPACES_PATTERN.test(value)) {
        return (
            <span className="text-danger">
                <span className="fa fa-exclamation-circle" /> This {fieldName} contains multiple spaces between words.
                The extra spaces won't be visible to users.
            </span>
        );
    }
    return null;
};

InternalSpacesWarning.displayName = 'InternalSpacesWarning';
