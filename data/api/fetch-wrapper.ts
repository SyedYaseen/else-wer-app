import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

const excludedPaths = ['/api/login', '/api/create_user'];

export async function apiFetch(url: string, options: RequestInit = {}) {
    const token = await AsyncStorage.getItem('token')
    let baseUrl = await AsyncStorage.getItem('serverUrl')
    const shouldExclude = excludedPaths.some(path => url.includes(path));
    if (!baseUrl) baseUrl = API_URL
    console.log(`${baseUrl}${url}`)
    const headers = {
        ...options.headers,
        ...(token && !shouldExclude ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
    };

    return fetch(`${baseUrl}${url}`, {
        ...options,
        headers,
    });
}
