import { apiDelete, apiGet, apiPost } from './client';
export interface UtmValues { source:string; medium:string; campaign:string; term:string; content:string; }
export interface UtmTemplate { id:string; name:string; values:UtmValues; created_at:string; }
export function listUtmTemplates():Promise<{items:UtmTemplate[]}>{return apiGet('/api/v1/utm-templates');}
export function createUtmTemplate(name:string,values:UtmValues):Promise<UtmTemplate>{return apiPost('/api/v1/utm-templates',{name,values});}
export function deleteUtmTemplate(id:string):Promise<{deleted:boolean}>{return apiDelete(`/api/v1/utm-templates/${id}`);}
