export interface User {
  id: string
  email: string
  full_name?: string
  subscription_tier: "free" | "pro" | "enterprise"
  usage_count: number
  usage_limit: number
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  filename: string
  file_size: number
  file_type: string
  storage_path: string
  text_storage_path?: string | null // Add this line
  upload_status: "pending" | "uploaded" | "failed"
  created_at: string
  updated_at: string
}

export interface AnalysisJob {
  id: string
  user_id: string
  document_id: string
  status: "pending" | "processing" | "completed" | "failed"
  analysis_type: "contradiction" | "consistency" | "fact_check"
  ai_model: string
  results?: any
  error_message?: string
  processing_time_ms?: number
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  user_id: string
  analysis_job_id: string
  report_type: "pdf" | "json" | "html"
  report_data: any
  file_path?: string
  generated_at: string
}

export interface Payment {
  id: string
  user_id: string
  amount: number
  currency: string
  payment_status: "pending" | "completed" | "failed" | "refunded"
  payment_method?: string
  transaction_id?: string
  subscription_period_start?: string
  subscription_period_end?: string
  created_at: string
  updated_at: string
}