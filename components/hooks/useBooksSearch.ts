import { useState, useEffect, useRef } from "react";
import { Audiobook } from "@/data/database/models";

const TAG = "[useBookSearch]";

export function useBookSearch(books: Audiobook[], delayMs = 200) {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setDebouncedQuery(query), delayMs);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [query, delayMs]);

    let filtered = books;
    if (debouncedQuery.trim().length > 0) {
        try {
            const q = debouncedQuery.toLowerCase();
            filtered = books.filter(book => {
                try {
                    return (
                        book.title?.toLowerCase().includes(q) ||
                        book.author?.toLowerCase().includes(q) ||
                        (book as any).series?.toLowerCase().includes(q)
                    );
                } catch (err) {
                    // Individual book field access failed (e.g. unexpected data shape) — exclude from results
                    console.warn(`${TAG} filter failed for book id=${book?.id}`, err);
                    return false;
                }
            });
        } catch (err) {
            // Should not happen, but if the outer filter itself throws, return unfiltered
            console.error(`${TAG} filter threw unexpectedly, returning full list`, err);
            filtered = books;
        }
    }

    return {
        query,
        setQuery,
        debouncedQuery,
        filtered,
        hasQuery: debouncedQuery.trim().length > 0,
    };
}