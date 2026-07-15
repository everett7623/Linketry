import { apiGet,apiPut } from './client';
export function getLinkNote(id:string):Promise<{note:string}>{return apiGet(`/api/v1/link-notes/${id}`)}
export function saveLinkNote(id:string,note:string):Promise<{note:string}>{return apiPut(`/api/v1/link-notes/${id}`,{note})}
