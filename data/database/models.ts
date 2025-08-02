export type Audiobook = {
    id: number;
    author: string;
    series?: string | null;
    title: string;
    cover_art?: string | null;
    local_path?: string | null;
    metadata?: string | null;
    downloaded: number;
    created_at?: string | null;
};

export type FileRow = {
    id: number;
    book_id: number;
    file_id: number;
    file_name: string;
    file_path?: string | null;
    local_path?: string | null;
    duration?: number | null;
    channels?: number | null;
    sample_rate?: number | null;
    bitrate?: number | null;
};

export type ProgressRow = {
    book_id: number;
    file_id: number;
    progress_ms: number;
    complete: boolean
    updated_at?: string | null;
};