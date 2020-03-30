import React from "react";

interface Props {
    title: string
    cls?: string
}

export function SectionHeading(props: Props) {
    return (
        <div className={'domain-field-section-heading' + (props.cls ? ' ' + props.cls : '')}>
            {props.title}
        </div>
    )
}
