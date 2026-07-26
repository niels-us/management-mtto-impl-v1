variable "region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "stage" {
  description = "Deployment stage/environment"
  type        = string
  default     = "DESA"
}

variable "account_id" {
  description = "AWS Account ID (12 digits)"
  type        = string
  default     = "940813655782"
}

variable "jwt_secret" {
  description = "Secret key for JWT signing (min 32 chars). Generate with: openssl rand -base64 48"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Password for RDS PostgreSQL master user"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_password) >= 8
    error_message = "db_password must be at least 8 characters."
  }
}

variable "groq_api_key" {
  description = "Groq API key from https://console.groq.com"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "postgres"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "postgres"
}

variable "aws_profile" {
  type    = string
  default = "rel"
}
