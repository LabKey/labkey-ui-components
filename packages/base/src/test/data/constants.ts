import { List } from 'immutable'
import { IFile } from "../..";


export const FILES_DATA = List<IFile>([
    {
        name: "exam.xlsx",
        description: "i'm an excel file",
        created: "2019-11-08 12:26:30.064",
        createdById: 1005,
        createdBy: "Vader",
        iconFontCls: "fa fa-file-excel-o",
        downloadUrl: "/labkey/sm/sampleManagement-downloadAttachments.view?jobId=282&names=exam.xlsx&returnUrl=%2Flabkey%2Fgpat3%2FsampleManagement-appDev.view%23%2Fworkflow%2F282%2Ffiles"
    },{
        "name": "xray.gif",
        description: "i'm gif",
        "created": "2019-11-14 15:47:51.931",
        "createdById": 1100,
        "createdBy": "Skywalker",
        "iconFontCls": "fa fa-file-image-o",
        "downloadUrl": "/labkey/sm/sampleManagement-downloadAttachments.view?jobId=282&names=xray.gif&returnUrl=%2Flabkey%2Fgpat3%2FsampleManagement-appDev.view%23%2Fworkflow%2F282%2Ffiles"
    },{
        "name": "report.json",
        description: "i'm a json file",
        "created": "2019-11-14 15:48:11.472",
        "createdById": 1005,
        "createdBy": "Vader",
        "iconFontCls": "fa fa-file-o",
        "downloadUrl": "/labkey/sm/sampleManagement-downloadAttachments.view?jobId=282&names=sreport.json&returnUrl=%2Flabkey%2Fgpat3%2FsampleManagement-appDev.view%23%2Fworkflow%2F282%2Ffiles"
    }
]);