import { environment } from '../../../environments/environment';

/**
 * Construit l'URL complète d'une image à partir de son nom de fichier
 * @param fileName - Nom du fichier (peut être null/undefined)
 * @param fallback - Image par défaut si fileName est null (optionnel)
 * @returns URL complète de l'image
 */
export function buildImageUrl(fileName?: string | null, fallback: string = 'assets/images/persona.png'): string {
    if (!fileName || fileName.trim() === '') {
        return fallback;
    }

    // Si c'est déjà une URL complète, la retourner telle quelle
    if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
        return fileName;
    }

    // Si c'est une image locale (assets), la retourner telle quelle
    if (fileName.startsWith('assets/')) {
        return fileName;
    }

    // Construire l'URL complète avec environment.filesUrl
    const cleanFileName = fileName.startsWith('/') ? fileName.substring(1) : fileName;
    return `${environment.filesUrl}/${cleanFileName}`;
}
