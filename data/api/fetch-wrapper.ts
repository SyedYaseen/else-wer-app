import AsyncStorage from '@react-native-async-storage/async-storage';

const excludedPaths = ['/api/login', '/api/create_user'];

export async function apiFetch(url: string, options: RequestInit = {}) {
    const token = await AsyncStorage.getItem('token')
    let baseUrl = await AsyncStorage.getItem('server')
    const shouldExclude = excludedPaths.some(path => url.includes(path));
    console.log("serv", await AsyncStorage.getItem('server'), "Sending req", `${baseUrl}${url}`)
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
