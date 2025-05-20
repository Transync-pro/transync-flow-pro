export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author: string
          canonical_url: string | null
          category: string
          content: string
          content_blocks: Json | null
          featured_image: string
          focus_keyword: string
          id: string
          is_featured: boolean
          meta_description: string
          meta_title: string | null
          published_date: string
          seo_data: Json | null
          slug: string
          social_image_url: string | null
          summary: string
          title: string
          updated_date: string
        }
        Insert: {
          author: string
          canonical_url?: string | null
          category: string
          content: string
          content_blocks?: Json | null
          featured_image: string
          focus_keyword: string
          id?: string
          is_featured?: boolean
          meta_description: string
          meta_title?: string | null
          published_date?: string
          seo_data?: Json | null
          slug: string
          social_image_url?: string | null
          summary: string
          title: string
          updated_date?: string
        }
        Update: {
          author?: string
          canonical_url?: string | null
          category?: string
          content?: string
          content_blocks?: Json | null
          featured_image?: string
          focus_keyword?: string
          id?: string
          is_featured?: boolean
          meta_description?: string
          meta_title?: string | null
          published_date?: string
          seo_data?: Json | null
          slug?: string
          social_image_url?: string | null
          summary?: string
          title?: string
          updated_date?: string
        }
        Relationships: []
      }
      blog_posts_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      operation_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          entity_type: string
          id: string
          operation_type: string
          record_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          entity_type: string
          id?: string
          operation_type: string
          record_id?: string | null
          status: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          entity_type?: string
          id?: string
          operation_type?: string
          record_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      quickbooks_connections: {
        Row: {
          access_token: string
          company_name: string | null
          created_at: string | null
          expires_at: string
          id: string
          realm_id: string
          refresh_token: string
          token_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          company_name?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          realm_id: string
          refresh_token: string
          token_type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          company_name?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          realm_id?: string
          refresh_token?: string
          token_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quickbooks_user_info: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          realm_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          realm_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          realm_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_admin_role: {
        Args: { user_id: string }
        Returns: boolean
      }
      get_blog_posts: {
        Args: Record<PropertyKey, never>
        Returns: {
          author: string
          canonical_url: string | null
          category: string
          content: string
          content_blocks: Json | null
          featured_image: string
          focus_keyword: string
          id: string
          is_featured: boolean
          meta_description: string
          meta_title: string | null
          published_date: string
          seo_data: Json | null
          slug: string
          social_image_url: string | null
          summary: string
          title: string
          updated_date: string
        }[]
      }
      get_blog_posts_tags: {
        Args: Record<PropertyKey, never>
        Returns: {
          post_id: string
          tag_id: string
        }[]
      }
      get_blog_tags: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
        }[]
      }
      has_role: {
        Args: { required_role: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_user_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
