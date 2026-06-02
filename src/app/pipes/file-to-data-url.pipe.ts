import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';

@Pipe({
    name: 'fileToDataUrl',
    standalone: true
})
export class FileToDataUrlPipe implements PipeTransform {
    transform(file: File | null): Observable<string> {
        return new Observable<string>(observer => {
            if (!file) {
                observer.next('');
                observer.complete();
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                observer.next(reader.result as string);
                observer.complete();
            };
            reader.onerror = () => {
                observer.error(reader.error);
            };
            reader.readAsDataURL(file);
        });
    }
}
