import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class FileUploadService {
    private apiUrl = `${environment.apiUrl}/upload`;

    constructor(private http: HttpClient) { }

    uploadImage(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('image', file);

        // Get token from localStorage or AuthService
        const token = localStorage.getItem('auth_token'); // or use your AuthService

        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        return this.http.post(`${this.apiUrl}/image`, formData, { headers });
    }
}