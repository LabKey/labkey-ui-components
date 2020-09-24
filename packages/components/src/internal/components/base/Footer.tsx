/*
 * Copyright (c) 2015-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { ActionURL } from '@labkey/api';

export class Footer extends React.Component<any, any> {
    render() {
        return (
            <footer className="my-footer-block">
                <div className="footer-tagline-left">
                    <a href="https://www.labkey.org/">LabKey</a>
                </div>
                <div className="footer-tagline-center">
                    <img src={ActionURL.getContextPath() + '/_images/defaultlogo.png'} height="22px" />
                </div>
                <div className="footer-tagline-right">Partners in Science</div>
            </footer>
        );
    }
}
