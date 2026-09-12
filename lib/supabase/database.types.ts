export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; created_at: string };
        Insert: { id: string; display_name?: string | null; created_at?: string };
        Update: { id?: string; display_name?: string | null; created_at?: string };
        Relationships: [];
      };
      friend_exclusions: {
        Row: { user_id: string; excluded_user_id: string; created_at: string };
        Insert: { user_id: string; excluded_user_id: string; created_at?: string };
        Update: { user_id?: string; excluded_user_id?: string; created_at?: string };
        Relationships: [];
      };
      streaming_services: {
        Row: { id: string; tmdb_provider_id: number; name: string; logo_path: string | null; created_at: string };
        Insert: { id?: string; tmdb_provider_id: number; name: string; logo_path?: string | null; created_at?: string };
        Update: { id?: string; tmdb_provider_id?: number; name?: string; logo_path?: string | null; created_at?: string };
        Relationships: [];
      };
      user_streaming_services: {
        Row: { user_id: string; streaming_service_id: string; active: boolean; created_at: string; updated_at: string };
        Insert: { user_id: string; streaming_service_id: string; active?: boolean; created_at?: string; updated_at?: string };
        Update: { user_id?: string; streaming_service_id?: string; active?: boolean; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      user_titles: {
        Row: {
          id: string;
          user_id: string;
          tmdb_id: number;
          media_type: "movie" | "tv";
          status: "to_watch" | "in_progress" | "watched" | "abandoned" | "not_interested";
          rating: number | null;
          rating_label: "bad" | "okay" | "good" | "very_good" | "masterpiece" | null;
          watched_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tmdb_id: number;
          media_type: "movie" | "tv";
          status?: "to_watch" | "in_progress" | "watched" | "abandoned" | "not_interested";
          rating?: number | null;
          rating_label?: "bad" | "okay" | "good" | "very_good" | "masterpiece" | null;
          watched_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tmdb_id?: number;
          media_type?: "movie" | "tv";
          status?: "to_watch" | "in_progress" | "watched" | "abandoned" | "not_interested";
          rating?: number | null;
          rating_label?: "bad" | "okay" | "good" | "very_good" | "masterpiece" | null;
          watched_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_seasons: {
        Row: { id: string; user_id: string; tmdb_id: number; season_number: number; status: "to_watch" | "in_progress" | "watched" | "abandoned" | "not_interested"; rating_label: "bad" | "okay" | "good" | "very_good" | "masterpiece" | null; watched_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; tmdb_id: number; season_number: number; status?: "to_watch" | "in_progress" | "watched" | "abandoned" | "not_interested"; rating_label?: "bad" | "okay" | "good" | "very_good" | "masterpiece" | null; watched_at?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; tmdb_id?: number; season_number?: number; status?: "to_watch" | "in_progress" | "watched" | "abandoned" | "not_interested"; rating_label?: "bad" | "okay" | "good" | "very_good" | "masterpiece" | null; watched_at?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      title_provider_audio: {
        Row: { tmdb_id: number; media_type: "movie" | "tv"; tmdb_provider_id: number; audio_languages: string[]; subtitle_languages: string[]; updated_at: string };
        Insert: { tmdb_id: number; media_type: "movie" | "tv"; tmdb_provider_id: number; audio_languages?: string[]; subtitle_languages?: string[]; updated_at?: string };
        Update: { tmdb_id?: number; media_type?: "movie" | "tv"; tmdb_provider_id?: number; audio_languages?: string[]; subtitle_languages?: string[]; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_friend_recommended_titles: { Args: Record<string, never>; Returns: Array<{ tmdb_id: number; media_type: "movie" | "tv" }> };
      list_friend_profiles: { Args: Record<string, never>; Returns: Array<{ id: string; display_name: string | null; is_excluded: boolean }> };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
