variable "region" {
  type = string
}

variable "stage" {
  type = string
}

variable "account_id" {
  type = string
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "groq_api_key" {
  type      = string
  sensitive = true
}
