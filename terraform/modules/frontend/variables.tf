variable "stage" {
  type = string
}

variable "account_id" {
  type = string
}

variable "frontend_domain" {
  type    = string
  default = ""
}

variable "frontend_certificate_arn" {
  type    = string
  default = ""
}
