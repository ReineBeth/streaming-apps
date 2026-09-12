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
      shared_movie_sessions: {
        Row: { id: string; owner_user_id: string; access_token: string; filters: Json; expires_at: string; created_at: string };
        Insert: { id?: string; owner_user_id: string; access_token: string; filters?: Json; expires_at: string; created_at?: string };
        Update: { id?: string; owner_user_id?: string; access_token?: string; filters?: Json; expires_at?: string; created_at?: string };
        Relationships: [];
      };
      shared_movie_session_participants: {
        Row: { id: string; session_id: string; user_id: string | null; participant_token: string; display_name: string; joined_at: string; completed_at: string | null };
        Insert: { id?: string; session_id: string; user_id?: string | null; participant_token: string; display_name: string; joined_at?: string; completed_at?: string | null };
        Update: { id?: string; session_id?: string; user_id?: string | null; participant_token?: string; display_name?: string; joined_at?: string; completed_at?: string | null };
        Relationships: [];
      };
      shared_movie_session_titles: {
        Row: { session_id: string; position: number; tmdb_id: number; media_type: "movie" | "tv"; title: string; overview: string; year: number | null; poster_path: string | null; tmdb_rating: number | null };
        Insert: { session_id: string; position: number; tmdb_id: number; media_type: "movie" | "tv"; title: string; overview?: string; year?: number | null; poster_path?: string | null; tmdb_rating?: number | null };
        Update: { session_id?: string; position?: number; tmdb_id?: number; media_type?: "movie" | "tv"; title?: string; overview?: string; year?: number | null; poster_path?: string | null; tmdb_rating?: number | null };
        Relationships: [];
      };
      shared_movie_session_votes: {
        Row: { participant_id: string; session_id: string; tmdb_id: number; media_type: "movie" | "tv"; liked: boolean; created_at: string };
        Insert: { participant_id: string; session_id: string; tmdb_id: number; media_type: "movie" | "tv"; liked: boolean; created_at?: string };
        Update: { participant_id?: string; session_id?: string; tmdb_id?: number; media_type?: "movie" | "tv"; liked?: boolean; created_at?: string };
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
      create_shared_movie_session: { Args: { p_access_token: string; p_participant_token: string; p_display_name: string; p_filters: Json; p_titles: Json; p_expires_at: string }; Returns: Array<{ session_id: string; participant_id: string; participant_token: string; expires_at: string }> };
      join_shared_movie_session: { Args: { p_access_token: string; p_participant_token: string; p_display_name: string }; Returns: Array<{ session_id: string; participant_id: string; participant_token: string; expires_at: string }> };
      get_shared_movie_session: { Args: { p_access_token: string; p_participant_token: string }; Returns: Json };
      vote_shared_movie_title: { Args: { p_access_token: string; p_participant_token: string; p_tmdb_id: number; p_media_type: "movie" | "tv"; p_liked: boolean }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
