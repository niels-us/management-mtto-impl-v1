locals {
  ssm_root = "/MAINTENANCE-API/${var.stage}"

  postgresql_credentials = jsonencode({
    host                   = aws_db_instance.postgres.address
    port                   = 5432
    database               = var.db_name
    user                   = var.db_username
    password               = var.db_password
    ssl                    = { rejectUnauthorized = false }
    max                    = 5
    idleTimeoutMillis      = 30000
    connectionTimeoutMillis = 2000
  })
}

resource "aws_ssm_parameter" "jwt_secret" {
  name        = "${local.ssm_root}/JWT_SECRET"
  description = "JWT signing secret for maintenance-api ${var.stage}"
  type        = "String"
  value       = var.jwt_secret

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "postgresql_credentials" {
  name        = "${local.ssm_root}/POSTGRESQL_CREDENTIALS"
  description = "PostgreSQL connection credentials for maintenance-api ${var.stage}"
  type        = "String"
  value       = local.postgresql_credentials

  # Re-create if RDS endpoint changes
  depends_on = [aws_db_instance.postgres]
}

resource "aws_ssm_parameter" "groq_api_key" {
  name        = "${local.ssm_root}/GROQ_API_KEY"
  description = "Groq LLM API key for maintenance-api ${var.stage}"
  type        = "String"
  value       = var.groq_api_key

  lifecycle {
    ignore_changes = [value]
  }
}
