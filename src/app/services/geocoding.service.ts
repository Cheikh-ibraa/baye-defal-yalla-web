import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface GeocodeResult {
  address: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {

  constructor(private http: HttpClient) {}

  // Utilisation de l'API Nominatim d'OpenStreetMap (gratuite)
  getAddressFromCoordinates(lat: number, lng: number): Observable<GeocodeResult> {
    if (!lat || !lng) {
      return of({ address: 'Coordonnées non disponibles', success: false });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr`;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        if (response && response.display_name) {
          return {
            address: response.display_name,
            success: true
          };
        } else {
          return {
            address: `Lat: ${lat}, Lng: ${lng}`,
            success: false
          };
        }
      }),
      catchError(error => {
        console.error('Erreur lors du géocodage inverse:', error);
        return of({
          address: `Lat: ${lat}, Lng: ${lng}`,
          success: false
        });
      })
    );
  }

  // Alternative avec l'API Google Geocoding (nécessite une clé API)
  getAddressFromCoordinatesGoogle(lat: number, lng: number, apiKey: string): Observable<GeocodeResult> {
    if (!lat || !lng || !apiKey) {
      return of({ address: 'Coordonnées non disponibles', success: false });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=fr`;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        if (response && response.results && response.results.length > 0) {
          return {
            address: response.results[0].formatted_address,
            success: true
          };
        } else {
          return {
            address: `Lat: ${lat}, Lng: ${lng}`,
            success: false
          };
        }
      }),
      catchError(error => {
        console.error('Erreur lors du géocodage inverse Google:', error);
        return of({
          address: `Lat: ${lat}, Lng: ${lng}`,
          success: false
        });
      })
    );
  }
}