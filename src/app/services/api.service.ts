// services/api.service.ts - Updated with /api/v1/ endpoints
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

  // 🎯 Real-World Usage: Form Builder Admin Interface - Pages API
  getPages(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/api/v1/pages/`, { params: httpParams });
  }

  getPage(id: number): Observable<Page> {
    return this.http.get<Page>(`${this.baseUrl}/api/v1/pages/${id}/`);
  }

  getPageWithFields(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/pages/${id}/with_fields/`);
  }

  createPage(page: Partial<Page>): Observable<Page> {
    return this.http.post<Page>(`${this.baseUrl}/api/v1/pages/`, page);
  }

  updatePage(id: number, page: Partial<Page>): Observable<Page> {
    return this.http.put<Page>(`${this.baseUrl}/api/v1/pages/${id}/`, page);
  }

  deletePage(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/v1/pages/${id}/`);
  }

  // 🎯 Real-World Usage: Building Dynamic Forms - Fields API
  getFields(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/api/v1/fields/`, { params: httpParams });
  }

  getField(id: number): Observable<Field> {
    return this.http.get<Field>(`${this.baseUrl}/api/v1/fields/${id}/`);
  }

  createField(field: Partial<Field>): Observable<Field> {
    return this.http.post<Field>(`${this.baseUrl}/api/v1/fields/`, field);
  }

  updateField(id: number, field: Partial<Field>): Observable<Field> {
    return this.http.put<Field>(`${this.baseUrl}/api/v1/fields/${id}/`, field);
  }

  deleteField(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/v1/fields/${id}/`);
  }

  // 🎯 Real-World Usage: Validate as user types
  validateField(fieldId: number, value: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/fields/${fieldId}/validate/`, { value });
  }

  // 🎯 Real-World Usage: Managing Form Deployment - Bulk operations
  bulkUpdateFields(fields: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/fields/bulk_update/`, { fields });
  }

  // 🎯 Real-World Usage: Form Builder Admin - Field Types API
  getFieldTypes(): Observable<FieldType[]> {
    return this.http.get<FieldType[]>(`${this.baseUrl}/api/v1/field-types/`);
  }

  getActiveFieldTypes(): Observable<FieldType[]> {
    return this.http.get<FieldType[]>(`${this.baseUrl}/api/v1/field-types/active/`);
  }

  // 🎯 Real-World Usage: Building Dynamic Forms - Form Schema & Submission
  getFormSchema(pageId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/forms/${pageId}/schema/`);
  }

  submitForm(pageId: number, formData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/forms/${pageId}/submit/`, { form_data: formData });
  }

  // 🎯 Real-World Usage: Form Builder Analytics
  getFormStatistics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/forms/statistics/`);
  }

  // 🎯 Real-World Usage: Managing Form Deployment - Export/Import
  exportForm(pageId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/forms/${pageId}/export/`);
  }

  importForm(formConfig: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/forms/import/`, { form_config: formConfig });
  }

  // 🎯 Real-World Usage: Conditional Logic - Conditions API
  getConditions(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/api/v1/conditions/`, { params: httpParams });
  }

  createCondition(condition: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/conditions/`, condition);
  }

  testCondition(conditionId: number, fieldData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/conditions/${conditionId}/test_condition/`, { field_data: fieldData });
  }

  // 🎯 Real-World Usage: Show/hide fields based on logic
  evaluateMultipleConditions(conditionIds: number[], fieldData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/conditions/evaluate_multiple/`, {
      condition_ids: conditionIds,
      field_data: fieldData
    });
  }

  // Authentication endpoints (using different API structure if needed)
  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login/`, credentials);
  }

  logout(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/logout/`, {});
  }

  refreshToken(refreshToken: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/refresh/`, { refresh: refreshToken });
  }

  // Additional utility endpoints for comprehensive form management
  getDynamicFormData(formId: number, params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/api/v1/forms/${formId}/data/`, { params: httpParams });
  }

  validateFormData(formId: number, formData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/forms/${formId}/validate/`, { form_data: formData });
  }

  previewForm(formId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/forms/${formId}/preview/`);
  }

  duplicateForm(formId: number, newName: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/forms/${formId}/duplicate/`, { name: newName });
  }

  // Advanced field operations
  reorderFields(formId: number, fieldOrder: { fieldId: number; sequence: number }[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/forms/${formId}/reorder_fields/`, { field_order: fieldOrder });
  }

  getFieldValidationRules(fieldId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/fields/${fieldId}/validation_rules/`);
  }

  updateFieldValidationRules(fieldId: number, rules: any[]): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/api/v1/fields/${fieldId}/validation_rules/`, { rules });
  }

  // Conditional logic advanced operations
  getConditionDependencies(conditionId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/conditions/${conditionId}/dependencies/`);
  }

  validateConditionLogic(condition: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/conditions/validate_logic/`, { condition });
  }

  // Form analytics and insights
  getFormAnalytics(formId: number, dateRange?: { start: string; end: string }): Observable<any> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('start_date', dateRange.start).set('end_date', dateRange.end);
    }
    return this.http.get<any>(`${this.baseUrl}/api/v1/forms/${formId}/analytics/`, { params });
  }

  getFormUsageMetrics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/forms/usage_metrics/`);
  }

  // System health and monitoring
  getSystemHealth(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/system/health/`);
  }

  getApiVersion(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/system/version/`);
  }
}
