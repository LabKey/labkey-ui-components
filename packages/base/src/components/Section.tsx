import * as React from 'react'

interface SectionProps {
    caption?: React.ReactNode
    context?: React.ReactNode
    panelClassName?: string
    title: string
}

export const Section: React.SFC<SectionProps> = (props) => (
    <>
        <div className="g-section">
            <div className={`panel panel-default ${props.panelClassName ? props.panelClassName : ''}`}>
                <div className="panel-body">
                    <div style={{borderBottom: '2px solid #cccccc', marginBottom: '30px'}}>
                        <div style={{display: 'inline-block', fontSize: '200%', marginBottom: '8px'}}>{props.title}</div>
                        {props.context && (
                            <div className="pull-right">
                                {props.context}
                            </div>
                        )}
                        {props.caption && (
                            <div style={{fontWeight: 300, marginBottom: '8px'}}>{props.caption}</div>
                        )}
                    </div>
                    {props.children}
                </div>
            </div>
        </div>
    </>
);