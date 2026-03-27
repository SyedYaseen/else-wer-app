import AsyncStorage from '@react-native-async-storage/async-storage';

const excludedPaths = ['/api/login', '/api/create_user'];

export async function apiFetch(url: string, options: RequestInit = {}) {
    // TODO: Complete refresh token impl and retry fetch
    const { signal, ...restOptions } = options;
    console.log("here")
    const token = await AsyncStorage.getItem('token')
    let baseUrl = await AsyncStorage.getItem('server')
    const shouldExclude = excludedPaths.some(path => url.includes(path));

    const headers = {
        ...restOptions.headers,
        ...(token && !shouldExclude ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
    };

    console.log(`${baseUrl}${url}`, headers)

    return fetch(`${baseUrl}${url}`, {
        ...restOptions,
        headers,
        signal
    });
}
