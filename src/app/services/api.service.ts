// services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Page, Field, FieldType } from '../models/flow.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Pages API
  getPages(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/pages/`, { params: httpParams });
  }

  getPage(id: number): Observable<Page> {
    return this.http.get<Page>(`${this.baseUrl}/pages/${id}/`);
  }

  getPageWithFields(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/pages/${id}/with_fields/`);
  }

  createPage(page: Partial<Page>): Observable<Page> {
    return this.http.post<Page>(`${this.baseUrl}/pages/`, page);
  }

  updatePage(id: number, page: Partial<Page>): Observable<Page> {
    return this.http.put<Page>(`${this.baseUrl}/pages/${id}/`, page);
  }

  deletePage(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/pages/${id}/`);
  }

  // Fields API
  getFields(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/fields/`, { params: httpParams });
  }

  getField(id: number): Observable<Field> {
    return this.http.get<Field>(`${this.baseUrl}/fields/${id}/`);
  }

  createField(field: Partial<Field>): Observable<Field> {
    return this.http.post<Field>(`${this.baseUrl}/fields/`, field);
  }

  updateField(id: number, field: Partial<Field>): Observable<Field> {
    return this.http.put<Field>(`${this.baseUrl}/fields/${id}/`, field);
  }

  deleteField(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/fields/${id}/`);
  }

  // Field Types API
  getFieldTypes(): Observable<FieldType[]> {
    return this.http.get<FieldType[]>(`${this.baseUrl}/field-types/`);
  }

  getActiveFieldTypes(): Observable<FieldType[]> {
    return this.http.get<FieldType[]>(`${this.baseUrl}/field-types/active/`);
  }

  // Form Schema API
  getFormSchema(pageId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/forms/${pageId}/schema/`);
  }

  submitForm(pageId: number, formData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/forms/${pageId}/submit/`, { form_data: formData });
  }

  validateField(fieldId: number, value: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/fields/${fieldId}/validate/`, { value });
  }

  // Conditions API
  getConditions(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/conditions/`, { params: httpParams });
  }

  testCondition(conditionId: number, fieldData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/conditions/${conditionId}/test_condition/`, { field_data: fieldData });
  }

  evaluateMultipleConditions(conditionIds: number[], fieldData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/conditions/evaluate_multiple/`, {
      condition_ids: conditionIds,
      field_data: fieldData
    });
  }

  // Statistics API
  getFormStatistics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/forms/statistics/`);
  }

  // Export/Import API
  exportForm(pageId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/forms/${pageId}/export/`);
  }

  importForm(formConfig: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/forms/import/`, { form_config: formConfig });
  }
}
