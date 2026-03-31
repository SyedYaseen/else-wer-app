import { useQuery } from "@tanstack/react-query";
import { getServerBooks } from "@/data/api/api";
import { getDownloadedBooks, upsertAudiobooks } from "@/data/database/audiobook-repo";
import { listInProgressBooksMergeConflicts } from "@/data/lib/conflict-handling";
import { useNetworkState } from "../store/network-store";

const TAG = "[useLibraryBooks]";

// Query keys — centralised so invalidation is consistent everywhere
export const LIBRARY_KEYS = {
    books: (isOnline: boolean) => ["library", "books", isOnline] as const,
    inProgress: (isOnline: boolean) => ["library", "inProgress", isOnline] as const,
};

export function useLibraryBooks() {
    const isOnline = useNetworkState(s => s.isOnline);

    return useQuery({
        queryKey: LIBRARY_KEYS.books(isOnline),
        queryFn: async () => {
            if (!isOnline) {
                console.log(`${TAG} offline — loading downloaded books from local DB`);
                try {
                    return await getDownloadedBooks();
                } catch (err) {
                    console.error(`${TAG} getDownloadedBooks failed`, err);
                    throw err; // re-throw so React Query sets isError
                }
            }

            console.log(`${TAG} online — fetching books from server`);
            let res;
            try {
                res = await getServerBooks();
            } catch (err) {
                console.error(`${TAG} getServerBooks failed`, err);
                throw err;
            }

            // Persist to local DB — failure is non-fatal: we already have the data
            // for this session, so we warn but don't throw.
            try {
                await upsertAudiobooks(res.books);
            } catch (err) {
                console.warn(`${TAG} upsertAudiobooks failed — books still shown but local cache not updated`, err);
            }

            console.log(`${TAG} loaded ${res.books.length} books`);
            return res.books;
        },
        staleTime: 1000 * 60 * 2, // 2 min — avoids re-fetch on every focus
        gcTime: 1000 * 60 * 10,
        retry: (failureCount, err) => {
            // Don't retry offline mode or aborted requests
            if (!isOnline) return false;
            if (err instanceof DOMException && err.name === "AbortError") return false;
            return failureCount < 2;
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10_000),
    });
}

export function useInProgressBooks() {
    const isOnline = useNetworkState(s => s.isOnline);

    return useQuery({
        queryKey: LIBRARY_KEYS.inProgress(isOnline),
        queryFn: async () => {
            console.log(`${TAG} loading in-progress books (isOnline=${isOnline})`);
            let books;
            try {
                books = await listInProgressBooksMergeConflicts();
            } catch (err) {
                console.error(`${TAG} listInProgressBooksMergeConflicts failed`, err);
                throw err;
            }

            if (!books?.length) {
                console.log(`${TAG} no in-progress books`);
                return [];
            }

            const filtered = isOnline ? books : books?.filter(b => b.downloaded);
            console.log(`${TAG} ${filtered?.length} in-progress books (${books.length - filtered.length} hidden offline)`);
            return filtered;
        },
        // staleTime: 1000 * 30,
        // gcTime: 1000 * 60 * 5,
        staleTime: 1000 * 2,
        gcTime: 1000 * 2,
        retry: (failureCount, err) => {
            if (err instanceof DOMException && err.name === "AbortError") return false;
            return failureCount < 2;
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10_000),
    });
}